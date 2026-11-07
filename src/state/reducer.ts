import type { AnswerValue, CaseFile, GameSession, ScoreResult, Stage } from '../domain/types'
import { getValues, setValue } from '../domain/answers'

export type GameAction =
  | { type: 'SET_STAGE'; stage: Stage }
  | { type: 'VIEW_EVIDENCE'; evidenceId: string }
  | { type: 'REQUEST_CHECK'; evidenceId: string }
  | { type: 'SET_ANSWER'; fieldId: string; targetId: string; value: AnswerValue | null }
  | { type: 'TOGGLE_MULTI'; fieldId: string; targetId: string; value: string }
  | { type: 'SET_NOTE'; key: string; value: string }
  | { type: 'USE_HINT'; hintId: string }
  | { type: 'SUBMIT'; score: ScoreResult }
  | { type: 'REOPEN' }
  | { type: 'RESET'; session: GameSession }
  | { type: 'IMPORT'; session: GameSession }
  | { type: 'TOUCH' }

function makeSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function createSession(caseFile: CaseFile): GameSession {
  const now = new Date().toISOString()
  return {
    sessionId: makeSessionId(),
    caseId: caseFile.metadata.id,
    caseVersion: caseFile.metadata.version,
    lawBundleId: caseFile.law_bundles[0]?.id ?? '',
    currentStage: 'brief',
    viewedEvidenceIds: [],
    requestedCheckIds: [],
    answers: {},
    notes: {},
    selectedHints: [],
    status: 'in_progress',
    updatedAt: now,
  }
}

export function gameReducer(state: GameSession, action: GameAction): GameSession {
  const now = new Date().toISOString()
  switch (action.type) {
    case 'SET_STAGE':
      return { ...state, currentStage: action.stage, updatedAt: now }
    case 'VIEW_EVIDENCE':
      return {
        ...state,
        viewedEvidenceIds: state.viewedEvidenceIds.includes(action.evidenceId)
          ? state.viewedEvidenceIds
          : [...state.viewedEvidenceIds, action.evidenceId],
        requestedCheckIds: state.requestedCheckIds.filter((id) => id !== action.evidenceId),
        updatedAt: now,
      }
    case 'REQUEST_CHECK':
      return {
        ...state,
        requestedCheckIds: state.requestedCheckIds.includes(action.evidenceId)
          ? state.requestedCheckIds
          : [...state.requestedCheckIds, action.evidenceId],
        viewedEvidenceIds: state.viewedEvidenceIds.includes(action.evidenceId)
          ? state.viewedEvidenceIds
          : [...state.viewedEvidenceIds, action.evidenceId],
        updatedAt: now,
      }
    case 'SET_ANSWER':
      return {
        ...state,
        answers: setValue(state.answers, action.fieldId, action.targetId, action.value),
        updatedAt: now,
      }
    case 'TOGGLE_MULTI': {
      const current = getValues(state.answers, action.fieldId, action.targetId)
      const next = current.includes(action.value)
        ? current.filter((value) => value !== action.value)
        : [...current, action.value]
      return {
        ...state,
        answers: setValue(state.answers, action.fieldId, action.targetId, next),
        updatedAt: now,
      }
    }
    case 'SET_NOTE': {
      const notes = { ...state.notes }
      if (action.value.trim() === '') {
        delete notes[action.key]
      } else {
        notes[action.key] = action.value
      }
      return { ...state, notes, updatedAt: now }
    }
    case 'USE_HINT':
      return {
        ...state,
        selectedHints: state.selectedHints.includes(action.hintId)
          ? state.selectedHints
          : [...state.selectedHints, action.hintId],
        updatedAt: now,
      }
    case 'SUBMIT':
      return {
        ...state,
        status: 'submitted',
        score: action.score,
        submittedAt: now,
        currentStage: 'feedback',
        updatedAt: now,
      }
    case 'REOPEN':
      return {
        ...state,
        status: 'in_progress',
        score: undefined,
        submittedAt: undefined,
        currentStage: 'submission',
        updatedAt: now,
      }
    case 'RESET':
      return action.session
    case 'IMPORT':
      return action.session
    case 'TOUCH':
      return { ...state, updatedAt: now }
    default:
      return state
  }
}
