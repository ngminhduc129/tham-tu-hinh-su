import type { Answers, AnswerPath, CaseFile, ConsistencyResult, ConsistencyRule } from './types'
import { evalExpr } from './expr'

export function evaluateRule(rule: ConsistencyRule, answers: Answers): ConsistencyResult {
  const whenHolds = evalExpr(rule.when, answers)
  if (!whenHolds) {
    return {
      ruleId: rule.id,
      status: 'skip',
      severity: rule.severity,
      message: rule.message,
      scope: rule.scope,
    }
  }
  const passes = evalExpr(rule.assert, answers)
  return {
    ruleId: rule.id,
    status: passes ? 'pass' : 'fail',
    severity: rule.severity,
    message: rule.message,
    scope: rule.scope,
  }
}

export function evaluateConsistency(caseFile: CaseFile, answers: Answers): ConsistencyResult[] {
  return caseFile.consistency_rules.map((rule) => evaluateRule(rule, answers))
}

export function blockingFailures(results: ConsistencyResult[]): ConsistencyResult[] {
  return results.filter((result) => result.status === 'fail' && result.severity === 'blocking')
}

export function matchAnswerPath(caseFile: CaseFile, answers: Answers): AnswerPath | null {
  const selection = caseFile.path_selection
  let candidates = caseFile.answer_paths
  if (selection?.order && selection.order.length > 0) {
    // `order` do Semantic Validator bảo đảm là hoán vị đầy đủ; ở runtime vẫn
    // bỏ qua ID lạ để không làm sập phiên đang chơi.
    const byId = new Map(caseFile.answer_paths.map((path) => [path.id, path]))
    candidates = selection.order
      .map((id) => byId.get(id))
      .filter((path): path is AnswerPath => Boolean(path))
  }
  for (const path of candidates) {
    if (evalExpr(path.match, answers)) return path
  }
  return null
}
