import type {
  AnswerPath,
  CaseFile,
  DateInterval,
  Expr,
  LintIssue,
  OutcomeCatalog,
} from './types'
import { flattenAtoms, validateExpr } from './expr'
import { checkLawResolution } from './legalVersion'
import { parseIsoDate } from './age'
import { semanticFindingsToLintIssues, validateCaseSemantics } from './semantic'

export type { LintIssue }

export interface LintOptions {
  mode: 'draft' | 'publish'
}

const MAX_EXAMPLES = 12

function byId<T extends { id: string }>(items: T[]): Map<string, T> {
  return new Map(items.map((item) => [item.id, item]))
}

function duplicateIds(
  collections: Array<[string, Array<{ id: string }>]>,
  push: (issue: LintIssue) => void,
): void {
  const seen = new Map<string, string>()
  for (const [name, items] of collections) {
    for (const item of items) {
      const previous = seen.get(item.id)
      if (previous) {
        push({
          severity: 'error',
          code: 'duplicate_id',
          message: `ID "${item.id}" xuất hiện ở cả ${previous} và ${name}.`,
        })
      } else {
        seen.set(item.id, name)
      }
    }
  }
}

function checkInterval(
  interval: DateInterval,
  context: string,
  sourceIds: Set<string>,
  mode: LintOptions['mode'],
  push: (issue: LintIssue) => void,
): void {
  const start = parseIsoDate(interval.start_date)
  const end = parseIsoDate(interval.end_date)
  if (interval.start_date && !start) {
    push({ severity: 'error', code: 'date_invalid', message: `${context}: start_date không hợp lệ.` })
  }
  if (interval.end_date && !end) {
    push({ severity: 'error', code: 'date_invalid', message: `${context}: end_date không hợp lệ.` })
  }
  if (start && end && start.getTime() > end.getTime()) {
    push({ severity: 'error', code: 'date_order', message: `${context}: start_date sau end_date.` })
  }
  if (!interval.start_date || !interval.end_date) {
    push({
      severity: mode === 'publish' ? 'error' : 'warning',
      code: 'date_missing',
      message: `${context}: thiếu ngày bắt đầu hoặc kết thúc; không thể đối chiếu thời điểm áp dụng.`,
    })
  }
  if (interval.precision === 'unknown' && interval.start_date) {
    push({
      severity: 'warning',
      code: 'date_precision',
      message: `${context}: precision "unknown" nhưng vẫn có ngày cụ thể.`,
    })
  }
  if (
    interval.precision === 'day' &&
    interval.start_date &&
    interval.end_date &&
    interval.start_date !== interval.end_date
  ) {
    push({
      severity: 'error',
      code: 'date_precision_mismatch',
      message: `${context}: precision là "day" nhưng start_date (${interval.start_date}) khác end_date (${interval.end_date}).`,
    })
  }
  for (const sourceId of interval.source_ids) {
    if (!sourceIds.has(sourceId)) {
      push({
        severity: 'error',
        code: 'source_missing',
        message: `${context}: source_id "${sourceId}" không tồn tại trong facts/evidence.`,
      })
    }
  }
}

function containsAny(expr: Expr): boolean {
  if (expr.op === 'any') return true
  if (expr.op === 'all') return expr.args.some(containsAny)
  return false
}

function pathsConflict(a: AnswerPath, b: AnswerPath): boolean {
  if (containsAny(a.match) || containsAny(b.match)) return false
  const atomsA = flattenAtoms(a.match)
  const atomsB = flattenAtoms(b.match)
  for (const left of atomsA) {
    for (const right of atomsB) {
      if (left.field_id !== right.field_id || left.target_id !== right.target_id) continue
      const leftValue = 'value' in left ? left.value : null
      const rightValue = 'value' in right ? right.value : null
      if (left.op === 'equals' && right.op === 'equals' && leftValue !== rightValue) return true
      if (left.op === 'equals' && right.op === 'not_equals' && leftValue === rightValue) return true
      if (left.op === 'not_equals' && right.op === 'equals' && leftValue === rightValue) return true
      if (left.op === 'contains' && right.op === 'not_contains' && leftValue === rightValue) return true
      if (left.op === 'not_contains' && right.op === 'contains' && leftValue === rightValue) return true
      if (left.op === 'is_empty' && right.op === 'is_not_empty') return true
      if (left.op === 'is_not_empty' && right.op === 'is_empty') return true
      if (left.op === 'is_empty' && right.op === 'equals') return true
      if (right.op === 'is_empty' && left.op === 'equals') return true
      if (left.op === 'is_empty' && right.op === 'contains') return true
      if (right.op === 'is_empty' && left.op === 'contains') return true
    }
  }
  return false
}

