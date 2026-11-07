/** Kiểu dữ liệu cho case, luật, phiên chơi và kết quả chấm. */

export type Stage =
  | 'brief'
  | 'investigation'
  | 'evidence'
  | 'hypotheses'
  | 'analysis'
  | 'submission'
  | 'feedback'

export const STAGES: Array<{ id: Stage; label: string; shortLabel: string; route: string }> = [
  { id: 'brief', label: 'Giới thiệu hồ sơ', shortLabel: 'Hồ sơ', route: 'brief' },
  { id: 'investigation', label: 'Khám phá tài liệu', shortLabel: 'Khám phá', route: 'investigation' },
  { id: 'evidence', label: 'Bảng chứng cứ', shortLabel: 'Chứng cứ', route: 'evidence' },
  { id: 'hypotheses', label: 'Giả thuyết', shortLabel: 'Giả thuyết', route: 'hypotheses' },
  { id: 'analysis', label: 'Phân tích pháp lý', shortLabel: 'Phân tích', route: 'analysis' },
  { id: 'submission', label: 'Kết luận và nộp bài', shortLabel: 'Kết luận', route: 'submission' },
  { id: 'feedback', label: 'Phản hồi', shortLabel: 'Phản hồi', route: 'feedback' },
]

export type ID = string

export interface DateInterval {
  start_date: string | null
  end_date: string | null
  precision: 'day' | 'month' | 'year' | 'range' | 'unknown'
  source_ids: string[]
}

export interface ContentRecord {
  id: string
  [key: string]: unknown
}

export type DiscoveryRule =
  | { kind: 'always' }
  | { kind: 'viewed'; evidence_ids: string[]; mode?: 'all' | 'any' }
  | { kind: 'check'; label: string; requires_viewed: string[] }
  | { kind: 'unavailable' }

export interface EvidenceRecord extends ContentRecord {
  type?: string
  title?: string
  summary?: string
  content?: string
  source?: { origin?: string; integrity_notes?: string[] }
  procedural_defect_ids?: string[]
  limitation_ids?: string[]
  issue_ids?: string[]
  discovery?: DiscoveryRule
}

export interface ProceduralDefect extends ContentRecord {
  evidence_id?: string
  step?: string
  observed_issue?: string
  legal_basis_ids?: string[]
  review_status?: string
  possible_effect_codes?: string[]
}

export interface EvidenceLimitation extends ContentRecord {
  evidence_id?: string
  description?: string
}

export interface Hypothesis extends ContentRecord {
  label?: string
  description?: string
  missing_information?: string[]
}

export interface Issue extends ContentRecord {
  label?: string
  description?: string
  evidence_ids?: string[]
  answer_field_ids?: string[]
  critical?: boolean
}

export interface Hint extends ContentRecord {
  level: 1 | 2 | 3
  text: string
  order?: number
  issue_id?: string | null
  rubric_id?: string | null
}

export interface GlossaryEntry extends ContentRecord {
  term: string
  definition: string
  legal_basis_ids?: string[]
}

export interface Explanation extends ContentRecord {
  title?: string
  body?: string
  legal_basis_ids?: string[]
}

export interface Character {
  id: string
  display_name: string
  roles: string[]
  birth_date_interval: DateInterval
  notes?: string
}

export interface LawProvision {
  id: string
  citation: string
  effective_from: string | null
  effective_to: string | null
  source_ref: string
  review_status: 'not_reviewed' | 'in_review' | 'approved' | 'review_required'
}

export interface LawBundle {
  id: string
  version: string
  jurisdiction: string
  provisions: LawProvision[]
}

export interface LawResolutionSegment {
  start_date: string | null
  end_date: string | null
  bundle_id: string
  provision_ids?: string[]
  review_id?: string | null
}

export interface LawResolution {
  status: 'resolved' | 'crosses_version' | 'unresolved'
  bundle_id: string | null
  review_id: string | null
  segments?: LawResolutionSegment[]
}

export interface ConductEvent {
  id: string
  date_interval: DateInterval
  law_resolution: LawResolution
}

export interface Fact extends ContentRecord {
  text?: string
  source_ids?: string[]
}

export interface EvidenceLink {
  evidence_id: string
  relation: 'supports' | 'challenges' | 'contradicts' | 'context' | 'contextual'
  limitation_ids?: string[]
  reasoning?: string
  weight?: number
}

