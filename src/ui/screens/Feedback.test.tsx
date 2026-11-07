import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithGameContext } from '../../test/test-utils'
import { FeedbackScreen } from './Feedback'
import { fixtureCase } from '../../domain/test-helpers'

describe('FeedbackScreen', () => {
  it('Hiển thị kết quả chấm điểm khi đã khớp path hợp lệ', () => {
    const caseFile = fixtureCase()
    renderWithGameContext(<FeedbackScreen />, {
      caseFile,
      session: {
        sessionId: 'test-session',
        caseId: caseFile.metadata.id,
        caseVersion: caseFile.metadata.version,
        lawBundleId: 'law_bundle_v1',
        currentStage: 'feedback',
        status: 'submitted',
        viewedEvidenceIds: [],
        requestedCheckIds: [],
        answers: {},
        notes: {},
        selectedHints: [],
        updatedAt: new Date().toISOString(),
        score: {
          pathId: 'path_a',
          pathLabel: 'Hỗ trợ định danh A',
          total: 85,
          roundOnce: true,
          criteria: [
            {
              criterionId: 'criterion_evidence',
              label: 'Đánh giá chứng cứ',
              earned: 30,
              max: 30,
              expectations: [],
            },
          ],
          diagnostics: [],
          consistency: [],
          blocking: false,
          unmatched: false,
          scoredAt: new Date().toISOString(),
        },
      },
    })

    expect(screen.getByText('Kết quả phiên học')).toBeDefined()
    expect(screen.getByText('85')).toBeDefined()
    expect(screen.getByText('Hỗ trợ định danh A')).toBeDefined()
  })

  it('Hiển thị chẩn đoán tiêu chí khi chưa khớp path (unmatched: true)', () => {
    const caseFile = fixtureCase()
    renderWithGameContext(<FeedbackScreen />, {
      caseFile,
      session: {
        sessionId: 'test-session',
        caseId: caseFile.metadata.id,
        caseVersion: caseFile.metadata.version,
        lawBundleId: 'law_bundle_v1',
        currentStage: 'feedback',
        status: 'submitted',
        viewedEvidenceIds: [],
        requestedCheckIds: [],
        answers: {},
        notes: {},
        selectedHints: [],
        updatedAt: new Date().toISOString(),
        score: {
          pathId: null,
          pathLabel: null,
          total: null,
          roundOnce: true,
          criteria: [],
          diagnostics: [
            {
              criterionId: 'criterion_evidence',
              label: 'Đánh giá chứng cứ bốn lớp',
              metWeight: 2,
              totalWeight: 7,
            },
          ],
          consistency: [],
          blocking: false,
          unmatched: true,
          scoredAt: new Date().toISOString(),
        },
      },
    })

    expect(screen.getByText('Chẩn đoán câu trả lời')).toBeDefined()
    expect(screen.getByText('Tổ hợp câu trả lời chưa khớp đường đáp án nào')).toBeDefined()
    expect(screen.getByText('Đánh giá chứng cứ bốn lớp')).toBeDefined()
  })

  it('Hỗ trợ mở modal làm lại hoặc mở lại bài đã nộp', () => {
    const dispatch = vi.fn()
    const navigate = vi.fn()
    const caseFile = fixtureCase()
    renderWithGameContext(<FeedbackScreen />, {
      dispatch,
      navigate,
      caseFile,
      session: {
        sessionId: 'test-session',
        caseId: caseFile.metadata.id,
        caseVersion: caseFile.metadata.version,
        lawBundleId: 'law_bundle_v1',
        currentStage: 'feedback',
        status: 'submitted',
        viewedEvidenceIds: [],
        requestedCheckIds: [],
        answers: {},
        notes: {},
        selectedHints: [],
        updatedAt: new Date().toISOString(),
        score: {
          pathId: 'path_a',
          pathLabel: 'Hỗ trợ định danh A',
          total: 100,
          roundOnce: true,
          criteria: [],
          diagnostics: [],
          consistency: [],
          blocking: false,
          unmatched: false,
          scoredAt: new Date().toISOString(),
        },
      },
    })

    // Nút mở lại để sửa
    const reopenBtn = screen.getByRole('button', { name: /Mở lại để sửa/i })
    fireEvent.click(reopenBtn)

    // Modal xuất hiện
    expect(screen.getByText('Mở lại bài đã nộp?')).toBeDefined()
    const confirmReopenBtn = screen.getByRole('button', { name: /Mở lại và sửa câu trả lời/i })
    fireEvent.click(confirmReopenBtn)

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'REOPEN',
      }),
    )
    expect(navigate).toHaveBeenCalledWith(`case/${caseFile.metadata.id}/submission`)
  })
})
