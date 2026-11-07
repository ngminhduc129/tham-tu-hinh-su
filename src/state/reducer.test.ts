import { describe, expect, it } from 'vitest'
import { createSession, gameReducer } from './reducer'
import { fixtureCase } from '../domain/test-helpers'
import { scoreSubmission } from '../domain/scoring'
import { answersForPath } from '../domain/test-helpers'

describe('reducer phiên chơi', () => {
  it('tạo phiên mới với đúng case và trạng thái ban đầu', () => {
    const caseFile = fixtureCase()
    const session = createSession(caseFile)

    expect(session.caseId).toBe(caseFile.metadata.id)
    expect(session.caseVersion).toBe(caseFile.metadata.version)
    expect(session.currentStage).toBe('brief')
    expect(session.status).toBe('in_progress')
    expect(session.answers).toEqual({})
    expect(session.viewedEvidenceIds).toEqual([])
    expect(session.sessionId.length).toBeGreaterThan(4)
  })

  it('mở tài liệu, yêu cầu kiểm tra và không nhân đôi id', () => {
    const caseFile = fixtureCase()
    let session = createSession(caseFile)

    session = gameReducer(session, { type: 'VIEW_EVIDENCE', evidenceId: 'ev_record_01' })
    session = gameReducer(session, { type: 'VIEW_EVIDENCE', evidenceId: 'ev_record_01' })
    expect(session.viewedEvidenceIds).toEqual(['ev_record_01'])

    session = gameReducer(session, { type: 'REQUEST_CHECK', evidenceId: 'ev_inventory_01' })
    expect(session.requestedCheckIds).toEqual(['ev_inventory_01'])
    expect(session.viewedEvidenceIds).toContain('ev_inventory_01')

    session = gameReducer(session, { type: 'VIEW_EVIDENCE', evidenceId: 'ev_inventory_01' })
    expect(session.requestedCheckIds).toEqual([])
  })

  it('lưu câu trả lời single-choice và toggle multi-select chính xác', () => {
    const caseFile = fixtureCase()
    let session = createSession(caseFile)

    session = gameReducer(session, {
      type: 'SET_ANSWER',
      fieldId: 'source_assessment',
      targetId: 'ev_record_01',
      value: 'source_supported',
    })
    expect(session.answers.source_assessment.ev_record_01).toBe('source_supported')

    session = gameReducer(session, {
      type: 'TOGGLE_MULTI',
      fieldId: 'hypothesis_support',
      targetId: 'hypothesis_a',
      value: 'ev_record_01',
    })
    session = gameReducer(session, {
      type: 'TOGGLE_MULTI',
      fieldId: 'hypothesis_support',
      targetId: 'hypothesis_a',
      value: 'ev_statement_01',
    })
    expect(session.answers.hypothesis_support.hypothesis_a).toEqual([
      'ev_record_01',
      'ev_statement_01',
    ])

    session = gameReducer(session, {
      type: 'TOGGLE_MULTI',
      fieldId: 'hypothesis_support',
      targetId: 'hypothesis_a',
      value: 'ev_record_01',
    })
    expect(session.answers.hypothesis_support.hypothesis_a).toEqual(['ev_statement_01'])

    session = gameReducer(session, {
      type: 'SET_ANSWER',
      fieldId: 'source_assessment',
      targetId: 'ev_record_01',
      value: null,
    })
    expect(session.answers.source_assessment).toBeUndefined()
  })

  it('ghi chú không chấm điểm, tự xóa khi rỗng', () => {
    const caseFile = fixtureCase()
    let session = createSession(caseFile)

    session = gameReducer(session, {
      type: 'SET_NOTE',
      key: 'evidence:ev_record_01',
      value: 'suy nghĩ riêng',
    })
    expect(session.notes['evidence:ev_record_01']).toBe('suy nghĩ riêng')

    session = gameReducer(session, {
      type: 'SET_NOTE',
      key: 'evidence:ev_record_01',
      value: '   ',
    })
    expect(session.notes['evidence:ev_record_01']).toBeUndefined()
    expect(session.score).toBeUndefined()
  })

  it('ghi nhận gợi ý đã dùng nhưng không trừ điểm', () => {
    const caseFile = fixtureCase()
    let session = createSession(caseFile)

    session = gameReducer(session, { type: 'USE_HINT', hintId: 'hint_01' })
    session = gameReducer(session, { type: 'USE_HINT', hintId: 'hint_01' })
    expect(session.selectedHints).toEqual(['hint_01'])

    const score = scoreSubmission(caseFile, answersForPath(caseFile, 'path_a'))
    expect(score.total).toBe(100)
    expect(session.selectedHints).toEqual(['hint_01'])
  })

  it('nộp, mở lại và đặt lại phiên', () => {
    const caseFile = fixtureCase()
    let session = createSession(caseFile)
    const score = scoreSubmission(caseFile, answersForPath(caseFile, 'path_a'))

    session = gameReducer(session, { type: 'SET_STAGE', stage: 'submission' })
    session = gameReducer(session, { type: 'SUBMIT', score })

    expect(session.status).toBe('submitted')
    expect(session.currentStage).toBe('feedback')
    expect(session.score?.total).toBe(100)
    expect(session.submittedAt).toBeTruthy()

    session = gameReducer(session, { type: 'REOPEN' })
    expect(session.status).toBe('in_progress')
    expect(session.score).toBeUndefined()
    expect(session.submittedAt).toBeUndefined()
    expect(session.currentStage).toBe('submission')

    const fresh = createSession(caseFile)
    session = gameReducer(session, { type: 'RESET', session: fresh })
    expect(session.sessionId).toBe(fresh.sessionId)
    expect(session.answers).toEqual({})
  })

  it('nhập phiên thay thế toàn bộ trạng thái', () => {
    const caseFile = fixtureCase()
    const current = createSession(caseFile)
    const imported = createSession(caseFile)
    imported.status = 'submitted'
    imported.currentStage = 'feedback'

    const next = gameReducer(current, { type: 'IMPORT', session: imported })
    expect(next).toBe(imported)
  })
})
