import { describe, expect, it } from 'vitest'
import { loadCase } from './load'
import { validateCaseSchema } from './validate'
import type { CaseFile } from './types'

function loadedCase(): CaseFile {
  const loaded = loadCase('case_001')
  if (!loaded.ok) throw new Error(loaded.errors.join('; '))
  // loadCase trả tham chiếu tới JSON đã import; clone để test mutation không rò rỉ.
  return JSON.parse(JSON.stringify(loaded.caseFile)) as CaseFile
}

function upgradedCase(): Record<string, unknown> {
  const base = loadedCase()
  const event = base.temporal_context.conduct_events[0]
  return {
    ...base,
    schema_version: '2.1.0',
    scoring: {
      ...base.scoring,
      max_total_points: 100,
      partial_credit: {
        ...base.scoring.partial_credit,
        weight_scope: 'within_criterion',
      },
    },
    path_selection: {
      mode: 'priority',
      order: base.answer_paths.map((path) => path.id),
    },
    learning_outcomes: [
      { id: 'lo_local_01', description: 'Outcome cục bộ dùng cho kiểm thử.' },
    ],
    temporal_context: {
      conduct_events: [
        {
          ...event,
          law_resolution: {
            status: 'crosses_version',
            bundle_id: null,
            review_id: 'review_cross_01',
            segments: [
              {
                start_date: '2024-05-01',
                end_date: '2024-05-31',
                bundle_id: 'law_bundle_v1',
                provision_ids: ['provision_placeholder_01'],
                review_id: 'review_segment_01',
              },
              {
                start_date: '2024-06-01',
                end_date: '2024-06-30',
                bundle_id: 'law_bundle_v1',
              },
            ],
          },
        },
      ],
    },
    proof_matrix: [
      {
        ...base.proof_matrix[0],
        status: 'disputed',
        evidence_links: [
          {
            evidence_id: 'ev_record_01',
            relation: 'contradicts',
            limitation_ids: ['limit_01'],
            strength: 'strong',
            weight: 1,
            reasoning: 'Kiểm thử cấu trúc evidence_link.',
          },
        ],
      },
    ],
  }
}

describe('JSON Schema 2.1.0 — backward compatibility và invalid corpus', () => {
  it('chấp nhận case 2.0.0 hiện có mà không cần thêm trường mới', () => {
    expect(validateCaseSchema(loadedCase()).ok).toBe(true)
  })

  it('chấp nhận case 2.1.0 dùng đầy đủ trường mới', () => {
    const result = validateCaseSchema(upgradedCase())
    expect(result.ok, result.ok ? '' : result.errors.join('; ')).toBe(true)
  })

  it.each([
    {
      name: 'schema_version không được hỗ trợ',
      mutate: (data: Record<string, unknown>) => {
        data.schema_version = '3.0.0'
      },
    },
    {
      name: 'max_total_points khác 100',
      mutate: (data: Record<string, unknown>) => {
        ;(data.scoring as { max_total_points: number }).max_total_points = 90
      },
    },
    {
      name: 'weight_scope không hợp lệ',
      mutate: (data: Record<string, unknown>) => {
        ;(
          (data.scoring as { partial_credit: { weight_scope: string } }).partial_credit
        ).weight_scope = 'global'
      },
    },
    {
      name: 'evidence_link relation không hợp lệ',
      mutate: (data: Record<string, unknown>) => {
        ;((data.proof_matrix as Array<{ evidence_links: Array<{ relation: string }> }>)[0]
          .evidence_links[0]).relation = 'unknown'
      },
    },
    {
      name: 'evidence_link thiếu relation',
      mutate: (data: Record<string, unknown>) => {
        delete (
          (data.proof_matrix as Array<{ evidence_links: Array<Record<string, unknown>> }>)[0]
            .evidence_links[0] as Record<string, unknown>
        ).relation
      },
    },
    {
      name: 'evidence_link có thuộc tính lạ',
      mutate: (data: Record<string, unknown>) => {
        ;(
          (data.proof_matrix as Array<{ evidence_links: Array<Record<string, unknown>> }>)[0]
            .evidence_links[0] as Record<string, unknown>
        ).unexpected = true
      },
    },
    {
      name: 'proof_row có thuộc tính lạ',
      mutate: (data: Record<string, unknown>) => {
        ;((data.proof_matrix as Array<Record<string, unknown>>)[0]).unexpected = true
      },
    },
    {
      name: 'proof_row.status không hợp lệ',
      mutate: (data: Record<string, unknown>) => {
        ;((data.proof_matrix as Array<{ status: string }>)[0]).status = 'confirmed'
      },
    },
    {
      name: 'law_segment thiếu bundle_id',
      mutate: (data: Record<string, unknown>) => {
        const event = (data.temporal_context as {
          conduct_events: Array<{
            law_resolution: { segments: Array<Record<string, unknown>> }
          }>
        }).conduct_events[0]
        delete event.law_resolution.segments[0].bundle_id
      },
    },
    {
      name: 'law_resolution thiếu bundle_id bắt buộc',
      mutate: (data: Record<string, unknown>) => {
        const event = (data.temporal_context as {
          conduct_events: Array<{ law_resolution: Record<string, unknown> }>
        }).conduct_events[0]
        delete event.law_resolution.bundle_id
      },
    },
    {
      name: 'path_selection.mode không hợp lệ',
      mutate: (data: Record<string, unknown>) => {
        ;(data.path_selection as { mode: string }).mode = 'random'
      },
    },
    {
      name: 'learning_outcomes thiếu description',
      mutate: (data: Record<string, unknown>) => {
        delete (data.learning_outcomes as Array<Record<string, unknown>>)[0].description
      },
    },
    {
      name: 'expected_response.weight không dương',
      mutate: (data: Record<string, unknown>) => {
        ;((data.expected_responses as Array<{ weight: number }>)[0]).weight = 0
      },
    },
    {
      name: 'expr.op không hợp lệ',
      mutate: (data: Record<string, unknown>) => {
        ;((data.answer_paths as Array<{ match: { op: string } }>)[0].match).op = 'xor'
      },
    },
  ])('từ chối: $name', ({ mutate }) => {
    const data = upgradedCase()
    mutate(data)
    const result = validateCaseSchema(data)
    expect(result.ok).toBe(false)
  })
})
