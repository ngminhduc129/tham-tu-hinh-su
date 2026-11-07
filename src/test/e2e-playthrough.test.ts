import { describe, expect, it } from 'vitest'
import { fixtureCase, answersForPath } from '../domain/test-helpers'
import { createSession, gameReducer } from '../state/reducer'
import { matchAnswerPath, evaluateConsistency, blockingFailures } from '../domain/matching'
import { scoreSubmission } from '../domain/scoring'

describe('End-to-End User Playthrough Journeys', () => {
  it('Kịch bản 1: Người chơi đi qua toàn bộ các bước và đạt 100 điểm với path_a', () => {
    const caseFile = fixtureCase()
    let session = createSession(caseFile)

    // 1. Xem tài liệu trong Investigation
    session = gameReducer(session, { type: 'VIEW_EVIDENCE', evidenceId: 'ev_record_01' })
    session = gameReducer(session, { type: 'VIEW_EVIDENCE', evidenceId: 'ev_statement_01' })
    session = gameReducer(session, { type: 'REQUEST_CHECK', evidenceId: 'ev_inventory_01' })

    expect(session.viewedEvidenceIds).toContain('ev_record_01')
    expect(session.requestedCheckIds).toContain('ev_inventory_01')

    // 2. Điền bộ đáp án trọn vẹn cho path_a
    const pathAAnswers = answersForPath(caseFile, 'path_a')
    for (const [fieldId, targetMap] of Object.entries(pathAAnswers)) {
      for (const [targetId, values] of Object.entries(targetMap)) {
        session = gameReducer(session, {
          type: 'SET_ANSWER',
          fieldId,
          targetId,
          value: values,
        })
      }
    }

    // 3. Chấm điểm & Nộp bài
    const score = scoreSubmission(caseFile, session.answers)
    expect(score.blocking).toBe(false)
    expect(score.unmatched).toBe(false)
    expect(score.pathId).toBe('path_a')
    expect(score.total).toBe(100)

    session = gameReducer(session, { type: 'SUBMIT', score })
    expect(session.status).toBe('submitted')
    expect(session.score?.total).toBe(100)
  })

  it('Kịch bản 2: Người chơi chọn kết luận chưa đủ căn cứ với element_b_01 là not_supported', () => {
    const caseFile = fixtureCase()
    let session = createSession(caseFile)

    // Người chơi chọn dấu hiệu A là unresolved, dấu hiệu B là not_supported
    session = gameReducer(session, {
      type: 'SET_ANSWER',
      fieldId: 'element_status',
      targetId: 'element_a_01',
      value: 'unresolved',
    })
    session = gameReducer(session, {
      type: 'SET_ANSWER',
      fieldId: 'element_status',
      targetId: 'element_b_01',
      value: 'not_supported',
    })
    // Không chọn định danh
    // Chọn kết luận conclusion_insufficient
    session = gameReducer(session, {
      type: 'SET_ANSWER',
      fieldId: 'conclusion',
      targetId: 'person_a:conduct_01',
      value: 'conclusion_insufficient',
    })

    // Khớp path chưa đủ căn cứ tương ứng với trạng thái từng dấu hiệu
    const matchedPath = matchAnswerPath(caseFile, session.answers)
    expect(matchedPath).not.toBeNull()
    expect(matchedPath?.id).toBe('path_insufficient_a_unresolved_b_not_supported')

    const score = scoreSubmission(caseFile, session.answers)
    expect(score.blocking).toBe(false)
    expect(score.unmatched).toBe(false)
    expect(score.pathId).toBe('path_insufficient_a_unresolved_b_not_supported')
    expect(score.total).toBeGreaterThan(0)
  })

  it('Kịch bản 3: Quy tắc mâu thuẫn (blocking consistency) ngăn chặn nộp điểm sai', () => {
    const caseFile = fixtureCase()
    let session = createSession(caseFile)

    // Chọn vừa conclusion_insufficient VỪA chọn định danh charge_a -> vi phạm rule_insufficient_excludes_charge
    session = gameReducer(session, {
      type: 'SET_ANSWER',
      fieldId: 'conclusion',
      targetId: 'person_a:conduct_01',
      value: 'conclusion_insufficient',
    })
    session = gameReducer(session, {
      type: 'SET_ANSWER',
      fieldId: 'selected_charge',
      targetId: 'person_a:conduct_01',
      value: 'charge_a',
    })

    const consistency = evaluateConsistency(caseFile, session.answers)
    const blocking = blockingFailures(consistency)
    expect(blocking.length).toBeGreaterThan(0)
    expect(blocking[0].ruleId).toBe('rule_insufficient_excludes_charge')

    const score = scoreSubmission(caseFile, session.answers)
    expect(score.blocking).toBe(true)
    expect(score.total).toBeNull()
  })

  it('Kịch bản 4: Mở lại bài đã nộp (REOPEN) xóa trạng thái submitted để sửa câu trả lời', () => {
    const caseFile = fixtureCase()
    let session = createSession(caseFile)

    session = gameReducer(session, {
      type: 'SUBMIT',
      score: {
        pathId: 'path_a',
        pathLabel: 'Định danh A',
        total: 100,
        roundOnce: true,
        criteria: [],
        diagnostics: [],
        consistency: [],
        blocking: false,
        unmatched: false,
        scoredAt: new Date().toISOString(),
      },
    })
    expect(session.status).toBe('submitted')

    // Mở lại
    session = gameReducer(session, { type: 'REOPEN' })
    expect(session.status).toBe('in_progress')
    expect(session.score).toBeUndefined()
  })
})
