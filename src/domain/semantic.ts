import type { CaseFile, Expr, LintIssue } from './types'
import { flattenAtoms } from './expr'

/**
 * Layer 2 — Semantic Validator.
 *
 * Module này kiểm tra các bất biến ngữ nghĩa mà JSON Schema không thể biểu diễn:
 * quan hệ giữa các thực thể, tính duy nhất của nhóm đáp án, chính sách chọn đường đáp án,
 * chấm điểm, nội dung mồ côi và chu trình mở khoá chứng cứ.
 *
 * Các kiểm tra tham chiếu ID cơ bản đang nằm trong `linter.ts` (legacy gate).
 * Khi migrate sang 2.2.0, các kiểm tra đó sẽ được chuyển dần về đây; trong
 * 2.1.0 hai lớp chạy song song và không lặp cùng một mã lỗi.
 */

export type SemanticSeverity = 'error' | 'warning' | 'info'

export interface SemanticFinding {
  code: string
  severity: SemanticSeverity
  path: string
  message: string
  entityId?: string
}

export interface SemanticOptions {
  mode: 'draft' | 'publish'
}

function byId<T extends { id: string }>(items: T[]): Map<string, T> {
  return new Map(items.map((item) => [item.id, item]))
}

function containsAny(expr: Expr): boolean {
  if (expr.op === 'any') return true
  if (expr.op === 'all') return expr.args.some(containsAny)
  return false
}

function pathsConflict(left: Expr, right: Expr): boolean {
  if (containsAny(left) || containsAny(right)) return false
  const leftAtoms = flattenAtoms(left)
  const rightAtoms = flattenAtoms(right)
  for (const a of leftAtoms) {
    for (const b of rightAtoms) {
      if (a.field_id !== b.field_id || a.target_id !== b.target_id) continue
      const leftValue = 'value' in a ? a.value : null
      const rightValue = 'value' in b ? b.value : null
      if (a.op === 'equals' && b.op === 'equals' && leftValue !== rightValue) return true
      if (a.op === 'equals' && b.op === 'not_equals' && leftValue === rightValue) return true
      if (a.op === 'not_equals' && b.op === 'equals' && leftValue === rightValue) return true
      if (a.op === 'contains' && b.op === 'not_contains' && leftValue === rightValue) return true
      if (a.op === 'not_contains' && b.op === 'contains' && leftValue === rightValue) return true
      if (a.op === 'is_empty' && b.op === 'is_not_empty') return true
      if (a.op === 'is_not_empty' && b.op === 'is_empty') return true
      if (a.op === 'is_empty' && ['equals', 'contains'].includes(b.op)) return true
      if (b.op === 'is_empty' && ['equals', 'contains'].includes(a.op)) return true
    }
  }
  return false
}

function findDiscoveryCycles(caseFile: CaseFile): string[][] {
  const graph = new Map<string, string[]>()
  for (const evidence of caseFile.evidence) {
    const edges: string[] = []
    const discovery = evidence.discovery
    if (discovery?.kind === 'viewed') edges.push(...(discovery.evidence_ids ?? []))
    if (discovery?.kind === 'check') edges.push(...(discovery.requires_viewed ?? []))
    graph.set(evidence.id, edges)
  }

  const cycles: string[][] = []
  const visited = new Set<string>()
  const stack: string[] = []
  const inStack = new Set<string>()

  const visit = (node: string) => {
    if (inStack.has(node)) {
      const start = stack.indexOf(node)
      cycles.push([...stack.slice(start), node])
      return
    }
    if (visited.has(node)) return
    visited.add(node)
    inStack.add(node)
    stack.push(node)
    for (const next of graph.get(node) ?? []) {
      if (graph.has(next)) visit(next)
    }
    stack.pop()
    inStack.delete(node)
  }

  for (const id of graph.keys()) visit(id)
  return cycles
}

