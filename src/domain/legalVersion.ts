import type {
  CaseFile,
  ConductEvent,
  LawBundle,
  LawProvision,
  LawResolutionSegment,
} from './types'
import { parseIsoDate } from './age'

export interface LawCheck {
  conductEventId: string
  status: 'ok' | 'incomplete' | 'crosses' | 'invalid'
  bundleId: string | null
  messages: string[]
  referencedProvisionIds: string[]
  segments: LawResolutionSegment[]
}

export function bundleById(caseFile: CaseFile, bundleId: string | null): LawBundle | undefined {
  if (!bundleId) return undefined
  return caseFile.law_bundles.find((bundle) => bundle.id === bundleId)
}

export function provisionById(caseFile: CaseFile, provisionId: string): LawProvision | undefined {
  for (const bundle of caseFile.law_bundles) {
    const provision = bundle.provisions.find((item) => item.id === provisionId)
    if (provision) return provision
  }
  return undefined
}

function collectReferencedProvisions(caseFile: CaseFile, eventId: string): string[] {
  const ids = new Set<string>()
  const charges = caseFile.candidate_charges.filter((charge) =>
    charge.conduct_event_ids.includes(eventId),
  )
  for (const charge of charges) {
    charge.legal_basis_ids.forEach((id) => ids.add(id))
  }
  const chargeIds = new Set(charges.map((charge) => charge.id))
  for (const element of caseFile.charge_elements) {
    if (chargeIds.has(element.charge_id)) {
      element.legal_basis_ids.forEach((id) => ids.add(id))
    }
  }
  for (const rule of caseFile.age_rules) {
    if (rule.conduct_event_ids.includes(eventId)) {
      rule.legal_basis_ids.forEach((id) => ids.add(id))
    }
  }
  for (const circumstance of caseFile.circumstances) {
    if (circumstance.conduct_event_ids.includes(eventId)) {
      circumstance.legal_basis_ids.forEach((id) => ids.add(id))
    }
  }
  return [...ids]
}

function intervalContains(
  provision: LawProvision,
  event: ConductEvent,
): 'ok' | 'incomplete' | 'crosses' {
  const eventStart = parseIsoDate(event.date_interval.start_date)
  const eventEnd = parseIsoDate(event.date_interval.end_date)
  const from = parseIsoDate(provision.effective_from)
  const to = parseIsoDate(provision.effective_to)

  if (!eventStart || !eventEnd) return 'incomplete'
  if (!from) return 'incomplete'
  if (eventStart.getTime() < from.getTime()) return 'crosses'
  if (to && eventEnd.getTime() > to.getTime()) return 'crosses'
  return 'ok'
}

const DAY_MS = 24 * 60 * 60 * 1000

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS)
}

/**
 * Kiểm tra phân giải luật cho từng conduct event.
 * Hệ thống chỉ đối chiếu dữ liệu; không tự chọn phiên bản luật.
 */
