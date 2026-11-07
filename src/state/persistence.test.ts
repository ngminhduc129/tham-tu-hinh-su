import { describe, expect, it } from 'vitest'
import { createSession } from '../state/reducer'
import {
  BACKUP_PREFIX,
  SESSION_SCHEMA_VERSION,
  clearAllSessions,
  clearSession,
  exportSessionPayload,
  loadSession,
  parseSessionImport,
  saveSession,
  sessionKey,
  type StorageLike,
} from '../state/persistence'
import { setValue } from '../domain/answers'
import { fixtureCase } from '../domain/test-helpers'

class MemoryStorage implements StorageLike {
  private readonly map = new Map<string, string>()

  getItem(key: string): string | null {
    return this.map.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value)
  }

  removeItem(key: string): void {
    this.map.delete(key)
  }

  get length(): number {
    return this.map.size
  }

  key(index: number): string | null {
    return [...this.map.keys()][index] ?? null
  }

  keys(): string[] {
    return [...this.map.keys()]
  }
}

function sessionWithAnswer() {
  const caseFile = fixtureCase()
  const session = createSession(caseFile)
  session.answers = setValue(
    session.answers,
    'source_assessment',
    'ev_record_01',
    'source_supported',
  )
  session.viewedEvidenceIds = ['ev_record_01']
  session.notes = { 'evidence:ev_record_01': 'ghi chú cục bộ' }
  return { caseFile, session }
}

describe('lưu và tải phiên chơi', () => {
  it('lưu rồi tải lại đúng dữ liệu', () => {
    const storage = new MemoryStorage()
    const { caseFile, session } = sessionWithAnswer()

    saveSession(storage, session, '0.1.0')
    const result = loadSession(storage, caseFile.metadata.id, caseFile.metadata.version)

    expect(result.status).toBe('ok')
    if (result.status !== 'ok') return
    expect(result.stored.session.answers.source_assessment.ev_record_01).toBe('source_supported')
    expect(result.stored.session.notes['evidence:ev_record_01']).toBe('ghi chú cục bộ')
    expect(result.stored.sessionSchemaVersion).toBe(SESSION_SCHEMA_VERSION)
  })

  it('giữ bản lưu lỗi và tạo bản sao thay vì ghi đè', () => {
    const storage = new MemoryStorage()
    const { caseFile } = sessionWithAnswer()
    storage.setItem(sessionKey(caseFile.metadata.id), '{not json')

    const result = loadSession(storage, caseFile.metadata.id, caseFile.metadata.version)

    expect(result.status).toBe('invalid')
    if (result.status !== 'invalid') return
    expect(result.raw).toBe('{not json')
    expect(result.backupKey).not.toBeNull()
    expect(storage.getItem(sessionKey(caseFile.metadata.id))).toBe('{not json')
    expect(storage.keys().some((key) => key.startsWith(BACKUP_PREFIX))).toBe(true)
  })

  it('từ chối bản lưu sai schema phiên chơi', () => {
    const storage = new MemoryStorage()
    const { caseFile, session } = sessionWithAnswer()
    storage.setItem(
      sessionKey(caseFile.metadata.id),
      JSON.stringify({
        sessionSchemaVersion: SESSION_SCHEMA_VERSION + 1,
        appVersion: '0.1.0',
        caseVersion: session.caseVersion,
        savedAt: new Date().toISOString(),
        session,
      }),
    )

    const result = loadSession(storage, caseFile.metadata.id, caseFile.metadata.version)
    expect(result.status).toBe('invalid')
    if (result.status !== 'invalid') return
    expect(result.reason).toContain('schema')
    expect(result.backupKey).not.toBeNull()
  })

  it('từ chối bản lưu của case phiên bản khác', () => {
    const storage = new MemoryStorage()
    const { caseFile, session } = sessionWithAnswer()
    saveSession(storage, session, '0.1.0')

    const result = loadSession(storage, caseFile.metadata.id, '9.9.9')
    expect(result.status).toBe('invalid')
    if (result.status !== 'invalid') return
    expect(result.reason).toContain('phiên bản')
  })

  it('bỏ qua khi chưa có bản lưu', () => {
    const storage = new MemoryStorage()
    const { caseFile } = sessionWithAnswer()
    expect(loadSession(storage, caseFile.metadata.id, caseFile.metadata.version).status).toBe('none')
  })
})

describe('xuất/nhập JSON', () => {
  it('round-trip đúng case và caseVersion', () => {
    const storage = new MemoryStorage()
    const { caseFile, session } = sessionWithAnswer()
    const stored = saveSession(storage, session, '0.1.0')

    const result = parseSessionImport(
      exportSessionPayload(stored),
      caseFile.metadata.id,
      caseFile.metadata.version,
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.stored.session.sessionId).toBe(session.sessionId)
    expect(result.stored.session.caseVersion).toBe(caseFile.metadata.version)
  })

  it('từ chối tệp sai case hoặc sai schema', () => {
    const storage = new MemoryStorage()
    const { caseFile, session } = sessionWithAnswer()
    const raw = exportSessionPayload(saveSession(storage, session, '0.1.0'))

    expect(parseSessionImport(raw, 'case_999', caseFile.metadata.version).ok).toBe(false)

    const parsed = JSON.parse(raw) as Record<string, unknown>
    parsed.sessionSchemaVersion = 99
    expect(parseSessionImport(JSON.stringify(parsed), caseFile.metadata.id, caseFile.metadata.version).ok).toBe(
      false,
    )
  })

  it('từ chối JSON lỗi', () => {
    expect(parseSessionImport('{oops', 'case_001', '0.2.0').ok).toBe(false)
  })
})

describe('xóa dữ liệu cục bộ', () => {
  it('xóa một phiên và xóa mọi phiên + bản sao', () => {
    const storage = new MemoryStorage()
    const { caseFile, session } = sessionWithAnswer()
    saveSession(storage, session, '0.1.0')
    storage.setItem(`${BACKUP_PREFIX}${caseFile.metadata.id}.1`, '{}')
    storage.setItem('unrelated-key', 'keep')

    clearSession(storage, caseFile.metadata.id)
    expect(storage.getItem(sessionKey(caseFile.metadata.id))).toBeNull()
    expect(storage.getItem('unrelated-key')).toBe('keep')

    saveSession(storage, session, '0.1.0')
    storage.setItem(`${BACKUP_PREFIX}${caseFile.metadata.id}.2`, '{}')
    const removed = clearAllSessions(storage)
    expect(removed).toBeGreaterThanOrEqual(2)
    expect(storage.getItem('unrelated-key')).toBe('keep')
  })
})
