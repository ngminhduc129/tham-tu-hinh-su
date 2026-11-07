import { describe, expect, it } from 'vitest'
import { lintCase, summarizeLint } from './linter'
import { outcomeCatalog } from './load'
import { cloneCase, fixtureCase } from './test-helpers'
import type { LintIssue } from './types'

function codes(issues: LintIssue[]): string[] {
  return issues.map((issue) => issue.code)
}

describe('content linter', () => {
  it('case nháp hợp lệ không có lỗi cấu trúc', () => {
    const issues = lintCase(fixtureCase(), outcomeCatalog, { mode: 'draft' })
    const summary = summarizeLint(issues)
    expect(summary.errors).toBe(0)
    expect(summary.warnings).toBeGreaterThan(0)
  })

  it('publish gate chặn case nháp với đủ blocker', () => {
    const issues = lintCase(fixtureCase(), outcomeCatalog, { mode: 'publish' })
    const summary = summarizeLint(issues)
    expect(summary.errors).toBe(17)
    expect(codes(issues)).toEqual(
      expect.arrayContaining([
        'anchor_reason_placeholder',
        'age_conditions_publish',
        'law_invalid',
        'sem_explanation_unused',
        'publish_status',
        'publish_review',
        'publish_provision',
        'publish_placeholder',
      ]),
    )
  })

  it('phát hiện ID trùng giữa hai collection', () => {
    const caseFile = cloneCase(fixtureCase())
    caseFile.evidence[1].id = caseFile.evidence[0].id
    const issues = lintCase(caseFile, outcomeCatalog, { mode: 'draft' })
    expect(codes(issues)).toContain('duplicate_id')
  })

  it('phát hiện source_id không tồn tại', () => {
    const caseFile = cloneCase(fixtureCase())
    caseFile.facts[0].source_ids = ['missing_source']
    const issues = lintCase(caseFile, outcomeCatalog, { mode: 'draft' })
    expect(codes(issues)).toContain('fact_source_missing')
  })

  it('phát hiện tổng điểm criterion của path khác 100', () => {
    const caseFile = cloneCase(fixtureCase())
    caseFile.scoring.path_weights[0].criterion_points.criterion_evidence += 5
    const issues = lintCase(caseFile, outcomeCatalog, { mode: 'draft' })
    expect(codes(issues)).toContain('weight_sum')
  })

  it('phát hiện biểu thức path tham chiếu field không tồn tại', () => {
    const caseFile = cloneCase(fixtureCase())
    caseFile.answer_paths[0].match = {
      op: 'equals',
      field_id: 'missing_field',
      target_id: 'missing_target',
      value: 'missing_value',
    }
    const issues = lintCase(caseFile, outcomeCatalog, { mode: 'draft' })
    expect(codes(issues)).toContain('expr_invalid')
  })

  it('phát hiện learning outcome không được đo bởi criterion', () => {
    const caseFile = cloneCase(fixtureCase())
    caseFile.metadata.learning_outcome_ids.push('lo_unmeasured')
    const issues = lintCase(caseFile, outcomeCatalog, { mode: 'draft' })
    expect(codes(issues)).toContain('outcome_missing')
    expect(codes(issues)).toContain('outcome_unmeasured')
  })

  it('phát hiện accepted value không thuộc options của field', () => {
    const caseFile = cloneCase(fixtureCase())
    caseFile.expected_responses[0].accepted_values = ['not_an_option']
    const issues = lintCase(caseFile, outcomeCatalog, { mode: 'draft' })
    expect(codes(issues)).toContain('expectation_value')
  })

  it('phát hiện khoảng tuổi chồng lấn trong cùng age rule', () => {
    const caseFile = cloneCase(fixtureCase())
    caseFile.age_rules[0].conditions = [
      {
        min_age_years: 14,
        max_age_years: 18,
        applies_to_charge_ids: ['charge_a'],
        effect_code: 'example_effect',
        legal_basis_ids: ['provision_placeholder_01'],
        review_id: 'review_age_01',
      },
      {
        min_age_years: 16,
        max_age_years: 20,
        applies_to_charge_ids: ['charge_a'],
        effect_code: 'example_effect',
        legal_basis_ids: ['provision_placeholder_01'],
        review_id: 'review_age_02',
      },
    ]
    const issues = lintCase(caseFile, outcomeCatalog, { mode: 'draft' })
    expect(codes(issues)).toContain('age_overlap')
  })

  it('phát hiện path chưa đủ căn cứ nhưng vẫn khai báo charge', () => {
    const caseFile = cloneCase(fixtureCase())
    const path = caseFile.answer_paths.find((item) => item.id === 'path_insufficient')
    expect(path).toBeDefined()
    path?.charge_ids.push('charge_a')
    const issues = lintCase(caseFile, outcomeCatalog, { mode: 'draft' })
    expect(codes(issues)).toContain('path_conclusion_charge')
  })

  it('phát hiện option trùng trong cùng answer field', () => {
    const caseFile = cloneCase(fixtureCase())
    const field = caseFile.answer_fields[0]
    field.options.push({ id: field.options[0].id, label: 'Trùng id' })
    const issues = lintCase(caseFile, outcomeCatalog, { mode: 'draft' })
    expect(codes(issues)).toContain('option_duplicate')
  })

  it('phát hiện charge_element trỏ sai charge_id (quan hệ 2 chiều)', () => {
    const caseFile = cloneCase(fixtureCase())
    caseFile.charge_elements[0].charge_id = 'other_charge'
    const issues = lintCase(caseFile, outcomeCatalog, { mode: 'draft' })
    expect(codes(issues)).toContain('element_charge')
    expect(codes(issues)).toContain('charge_element_mismatch')
  })

  it('phát hiện charge có charge_element nhưng charge_element trỏ charge khác', () => {
    const caseFile = cloneCase(fixtureCase())
    // Thêm charge_b
    caseFile.candidate_charges.push({
      ...caseFile.candidate_charges[0],
      id: 'charge_b',
      charge_element_ids: ['element_a_01'], // element_a_01 belongs to charge_a
    })
    const issues = lintCase(caseFile, outcomeCatalog, { mode: 'draft' })
    expect(codes(issues)).toContain('charge_element_mismatch')
  })

  it('phát hiện quan hệ evidence_link không hợp lệ trong proof matrix', () => {
    const caseFile = cloneCase(fixtureCase())
    // @ts-expect-error intentionally invalid relation for test
    caseFile.proof_matrix[0].evidence_links[0].relation = 'invalid_relation'
    const issues = lintCase(caseFile, outcomeCatalog, { mode: 'draft' })
    expect(codes(issues)).toContain('proof_relation')
  })

  it('chấp nhận quan hệ contradicts và contextual trong Schema 2.1.0', () => {
    const caseFile = cloneCase(fixtureCase())
    caseFile.proof_matrix[0].evidence_links[0].relation = 'contradicts'
    caseFile.proof_matrix[0].evidence_links[1].relation = 'contextual'
    const issues = lintCase(caseFile, outcomeCatalog, { mode: 'draft' })
    expect(codes(issues)).not.toContain('proof_relation')
  })

  it('phát hiện ngày bắt đầu sau ngày kết thúc trong date_interval', () => {
    const caseFile = cloneCase(fixtureCase())
    caseFile.characters[0].birth_date_interval.start_date = '2000-01-02'
    caseFile.characters[0].birth_date_interval.end_date = '1999-01-01'
    const issues = lintCase(caseFile, outcomeCatalog, { mode: 'draft' })
    expect(codes(issues)).toContain('date_order')
  })

  it('phát hiện precision day nhưng start_date khác end_date', () => {
    const caseFile = cloneCase(fixtureCase())
    caseFile.characters[0].birth_date_interval.start_date = '1998-03-15'
    caseFile.characters[0].birth_date_interval.end_date = '1998-03-16'
    caseFile.characters[0].birth_date_interval.precision = 'day'
    const issues = lintCase(caseFile, outcomeCatalog, { mode: 'draft' })
    expect(codes(issues)).toContain('date_precision_mismatch')
  })

  it('chấp nhận learning_outcomes cục bộ khai báo trong case file', () => {
    const caseFile = cloneCase(fixtureCase())
    caseFile.learning_outcomes = [
      { id: 'lo_custom_01', description: 'Kỹ năng đánh giá độc lập' },
    ]
    caseFile.metadata.learning_outcome_ids.push('lo_custom_01')
    caseFile.criteria[0].learning_outcome_ids.push('lo_custom_01')
    const issues = lintCase(caseFile, outcomeCatalog, { mode: 'draft' })
    expect(codes(issues)).not.toContain('outcome_missing')
  })

  it('chấp nhận law_resolution status crosses_version kèm segments hợp lệ', () => {
    const caseFile = cloneCase(fixtureCase())
    const provision = caseFile.law_bundles[0].provisions[0]
    provision.review_status = 'approved'
    provision.effective_from = '2024-01-01'
    provision.effective_to = null
    caseFile.law_bundles.push({
      id: 'law_bundle_v2',
      version: 'v2',
      jurisdiction: 'VN',
      provisions: [
        {
          id: 'provision_v2_01',
          citation: 'Điều kiểm thử v2',
          effective_from: '2024-06-01',
          effective_to: null,
          source_ref: 'test',
          review_status: 'approved',
        },
      ],
    })
    caseFile.temporal_context.conduct_events[0].law_resolution = {
      status: 'crosses_version',
      bundle_id: null,
      review_id: 'review_cross_01',
      segments: [
        { start_date: '2024-05-01', end_date: '2024-05-31', bundle_id: 'law_bundle_v1' },
        { start_date: '2024-06-01', end_date: '2024-06-30', bundle_id: 'law_bundle_v2' },
      ],
    }
    const issues = lintCase(caseFile, outcomeCatalog, { mode: 'publish' })
    expect(codes(issues)).not.toContain('law_crosses')
    expect(codes(issues)).not.toContain('law_invalid')
  })

  it('từ chối crosses_version chỉ có một segment', () => {
    const caseFile = cloneCase(fixtureCase())
    caseFile.temporal_context.conduct_events[0].law_resolution = {
      status: 'crosses_version',
      bundle_id: null,
      review_id: 'review_cross_01',
      segments: [
        { start_date: '2024-05-01', end_date: '2024-05-31', bundle_id: 'law_bundle_v1' },
      ],
    }
    const issues = lintCase(caseFile, outcomeCatalog, { mode: 'publish' })
    expect(codes(issues)).toContain('law_invalid')
  })
})
