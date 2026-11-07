import type { Answers, AnswerValue } from './types'

export function normalizeValues(value: AnswerValue | undefined | null): string[] {
  if (value === undefined || value === null) return []
  if (Array.isArray(value)) return [...new Set(value.filter((v): v is string => typeof v === 'string'))]
  if (value === '') return []
  return [value]
}

export function getValues(answers: Answers, fieldId: string, targetId: string): string[] {
  return normalizeValues(answers[fieldId]?.[targetId])
}

export function getSingle(answers: Answers, fieldId: string, targetId: string): string | null {
  const values = getValues(answers, fieldId, targetId)
  return values.length > 0 ? values[0] : null
}

export function hasAnswer(answers: Answers, fieldId: string, targetId: string): boolean {
  return getValues(answers, fieldId, targetId).length > 0
}

export function setValue(
  answers: Answers,
  fieldId: string,
  targetId: string,
  value: string | string[] | null,
): Answers {
  const next: Answers = { ...answers }
  const fieldAnswers = { ...(next[fieldId] ?? {}) }
  if (value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
    delete fieldAnswers[targetId]
  } else {
    fieldAnswers[targetId] = Array.isArray(value) ? [...new Set(value)] : value
  }
  if (Object.keys(fieldAnswers).length === 0) {
    delete next[fieldId]
  } else {
    next[fieldId] = fieldAnswers
  }
  return next
}

export function isAnswerValueEqual(actual: string[], accepted: string[]): boolean {
  const a = [...new Set(actual)].sort()
  const b = [...new Set(accepted)].sort()
  if (a.length !== b.length) return false
  return a.every((value, index) => value === b[index])
}
