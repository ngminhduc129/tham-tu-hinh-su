import type { GameSession } from '../domain/types'

export const SESSION_SCHEMA_VERSION = 1
export const SESSION_PREFIX = 'ttths.session.v1.'
export const BACKUP_PREFIX = 'ttths.backup.v1.'

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
  readonly length?: number
  key?(index: number): string | null
}

export interface StoredSession {
  sessionSchemaVersion: number
  appVersion: string
  caseVersion: string
  savedAt: string
  session: GameSession
}

export type LoadResult =
  | { status: 'none' }
  | { status: 'ok'; stored: StoredSession }
  | { status: 'invalid'; reason: string; raw: string; backupKey: string | null }

export function sessionKey(caseId: string): string {
  return `${SESSION_PREFIX}${caseId}`
}

export function saveSession(
  storage: StorageLike,
  session: GameSession,
  appVersion: string,
): StoredSession {
  const stored: StoredSession = {
    sessionSchemaVersion: SESSION_SCHEMA_VERSION,
    appVersion,
    caseVersion: session.caseVersion,
    savedAt: new Date().toISOString(),
    session,
  }
  storage.setItem(sessionKey(session.caseId), JSON.stringify(stored))
  return stored
}

function backupRaw(storage: StorageLike, caseId: string, raw: string): string | null {
  try {
    const key = `${BACKUP_PREFIX}${caseId}.${Date.now()}`
    storage.setItem(key, raw)
    return key
  } catch {
    return null
  }
}

export function loadSession(
  storage: StorageLike,
  caseId: string,
  expectedCaseVersion: string,
): LoadResult {
  const raw = storage.getItem(sessionKey(caseId))
  if (!raw) return { status: 'none' }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    const backupKey = backupRaw(storage, caseId, raw)
    return {
      status: 'invalid',
      reason: 'Bản lưu cục bộ không đọc được (tệp dữ liệu bị lỗi). Dữ liệu gốc vẫn được giữ.',
      raw,
      backupKey,
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    const backupKey = backupRaw(storage, caseId, raw)
    return {
      status: 'invalid',
      reason: 'Bản lưu cục bộ không đúng cấu trúc.',
      raw,
      backupKey,
    }
  }

  const candidate = parsed as Partial<StoredSession>
  if (candidate.sessionSchemaVersion !== SESSION_SCHEMA_VERSION) {
    const backupKey = backupRaw(storage, caseId, raw)
    return {
      status: 'invalid',
      reason:
        'Phiên bản lược đồ của bản lưu không khớp ứng dụng hiện tại. Bản cũ được giữ nguyên, không tự ghi đè.',
      raw,
      backupKey,
    }
  }

  if (!candidate.session || typeof candidate.session !== 'object') {
    const backupKey = backupRaw(storage, caseId, raw)
    return {
      status: 'invalid',
      reason: 'Bản lưu thiếu dữ liệu phiên chơi.',
      raw,
      backupKey,
    }
  }

  if (candidate.session.caseVersion !== expectedCaseVersion) {
    const backupKey = backupRaw(storage, caseId, raw)
    return {
      status: 'invalid',
      reason: `Bản lưu thuộc hồ sơ phiên bản ${candidate.session.caseVersion}, ứng dụng đang dùng ${expectedCaseVersion}. Không tự ghi đè kết quả đã nộp.`,
      raw,
      backupKey,
    }
  }

  return { status: 'ok', stored: candidate as StoredSession }
}

export function clearSession(storage: StorageLike, caseId: string): void {
  storage.removeItem(sessionKey(caseId))
}

export function clearAllSessions(storage: StorageLike): number {
  if (typeof storage.length !== 'number' || typeof storage.key !== 'function') {
    return 0
  }
  const keys: string[] = []
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index)
    if (key && (key.startsWith(SESSION_PREFIX) || key.startsWith(BACKUP_PREFIX))) {
      keys.push(key)
    }
  }
  for (const key of keys) storage.removeItem(key)
  return keys.length
}

export function exportSessionPayload(stored: StoredSession): string {
  return JSON.stringify(stored, null, 2)
}

export type ImportResult =
  | { ok: true; stored: StoredSession }
  | { ok: false; error: string }

export function parseSessionImport(
  text: string,
  expectedCaseId: string,
  expectedCaseVersion: string,
): ImportResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, error: 'Tệp không phải tệp dữ liệu hợp lệ.' }
  }
  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, error: 'Tệp không đúng cấu trúc phiên chơi.' }
  }

  const candidate = parsed as Partial<StoredSession> & { session?: GameSession }
  const session = candidate.session
  if (!session || typeof session !== 'object') {
    return { ok: false, error: 'Tệp thiếu dữ liệu phiên chơi.' }
  }
  if (candidate.sessionSchemaVersion !== SESSION_SCHEMA_VERSION) {
    return {
      ok: false,
      error: `Lược đồ phiên chơi trong tệp là ${String(candidate.sessionSchemaVersion)}, ứng dụng cần ${SESSION_SCHEMA_VERSION}.`,
    }
  }
  if (session.caseId !== expectedCaseId) {
    return {
      ok: false,
      error: `Tệp thuộc hồ sơ "${session.caseId}", không khớp hồ sơ "${expectedCaseId}".`,
    }
  }
  if (session.caseVersion !== expectedCaseVersion) {
    return {
      ok: false,
      error: `Tệp thuộc hồ sơ phiên bản ${session.caseVersion}, ứng dụng cần ${expectedCaseVersion}.`,
    }
  }
  if (!Array.isArray(session.viewedEvidenceIds) || typeof session.answers !== 'object') {
    return { ok: false, error: 'Dữ liệu phiên chơi thiếu trường bắt buộc.' }
  }

  return {
    ok: true,
    stored: {
      sessionSchemaVersion: SESSION_SCHEMA_VERSION,
      appVersion: candidate.appVersion ?? 'imported',
      caseVersion: session.caseVersion,
      savedAt: candidate.savedAt ?? new Date().toISOString(),
      session,
    },
  }
}
