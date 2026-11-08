import { describe, expect, it } from 'vitest'
import { scoreSubmission } from './scoring'
import { setValue, isAnswerValueEqual } from './answers'
import { answersForPath, fixtureCase } from './test-helpers'
import { loadCase } from './load'

const NOW = '2026-01-01T00:00:00.000Z'

describe('chấm điểm theo đường đáp án', () => {
  it('đạt 100 cho đường path_a khi trả lời đúng toàn bộ expectation', () => {
    const caseFile = fixtureCase()
    const score = scoreSubmission(caseFile, answersForPath(caseFile, 'path_a'), NOW)

    expect(score.blocking).toBe(false)
    expect(score.unmatched).toBe(false)
    expect(score.pathId).toBe('path_a')
    expect(score.total).toBe(100)
    expect(score.criteria.reduce((sum, item) => sum + item.max, 0)).toBe(100)
  })

  it('đạt 100 cho đường path_b', () => {
    const caseFile = fixtureCase()
    const score = scoreSubmission(caseFile, answersForPath(caseFile, 'path_b'), NOW)

    expect(score.pathId).toBe('path_b')
    expect(score.total).toBe(100)
  })

  it('đạt 100 cho đường chưa đủ dữ kiện, kể cả khi không chọn định danh/căn cứ', () => {
    const caseFile = fixtureCase()
    const answers = answersForPath(caseFile, 'path_insufficient')
    const score = scoreSubmission(caseFile, answers, NOW)

    expect(score.pathId).toBe('path_insufficient')
    expect(score.total).toBe(100)
    expect(score.diagnostics.length).toBeGreaterThan(0)
  })

  it('đạt 100 cho cả bốn đường chưa đủ căn cứ, gồm biến thể b = not_supported', () => {
    const caseFile = fixtureCase()
    const pathIds = [
      'path_insufficient',
      'path_insufficient_a_unresolved_b_not_supported',
      'path_insufficient_a_not_supported_b_unresolved',
      'path_insufficient_both_not_supported',
    ]

    for (const pathId of pathIds) {
      const score = scoreSubmission(caseFile, answersForPath(caseFile, pathId), NOW)
      expect(score.blocking, pathId).toBe(false)
      expect(score.unmatched, pathId).toBe(false)
      expect(score.pathId, pathId).toBe(pathId)
      expect(score.total, pathId).toBe(100)
    }
  })

  it('path A không đòi dấu hiệu mục đích của B cũng được hỗ trợ', () => {
    const caseFile = fixtureCase()
    const answers = setValue(
      answersForPath(caseFile, 'path_a'),
      'element_status',
      'element_b_01',
      'supported',
    )

    const score = scoreSubmission(caseFile, answers, NOW)
    expect(score.blocking).toBe(false)
    expect(score.pathId).toBe('path_a')
    expect(score.total).toBe(100)
  })

  it('path B không đòi dấu hiệu hành vi của A cũng được hỗ trợ', () => {
    const caseFile = fixtureCase()
    const answers = setValue(
      answersForPath(caseFile, 'path_b'),
      'element_status',
      'element_a_01',
      'supported',
    )

    const score = scoreSubmission(caseFile, answers, NOW)
    expect(score.blocking).toBe(false)
    expect(score.pathId).toBe('path_b')
    expect(score.total).toBe(100)
  })

  it('không gán điểm khi kết luận chưa đủ căn cứ nhưng tự đánh giá một dấu hiệu là supported', () => {
    const caseFile = fixtureCase()
    const answers = setValue(
      answersForPath(caseFile, 'path_insufficient'),
      'element_status',
      'element_a_01',
      'supported',
    )

    const score = scoreSubmission(caseFile, answers, NOW)
    expect(score.blocking).toBe(false)
    expect(score.unmatched).toBe(true)
    expect(score.total).toBeNull()
    expect(score.pathId).toBeNull()
    expect(score.diagnostics.length).toBeGreaterThan(0)
  })

  it('chặn khi kết luận A/B không đi kèm đúng định danh tương ứng', () => {
    const caseFile = fixtureCase()

    let answers = answersForPath(caseFile, 'path_a')
    answers = setValue(answers, 'element_status', 'element_b_01', 'supported')
    answers = setValue(answers, 'selected_charge', 'person_a:conduct_01', 'charge_b')
    const wrongCharge = scoreSubmission(caseFile, answers, NOW)
    expect(wrongCharge.blocking).toBe(true)
    expect(
      wrongCharge.consistency.find(
        (item) => item.ruleId === 'rule_conclusion_a_requires_charge_a',
      )?.status,
    ).toBe('fail')

    let emptyCharge = answersForPath(caseFile, 'path_b')
    emptyCharge = setValue(emptyCharge, 'selected_charge', 'person_a:conduct_01', null)
    const noCharge = scoreSubmission(caseFile, emptyCharge, NOW)
    expect(noCharge.blocking).toBe(true)
    expect(
      noCharge.consistency.find(
        (item) => item.ruleId === 'rule_conclusion_b_requires_charge_b',
      )?.status,
    ).toBe('fail')
  })

  it('chỉ đạt điểm kết quả cấu hình khi chọn đúng nhưng không viện dẫn dữ kiện', () => {
    const caseFile = fixtureCase()
    let answers = answersForPath(caseFile, 'path_a')
    for (const field of ['source_assessment', 'procedure_assessment', 'reliability_assessment', 'relevance_assessment']) {
      const targets = caseFile.answer_fields.find((item) => item.id === field)?.target_ids ?? []
      for (const target of targets) answers = setValue(answers, field, target, null)
    }
    for (const hypothesis of caseFile.hypotheses) {
      answers = setValue(answers, 'hypothesis_support', hypothesis.id, null)
      answers = setValue(answers, 'hypothesis_challenge', hypothesis.id, null)
    }
    for (const row of caseFile.proof_matrix) {
      answers = setValue(answers, 'proof_assessment', row.id, null)
    }
    for (const circumstance of caseFile.circumstances) {
      answers = setValue(answers, 'circumstance_status', circumstance.id, null)
    }

    const score = scoreSubmission(caseFile, answers, NOW)

    expect(score.pathId).toBe('path_a')
    expect(score.total).toBe(40)
    const evidence = score.criteria.find((item) => item.criterionId === 'criterion_evidence')
    expect(evidence?.earned).toBe(0)
    const charge = score.criteria.find((item) => item.criterionId === 'criterion_charge')
    expect(charge?.earned).toBe(charge?.max)
  })

  it('cho điểm một phần theo trọng số expectation và làm tròn một lần ở tổng', () => {
    const caseFile = fixtureCase()
    let answers = answersForPath(caseFile, 'path_a')
    answers = setValue(answers, 'source_assessment', 'ev_statement_01', null)

    const score = scoreSubmission(caseFile, answers, NOW)
    expect(score.pathId).toBe('path_a')
    expect(score.total).toBe(97)

    const evidence = score.criteria.find((item) => item.criterionId === 'criterion_evidence')
    expect(evidence?.earned).toBeCloseTo((20 * 6) / 7, 5)
    expect(score.total).toBe(
      Math.round(score.criteria.reduce((sum, item) => sum + item.earned, 0)),
    )
  })

  it('làm tròn một lần sau khi cộng nhiều tiêu chí', () => {
    const caseFile = fixtureCase()
    let answers = answersForPath(caseFile, 'path_a')
    answers = setValue(answers, 'source_assessment', 'ev_statement_01', null)
    answers = setValue(answers, 'procedure_assessment', 'ev_record_01', null)
    answers = setValue(answers, 'hypothesis_support', 'hypothesis_a', null)

    const score = scoreSubmission(caseFile, answers, NOW)
    const raw = score.criteria.reduce((sum, item) => sum + item.earned, 0)

    expect(raw).not.toBe(Math.round(raw))
    expect(score.total).toBe(Math.round(raw))
  })

  it('so khớp multi-select bằng đúng tập giá trị, không chỉ vì chứa một option đúng', () => {
    expect(isAnswerValueEqual(['a', 'b'], ['b', 'a'])).toBe(true)
    expect(isAnswerValueEqual(['a'], ['a', 'b'])).toBe(false)
    expect(isAnswerValueEqual(['a', 'b', 'c'], ['a', 'b'])).toBe(false)

    const caseFile = fixtureCase()
    let answers = answersForPath(caseFile, 'path_a')
    answers = setValue(answers, 'hypothesis_support', 'hypothesis_a', [
      'ev_record_01',
      'ev_statement_01',
    ])

    const score = scoreSubmission(caseFile, answers, NOW)
    const hypothesis = score.criteria.find(
      (item) => item.criterionId === 'criterion_hypothesis',
    )
    const expectation = hypothesis?.expectations.find(
      (item) => item.expectationId === 'expect_hyp_a_support',
    )
    expect(expectation?.met).toBe(false)
    expect(score.total).toBeLessThan(100)
  })
})

