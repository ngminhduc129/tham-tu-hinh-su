import type { EvidenceRecord, GameSession } from './types'

export type EvidenceState = 'locked' | 'available' | 'viewed' | 'requested' | 'unavailable'

export function evidenceState(evidence: EvidenceRecord, session: GameSession): EvidenceState {
  const rule = evidence.discovery ?? { kind: 'always' as const }

  if (rule.kind === 'unavailable') return 'unavailable'
  if (session.requestedCheckIds.includes(evidence.id)) return 'requested'
  if (session.viewedEvidenceIds.includes(evidence.id)) return 'viewed'

  if (rule.kind === 'viewed') {
    const needed = rule.evidence_ids ?? []
    const mode = rule.mode ?? 'all'
    const viewed = needed.map((id) => session.viewedEvidenceIds.includes(id))
    const unlocked = mode === 'all' ? viewed.every(Boolean) : viewed.some(Boolean)
    return unlocked ? 'available' : 'locked'
  }

  if (rule.kind === 'check') {
    const needed = rule.requires_viewed ?? []
    return needed.every((id) => session.viewedEvidenceIds.includes(id)) ? 'available' : 'locked'
  }

  return 'available'
}

export function isEvidenceDiscovered(state: EvidenceState): boolean {
  return state === 'viewed' || state === 'requested'
}

export function evidenceProgress(session: GameSession, evidence: EvidenceRecord[]): {
  discovered: number
  total: number
} {
  const discovered = evidence.filter((item) => {
    const state = evidenceState(item, session)
    return isEvidenceDiscovered(state)
  }).length
  return { discovered, total: evidence.length }
}

export function lockedReason(evidence: EvidenceRecord, session: GameSession): string | null {
  const rule = evidence.discovery ?? { kind: 'always' as const }
  if (rule.kind === 'viewed') {
    const missing = (rule.evidence_ids ?? []).filter(
      (id) => !session.viewedEvidenceIds.includes(id),
    )
    if (missing.length > 0) {
      return `Cần xem trước: ${missing.join(', ')}`
    }
  }
  if (rule.kind === 'check') {
    const missing = (rule.requires_viewed ?? []).filter(
      (id) => !session.viewedEvidenceIds.includes(id),
    )
    if (missing.length > 0) {
      return `Cần xem trước: ${missing.join(', ')}`
    }
  }
  return null
}
