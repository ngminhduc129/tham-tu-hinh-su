import type {
  Answers,
  CaseFile,
  CriterionResult,
  DiagnosticCriterionResult,
  ExpectationResult,
  ScoreResult,
} from './types'
import { getValues, isAnswerValueEqual } from './answers'
import { blockingFailures, evaluateConsistency, matchAnswerPath } from './matching'

interface DiagnosticGroup {
  criterionId: string
  fieldId: string
  targetId: string
  weight: number
  acceptedSets: string[][]
}

function buildDiagnostics(caseFile: CaseFile, answers: Answers): DiagnosticCriterionResult[] {
  const groups = new Map<string, DiagnosticGroup>()
  for (const expectation of caseFile.expected_responses) {
    const key = `${expectation.criterion_id}|${expectation.field_id}|${expectation.target_id}`
    const existing = groups.get(key)
    if (existing) {
      existing.weight = Math.max(existing.weight, expectation.weight)
      existing.acceptedSets.push(expectation.accepted_values)
    } else {
      groups.set(key, {
        criterionId: expectation.criterion_id,
        fieldId: expectation.field_id,
        targetId: expectation.target_id,
        weight: expectation.weight,
        acceptedSets: [expectation.accepted_values],
      })
    }
  }

  return caseFile.criteria
    .map((criterion) => {
      const relevant = [...groups.values()].filter(
        (group) => group.criterionId === criterion.id,
      )
      let metWeight = 0
      let totalWeight = 0
      for (const group of relevant) {
        totalWeight += group.weight
        const actual = getValues(answers, group.fieldId, group.targetId)
        if (group.acceptedSets.some((accepted) => isAnswerValueEqual(actual, accepted))) {
          metWeight += group.weight
        }
      }
      return {
        criterionId: criterion.id,
        label: criterion.label,
        metWeight,
        totalWeight,
      }
    })
    .filter((item) => item.totalWeight > 0)
}

/**
 * Chấm theo path đã khớp. Nếu không khớp path nào, không tạo điểm cuối;
 * chỉ trả điểm thành phần tham khảo để phản hồi, tránh gán điểm kết luận tùy tiện.
 */
export function scoreSubmission(
  caseFile: CaseFile,
  answers: Answers,
  now: string = new Date().toISOString(),
): ScoreResult {
  const consistency = evaluateConsistency(caseFile, answers)
  const blocking = blockingFailures(consistency)

  if (blocking.length > 0) {
    return {
      pathId: null,
      pathLabel: null,
      total: null,
      roundOnce: true,
      criteria: [],
      diagnostics: [],
      consistency,
      blocking: true,
      unmatched: false,
      scoredAt: now,
    }
  }

  const path = matchAnswerPath(caseFile, answers)
  if (!path) {
    return {
      pathId: null,
      pathLabel: null,
      total: null,
      roundOnce: true,
      criteria: [],
      diagnostics: buildDiagnostics(caseFile, answers),
      consistency,
      blocking: false,
      unmatched: true,
      scoredAt: now,
    }
  }

  const pathWeights = caseFile.scoring.path_weights.find((entry) => entry.path_id === path.id)
  const criteria: CriterionResult[] = []

  for (const criterion of caseFile.criteria) {
    const max = pathWeights?.criterion_points[criterion.id] ?? 0
    if (max <= 0) continue

    const applicable = caseFile.expected_responses.filter(
      (expectation) =>
        expectation.criterion_id === criterion.id && expectation.path_ids.includes(path.id),
    )
    if (applicable.length === 0) continue

    const expectations: ExpectationResult[] = applicable.map((expectation) => {
      const actual = getValues(answers, expectation.field_id, expectation.target_id)
      return {
        expectationId: expectation.id,
        criterionId: expectation.criterion_id,
        fieldId: expectation.field_id,
        targetId: expectation.target_id,
        weight: expectation.weight,
        met: isAnswerValueEqual(actual, expectation.accepted_values),
        accepted: expectation.accepted_values,
        actual,
        explanationId: expectation.explanation_id,
        learningOutcomeIds: expectation.learning_outcome_ids,
      }
    })

    const totalWeight = expectations.reduce((sum, item) => sum + item.weight, 0)
    const metWeight = expectations.reduce(
      (sum, item) => sum + (item.met ? item.weight : 0),
      0,
    )
    const earned = totalWeight > 0 ? (max * metWeight) / totalWeight : 0

    criteria.push({
      criterionId: criterion.id,
      label: criterion.label,
      earned,
      max,
      expectations,
    })
  }

  const rawTotal = criteria.reduce((sum, item) => sum + item.earned, 0)
  const total = Math.max(0, Math.min(100, Math.round(rawTotal)))

  return {
    pathId: path.id,
    pathLabel: path.label ?? path.id,
    total,
    roundOnce: true,
    criteria,
    diagnostics: criteria.map((item) => ({
      criterionId: item.criterionId,
      label: item.label,
      metWeight: item.expectations
        .filter((expectation) => expectation.met)
        .reduce((sum, expectation) => sum + expectation.weight, 0),
      totalWeight: item.expectations.reduce((sum, expectation) => sum + expectation.weight, 0),
    })),
    consistency,
    blocking: false,
    unmatched: false,
    scoredAt: now,
  }
}