export function checkLawResolution(caseFile: CaseFile): LawCheck[] {
  return caseFile.temporal_context.conduct_events.map((event) => {
    const messages: string[] = []
    const resolution = event.law_resolution
    const referenced = collectReferencedProvisions(caseFile, event.id)
    const segments = resolution.segments ?? []

    if (resolution.status === 'unresolved') {
      if (resolution.bundle_id) {
        messages.push('Trạng thái phân giải luật là chưa phân giải nhưng lại có mã bộ văn bản luật.')
      }
      if (segments.length > 0) {
        messages.push('Trạng thái phân giải luật là chưa phân giải nhưng lại có các đoạn hiệu lực.')
      }
      return {
        conductEventId: event.id,
        status: 'invalid',
        bundleId: resolution.bundle_id,
        messages:
          messages.length > 0
            ? messages
            : ['Chưa phân giải được bộ văn bản luật cho hành vi này.'],
        referencedProvisionIds: referenced,
        segments,
      }
    }

    if (resolution.status === 'crosses_version') {
      if (segments.length === 0) {
        messages.push(
          'Khoảng ngày hành vi cắt qua thời điểm chuyển phiên bản luật; cần ít nhất hai đoạn hiệu lực và rà soát riêng.',
        )
        return {
          conductEventId: event.id,
          status: 'crosses',
          bundleId: resolution.bundle_id,
          messages,
          referencedProvisionIds: referenced,
          segments,
        }
      }

      if (segments.length < 2) {
        messages.push(
          `Trạng thái cắt qua phiên bản cần ít nhất hai đoạn hiệu lực; hiện có ${segments.length}.`,
        )
      }
      if (resolution.bundle_id) {
        messages.push(
          'Trạng thái cắt qua phiên bản đang có cả mã bộ văn bản luật và các đoạn hiệu lực; mã bộ văn bản luật bị bỏ qua khi có các đoạn hiệu lực.',
        )
      }

      const parsed = segments.map((segment, index) => ({
        segment,
        index,
        start: parseIsoDate(segment.start_date),
        end: parseIsoDate(segment.end_date),
        bundle: bundleById(caseFile, segment.bundle_id),
      }))

      let invalid = messages.length > 0
      let crosses = false
      let incomplete = false

      for (const item of parsed) {
        if (!item.start || !item.end) {
          invalid = true
          messages.push(
            `Đoạn ${item.index} thiếu ngày bắt đầu hoặc ngày kết thúc hợp lệ để đối chiếu hiệu lực.`,
          )
          continue
        }
        if (item.start.getTime() > item.end.getTime()) {
          invalid = true
          messages.push(
            `Đoạn ${item.index} có ngày bắt đầu sau ngày kết thúc: ${item.segment.start_date} > ${item.segment.end_date}.`,
          )
        }
        if (!item.bundle) {
          invalid = true
          messages.push(
            `Không tìm thấy bộ văn bản luật "${item.segment.bundle_id}" cho đoạn ${item.index}.`,
          )
        }
      }

      const sortable = parsed
        .filter((item): item is typeof item & { start: Date; end: Date } =>
          Boolean(item.start && item.end),
        )
        .sort((a, b) => a.start.getTime() - b.start.getTime())

      for (let index = 1; index < sortable.length; index += 1) {
        const previous = sortable[index - 1]
        const current = sortable[index]
        if (current.start.getTime() <= previous.end.getTime()) {
          invalid = true
          messages.push(
            `Đoạn ${previous.index} và ${current.index} chồng lấn thời gian.`,
          )
        } else if (addDays(previous.end, 1).getTime() < current.start.getTime()) {
          crosses = true
          messages.push(
            `Có khoảng trống giữa đoạn ${previous.index} (${previous.segment.end_date}) và đoạn ${current.index} (${current.segment.start_date}).`,
          )
        }
      }

      const eventStart = parseIsoDate(event.date_interval.start_date)
      const eventEnd = parseIsoDate(event.date_interval.end_date)
      if (!eventStart || !eventEnd) {
        incomplete = true
        messages.push('Thiếu ngày hành vi để kiểm tra các đoạn hiệu lực có phủ kín khoảng ngày.')
      } else if (sortable.length > 0) {
        const first = sortable[0]
        const last = sortable[sortable.length - 1]
        if (first.start.getTime() > eventStart.getTime()) {
          crosses = true
          messages.push(
            `Đoạn đầu tiên bắt đầu sau ngày hành vi (${first.segment.start_date} > ${event.date_interval.start_date}).`,
          )
        }
        if (last.end.getTime() < eventEnd.getTime()) {
          crosses = true
          messages.push(
            `Đoạn cuối cùng kết thúc trước ngày hành vi (${last.segment.end_date} < ${event.date_interval.end_date}).`,
          )
        }
      }

      for (const provisionId of referenced) {
        const provision = provisionById(caseFile, provisionId)
        if (!provision) {
          invalid = true
          messages.push(`Điều khoản "${provisionId}" không tồn tại trong hồ sơ.`)
          continue
        }
        const owner = sortable.find((item) =>
          item.bundle?.provisions.some((entry) => entry.id === provisionId),
        )
        if (!owner) {
          invalid = true
          messages.push(
            `Điều khoản "${provisionId}" không thuộc bộ văn bản luật của đoạn hiệu lực nào.`,
          )
          continue
        }
        if (provision.review_status !== 'approved') {
          incomplete = true
          messages.push(
            `Điều khoản "${provisionId}" chưa được duyệt (${provision.review_status}).`,
          )
        }
        const from = parseIsoDate(provision.effective_from)
        const to = parseIsoDate(provision.effective_to)
        if (!from) {
          incomplete = true
          messages.push(`Điều khoản "${provisionId}" thiếu ngày hiệu lực bắt đầu.`)
        } else if (
          from.getTime() > owner.end.getTime() ||
          (to && to.getTime() < owner.start.getTime())
        ) {
          crosses = true
          messages.push(
            `Điều khoản "${provisionId}" không có hiệu lực trong đoạn tương ứng.`,
          )
        }
      }

      const status: LawCheck['status'] = invalid
        ? 'invalid'
        : crosses
          ? 'crosses'
          : incomplete
            ? 'incomplete'
            : 'ok'

      return {
        conductEventId: event.id,
        status,
        bundleId: resolution.bundle_id,
        messages,
        referencedProvisionIds: referenced,
        segments,
      }
    }

    // status === 'resolved'
    if (segments.length > 0) {
      messages.push('Trạng thái phân giải luật là đã phân giải nhưng lại có các đoạn hiệu lực.')
    }
    if (!resolution.bundle_id) {
      messages.push('Trạng thái phân giải luật là đã phân giải nhưng thiếu mã bộ văn bản luật.')
    }
    if (!resolution.review_id) {
      messages.push('Trạng thái phân giải luật là đã phân giải nhưng thiếu mã rà soát.')
    }
    const bundle = bundleById(caseFile, resolution.bundle_id)
    if (!bundle) {
      messages.push(`Không tìm thấy bộ văn bản luật "${resolution.bundle_id}" trong hồ sơ.`)
    }

    let invalid = messages.length > 0
    let crosses = false
    let incomplete = false
    if (bundle) {
      for (const provisionId of referenced) {
        const provision = bundle.provisions.find((item) => item.id === provisionId)
        if (!provision) {
          invalid = true
          messages.push(`Điều khoản "${provisionId}" không thuộc bộ văn bản luật "${bundle.id}".`)
          continue
        }
        if (provision.review_status !== 'approved') {
          incomplete = true
          messages.push(`Điều khoản "${provisionId}" chưa được duyệt (${provision.review_status}).`)
        }
        const containment = intervalContains(provision, event)
        if (containment === 'crosses') {
          crosses = true
          messages.push(
            `Khoảng ngày hành vi "${event.id}" nằm ngoài hiệu lực của điều khoản "${provisionId}".`,
          )
        } else if (containment === 'incomplete') {
          incomplete = true
          messages.push(
            `Điều khoản "${provisionId}" thiếu ngày hiệu lực hoặc ngày hành vi để đối chiếu.`,
          )
        }
      }
    }

    return {
      conductEventId: event.id,
      status: invalid ? 'invalid' : crosses ? 'crosses' : incomplete ? 'incomplete' : 'ok',
      bundleId: resolution.bundle_id,
      messages,
      referencedProvisionIds: referenced,
      segments,
    }
  })
}

export function formatDateInterval(start: string | null, end: string | null): string {
  if (!start && !end) return 'Chưa xác định'
  if (start && end && start !== end) return `${start} → ${end}`
  return start ?? end ?? 'Chưa xác định'
}
