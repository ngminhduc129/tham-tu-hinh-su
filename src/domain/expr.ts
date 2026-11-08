import type { Answers, AnswerField, Expr, IdAtom, EmptyAtom } from './types'
import { getValues } from './answers'

/** Đánh giá biểu thức DSL trên registry câu trả lời đã khai báo. */
export function evalExpr(expr: Expr, answers: Answers): boolean {
  switch (expr.op) {
    case 'all':
      return expr.args.every((arg) => evalExpr(arg, answers))
    case 'any':
      return expr.args.some((arg) => evalExpr(arg, answers))
    case 'equals': {
      const values = getValues(answers, expr.field_id, expr.target_id)
      return values.length === 1 && values[0] === expr.value
    }
    case 'not_equals': {
      const values = getValues(answers, expr.field_id, expr.target_id)
      return !(values.length === 1 && values[0] === expr.value)
    }
    case 'contains':
      return getValues(answers, expr.field_id, expr.target_id).includes(expr.value)
    case 'not_contains':
      return !getValues(answers, expr.field_id, expr.target_id).includes(expr.value)
    case 'is_empty':
      return getValues(answers, expr.field_id, expr.target_id).length === 0
    case 'is_not_empty':
      return getValues(answers, expr.field_id, expr.target_id).length > 0
    default:
      return false
  }
}

export function flattenAtoms(expr: Expr): Array<IdAtom | EmptyAtom> {
  if ('args' in expr) {
    return expr.args.flatMap(flattenAtoms)
  }
  return [expr]
}

export interface ExprReference {
  fieldId: string
  targetId: string
  value?: string
}

export function exprReferences(expr: Expr): ExprReference[] {
  return flattenAtoms(expr).map((atom) => ({
    fieldId: atom.field_id,
    targetId: atom.target_id,
    ...('value' in atom ? { value: atom.value } : {}),
  }))
}

export function validateExpr(expr: Expr, fields: Map<string, AnswerField>): string[] {
  const errors: string[] = []
  if ('args' in expr) {
    if (expr.args.length === 0) errors.push('Biểu thức all/any không được rỗng.')
    for (const arg of expr.args) errors.push(...validateExpr(arg, fields))
    return errors
  }
  const atom = expr
  const field = fields.get(atom.field_id)
  if (!field) {
    errors.push(`Trường câu trả lời "${atom.field_id}" không tồn tại.`)
    return errors
  }
  if (!field.target_ids.includes(atom.target_id)) {
    errors.push(`Đối tượng "${atom.target_id}" không thuộc trường "${field.id}".`)
  }
  if ('value' in atom) {
    if (!field.options.some((option) => option.id === atom.value)) {
      errors.push(`Giá trị "${atom.value}" không có trong các lựa chọn của trường "${field.id}".`)
    }
    if (field.value_type === 'multi_select' && (atom.op === 'equals' || atom.op === 'not_equals')) {
      errors.push(`Không dùng ${atom.op} cho trường multi_select "${field.id}"; hãy dùng contains/not_contains.`)
    }
  }
  return errors
}
