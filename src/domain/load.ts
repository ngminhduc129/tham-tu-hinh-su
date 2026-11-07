import rawCase from '../content/cases/case_001.json'
import lawBundle from '../content/laws/law_bundle_v1.json'
import manifestJson from '../content/manifest.json'
import outcomesJson from '../content/learning-outcomes.json'
import type {
  CaseFile,
  CaseManifestEntry,
  LawBundle,
  Manifest,
  OutcomeCatalog,
} from './types'
import { validateCaseSchema } from './validate'

export const manifest = manifestJson as unknown as Manifest
export const outcomeCatalog = outcomesJson as unknown as OutcomeCatalog

const LAW_BUNDLES: Record<string, LawBundle> = {
  [lawBundle.id]: lawBundle as unknown as LawBundle,
}

const RAW_CASES: Record<string, unknown> = {
  case_001: rawCase,
}

export type CaseLoadResult =
  | { ok: true; caseFile: CaseFile }
  | { ok: false; errors: string[] }

export function getCaseEntry(caseId: string): CaseManifestEntry | undefined {
  return manifest.cases.find((entry) => entry.id === caseId)
}

export function getAllCaseEntries(): CaseManifestEntry[] {
  return manifest.cases.slice()
}

/**
 * Ghép case với các law bundle tách riêng, sau đó validate toàn bộ tài liệu.
 * Case trên đĩa chỉ khai báo metadata.law_bundle_ids; luật là nguồn duy nhất
 * trong src/content/laws để tránh trùng lặp giữa nhiều case.
 */
export function loadCase(caseId: string): CaseLoadResult {
  const entry = getCaseEntry(caseId)
  if (!entry) {
    return { ok: false, errors: [`Không tìm thấy case "${caseId}" trong manifest.`] }
  }
  const raw = RAW_CASES[caseId]
  if (!raw) {
    return { ok: false, errors: [`Không tìm thấy tệp nội dung cho case "${caseId}".`] }
  }

  const rawRecord = raw as { metadata?: { law_bundle_ids?: string[] } }
  const bundleIds = rawRecord.metadata?.law_bundle_ids ?? []
  const bundles: LawBundle[] = []
  const errors: string[] = []
  for (const bundleId of bundleIds) {
    const bundle = LAW_BUNDLES[bundleId]
    if (!bundle) {
      errors.push(`Không tìm thấy law bundle "${bundleId}" trong thư viện luật.`)
    } else {
      bundles.push(bundle)
    }
  }

  const composed = { ...(raw as Record<string, unknown>), law_bundles: bundles }
  const result = validateCaseSchema(composed)
  if (!result.ok) {
    return { ok: false, errors: [...errors, ...result.errors] }
  }

  if (result.caseFile.metadata.id !== entry.id) {
    errors.push(
      `metadata.id "${result.caseFile.metadata.id}" không khớp manifest "${entry.id}".`,
    )
  }
  if (result.caseFile.metadata.version !== entry.version) {
    errors.push(
      `metadata.version "${result.caseFile.metadata.version}" không khớp manifest "${entry.version}".`,
    )
  }
  if (errors.length > 0) {
    return { ok: false, errors }
  }

  return { ok: true, caseFile: result.caseFile }
}
