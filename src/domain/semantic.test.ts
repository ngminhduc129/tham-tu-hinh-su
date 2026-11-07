import { describe, expect, it } from 'vitest'
import { cloneCase, fixtureCase } from './test-helpers'
import { validateCaseSemantics, type SemanticFinding } from './semantic'
import type { Expr } from './types'

function codes(findings: SemanticFinding[]): string[] {
  return findings.map((finding) => finding.code)
}

function errors(findings: SemanticFinding[]): SemanticFinding[] {
  return findings.filter((finding) => finding.severity === 'error')
}

describe('semantic validator — Layer 2', () => {
  it('case mẫu chỉ có warning nội dung đã biết, không có lỗi ngữ nghĩa', () => {
    const findings = validateCaseSemantics(fixtureCase(), { mode: 'draft' })
    expect(errors(findings)).toEqual([])
    expect(codes(findings)).toContain('sem_explanation_unused')
  })

  it('phát hiện hai expectation cùng chấm một nhóm path/criterion/field/target', () => {
    const caseFile = cloneCase(fixtureCase())
    const first = caseFile.expected_responses[0]
    caseFile.expected_responses.push({
      ...first,
      id: 'expectation_duplicate_group',
    })
    const findings = validateCaseSemantics(caseFile, { mode: 'draft' })
    expect(codes(findings)).toContain('sem_unique_expectation')
  })

  it('phát hiện max_total_points khác 100', () => {
    const caseFile = cloneCase(fixtureCase())
    ;(caseFile.scoring as { max_total_points?: number }).max_total_points = 90
    const findings = validateCaseSemantics(caseFile, { mode: 'draft' })
    expect(codes(findings)).toContain('sem_score_max_total')
  })

  it('phát hiện weight_scope không phải within_criterion', () => {
    const caseFile = cloneCase(fixtureCase())
    ;(caseFile.scoring.partial_credit as { weight_scope?: string }).weight_scope = 'global'
    const findings = validateCaseSemantics(caseFile, { mode: 'draft' })
    expect(codes(findings)).toContain('sem_score_weight_scope')
  })

  it('cảnh báo case 2.1.0 thiếu khai báo scoring tường minh', () => {
    const caseFile = cloneCase(fixtureCase())
    caseFile.schema_version = '2.1.0'
    const findings = validateCaseSemantics(caseFile, { mode: 'draft' })
    expect(codes(findings)).toContain('sem_score_max_total_missing')
    expect(codes(findings)).toContain('sem_score_weight_scope_missing')
    expect(errors(findings)).toEqual([])
  })

  it('kiểm tra path_selection.order là hoán vị đầy đủ của answer_paths', () => {
    const caseFile = cloneCase(fixtureCase())
    caseFile.path_selection = {
      mode: 'priority',
      order: ['path_a', 'path_a', 'path_missing'],
    }
    const findings = validateCaseSemantics(caseFile, { mode: 'draft' })
    expect(codes(findings)).toContain('sem_path_order_unknown')
    expect(codes(findings)).toContain('sem_path_order_duplicate')
    expect(codes(findings)).toContain('sem_path_order_missing')
  })

  it('phát hiện hai path có thể cùng khớp khi chính sách là exclusive', () => {
    const caseFile = cloneCase(fixtureCase())
    const left = {
      op: 'equals',
      field_id: 'conclusion',
      target_id: 'person_a:conduct_01',
      value: 'conclusion_a',
    } as Expr
    const right = {
      op: 'equals',
      field_id: 'conclusion',
      target_id: 'person_a:conduct_01',
      value: 'conclusion_b',
    } as Expr
    caseFile.answer_paths.push({
      id: 'path_dup_a',
      match: left,
      conclusion_ids: ['conclusion_a'],
      charge_ids: ['charge_a'],
    })
    caseFile.answer_paths.push({
      id: 'path_dup_b',
      match: right,
      conclusion_ids: ['conclusion_b'],
      charge_ids: ['charge_b'],
    })
    caseFile.path_selection = { mode: 'exclusive' }
    const findings = validateCaseSemantics(caseFile, { mode: 'draft' })
    expect(codes(findings)).toContain('sem_path_overlap')
  })

  it('phát hiện references.legal_basis_ids trỏ provision không tồn tại', () => {
    const caseFile = cloneCase(fixtureCase())
    caseFile.references.legal_basis_ids.push('provision_missing')
    const findings = validateCaseSemantics(caseFile, { mode: 'draft' })
    expect(codes(findings)).toContain('sem_reference_law')
  })

  it('phát hiện segment.provision_ids trỏ provision không tồn tại', () => {
    const caseFile = cloneCase(fixtureCase())
    caseFile.temporal_context.conduct_events[0].law_resolution = {
      status: 'crosses_version',
      bundle_id: null,
      review_id: null,
      segments: [
        {
          start_date: '2024-05-31',
          end_date: '2024-05-31',
          bundle_id: 'law_bundle_v1',
          provision_ids: ['provision_missing'],
        },
      ],
    }
    const findings = validateCaseSemantics(caseFile, { mode: 'draft' })
    expect(codes(findings)).toContain('sem_segment_provision')
  })

  it('phát hiện issue critical nhưng không nằm trong critical_issue_ids', () => {
    const caseFile = cloneCase(fixtureCase())
    caseFile.critical_issue_ids = ['issue_02']
    const findings = validateCaseSemantics(caseFile, { mode: 'draft' })
    const finding = findings.find((item) => item.code === 'sem_critical_flag')
    expect(finding?.severity).toBe('error')
    expect(finding?.entityId).toBe('issue_01')
  })

  it('phát hiện chu trình mở khoá chứng cứ nhiều bước', () => {
    const caseFile = cloneCase(fixtureCase())
    caseFile.evidence[0].discovery = {
      kind: 'viewed',
      evidence_ids: ['ev_receipt_01'],
      mode: 'any',
    }
    const findings = validateCaseSemantics(caseFile, { mode: 'draft' })
    expect(codes(findings)).toContain('sem_discovery_cycle')
  })

  it('cảnh báo chứng cứ mồ côi và nâng thành error ở publish', () => {
    const caseFile = cloneCase(fixtureCase())
    caseFile.evidence.push({
      id: 'ev_orphan_01',
      type: 'record',
      title: 'Chứng cứ mồ côi',
      summary: 'Không được tham chiếu',
      content: 'Nội dung kiểm thử',
    })
    const draft = validateCaseSemantics(caseFile, { mode: 'draft' })
    const publish = validateCaseSemantics(caseFile, { mode: 'publish' })
    expect(draft.find((item) => item.code === 'sem_evidence_orphan')?.severity).toBe('warning')
    expect(publish.find((item) => item.code === 'sem_evidence_orphan')?.severity).toBe('error')
  })

  it('cảnh báo criterion không có expectation và element bắt buộc thiếu fact', () => {
    const caseFile = cloneCase(fixtureCase())
    caseFile.criteria.push({
      id: 'criterion_orphan',
      learning_outcome_ids: [],
      answer_field_ids: [],
      label: 'Criterion kiểm thử',
    })
    caseFile.charge_elements[0].fact_ids = []
    const findings = validateCaseSemantics(caseFile, { mode: 'draft' })
    expect(codes(findings)).toContain('sem_criterion_no_expectation')
    expect(codes(findings)).toContain('sem_element_no_fact')
  })
})
