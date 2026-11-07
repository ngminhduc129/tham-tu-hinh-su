import { describe, expect, it } from 'vitest'
import { loadCase, outcomeCatalog } from '../domain/load'
import { lintCase, summarizeLint } from '../domain/linter'
import { flattenAtoms } from '../domain/expr'
import type { CaseFile } from '../domain/types'
import { CATEGORY_LABELS, ELEMENT_TYPE_LABELS } from '../ui/labels'

function caseFile(): CaseFile {
  const loaded = loadCase('case_001')
  if (!loaded.ok) throw new Error(loaded.errors.join('; '))
  return loaded.caseFile
}

const draftIssues = () => lintCase(caseFile(), outcomeCatalog, { mode: 'draft' })
const publishIssues = () => lintCase(caseFile(), outcomeCatalog, { mode: 'publish' })
const draftCodes = () => draftIssues().map((issue) => issue.code)
const publishCodes = () => publishIssues().map((issue) => issue.code)

/**
 * Bộ test nội dung C-01 → C-16.
 * Các test đánh dấu "known gap" cố định phát hiện của content audit; khi reviewer
 * sửa nội dung, test sẽ buộc cập nhật lại kỳ vọng thay vì âm thầm bỏ qua.
 */
describe('content invariants C-01 → C-16', () => {
  it('C-01: case nháp qua lint cấu trúc với 0 error', () => {
    const summary = summarizeLint(draftIssues())
    expect(summary.errors).toBe(0)
  })

  it('C-02: publish gate vẫn chặn case nháp với đủ blocker', () => {
    const summary = summarizeLint(publishIssues())
    expect(summary.errors).toBe(17)
    expect(publishCodes()).toEqual(
      expect.arrayContaining([
        'publish_status',
        'publish_review',
        'publish_provision',
        'publish_defect',
        'publish_age_conditions',
        'publish_circumstance',
        'publish_placeholder',
        'law_invalid',
      ]),
    )
  })

  it('C-03: mọi tham chiếu chéo ID phân giải được', () => {
    expect(draftIssues().filter((issue) => issue.severity === 'error')).toEqual([])
    expect(draftCodes()).not.toContain('duplicate_id')
    for (const fact of caseFile().facts) {
      for (const sourceId of fact.source_ids ?? []) {
        expect(
          caseFile().evidence.some((item) => item.id === sourceId) ||
            caseFile().facts.some((item) => item.id === sourceId),
        ).toBe(true)
      }
    }
  })

  it('C-04: mỗi path có đúng 100 điểm và đủ expectation theo loại path', () => {
    const file = caseFile()
    for (const path of file.answer_paths) {
      const weight = file.scoring.path_weights.find((entry) => entry.path_id === path.id)
      expect(weight, path.id).toBeDefined()
      const sum = Object.values(weight?.criterion_points ?? {}).reduce((total, value) => total + value, 0)
      expect(sum, path.id).toBe(100)
      const expectations = file.expected_responses.filter((item) => item.path_ids.includes(path.id))
      const expectedCount = path.id.startsWith('path_insufficient') ? 18 : 17
      expect(expectations, path.id).toHaveLength(expectedCount)
    }
  })

  it('C-05: accepted value luôn có option và single_choice không nhận nhiều giá trị', () => {
    const file = caseFile()
    for (const expectation of file.expected_responses) {
      const field = file.answer_fields.find((item) => item.id === expectation.field_id)
      expect(field, expectation.id).toBeDefined()
      for (const value of expectation.accepted_values) {
        expect(field?.options.some((option) => option.id === value), `${expectation.id}:${value}`).toBe(true)
      }
      if (field?.value_type === 'single_choice') {
        expect(expectation.accepted_values.length, expectation.id).toBeLessThanOrEqual(1)
      }
    }
  })

  it('C-06: mọi chứng cứ đều có đường mở khoá từ trạng thái ban đầu', () => {
    const file = caseFile()
    const available = new Set(
      file.evidence
        .filter((item) => item.discovery?.kind === 'always')
        .map((item) => item.id),
    )
    let changed = true
    while (changed) {
      changed = false
      for (const item of file.evidence) {
        if (available.has(item.id)) continue
        const discovery = item.discovery
        if (discovery?.kind === 'viewed') {
          const required = discovery.evidence_ids ?? []
          const ready =
            discovery.mode === 'any'
              ? required.some((id) => available.has(id))
              : required.every((id) => available.has(id))
          if (ready) {
            available.add(item.id)
            changed = true
          }
        }
        if (discovery?.kind === 'check') {
          const required = discovery.requires_viewed ?? []
          if (required.every((id) => available.has(id))) {
            available.add(item.id)
            changed = true
          }
        }
      }
    }
    expect([...file.evidence.map((item) => item.id)].filter((id) => !available.has(id))).toEqual([])
  })

  it('C-07: mỗi path có match, conclusion và charge nhất quán', () => {
    const file = caseFile()
    expect(file.answer_paths).toHaveLength(6)
    for (const path of file.answer_paths) {
      expect(path.conclusion_ids.length, path.id).toBeGreaterThan(0)
      const atoms = flattenAtoms(path.match)
      expect(atoms.length, path.id).toBeGreaterThan(0)
      for (const atom of atoms) {
        const field = file.answer_fields.find((item) => item.id === atom.field_id)
        expect(field, `${path.id}:${atom.field_id}`).toBeDefined()
        expect(field?.target_ids.includes(atom.target_id), `${path.id}:${atom.target_id}`).toBe(true)
        if ('value' in atom) {
          expect(field?.options.some((option) => option.id === atom.value), `${path.id}:${atom.value}`).toBe(true)
        }
      }
    }
  })

  it('C-08: charge, conclusion và element nhất quán; conclusion A/B buộc đúng định danh', () => {
    const file = caseFile()
    for (const charge of file.candidate_charges) {
      const actual = file.charge_elements
        .filter((element) => element.charge_id === charge.id)
        .map((element) => element.id)
      expect(new Set(charge.charge_element_ids), charge.id).toEqual(new Set(actual))
    }

    for (const path of file.answer_paths) {
      const supported = file.conclusions.filter(
        (conclusion) =>
          path.conclusion_ids.includes(conclusion.id) && conclusion.type === 'charge_supported',
      )
      expect(new Set(path.charge_ids), path.id).toEqual(
        new Set(supported.map((conclusion) => conclusion.charge_id).filter(Boolean)),
      )
      for (const chargeId of path.charge_ids) {
        const required = file.charge_elements.filter(
          (element) => element.charge_id === chargeId && element.required,
        )
        for (const element of required) {
          const expectation = file.expected_responses.find(
            (item) =>
              item.path_ids.includes(path.id) &&
              item.field_id === 'element_status' &&
              item.target_id === element.id,
          )
          expect(expectation?.accepted_values, `${path.id}:${element.id}`).toContain('supported')
        }
      }
    }

    const linksConclusionToCharge = file.consistency_rules.filter((rule) => {
      const whenValues = flattenAtoms(rule.when)
        .filter((atom) => 'value' in atom)
        .map((atom) => ('value' in atom ? atom.value : ''))
      const assertFields = flattenAtoms(rule.assert).map((atom) => atom.field_id)
      return (
        whenValues.includes('conclusion_a') ||
        whenValues.includes('conclusion_b')
      ) && assertFields.includes('selected_charge')
    })
    expect(linksConclusionToCharge.map((rule) => rule.id).sort()).toEqual([
      'rule_conclusion_a_requires_charge_a',
      'rule_conclusion_b_requires_charge_b',
    ])
  })

  it('C-09: proof matrix phủ element_a_01 nhưng còn thiếu element_b_01 (known gap)', () => {
    const file = caseFile()
    const pathChargeIds = new Set(file.answer_paths.flatMap((path) => path.charge_ids))
    const required = file.charge_elements.filter(
      (element) => element.required && pathChargeIds.has(element.charge_id),
    )
    const covered = new Set(file.proof_matrix.flatMap((row) => row.charge_element_ids))
    const gaps = required.filter((element) => !covered.has(element.id)).map((element) => element.id)
    expect(gaps).toEqual(['element_b_01'])
  })

  it('C-10: mốc thời gian trong narrative và dữ kiện nhất quán', () => {
    const file = caseFile()
    const text = [
      file.brief.narrative,
      file.brief.task_prompt,
      ...file.facts.map((fact) => fact.text ?? ''),
      ...file.evidence.map((item) => item.content ?? ''),
    ].join('\n')
    for (const marker of ['21:00', '22:10', '22:35', '22:47', '22:50', '03:40']) {
      expect(text, marker).toContain(marker)
    }
    const hypothesisA = file.hypotheses.find((item) => item.id === 'hypothesis_a')
    expect(hypothesisA?.label).toContain('22:10')
    expect(hypothesisA?.label).toContain('03:40')
    expect(file.temporal_context.conduct_events[0].date_interval.start_date).toBe('2024-05-31')
    expect(file.temporal_context.conduct_events[0].date_interval.end_date).toBe('2024-06-01')
    expect(file.temporal_context.conduct_events[0].date_interval.precision).toBe('range')
  })

  it('C-11: fact, defect và limitation tham chiếu đúng chứng cứ', () => {
    const file = caseFile()
    const evidenceIds = new Set(file.evidence.map((item) => item.id))
    for (const fact of file.facts) {
      expect((fact.source_ids ?? []).length, fact.id).toBeGreaterThan(0)
      for (const sourceId of fact.source_ids ?? []) {
        expect(evidenceIds.has(sourceId), `${fact.id}:${sourceId}`).toBe(true)
      }
    }
    for (const defect of file.procedural_defects) {
      expect(evidenceIds.has(defect.evidence_id ?? ''), defect.id).toBe(true)
    }
    for (const limitation of file.evidence_limitations) {
      expect(evidenceIds.has(limitation.evidence_id ?? ''), limitation.id).toBe(true)
      expect((limitation.description ?? '').length, limitation.id).toBeGreaterThan(0)
    }
  })

  it('C-12: hint, glossary và explanation không có tham chiếu chết; ghi nhận issue_03 thiếu hint', () => {
    const file = caseFile()
    const issueIds = new Set((file.issues ?? []).map((issue) => issue.id))
    const criterionIds = new Set(file.criteria.map((criterion) => criterion.id))
    for (const hint of file.hints ?? []) {
      if (hint.issue_id) expect(issueIds.has(hint.issue_id), hint.id).toBe(true)
      if (hint.rubric_id) expect(criterionIds.has(hint.rubric_id), hint.id).toBe(true)
    }
    expect((file.hints ?? []).filter((hint) => hint.issue_id === 'issue_03')).toEqual([])

    const orderedHints = [...(file.hints ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    for (let index = 1; index < orderedHints.length; index += 1) {
      const previous = orderedHints[index - 1]
      const current = orderedHints[index]
      if (previous.issue_id === current.issue_id) {
        expect(current.level, `${previous.id}→${current.id}`).toBeGreaterThanOrEqual(previous.level)
      }
    }

    const usedExplanations = new Set(file.expected_responses.map((item) => item.explanation_id))
    for (const comparison of file.charge_comparisons) {
      if (comparison.explanation_id) usedExplanations.add(comparison.explanation_id)
    }
    const unused = file.explanations
      .filter((explanation) => !usedExplanations.has(explanation.id))
      .map((explanation) => explanation.id)
    expect(unused).toEqual(['explanation_01'])
  })

  it('C-13: nhãn UI phủ hết loại element và category đang dùng', () => {
    const file = caseFile()
    for (const element of file.charge_elements) {
      expect(ELEMENT_TYPE_LABELS[element.element_type], element.id).toBeTruthy()
    }
    for (const circumstance of file.circumstances) {
      expect(CATEGORY_LABELS[circumstance.category], circumstance.id).toBeTruthy()
    }
    for (const character of file.characters) {
      expect(character.display_name.trim().length, character.id).toBeGreaterThan(0)
    }
    for (const evidence of file.evidence) {
      expect((evidence.title ?? '').trim().length, evidence.id).toBeGreaterThan(0)
      expect((evidence.summary ?? '').trim().length, evidence.id).toBeGreaterThan(0)
    }
  })

  it('C-14: case vẫn ở trạng thái chưa thẩm định pháp lý', () => {
    const file = caseFile()
    expect(file.metadata.status).toBe('draft')
    expect(file.review.status).not.toBe('approved')
    expect(file.review.review_ids).toEqual([])
    for (const bundle of file.law_bundles) {
      for (const provision of bundle.provisions) {
        expect(provision.review_status).not.toBe('approved')
      }
    }
  })

  it('C-15: age rule thiếu conditions là known gap và bị chặn publish', () => {
    const file = caseFile()
    expect(file.age_rules).toHaveLength(1)
    expect(file.age_rules[0].conditions).toEqual([])
    expect(publishCodes()).toContain('publish_age_conditions')
    expect(publishCodes()).toContain('age_conditions_publish')
  })

  it('C-16: 7/7 learning outcome được criterion đo', () => {
    const file = caseFile()
    expect(file.metadata.learning_outcome_ids).toHaveLength(7)
    const measured = new Set(file.criteria.flatMap((criterion) => criterion.learning_outcome_ids))
    expect([...file.metadata.learning_outcome_ids].filter((id) => !measured.has(id))).toEqual([])
    expect(file.learning_outcomes ?? []).toEqual([])
  })
})
