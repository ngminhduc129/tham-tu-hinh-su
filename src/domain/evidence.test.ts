import { describe, expect, it } from 'vitest'
import {
  evidenceProgress,
  evidenceState,
  isEvidenceDiscovered,
  lockedReason,
} from './evidence'
import { createSession } from '../state/reducer'
import { cloneCase, fixtureCase } from './test-helpers'
import type { EvidenceRecord } from './types'

describe('mở khóa chứng cứ theo luật discovery', () => {
  it('tài liệu always có thể đọc ngay', () => {
    const caseFile = fixtureCase()
    const session = createSession(caseFile)
    const record = caseFile.evidence.find((item) => item.id === 'ev_record_01')
    expect(record).toBeDefined()
    expect(evidenceState(record as EvidenceRecord, session)).toBe('available')
  })

  it('tài liệu viewed bị khóa cho đến khi xem tài liệu phụ thuộc', () => {
    const caseFile = fixtureCase()
    let session = createSession(caseFile)
    const receipt = caseFile.evidence.find((item) => item.id === 'ev_receipt_01') as EvidenceRecord

    expect(evidenceState(receipt, session)).toBe('locked')
    expect(lockedReason(receipt, session)).toContain('ev_record_01')

    session = { ...session, viewedEvidenceIds: ['ev_record_01'] }
    expect(evidenceState(receipt, session)).toBe('available')
  })

  it('tài liệu check chỉ mở khi đã xem đủ tài liệu yêu cầu, sau đó đánh dấu requested', () => {
    const caseFile = fixtureCase()
    let session = createSession(caseFile)
    const inventory = caseFile.evidence.find((item) => item.id === 'ev_inventory_01') as EvidenceRecord

    expect(evidenceState(inventory, session)).toBe('locked')
    session = { ...session, viewedEvidenceIds: ['ev_record_01'] }
    expect(evidenceState(inventory, session)).toBe('available')

    session = { ...session, requestedCheckIds: ['ev_inventory_01'], viewedEvidenceIds: ['ev_record_01', 'ev_inventory_01'] }
    expect(evidenceState(inventory, session)).toBe('requested')
    expect(isEvidenceDiscovered('requested')).toBe(true)
  })

  it('tài liệu unavailable không bao giờ mở', () => {
    const caseFile = cloneCase(fixtureCase())
    const record = caseFile.evidence[0]
    record.discovery = { kind: 'unavailable' }
    const session = createSession(caseFile)
    expect(evidenceState(record, session)).toBe('unavailable')
    expect(isEvidenceDiscovered('unavailable')).toBe(false)
  })

  it('tiến độ chỉ để tham khảo, đếm tài liệu đã mở hoặc yêu cầu', () => {
    const caseFile = fixtureCase()
    let session = createSession(caseFile)
    expect(evidenceProgress(session, caseFile.evidence)).toEqual({
      discovered: 0,
      total: caseFile.evidence.length,
    })

    session = {
      ...session,
      viewedEvidenceIds: ['ev_record_01', 'ev_statement_01'],
      requestedCheckIds: ['ev_inventory_01'],
    }
    const progress = evidenceProgress(session, caseFile.evidence)
    expect(progress.discovered).toBe(3)
    expect(progress.total).toBe(caseFile.evidence.length)
  })
})