export interface ProofRow extends ContentRecord {
  proposition: string
  charge_element_ids: string[]
  evidence_links: EvidenceLink[]
  status?: 'established' | 'partially_established' | 'not_established' | 'disputed'
}

export interface Charge {
  id: string
  display_label?: string
  person_id: string
  conduct_event_ids: string[]
  legal_basis_ids: string[]
  charge_element_ids: string[]
  [key: string]: unknown
}

export type ElementType =
  | 'protected_interest'
  | 'conduct'
  | 'result'
  | 'causation'
  | 'subject'
  | 'mental_state'
  | 'circumstance'
  | 'other'

export interface ChargeElement {
  id: string
  charge_id: string
  label?: string
  legal_test?: string
  element_type: ElementType
  required: boolean
  fact_ids?: string[]
  evidence_ids?: string[]
  legal_basis_ids: string[]
  [key: string]: unknown
}

export interface ChargeComparison extends ContentRecord {
  candidate_charge_ids?: string[]
  distinguishing_element_ids?: string[]
  explanation_id?: string
}

export interface AgeCondition {
  min_age_years: number
  max_age_years: number
  applies_to_charge_ids: string[]
  effect_code: string
  legal_basis_ids: string[]
  review_id: string
}

export interface AgeRule {
  id: string
  candidate_charge_ids: string[]
  conduct_event_ids: string[]
  law_bundle_ids: string[]
  legal_basis_ids: string[]
  conditions: AgeCondition[]
  review_status: 'not_reviewed' | 'in_review' | 'approved'
}

export interface Circumstance {
  id: string
  label?: string
  category: 'aggravating' | 'mitigating' | 'other'
  person_id: string
  conduct_event_ids: string[]
  legal_basis_ids: string[]
  fact_ids?: string[]
  review_status: 'not_reviewed' | 'in_review' | 'approved'
  [key: string]: unknown
}

export interface Conclusion extends ContentRecord {
  type: 'charge_supported' | 'not_supported' | 'insufficient_information' | 'alternative_hypothesis_remains'
  charge_id: string | null
  person_id: string
  conduct_event_ids: string[]
  label?: string
}

export type AnswerScope =
  | 'case'
  | 'evidence'
  | 'hypothesis'
  | 'proof_row'
  | 'charge_element'
  | 'person_conduct'
  | 'circumstance'
  | 'conclusion'

export interface AnswerOption {
  id: string
  label: string
}

export interface AnswerField {
  id: string
  scope: AnswerScope
  target_ids: string[]
  value_type: 'single_choice' | 'multi_select'
  options: AnswerOption[]
}

export interface ExpectedResponse {
  id: string
  path_ids: string[]
  field_id: string
  target_id: string
  accepted_values: string[]
  weight: number
  criterion_id: string
  learning_outcome_ids: string[]
  explanation_id: string
}

export type IdAtom = {
  op: 'equals' | 'not_equals' | 'contains' | 'not_contains'
  field_id: string
  target_id: string
  value: string
}

export type EmptyAtom = {
  op: 'is_empty' | 'is_not_empty'
  field_id: string
  target_id: string
}

export type GroupExpr = { op: 'all' | 'any'; args: Expr[] }

export type Expr = GroupExpr | IdAtom | EmptyAtom

export interface AnswerPath {
  id: string
  label?: string
  description?: string
  match: Expr
  conclusion_ids: string[]
  charge_ids: string[]
  mode?: 'exclusive' | 'priority' | 'multi_match'
  priority?: number
}

export interface ConsistencyRule {
  id: string
  scope: { person_id: string; conduct_event_id: string }
  when: Expr
  assert: Expr
  severity: 'blocking' | 'major' | 'minor'
  message: string
}

export interface Criterion {
  id: string
  learning_outcome_ids: string[]
  answer_field_ids: string[]
  label: string
}

export interface PathSelection {
  mode: 'priority' | 'exclusive'
  order?: string[]
}

export interface Scoring {
  max_total_points?: 100
  path_weights: Array<{ path_id: string; criterion_points: Record<string, number> }>
  partial_credit: {
    method: 'weighted_expectation_ratio'
    rounding: 'nearest_integer'
    weight_scope?: 'within_criterion'
  }
}

export interface Review {
  status: 'not_reviewed' | 'in_review' | 'approved' | 'review_required'
  review_ids: string[]
}

