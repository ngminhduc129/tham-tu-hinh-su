import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import schema from '../../schemas/case.schema.json'
import type { CaseFile } from './types'

const ajv = new Ajv2020({ allErrors: true, strict: true })
addFormats(ajv)
const validate = ajv.compile(schema)

export type SchemaValidationResult =
  | { ok: true; caseFile: CaseFile }
  | { ok: false; errors: string[] }

export function validateCaseSchema(data: unknown): SchemaValidationResult {
  if (validate(data)) {
    return { ok: true, caseFile: data as unknown as CaseFile }
  }
  const errors = (validate.errors ?? []).map((error) => {
    const path = error.instancePath || '(gốc)'
    return `${path}: ${error.message ?? 'không hợp lệ'}`
  })
  return { ok: false, errors }
}
