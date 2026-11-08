import { describe, expect, it } from 'vitest'
import { getCaseEntry, loadCase, manifest, outcomeCatalog } from './load'
import { validateCaseSchema } from './validate'

describe('tải case và schema', () => {
  it('ghép law bundle tách rời vào case trước khi validate', () => {
    const loaded = loadCase('case_001')
    expect(loaded.ok).toBe(true)
    if (!loaded.ok) return

    expect(loaded.caseFile.metadata.id).toBe('case_001')
    expect(loaded.caseFile.law_bundles).toHaveLength(1)
    expect(loaded.caseFile.law_bundles[0].id).toBe('law_bundle_v1')
    expect(loaded.caseFile.schema_version).toBe('2.0.0')
  })

  it('manifest khớp metadata và chặn publish case nháp', () => {
    const loaded = loadCase('case_001')
    expect(loaded.ok).toBe(true)
    if (!loaded.ok) return

    const entry = getCaseEntry('case_001')
    expect(entry).toBeDefined()
    expect(entry?.version).toBe(loaded.caseFile.metadata.version)
    expect(entry?.status).toBe('draft')
    expect(entry?.publishable).toBe(false)
    expect(entry?.playable).toBe(true)
    expect(manifest.cases).toHaveLength(1)
  })

  it('validate schema chấp nhận case đã ghép và từ chối dữ liệu thiếu trường', () => {
    const loaded = loadCase('case_001')
    expect(loaded.ok).toBe(true)
    if (!loaded.ok) return

    expect(validateCaseSchema(loaded.caseFile).ok).toBe(true)

    const invalid = validateCaseSchema({ schema_version: '2.0.0' })
    expect(invalid.ok).toBe(false)
    if (invalid.ok) return
    expect(invalid.errors.length).toBeGreaterThan(0)
  })

  it('từ chối thuộc tính lạ ở cấp gốc do schema đóng', () => {
    const loaded = loadCase('case_001')
    expect(loaded.ok).toBe(true)
    if (!loaded.ok) return

    const result = validateCaseSchema({
      ...loaded.caseFile,
      unexpected_property: 'không được phép',
    })
    expect(result.ok).toBe(false)
  })

  it('trả lỗi rõ ràng khi case không tồn tại trong manifest', () => {
    const result = loadCase('case_khong_ton_tai')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors[0]).toContain('danh mục')
  })

  it('catalog learning outcome đủ cho mọi outcome case công bố', () => {
    const loaded = loadCase('case_001')
    expect(loaded.ok).toBe(true)
    if (!loaded.ok) return

    const catalogIds = new Set(outcomeCatalog.outcomes.map((outcome) => outcome.id))
    for (const outcomeId of loaded.caseFile.metadata.learning_outcome_ids) {
      expect(catalogIds.has(outcomeId)).toBe(true)
    }
  })

  it('Schema 2.1.0 backward compatibility: hợp lệ với cả 2.0.0 và 2.1.0', () => {
    const loaded = loadCase('case_001')
    expect(loaded.ok).toBe(true)
    if (!loaded.ok) return

    // Kiểm tra hợp lệ với 2.0.0 hiện tại
    expect(validateCaseSchema(loaded.caseFile).ok).toBe(true)

    // Kiểm tra hợp lệ với 2.1.0 cùng cấu trúc nâng cấp
    const upgraded = {
      ...loaded.caseFile,
      schema_version: '2.1.0',
      learning_outcomes: [{ id: 'lo_extra_01', description: 'Mô tả outcome' }],
      temporal_context: {
        conduct_events: [
          {
            ...loaded.caseFile.temporal_context.conduct_events[0],
            law_resolution: {
              status: 'crosses_version',
              bundle_id: null,
              review_id: 'rev_01',
              segments: [
                { start_date: '2024-01-01', end_date: '2024-06-30', bundle_id: 'law_bundle_v1' },
              ],
            },
          },
        ],
      },
      proof_matrix: [
        {
          id: 'proof_row_01',
          proposition: 'Mệnh đề kiểm tra',
          charge_element_ids: ['element_a_01'],
          evidence_links: [
            {
              evidence_id: 'ev_record_01',
              relation: 'supports',
              reasoning: 'Lý do chứng minh',
              weight: 1,
            },
          ],
          status: 'established',
        },
      ],
    }
    const res = validateCaseSchema(upgraded)
    expect(res.ok).toBe(true)
  })

  it('Schema từ chối relation không hợp lệ trong evidence_links của proof_row', () => {
    const loaded = loadCase('case_001')
    expect(loaded.ok).toBe(true)
    if (!loaded.ok) return

    const invalid = {
      ...loaded.caseFile,
      proof_matrix: [
        {
          id: 'proof_row_01',
          proposition: 'Mệnh đề kiểm tra',
          charge_element_ids: ['element_a_01'],
          evidence_links: [
            {
              evidence_id: 'ev_record_01',
              relation: 'invalid_rel_type',
            },
          ],
        },
      ],
    }
    const res = validateCaseSchema(invalid)
    expect(res.ok).toBe(false)
  })
})