export function validateCaseSemantics(
  caseFile: CaseFile,
  options: SemanticOptions,
): SemanticFinding[] {
  const findings: SemanticFinding[] = []
  const add = (
    code: string,
    severity: SemanticSeverity,
    path: string,
    message: string,
    entityId?: string,
  ) => findings.push({ code, severity, path, message, entityId })

  const paths = byId(caseFile.answer_paths)
  const criteria = byId(caseFile.criteria)
  const fields = byId(caseFile.answer_fields)
  const evidence = byId(caseFile.evidence)
  const provisions = new Map(
    caseFile.law_bundles.flatMap((bundle) =>
      bundle.provisions.map((provision) => [provision.id, { ...provision, bundleId: bundle.id }] as const),
    ),
  )

  // ---------------------------------------------------------------------------
  // Chấm điểm: nguồn trọng số và nhóm kỳ vọng
  // ---------------------------------------------------------------------------
  if (caseFile.scoring.max_total_points !== undefined && caseFile.scoring.max_total_points !== 100) {
    add(
      'sem_score_max_total',
      'error',
      'scoring.max_total_points',
      `max_total_points phải bằng 100, nhận ${caseFile.scoring.max_total_points}.`,
    )
  }

  if (
    caseFile.scoring.partial_credit.weight_scope !== undefined &&
    caseFile.scoring.partial_credit.weight_scope !== 'within_criterion'
  ) {
    add(
      'sem_score_weight_scope',
      'error',
      'scoring.partial_credit.weight_scope',
      'weight_scope chỉ nhận "within_criterion" để tránh nhân trọng số hai lần.',
    )
  }

  if (caseFile.schema_version === '2.1.0') {
    if (caseFile.scoring.max_total_points === undefined) {
      add(
        'sem_score_max_total_missing',
        'warning',
        'scoring.max_total_points',
        'Hồ sơ 2.1.0 nên khai báo max_total_points = 100 để cố định thang điểm.',
      )
    }
    if (caseFile.scoring.partial_credit.weight_scope === undefined) {
      add(
        'sem_score_weight_scope_missing',
        'warning',
        'scoring.partial_credit.weight_scope',
        'Hồ sơ 2.1.0 nên khai báo weight_scope = "within_criterion".',
      )
    }
  }

  const expectationGroups = new Map<string, string[]>()
  for (const expectation of caseFile.expected_responses) {
    if (!criteria.has(expectation.criterion_id)) continue
    for (const pathId of expectation.path_ids) {
      if (!paths.has(pathId)) continue
      const key = `${pathId}|${expectation.criterion_id}|${expectation.field_id}|${expectation.target_id}`
      const group = expectationGroups.get(key) ?? []
      group.push(expectation.id)
      expectationGroups.set(key, group)
    }
  }
  for (const [key, ids] of expectationGroups) {
    if (ids.length <= 1) continue
    const [pathId, criterionId, fieldId, targetId] = key.split('|')
    add(
      'sem_unique_expectation',
      'error',
      `expected_responses(${ids.join(',')})`,
      `Có ${ids.length} kỳ vọng cùng chấm một nhóm (${pathId}/${criterionId}/${fieldId}/${targetId}); điểm sẽ bị cộng trùng.`,
      ids[0],
    )
  }

  // ---------------------------------------------------------------------------
  // Chọn đường đáp án
  // ---------------------------------------------------------------------------
  const selection = caseFile.path_selection
  if (selection) {
    const order = selection.order
    if (order) {
      const seen = new Set<string>()
      for (const pathId of order) {
        if (!paths.has(pathId)) {
          add(
            'sem_path_order_unknown',
            'error',
            'path_selection.order',
            `Đường đáp án "${pathId}" trong thứ tự ưu tiên không tồn tại.`,
          )
        }
        if (seen.has(pathId)) {
          add(
            'sem_path_order_duplicate',
            'error',
            'path_selection.order',
            `Đường đáp án "${pathId}" xuất hiện nhiều lần trong thứ tự ưu tiên.`,
          )
        }
        seen.add(pathId)
      }
      for (const path of caseFile.answer_paths) {
        if (!seen.has(path.id)) {
          add(
            'sem_path_order_missing',
            'error',
            'path_selection.order',
            `Đường đáp án "${path.id}" chưa có trong thứ tự ưu tiên.`,
          )
        }
      }
    }

    if (selection.mode === 'exclusive') {
      for (let i = 0; i < caseFile.answer_paths.length; i += 1) {
        for (let j = i + 1; j < caseFile.answer_paths.length; j += 1) {
          const left = caseFile.answer_paths[i]
          const right = caseFile.answer_paths[j]
          if (pathsConflict(left.match, right.match)) {
            add(
              'sem_path_overlap',
              'error',
              `answer_paths[${i}].match`,
              `Đường đáp án "${left.id}" và "${right.id}" có thể cùng khớp nhưng chính sách là exclusive.`,
              left.id,
            )
          }
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Referential integrity bổ sung (các check chưa có trong linter)
  // ---------------------------------------------------------------------------
  for (const basisId of caseFile.references.legal_basis_ids) {
    if (!provisions.has(basisId)) {
      add(
        'sem_reference_law',
        'error',
        'references.legal_basis_ids',
        `Điều khoản "${basisId}" không tồn tại trong law_bundles.`,
      )
    }
  }

  for (const [index, event] of caseFile.temporal_context.conduct_events.entries()) {
    for (const [segmentIndex, segment] of (event.law_resolution.segments ?? []).entries()) {
      for (const provisionId of segment.provision_ids ?? []) {
        const provision = provisions.get(provisionId)
        if (!provision) {
          add(
            'sem_segment_provision',
            'error',
            `temporal_context.conduct_events[${index}].law_resolution.segments[${segmentIndex}].provision_ids`,
            `Điều khoản "${provisionId}" không tồn tại.`,
          )
        } else if (provision.bundleId !== segment.bundle_id) {
          add(
            'sem_segment_provision_bundle',
            'error',
            `temporal_context.conduct_events[${index}].law_resolution.segments[${segmentIndex}].provision_ids`,
            `Điều khoản "${provisionId}" thuộc bộ văn bản "${provision.bundleId}", không thuộc "${segment.bundle_id}".`,
          )
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Issues / hints
  // ---------------------------------------------------------------------------
  for (const issue of caseFile.issues ?? []) {
    const criticalListed = (caseFile.critical_issue_ids ?? []).includes(issue.id)
    if (issue.critical === true && !criticalListed) {
      add(
        'sem_critical_flag',
        'error',
        `issues(${issue.id}).critical`,
        `Vấn đề "${issue.id}" đánh dấu nghiêm trọng nhưng không nằm trong critical_issue_ids.`,
        issue.id,
      )
    }
    if (issue.critical !== true && criticalListed) {
      add(
        'sem_critical_flag',
        'warning',
        `critical_issue_ids(${issue.id})`,
        `Vấn đề "${issue.id}" nằm trong critical_issue_ids nhưng không đánh dấu nghiêm trọng.`,
        issue.id,
      )
    }
  }

  // ---------------------------------------------------------------------------
  // Discovery cycles
  // ---------------------------------------------------------------------------
  for (const cycle of findDiscoveryCycles(caseFile)) {
    // Self-reference đã được linter báo bằng mã unlock_cycle.
    if (cycle.length === 2 && cycle[0] === cycle[1]) continue
    add(
      'sem_discovery_cycle',
      'error',
      'evidence.discovery',
      `Chu trình mở khoá chứng cứ: ${cycle.join(' → ')}.`,
      cycle[0],
    )
  }

  // ---------------------------------------------------------------------------
  // Orphan content
  // ---------------------------------------------------------------------------
  const referencedEvidence = new Set<string>()
  for (const fact of caseFile.facts) {
    for (const sourceId of fact.source_ids ?? []) {
      if (evidence.has(sourceId)) referencedEvidence.add(sourceId)
    }
  }
  for (const item of caseFile.evidence) {
    const discovery = item.discovery
    if (discovery?.kind === 'viewed') {
      for (const id of discovery.evidence_ids ?? []) referencedEvidence.add(id)
    }
    if (discovery?.kind === 'check') {
      for (const id of discovery.requires_viewed ?? []) referencedEvidence.add(id)
    }
    for (const id of item.procedural_defect_ids ?? []) {
      const defect = caseFile.procedural_defects.find((entry) => entry.id === id)
      if (defect?.evidence_id) referencedEvidence.add(defect.evidence_id)
    }
    for (const id of item.limitation_ids ?? []) {
      const limitation = caseFile.evidence_limitations.find((entry) => entry.id === id)
      if (limitation?.evidence_id) referencedEvidence.add(limitation.evidence_id)
    }
  }
  for (const element of caseFile.charge_elements) {
    for (const id of element.evidence_ids ?? []) referencedEvidence.add(id)
  }
  for (const row of caseFile.proof_matrix) {
    for (const link of row.evidence_links) referencedEvidence.add(link.evidence_id)
  }
  for (const issue of caseFile.issues ?? []) {
    for (const id of issue.evidence_ids ?? []) referencedEvidence.add(id)
  }
  for (const expectation of caseFile.expected_responses) {
    if (fields.get(expectation.field_id)?.scope === 'evidence') {
      referencedEvidence.add(expectation.target_id)
    }
  }
  for (const item of caseFile.evidence) {
    if (!referencedEvidence.has(item.id)) {
      add(
        'sem_evidence_orphan',
        'warning',
        `evidence(${item.id})`,
        `Chứng cứ "${item.id}" không được tham chiếu ở dữ kiện, ma trận chứng minh, dấu hiệu, vấn đề, cơ chế mở tài liệu hoặc kỳ vọng.`,
        item.id,
      )
    }
  }

  const usedExplanations = new Set<string>()
  for (const expectation of caseFile.expected_responses) usedExplanations.add(expectation.explanation_id)
  for (const comparison of caseFile.charge_comparisons) {
    if (comparison.explanation_id) usedExplanations.add(comparison.explanation_id)
  }
  for (const explanation of caseFile.explanations) {
    if (!usedExplanations.has(explanation.id)) {
      add(
        'sem_explanation_unused',
        'warning',
        `explanations(${explanation.id})`,
        `Giải thích "${explanation.id}" không được kỳ vọng hoặc phần so sánh định danh nào dùng.`,
        explanation.id,
      )
    }
  }

  for (const criterion of caseFile.criteria) {
    const hasExpectation = caseFile.expected_responses.some(
      (expectation) => expectation.criterion_id === criterion.id,
    )
    if (!hasExpectation) {
      add(
        'sem_criterion_no_expectation',
        'warning',
        `criteria(${criterion.id})`,
        `Tiêu chí "${criterion.id}" không có kỳ vọng nào nên không thể sinh điểm.`,
        criterion.id,
      )
    }
  }

  for (const element of caseFile.charge_elements) {
    if (element.required && (element.fact_ids ?? []).length === 0) {
      add(
        'sem_element_no_fact',
        'warning',
        `charge_elements(${element.id}).fact_ids`,
        `Dấu hiệu bắt buộc "${element.id}" chưa có mã dữ kiện để đối chiếu.`,
        element.id,
      )
    }
  }

  // Ở chế độ xuất bản, các cảnh báo về nội dung chưa đầy đủ trở thành lỗi.
  if (options.mode === 'publish') {
    return findings.map((finding) =>
      finding.severity === 'warning' && finding.code !== 'sem_score_max_total_missing'
        ? { ...finding, severity: 'error' }
        : finding,
    )
  }

  return findings
}

export function semanticFindingsToLintIssues(findings: SemanticFinding[]): LintIssue[] {
  return findings.map((finding) => ({
    severity: finding.severity,
    code: finding.code,
    message: finding.message,
    path: finding.path,
  }))
}
