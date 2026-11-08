import { loadCase } from './load'
import { setValue } from './answers'
import type { Answers, CaseFile, GameSession } from './types'
import { createSession } from '../state/reducer'

export function fixtureCase(): CaseFile {
  const loaded = loadCase('case_001')
  if (!loaded.ok) {
    throw new Error(`Không tải được hồ sơ mẫu: ${loaded.errors.join('; ')}`)
  }
  return loaded.caseFile
}

export function cloneCase(caseFile: CaseFile): CaseFile {
  return JSON.parse(JSON.stringify(caseFile)) as CaseFile
}

/**
 * Trả lời đúng toàn bộ expectation của một path đã cấu hình.
 * Dùng để kiểm tra nhánh đạt điểm đầy đủ và các phép so khớp.
 */
export function answersForPath(caseFile: CaseFile, pathId: string): Answers {
  const fieldTypes = new Map(
    caseFile.answer_fields.map((field) => [field.id, field.value_type] as const),
  )
  let answers: Answers = {}
  for (const expectation of caseFile.expected_responses) {
    if (!expectation.path_ids.includes(pathId)) continue
    const valueType = fieldTypes.get(expectation.field_id) ?? 'single_choice'
    const value =
      valueType === 'single_choice'
        ? expectation.accepted_values[0]
        : expectation.accepted_values
    answers = setValue(answers, expectation.field_id, expectation.target_id, value)
  }
  return answers
}

export function fixtureSession(): GameSession {
  return createSession(fixtureCase())
}