export interface CaseMetadata {
  id: string
  version: string
  title: string
  status: 'draft' | 'review' | 'approved' | 'published' | 'review_required' | 'retired'
  jurisdiction: string
  law_bundle_ids: string[]
  learning_outcome_ids: string[]
  legal_time_anchor: 'conduct_date' | 'case_defined' | 'reviewer_defined'
  legal_time_anchor_reason: string
}

export interface CaseFile {
  schema_version: '2.0.0' | '2.1.0'
  metadata: CaseMetadata
  brief: {
    narrative: string
    task_prompt: string
    player_role: string
  }
  law_bundles: LawBundle[]
  temporal_context: { conduct_events: ConductEvent[] }
  characters: Character[]
  facts: Fact[]
  evidence: EvidenceRecord[]
  procedural_defects: ProceduralDefect[]
  evidence_limitations: EvidenceLimitation[]
  hypotheses: Hypothesis[]
  proof_matrix: ProofRow[]
  candidate_charges: Charge[]
  charge_elements: ChargeElement[]
  charge_comparisons: ChargeComparison[]
  age_rules: AgeRule[]
  circumstances: Circumstance[]
  conclusions: Conclusion[]
  answer_fields: AnswerField[]
  expected_responses: ExpectedResponse[]
  answer_paths: AnswerPath[]
  consistency_rules: ConsistencyRule[]
  criteria: Criterion[]
  scoring: Scoring
  path_selection?: PathSelection
  review: Review
  explanations: Explanation[]
  references: { legal_basis_ids: string[] }
  issues?: Issue[]
  critical_issue_ids?: string[]
  hints?: Hint[]
  glossary?: GlossaryEntry[]
  learning_outcomes?: Array<{ id: string; description: string; label?: string }>
}

export interface LearningOutcome {
  id: string
  label: string
  description: string
}

export interface OutcomeCatalog {
  version: string
  note?: string
  outcomes: LearningOutcome[]
}

export interface CaseManifestEntry {
  id: string
  version: string
  title: string
  subtitle: string
  summary: string
  difficulty: string
  durationMinutes: [number, number]
  status: string
  review: string
  playable: boolean
  publishable: boolean
  lawBundleIds: string[]
  learningOutcomeIds: string[]
  notice?: string
}

export interface Manifest {
  app: {
    name: string
    version: string
    schemaVersion: string
    sessionSchemaVersion: number
    platform: string
  }
  cases: CaseManifestEntry[]
}

export type AnswerValue = string | string[]
export type Answers = Record<string, Record<string, AnswerValue>>

export interface ConsistencyResult {
  ruleId: string
  status: 'pass' | 'fail' | 'skip'
  severity: 'blocking' | 'major' | 'minor'
  message: string
  scope: { person_id: string; conduct_event_id: string }
}

export interface ExpectationResult {
  expectationId: string
  criterionId: string
  fieldId: string
  targetId: string
  weight: number
  met: boolean
  accepted: string[]
  actual: string[]
  explanationId: string
  learningOutcomeIds: string[]
}

export interface CriterionResult {
  criterionId: string
  label: string
  earned: number
  max: number
  expectations: ExpectationResult[]
}

export interface DiagnosticCriterionResult {
  criterionId: string
  label: string
  metWeight: number
  totalWeight: number
}

export interface ScoreResult {
  pathId: string | null
  pathLabel: string | null
  total: number | null
  roundOnce: boolean
  criteria: CriterionResult[]
  diagnostics: DiagnosticCriterionResult[]
  consistency: ConsistencyResult[]
  blocking: boolean
  unmatched: boolean
  scoredAt: string
}

export interface LintIssue {
  severity: 'error' | 'warning' | 'info'
  code: string
  message: string
  /** Vị trí dữ liệu để reviewer đối chiếu, ví dụ "expected_responses[3].field_id". */
  path?: string
}

export interface GameSession {
  sessionId: string
  caseId: string
  caseVersion: string
  lawBundleId: string
  currentStage: Stage
  viewedEvidenceIds: string[]
  requestedCheckIds: string[]
  answers: Answers
  notes: Record<string, string>
  selectedHints: string[]
  submittedAt?: string
  score?: ScoreResult
  status: 'in_progress' | 'submitted'
  updatedAt: string
}
