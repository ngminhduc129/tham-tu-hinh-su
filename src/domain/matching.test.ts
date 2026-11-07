import { describe, expect, it } from 'vitest'
import { blockingFailures, evaluateConsistency, evaluateRule, matchAnswerPath } from './matching'
import { evalExpr } from './expr'
import { answersForPath, cloneCase, fixtureCase } from './test-helpers'
import { setValue } from './answers'

describe('DSL biểu thức', () => {
  it('đánh giá equals/not_equals/contains/is_empty trên registry đã khai báo', () => {
    const caseFile = fixtureCase()
    const answers = setValue(
      setValue({}, 'element_status', 'element_a_01', 'supported'),
      'hypothesis_support',
      'hypothesis_a',
      ['ev_record_01'],
    )

    expect(
      evalExpr(
        { op: 'equals', field_id: 'element_status', target_id: 'element_a_01', value: 'supported' },
        answers,
      ),
    ).toBe(true)
    expect(
      evalExpr(
        {
          op: 'not_equals',
          field_id: 'element_status',
          target_id: 'element_a_01',
          value: 'unresolved',
        },
        answers,
      ),
    ).toBe(true)
    expect(
      evalExpr(
        {
          op: 'contains',
          field_id: 'hypothesis_support',
          target_id: 'hypothesis_a',
          value: 'ev_record_01',
        },
        answers,
      ),
    ).toBe(true)
    expect(
      evalExpr(
        { op: 'is_empty', field_id: 'selected_charge', target_id: 'person_a:conduct_01' },
        answers,
      ),
    ).toBe(true)
    expect(
      evalExpr(
        { op: 'is_not_empty', field_id: 'element_status', target_id: 'element_a_01' },
        answers,
      ),
    ).toBe(true)
    expect(caseFile.answer_paths.length).toBeGreaterThan(0)
  })

  it('all/any kết hợp đúng', () => {
    const answers = setValue({}, 'element_status', 'element_a_01', 'supported')
    expect(
      evalExpr(
        {
          op: 'any',
          args: [
            { op: 'equals', field_id: 'element_status', target_id: 'element_a_01', value: 'unresolved' },
            { op: 'equals', field_id: 'element_status', target_id: 'element_a_01', value: 'supported' },
          ],
        },
        answers,
      ),
    ).toBe(true)
    expect(
      evalExpr(
        {
          op: 'all',
          args: [
            { op: 'equals', field_id: 'element_status', target_id: 'element_a_01', value: 'supported' },
            { op: 'is_empty', field_id: 'selected_charge', target_id: 'person_a:conduct_01' },
          ],
        },
        answers,
      ),
    ).toBe(true)
  })
})

describe('so khớp đường đáp án và quy tắc nhất quán', () => {
  it('khớp path_a với câu trả lời đầy đủ và không khớp khi để trống', () => {
    const caseFile = fixtureCase()
    expect(matchAnswerPath(caseFile, {})).toBeNull()
    expect(matchAnswerPath(caseFile, answersForPath(caseFile, 'path_a'))?.id).toBe('path_a')
    expect(matchAnswerPath(caseFile, answersForPath(caseFile, 'path_b'))?.id).toBe('path_b')
    expect(matchAnswerPath(caseFile, answersForPath(caseFile, 'path_insufficient'))?.id).toBe(
      'path_insufficient',
    )
  })

  it('path_selection.order điều khiển thứ tự ưu tiên khi nhiều path cùng khớp', () => {
    const caseFile = cloneCase(fixtureCase())
    const pathA = caseFile.answer_paths.find((path) => path.id === 'path_a')
    expect(pathA).toBeDefined()
    if (!pathA) return

    const duplicate = { ...pathA, id: 'path_duplicate', label: 'Bản sao kiểm thử' }
    caseFile.answer_paths = [duplicate, ...caseFile.answer_paths]
    const answers = answersForPath(caseFile, 'path_a')

    // Không khai báo chính sách: giữ hành vi cũ, path khai báo trước thắng.
    expect(matchAnswerPath(caseFile, answers)?.id).toBe('path_duplicate')

    caseFile.path_selection = {
      mode: 'priority',
      order: ['path_a', 'path_duplicate', 'path_b', 'path_insufficient'],
    }
    expect(matchAnswerPath(caseFile, answers)?.id).toBe('path_a')
  })

  it('rule chỉ chạy khi điều kiện when đúng; nếu sai thì skip', () => {
    const caseFile = fixtureCase()
    const rule = caseFile.consistency_rules.find((item) => item.id === 'rule_charge_a_element')
    expect(rule).toBeDefined()
    if (!rule) return

    expect(evaluateRule(rule, {}).status).toBe('skip')
    const result = evaluateRule(
      rule,
      setValue({}, 'selected_charge', 'person_a:conduct_01', 'charge_a'),
    )
    expect(result.status).toBe('fail')
    expect(result.severity).toBe('blocking')
  })

  it('không có lỗi blocking với câu trả lời path_a đầy đủ', () => {
    const caseFile = fixtureCase()
    const results = evaluateConsistency(caseFile, answersForPath(caseFile, 'path_a'))
    expect(blockingFailures(results)).toEqual([])
  })

  it('phát hiện lỗi blocking và trả về đúng rule', () => {
    const caseFile = fixtureCase()
    const answers = setValue(
      setValue({}, 'conclusion', 'person_a:conduct_01', 'conclusion_insufficient'),
      'selected_charge',
      'person_a:conduct_01',
      'charge_a',
    )
    const fails = blockingFailures(evaluateConsistency(caseFile, answers))
    expect(fails.map((item) => item.ruleId)).toContain('rule_insufficient_excludes_charge')
  })
})