export function lintCase(
  caseFile: CaseFile,
  catalog: OutcomeCatalog,
  options: LintOptions,
): LintIssue[] {
  const issues: LintIssue[] = []
  const push = (issue: LintIssue) => issues.push(issue)
  const err = (code: string, message: string) =>
    push({ severity: 'error', code, message })
  const warn = (code: string, message: string) =>
    push({ severity: 'warning', code, message })

  const localOutcomes = byId(caseFile.learning_outcomes ?? [])
  const outcomes = new Map<string, { id: string }>([
    ...byId(catalog.outcomes).entries(),
    ...localOutcomes.entries(),
  ])
  const bundles = byId(caseFile.law_bundles)
  const provisions = byId(caseFile.law_bundles.flatMap((bundle) => bundle.provisions))
  const characters = byId(caseFile.characters)
  const conductEvents = byId(caseFile.temporal_context.conduct_events)
  const facts = byId(caseFile.facts)
  const evidence = byId(caseFile.evidence)
  const defects = byId(caseFile.procedural_defects)
  const limitations = byId(caseFile.evidence_limitations)
  const hypotheses = byId(caseFile.hypotheses)
  const proofRows = byId(caseFile.proof_matrix)
  const charges = byId(caseFile.candidate_charges)
  const elements = byId(caseFile.charge_elements)
  const comparisons = byId(caseFile.charge_comparisons)
  const ageRules = byId(caseFile.age_rules)
  const circumstances = byId(caseFile.circumstances)
  const conclusions = byId(caseFile.conclusions)
  const fields = byId(caseFile.answer_fields)
  const expectations = byId(caseFile.expected_responses)
  const paths = byId(caseFile.answer_paths)
  const rules = byId(caseFile.consistency_rules)
  const criteria = byId(caseFile.criteria)
  const explanations = byId(caseFile.explanations)
  const issuesById = byId(caseFile.issues ?? [])
  const hints = byId(caseFile.hints ?? [])
  const glossary = byId(caseFile.glossary ?? [])

  const allIds = new Set<string>([
    ...bundles.keys(),
    ...provisions.keys(),
    ...characters.keys(),
    ...conductEvents.keys(),
    ...facts.keys(),
    ...evidence.keys(),
    ...defects.keys(),
    ...limitations.keys(),
    ...hypotheses.keys(),
    ...proofRows.keys(),
    ...charges.keys(),
    ...elements.keys(),
    ...comparisons.keys(),
    ...ageRules.keys(),
    ...circumstances.keys(),
    ...conclusions.keys(),
    ...fields.keys(),
    ...expectations.keys(),
    ...paths.keys(),
    ...rules.keys(),
    ...criteria.keys(),
    ...explanations.keys(),
    ...issuesById.keys(),
    ...hints.keys(),
    ...glossary.keys(),
  ])

  duplicateIds(
    [
      ['law_bundles', caseFile.law_bundles],
      ['provisions', caseFile.law_bundles.flatMap((bundle) => bundle.provisions)],
      ['characters', caseFile.characters],
      ['conduct_events', caseFile.temporal_context.conduct_events],
      ['facts', caseFile.facts],
      ['evidence', caseFile.evidence],
      ['procedural_defects', caseFile.procedural_defects],
      ['evidence_limitations', caseFile.evidence_limitations],
      ['hypotheses', caseFile.hypotheses],
      ['proof_matrix', caseFile.proof_matrix],
      ['candidate_charges', caseFile.candidate_charges],
      ['charge_elements', caseFile.charge_elements],
      ['charge_comparisons', caseFile.charge_comparisons],
      ['age_rules', caseFile.age_rules],
      ['circumstances', caseFile.circumstances],
      ['conclusions', caseFile.conclusions],
      ['answer_fields', caseFile.answer_fields],
      ['expected_responses', caseFile.expected_responses],
      ['answer_paths', caseFile.answer_paths],
      ['consistency_rules', caseFile.consistency_rules],
      ['criteria', caseFile.criteria],
      ['explanations', caseFile.explanations],
      ['issues', caseFile.issues ?? []],
      ['hints', caseFile.hints ?? []],
      ['glossary', caseFile.glossary ?? []],
    ],
    push,
  )

  const expectExists = (
    id: string,
    set: Map<string, unknown> | Set<string>,
    code: string,
    context: string,
  ) => {
    const exists = set instanceof Map ? set.has(id) : set.has(id)
    if (!exists) err(code, `${context}: "${id}" không tồn tại.`)
  }

  // Metadata và catalog
  for (const bundleId of caseFile.metadata.law_bundle_ids) {
    expectExists(bundleId, bundles, 'bundle_missing', 'metadata.law_bundle_ids')
  }
  for (const bundle of caseFile.law_bundles) {
    if (!caseFile.metadata.law_bundle_ids.includes(bundle.id)) {
      warn('bundle_unreferenced', `Law bundle "${bundle.id}" không được metadata tham chiếu.`)
    }
  }
  for (const outcomeId of caseFile.metadata.learning_outcome_ids) {
    if (!outcomes.has(outcomeId)) {
      err('outcome_missing', `Learning outcome "${outcomeId}" không có trong catalog.`)
    }
  }
  if (!caseFile.metadata.legal_time_anchor_reason.trim()) {
    err('anchor_reason', 'legal_time_anchor_reason không được rỗng.')
  }
  if (
    options.mode === 'publish' &&
    /^\[|\breviewer\b|\bTBD\b/i.test(caseFile.metadata.legal_time_anchor_reason)
  ) {
    err('anchor_reason_placeholder', 'legal_time_anchor_reason còn placeholder/chưa được reviewer xác nhận.')
  }

  // Date intervals
  const sourceIds = new Set<string>([...facts.keys(), ...evidence.keys()])
  for (const character of caseFile.characters) {
    checkInterval(
      character.birth_date_interval,
      `character "${character.id}".birth_date_interval`,
      sourceIds,
      options.mode,
      push,
    )
  }
  for (const event of caseFile.temporal_context.conduct_events) {
    checkInterval(
      event.date_interval,
      `conduct_event "${event.id}".date_interval`,
      sourceIds,
      options.mode,
      push,
    )
  }

  // Characters
  for (const character of caseFile.characters) {
    if (character.roles.length === 0) {
      err('character_roles', `Character "${character.id}" không có role.`)
    }
  }

  // Facts & evidence
  for (const fact of caseFile.facts) {
    for (const sourceId of fact.source_ids ?? []) {
      expectExists(sourceId, sourceIds, 'fact_source_missing', `fact "${fact.id}".source_ids`)
    }
    if (!fact.text || !String(fact.text).trim()) {
      warn('fact_empty', `Fact "${fact.id}" không có nội dung.`)
    }
  }
  for (const item of caseFile.evidence) {
    for (const defectId of item.procedural_defect_ids ?? []) {
      expectExists(defectId, defects, 'defect_missing', `evidence "${item.id}".procedural_defect_ids`)
    }
    for (const limitationId of item.limitation_ids ?? []) {
      expectExists(
        limitationId,
        limitations,
        'limitation_missing',
        `evidence "${item.id}".limitation_ids`,
      )
    }
    for (const issueId of item.issue_ids ?? []) {
      expectExists(issueId, issuesById, 'issue_missing', `evidence "${item.id}".issue_ids`)
    }
    const discovery = item.discovery
    if (discovery) {
      if (discovery.kind === 'viewed') {
        for (const requiredId of discovery.evidence_ids ?? []) {
          expectExists(requiredId, evidence, 'unlock_missing', `evidence "${item.id}".discovery`)
          if (requiredId === item.id) {
            err('unlock_cycle', `Evidence "${item.id}" tự mở khóa chính nó.`)
          }
        }
      }
      if (discovery.kind === 'check') {
        for (const requiredId of discovery.requires_viewed ?? []) {
          expectExists(requiredId, evidence, 'unlock_missing', `evidence "${item.id}".discovery`)
          if (requiredId === item.id) {
            err('unlock_cycle', `Evidence "${item.id}" tự mở khóa chính nó.`)
          }
        }
      }
    }
  }
  for (const defect of caseFile.procedural_defects) {
    if (!defect.evidence_id) {
      err('defect_evidence', `Procedural defect "${defect.id}" thiếu evidence_id.`)
    } else {
      expectExists(defect.evidence_id, evidence, 'defect_evidence', `defect "${defect.id}"`)
    }
    for (const basisId of defect.legal_basis_ids ?? []) {
      expectExists(basisId, provisions, 'basis_missing', `defect "${defect.id}".legal_basis_ids`)
    }
    if (defect.review_status !== 'approved') {
      warn('defect_unreviewed', `Procedural defect "${defect.id}" chưa được duyệt.`)
    }
  }
  for (const limitation of caseFile.evidence_limitations) {
    if (limitation.evidence_id) {
      expectExists(limitation.evidence_id, evidence, 'limitation_evidence', `limitation "${limitation.id}"`)
    }
  }

  // Issues & hints
  for (const issue of caseFile.issues ?? []) {
    for (const fieldId of issue.answer_field_ids ?? []) {
      expectExists(fieldId, fields, 'issue_field_missing', `issue "${issue.id}".answer_field_ids`)
    }
    for (const evidenceId of issue.evidence_ids ?? []) {
      expectExists(evidenceId, evidence, 'issue_evidence_missing', `issue "${issue.id}".evidence_ids`)
    }
  }
  for (const criticalId of caseFile.critical_issue_ids ?? []) {
    expectExists(criticalId, issuesById, 'critical_issue_missing', 'critical_issue_ids')
  }
  for (const hint of caseFile.hints ?? []) {
    if (hint.issue_id) {
      expectExists(hint.issue_id, issuesById, 'hint_issue_missing', `hint "${hint.id}"`)
    }
    if (hint.rubric_id) {
      expectExists(hint.rubric_id, criteria, 'hint_rubric_missing', `hint "${hint.id}"`)
    }
  }
  for (const entry of caseFile.glossary ?? []) {
    for (const basisId of entry.legal_basis_ids ?? []) {
      expectExists(basisId, provisions, 'glossary_basis_missing', `glossary "${entry.id}"`)
    }
  }

  // Proof matrix
  for (const row of caseFile.proof_matrix) {
    for (const elementId of row.charge_element_ids) {
      expectExists(elementId, elements, 'proof_element_missing', `proof row "${row.id}"`)
    }
    for (const link of row.evidence_links ?? []) {
      expectExists(link.evidence_id, evidence, 'proof_evidence_missing', `proof row "${row.id}"`)
      if (!['supports', 'challenges', 'contradicts', 'context', 'contextual'].includes(link.relation)) {
        err('proof_relation', `Proof row "${row.id}" có relation không hợp lệ: ${link.relation}.`)
      }
      for (const limitationId of link.limitation_ids ?? []) {
        expectExists(limitationId, limitations, 'proof_limitation_missing', `proof row "${row.id}"`)
      }
    }
  }

  // Charges & elements
  for (const charge of caseFile.candidate_charges) {
    expectExists(charge.person_id, characters, 'charge_person', `charge "${charge.id}"`)
    for (const eventId of charge.conduct_event_ids) {
      expectExists(eventId, conductEvents, 'charge_event', `charge "${charge.id}"`)
    }
    for (const elementId of charge.charge_element_ids) {
      expectExists(elementId, elements, 'charge_element', `charge "${charge.id}"`)
      const el = elements.get(elementId)
      if (el && el.charge_id !== charge.id) {
        err(
          'charge_element_mismatch',
          `Charge "${charge.id}" tham chiếu element "${elementId}" nhưng element này thuộc charge "${el.charge_id}".`,
        )
      }
    }
    for (const basisId of charge.legal_basis_ids) {
      expectExists(basisId, provisions, 'charge_basis', `charge "${charge.id}"`)
    }
    const required = caseFile.charge_elements.filter(
      (element) => element.charge_id === charge.id && element.required,
    )
    if (required.length === 0) {
      err('charge_no_required_element', `Charge "${charge.id}" không có dấu hiệu bắt buộc.`)
    }
  }
  for (const element of caseFile.charge_elements) {
    expectExists(element.charge_id, charges, 'element_charge', `element "${element.id}"`)
    const ch = charges.get(element.charge_id)
    if (ch && !ch.charge_element_ids.includes(element.id)) {
      err(
        'charge_element_unreferenced',
        `Element "${element.id}" thuộc charge "${element.charge_id}" nhưng charge không liệt kê element này trong charge_element_ids.`,
      )
    }
    for (const factId of element.fact_ids ?? []) {
      expectExists(factId, facts, 'element_fact', `element "${element.id}"`)
    }
    for (const evidenceId of element.evidence_ids ?? []) {
      expectExists(evidenceId, evidence, 'element_evidence', `element "${element.id}"`)
    }
    for (const basisId of element.legal_basis_ids) {
      expectExists(basisId, provisions, 'element_basis', `element "${element.id}"`)
    }
    if (!element.label) warn('element_label', `Element "${element.id}" thiếu label.`)
  }

  // Comparisons
  for (const comparison of caseFile.charge_comparisons) {
    for (const chargeId of comparison.candidate_charge_ids ?? []) {
      expectExists(chargeId, charges, 'comparison_charge', `comparison "${comparison.id}"`)
    }
    for (const elementId of comparison.distinguishing_element_ids ?? []) {
      const element = elements.get(elementId)
      if (!element) {
        err('comparison_element', `comparison "${comparison.id}": element "${elementId}" không tồn tại.`)
      } else if (!(comparison.candidate_charge_ids ?? []).includes(element.charge_id)) {
        err(
          'comparison_element_charge',
          `comparison "${comparison.id}": element "${elementId}" thuộc charge ngoài danh sách so sánh.`,
        )
      }
    }
    if (comparison.explanation_id) {
      expectExists(comparison.explanation_id, explanations, 'comparison_explanation', `comparison "${comparison.id}"`)
    }
  }

  // Age rules
  for (const rule of caseFile.age_rules) {
    for (const chargeId of rule.candidate_charge_ids) {
      expectExists(chargeId, charges, 'age_charge', `age rule "${rule.id}"`)
    }
    for (const eventId of rule.conduct_event_ids) {
      expectExists(eventId, conductEvents, 'age_event', `age rule "${rule.id}"`)
    }
    for (const bundleId of rule.law_bundle_ids) {
      expectExists(bundleId, bundles, 'age_bundle', `age rule "${rule.id}"`)
    }
    for (const basisId of rule.legal_basis_ids) {
      expectExists(basisId, provisions, 'age_basis', `age rule "${rule.id}"`)
    }
    const rangesByCharge = new Map<string, Array<[number, number]>>()
    for (const condition of rule.conditions ?? []) {
      if (condition.min_age_years > condition.max_age_years) {
        err('age_range', `age rule "${rule.id}": min_age_years lớn hơn max_age_years.`)
      }
      for (const chargeId of condition.applies_to_charge_ids) {
        expectExists(chargeId, charges, 'age_condition_charge', `age rule "${rule.id}"`)
        if (!rule.candidate_charge_ids.includes(chargeId)) {
          err(
            'age_condition_charge_scope',
            `age rule "${rule.id}": condition áp cho charge "${chargeId}" ngoài candidate_charge_ids.`,
          )
        }
      }
      for (const basisId of condition.legal_basis_ids) {
        expectExists(basisId, provisions, 'age_condition_basis', `age rule "${rule.id}"`)
      }
      if (!condition.review_id) {
        err('age_condition_review', `age rule "${rule.id}": condition thiếu review_id.`)
      }
      for (const chargeId of condition.applies_to_charge_ids) {
        const list = rangesByCharge.get(chargeId) ?? []
        list.push([condition.min_age_years, condition.max_age_years])
        rangesByCharge.set(chargeId, list)
      }
    }
    for (const [chargeId, ranges] of rangesByCharge) {
      const sorted = ranges.slice().sort((a, b) => a[0] - b[0])
      for (let i = 1; i < sorted.length; i += 1) {
        if (sorted[i][0] <= sorted[i - 1][1]) {
          err(
            'age_overlap',
            `age rule "${rule.id}": khoảng tuổi chồng lấn cho charge "${chargeId}".`,
          )
        }
      }
      if (sorted.length > 0 && sorted[0][0] > 0) {
        warn('age_gap', `age rule "${rule.id}": thiếu khoảng tuổi từ 0 đến ${sorted[0][0]} cho charge "${chargeId}".`)
      }
    }
    if (rule.conditions.length === 0) {
      warn('age_conditions_empty', `age rule "${rule.id}" chưa có conditions do reviewer điền.`)
    }
    if (rule.review_status !== 'approved') {
      warn('age_rule_unreviewed', `age rule "${rule.id}" chưa được duyệt.`)
    }
    if (rule.conditions.length === 0 && options.mode === 'publish') {
      err('age_conditions_publish', `age rule "${rule.id}" không được publish khi conditions rỗng.`)
    }
  }

  // Circumstances
  for (const circumstance of caseFile.circumstances) {
    expectExists(circumstance.person_id, characters, 'circumstance_person', `circumstance "${circumstance.id}"`)
    for (const eventId of circumstance.conduct_event_ids) {
      expectExists(eventId, conductEvents, 'circumstance_event', `circumstance "${circumstance.id}"`)
    }
    for (const basisId of circumstance.legal_basis_ids) {
      expectExists(basisId, provisions, 'circumstance_basis', `circumstance "${circumstance.id}"`)
    }
    for (const factId of circumstance.fact_ids ?? []) {
      expectExists(factId, facts, 'circumstance_fact', `circumstance "${circumstance.id}"`)
    }
    if (circumstance.review_status !== 'approved') {
      warn('circumstance_unreviewed', `circumstance "${circumstance.id}" chưa được duyệt.`)
    }
  }

  // Conclusions
  for (const conclusion of caseFile.conclusions) {
    if (conclusion.type === 'charge_supported' && !conclusion.charge_id) {
      err('conclusion_charge', `Conclusion "${conclusion.id}" kiểu charge_supported nhưng thiếu charge_id.`)
    }
    if (conclusion.type === 'insufficient_information' && conclusion.charge_id) {
      err('conclusion_charge', `Conclusion "${conclusion.id}" kiểu insufficient_information nhưng có charge_id.`)
    }
    if (conclusion.charge_id) {
      expectExists(conclusion.charge_id, charges, 'conclusion_charge', `conclusion "${conclusion.id}"`)
    }
    expectExists(conclusion.person_id, characters, 'conclusion_person', `conclusion "${conclusion.id}"`)
    for (const eventId of conclusion.conduct_event_ids) {
      expectExists(eventId, conductEvents, 'conclusion_event', `conclusion "${conclusion.id}"`)
    }
  }

  // Answer fields
  for (const field of caseFile.answer_fields) {
    const optionIds = new Set<string>()
    for (const option of field.options) {
      if (optionIds.has(option.id)) {
        err('option_duplicate', `Field "${field.id}" có option trùng "${option.id}".`)
      }
      optionIds.add(option.id)
    }
    if (field.options.length === 0) {
      err('field_no_options', `Field "${field.id}" không có option.`)
    }
    if (field.target_ids.length === 0 && field.scope !== 'case') {
      err('field_no_targets', `Field "${field.id}" không có target.`)
    }
    for (const targetId of field.target_ids) {
      switch (field.scope) {
        case 'evidence':
          expectExists(targetId, evidence, 'field_target', `field "${field.id}"`)
          break
        case 'hypothesis':
          expectExists(targetId, hypotheses, 'field_target', `field "${field.id}"`)
          break
        case 'proof_row':
          expectExists(targetId, proofRows, 'field_target', `field "${field.id}"`)
          break
        case 'charge_element':
          expectExists(targetId, elements, 'field_target', `field "${field.id}"`)
          break
        case 'circumstance':
          expectExists(targetId, circumstances, 'field_target', `field "${field.id}"`)
          break
        case 'conclusion':
          expectExists(targetId, conclusions, 'field_target', `field "${field.id}"`)
          break
        case 'person_conduct': {
          const [personId, conductId] = targetId.split(':')
          if (!personId || !conductId) {
            err('field_target', `field "${field.id}": target "${targetId}" không đúng dạng person:conduct.`)
          } else {
            expectExists(personId, characters, 'field_target', `field "${field.id}"`)
            expectExists(conductId, conductEvents, 'field_target', `field "${field.id}"`)
          }
          break
        }
        case 'case':
          break
      }
    }
  }

  const validateExprAgainst = (expr: Expr, context: string) => {
    for (const message of validateExpr(expr, fields)) {
      err('expr_invalid', `${context}: ${message}`)
    }
  }

  // Expected responses
  for (const expectation of caseFile.expected_responses) {
    const field = fields.get(expectation.field_id)
    if (!field) {
      err('expectation_field', `Expectation "${expectation.id}": field "${expectation.field_id}" không tồn tại.`)
    } else {
      if (!field.target_ids.includes(expectation.target_id)) {
        err(
          'expectation_target',
          `Expectation "${expectation.id}": target "${expectation.target_id}" không thuộc field "${field.id}".`,
        )
      }
      for (const value of expectation.accepted_values) {
        if (!field.options.some((option) => option.id === value)) {
          err(
            'expectation_value',
            `Expectation "${expectation.id}": accepted value "${value}" không có trong options của "${field.id}".`,
          )
        }
      }
      if (expectation.accepted_values.length > 1 && field.value_type === 'single_choice') {
        err(
          'expectation_single',
          `Expectation "${expectation.id}": single_choice không được nhận nhiều giá trị.`,
        )
      }
    }
    for (const pathId of expectation.path_ids) {
      expectExists(pathId, paths, 'expectation_path', `expectation "${expectation.id}"`)
    }
    if (expectation.path_ids.length === 0) {
      err('expectation_no_path', `Expectation "${expectation.id}" không thuộc path nào.`)
    }
    expectExists(expectation.criterion_id, criteria, 'expectation_criterion', `expectation "${expectation.id}"`)
    expectExists(expectation.explanation_id, explanations, 'expectation_explanation', `expectation "${expectation.id}"`)
    for (const outcomeId of expectation.learning_outcome_ids) {
      if (!outcomes.has(outcomeId)) {
        err('expectation_outcome', `Expectation "${expectation.id}": outcome "${outcomeId}" không có trong catalog.`)
      }
    }
  }

  // Paths
  for (const path of caseFile.answer_paths) {
    validateExprAgainst(path.match, `path "${path.id}".match`)
    for (const conclusionId of path.conclusion_ids) {
      const conclusion = conclusions.get(conclusionId)
      if (!conclusion) {
        err('path_conclusion', `Path "${path.id}": conclusion "${conclusionId}" không tồn tại.`)
        continue
      }
      if (conclusion.type === 'charge_supported') {
        if (!conclusion.charge_id || !path.charge_ids.includes(conclusion.charge_id)) {
          err(
            'path_conclusion_charge',
            `Path "${path.id}": conclusion "${conclusionId}" cần charge "${conclusion.charge_id}" trong charge_ids.`,
          )
        }
      }
      if (conclusion.type === 'insufficient_information' && path.charge_ids.length > 0) {
        err(
          'path_conclusion_charge',
          `Path "${path.id}": conclusion "${conclusionId}" là chưa đủ căn cứ nhưng path có charge_ids.`,
        )
      }
      const hasConclusionExpectation = caseFile.expected_responses.some(
        (expectation) =>
          expectation.path_ids.includes(path.id) &&
          expectation.accepted_values.includes(conclusionId) &&
          fields.get(expectation.field_id)?.scope === 'person_conduct',
      )
      if (!hasConclusionExpectation) {
        err(
          'path_conclusion_expectation',
          `Path "${path.id}": thiếu expectation cho conclusion "${conclusionId}".`,
        )
      }
    }
    for (const chargeId of path.charge_ids) {
      const charge = charges.get(chargeId)
      if (!charge) {
        err('path_charge', `Path "${path.id}": charge "${chargeId}" không tồn tại.`)
        continue
      }
      for (const element of caseFile.charge_elements) {
        if (element.charge_id !== chargeId || !element.required) continue
        const expected = caseFile.expected_responses.some(
          (expectation) =>
            expectation.path_ids.includes(path.id) &&
            expectation.field_id === 'element_status' &&
            expectation.target_id === element.id &&
            expectation.accepted_values.includes('supported'),
        )
        if (!expected) {
          err(
            'path_charge_element',
            `Path "${path.id}": định danh "${chargeId}" cần expectation "supported" cho dấu hiệu bắt buộc "${element.id}".`,
          )
        }
      }
    }
  }

  for (let i = 0; i < caseFile.answer_paths.length; i += 1) {
    for (let j = i + 1; j < caseFile.answer_paths.length; j += 1) {
      const left = caseFile.answer_paths[i]
      const right = caseFile.answer_paths[j]
      const sameConclusion =
        left.conclusion_ids.length === right.conclusion_ids.length &&
        left.conclusion_ids.every((id) => right.conclusion_ids.includes(id))
      if (!sameConclusion && !pathsConflict(left, right)) {
        warn(
          'path_overlap',
          `Path "${left.id}" và "${right.id}" có thể cùng khớp dù kết luận khác nhau; cần kiểm tra lại biểu thức.`,
        )
      }
    }
  }

  // Consistency rules
  for (const rule of caseFile.consistency_rules) {
    expectExists(rule.scope.person_id, characters, 'rule_person', `rule "${rule.id}".scope`)
    expectExists(rule.scope.conduct_event_id, conductEvents, 'rule_event', `rule "${rule.id}".scope`)
    validateExprAgainst(rule.when, `rule "${rule.id}".when`)
    validateExprAgainst(rule.assert, `rule "${rule.id}".assert`)
  }

  // Criteria
  for (const criterion of caseFile.criteria) {
    for (const outcomeId of criterion.learning_outcome_ids) {
      if (!outcomes.has(outcomeId)) {
        err('criterion_outcome', `Criterion "${criterion.id}": outcome "${outcomeId}" không có trong catalog.`)
      }
      if (!caseFile.metadata.learning_outcome_ids.includes(outcomeId)) {
        warn(
          'criterion_outcome_undeclared',
          `Criterion "${criterion.id}" dùng outcome "${outcomeId}" nhưng metadata không công bố outcome này.`,
        )
      }
    }
    for (const fieldId of criterion.answer_field_ids) {
      expectExists(fieldId, fields, 'criterion_field', `criterion "${criterion.id}".answer_field_ids`)
    }
  }
  for (const outcomeId of caseFile.metadata.learning_outcome_ids) {
    const measured = caseFile.criteria.some((criterion) =>
      criterion.learning_outcome_ids.includes(outcomeId),
    )
    if (!measured) {
      err(
        'outcome_unmeasured',
        `Outcome "${outcomeId}" được công bố nhưng không criterion nào đo nó.`,
      )
    }
  }

  // Scoring
  const weightById = new Map<string, (typeof caseFile.scoring.path_weights)[number]>()
  for (const weight of caseFile.scoring.path_weights) {
    if (weightById.has(weight.path_id)) {
      err('weight_duplicate', `path_weights có nhiều entry cho path "${weight.path_id}".`)
    }
    weightById.set(weight.path_id, weight)
    expectExists(weight.path_id, paths, 'weight_path', 'scoring.path_weights')
    const sum = Object.values(weight.criterion_points).reduce((total, value) => total + value, 0)
    if (Math.abs(sum - 100) > 0.001) {
      err('weight_sum', `Path "${weight.path_id}" có tổng điểm ${sum}, yêu cầu đúng 100.`)
    }
    for (const criterionId of Object.keys(weight.criterion_points)) {
      expectExists(criterionId, criteria, 'weight_criterion', `path "${weight.path_id}"`)
    }
  }
  for (const path of caseFile.answer_paths) {
    if (!weightById.has(path.id)) {
      err('weight_missing', `Path "${path.id}" không có scoring.path_weights tương ứng.`)
    }
  }
  for (const path of caseFile.answer_paths) {
    const weight = weightById.get(path.id)
    if (!weight) continue
    for (const [criterionId, points] of Object.entries(weight.criterion_points)) {
      if (points <= 0) continue
      const hasExpectation = caseFile.expected_responses.some(
        (expectation) =>
          expectation.criterion_id === criterionId && expectation.path_ids.includes(path.id),
      )
      if (!hasExpectation) {
        err(
          'weight_no_expectation',
          `Path "${path.id}": criterion "${criterionId}" có ${points} điểm nhưng không có expectation áp dụng.`,
        )
      }
    }
  }
  for (const expectation of caseFile.expected_responses) {
    for (const pathId of expectation.path_ids) {
      const weight = weightById.get(pathId)
      if (weight && !(expectation.criterion_id in weight.criterion_points)) {
        warn(
          'expectation_criterion_unweighted',
          `Expectation "${expectation.id}" thuộc criterion "${expectation.criterion_id}" nhưng path "${pathId}" không cấp điểm cho criterion này.`,
        )
      }
    }
  }

  // Legal version resolution
  const lawChecks = checkLawResolution(caseFile)
  for (const check of lawChecks) {
    if (check.status === 'ok') continue
    const severity = options.mode === 'publish' ? 'error' : 'warning'
    for (const message of check.messages) {
      push({
        severity,
        code: `law_${check.status}`,
        message: `conduct_event "${check.conductEventId}": ${message}`,
      })
    }
    if (check.messages.length === 0) {
      push({
        severity,
        code: `law_${check.status}`,
        message: `conduct_event "${check.conductEventId}": trạng thái luật ${check.status}.`,
      })
    }
  }

  // Layer 2 — semantic invariants (scoring, path policy, orphan content, cycles)
  for (const issue of semanticFindingsToLintIssues(validateCaseSemantics(caseFile, options))) {
    push(issue)
  }

  // Publish gates
  if (options.mode === 'publish') {
    const blockers = collectPublishBlockers(caseFile)
    for (const blocker of blockers) push(blocker)
  } else {
    const blockers = collectPublishBlockers(caseFile)
    if (blockers.length > 0) {
      push({
        severity: 'info',
        code: 'publish_gate',
        message: `Case đang ở trạng thái nháp: ${blockers.length} mục chặn publish (chạy lint:content --publish để xem chi tiết).`,
      })
    }
  }

  // Unused helper guard (keeps allIds meaningful for future checks)
  void allIds
  void conclusions

  return issues
}

export function collectPublishBlockers(caseFile: CaseFile): LintIssue[] {
  const blockers: LintIssue[] = []
  const add = (code: string, message: string) =>
    blockers.push({ severity: 'error', code, message })

  if (!['approved', 'published'].includes(caseFile.metadata.status)) {
    add('publish_status', `metadata.status là "${caseFile.metadata.status}", cần "approved" hoặc "published".`)
  }
  if (caseFile.review.status !== 'approved') {
    add('publish_review', `review.status là "${caseFile.review.status}", cần "approved".`)
  }
  if (caseFile.review.review_ids.length === 0) {
    add('publish_review_ids', 'review.review_ids rỗng; cần ghi nhận người/ngày rà soát.')
  }
  for (const bundle of caseFile.law_bundles) {
    for (const provision of bundle.provisions) {
      if (provision.review_status !== 'approved') {
        add(
          'publish_provision',
          `Provision "${provision.id}" chưa được duyệt (${provision.review_status}).`,
        )
      }
      if (!provision.effective_from) {
        add('publish_effective', `Provision "${provision.id}" thiếu effective_from.`)
      }
      if (!provision.source_ref || /^\[|\bTBD\b/i.test(provision.source_ref)) {
        add('publish_source', `Provision "${provision.id}" thiếu nguồn chính thức đã đối chiếu.`)
      }
    }
  }
  for (const defect of caseFile.procedural_defects) {
    if (defect.review_status !== 'approved') {
      add('publish_defect', `Procedural defect "${defect.id}" chưa được duyệt.`)
    }
  }
  for (const rule of caseFile.age_rules) {
    if (rule.review_status !== 'approved') {
      add('publish_age', `Age rule "${rule.id}" chưa được duyệt.`)
    }
    if (rule.conditions.length === 0) {
      add('publish_age_conditions', `Age rule "${rule.id}" chưa có conditions.`)
    }
  }
  for (const circumstance of caseFile.circumstances) {
    if (circumstance.review_status !== 'approved') {
      add('publish_circumstance', `Circumstance "${circumstance.id}" chưa được duyệt.`)
    }
  }
  for (const check of checkLawResolution(caseFile)) {
    if (check.status !== 'ok') {
      add('publish_law', `conduct_event "${check.conductEventId}": ${check.messages.join(' ')}`)
    }
  }
  for (const issueId of caseFile.critical_issue_ids ?? []) {
    if (!(caseFile.issues ?? []).some((issue) => issue.id === issueId)) {
      add('publish_critical_issue', `critical_issue_id "${issueId}" không tồn tại.`)
    }
  }

  const serialized = JSON.stringify(caseFile)
  const patterns: Array<[RegExp, string]> = [
    [/\[chưa xác minh[^\]]*\]/gi, 'chưa xác minh'],
    [/\[reviewer[^\]]*\]/gi, 'reviewer placeholder'],
    [/\[nguồn luật chưa xác minh[^\]]*\]/gi, 'nguồn luật placeholder'],
    [/\[giả định học tập[^\]]*\]/gi, 'nhãn giả định học tập'],
    [/\bTBD\b/g, 'TBD'],
    [/placeholder/gi, 'placeholder'],
    [/effect_to_be_reviewed/gi, 'effect_to_be_reviewed'],
    [/not_reviewed/gi, 'not_reviewed'],
  ]
  const found: string[] = []
  for (const [pattern, label] of patterns) {
    const matches = serialized.match(pattern)
    if (matches && matches.length > 0) {
      found.push(`${label} (${matches.length})`)
    }
  }
  if (found.length > 0) {
    add(
      'publish_placeholder',
      `Còn nội dung placeholder/chưa xác minh: ${found.slice(0, MAX_EXAMPLES).join(', ')}.`,
    )
  }

  for (const conclusion of caseFile.conclusions) {
    if (!conclusion.label || /^\[/.test(conclusion.label) || /\bTBD\b/i.test(conclusion.label)) {
      add('publish_conclusion_label', `Conclusion "${conclusion.id}" thiếu nhãn hiển thị đã duyệt.`)
    }
  }

  return blockers
}

export function summarizeLint(issues: LintIssue[]): {
  errors: number
  warnings: number
  infos: number
} {
  return {
    errors: issues.filter((issue) => issue.severity === 'error').length,
    warnings: issues.filter((issue) => issue.severity === 'warning').length,
    infos: issues.filter((issue) => issue.severity === 'info').length,
  }
}