describe('quy tắc nhất quán và đường đáp án không khớp', () => {
  it('chặn chấm điểm khi chọn định danh nhưng dấu hiệu bắt buộc không được hỗ trợ', () => {
    const caseFile = fixtureCase()
    let answers = answersForPath(caseFile, 'path_a')
    answers = setValue(answers, 'element_status', 'element_a_01', 'not_supported')

    const score = scoreSubmission(caseFile, answers, NOW)

    expect(score.blocking).toBe(true)
    expect(score.total).toBeNull()
    expect(score.criteria).toEqual([])
    expect(
      score.consistency.some(
        (item) => item.ruleId === 'rule_charge_a_element' && item.status === 'fail',
      ),
    ).toBe(true)
  })

  it('chặn khi kết luận chưa đủ căn cứ nhưng vẫn chọn định danh', () => {
    const caseFile = fixtureCase()
    let answers = answersForPath(caseFile, 'path_insufficient')
    answers = setValue(answers, 'selected_charge', 'person_a:conduct_01', 'charge_a')

    const score = scoreSubmission(caseFile, answers, NOW)

    expect(score.blocking).toBe(true)
    expect(score.total).toBeNull()
    expect(score.unmatched).toBe(false)
    expect(score.consistency.find((item) => item.ruleId === 'rule_insufficient_excludes_charge')?.status).toBe(
      'fail',
    )
  })

  it('không gán điểm khi tổ hợp gần path nhưng không khớp path nào', () => {
    const caseFile = fixtureCase()
    let answers = answersForPath(caseFile, 'path_insufficient')
    answers = setValue(answers, 'element_status', 'element_b_01', 'supported')

    const score = scoreSubmission(caseFile, answers, NOW)

    expect(score.blocking).toBe(false)
    expect(score.unmatched).toBe(true)
    expect(score.total).toBeNull()
    expect(score.pathId).toBeNull()
    expect(score.diagnostics.length).toBeGreaterThan(0)
  })
})

describe('hồ sơ nhiều đường đáp án (case_002)', () => {
  it('cả hai đường đáp án đạt 100 điểm với câu trả lời lý tưởng', () => {
    const loaded = loadCase('case_002')
    expect(loaded.ok).toBe(true)
    if (!loaded.ok) return

    for (const pathId of ['path_a', 'path_b']) {
      const score = scoreSubmission(loaded.caseFile, answersForPath(loaded.caseFile, pathId), NOW)
      expect(score.blocking, pathId).toBe(false)
      expect(score.unmatched, pathId).toBe(false)
      expect(score.pathId, pathId).toBe(pathId)
      expect(score.total, pathId).toBe(100)
    }
  })

  it('trường chọn một nhận một trong các giá trị thay thế được chấp nhận', () => {
    const loaded = loadCase('case_002')
    expect(loaded.ok).toBe(true)
    if (!loaded.ok) return

    const answers = setValue(
      answersForPath(loaded.caseFile, 'path_a'),
      'element_status',
      'element_b_01',
      'unresolved',
    )

    const score = scoreSubmission(loaded.caseFile, answers, NOW)
    expect(score.blocking).toBe(false)
    expect(score.pathId).toBe('path_a')
    expect(score.total).toBe(100)
  })
})
