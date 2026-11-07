import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithGameContext } from '../../test/test-utils'
import { SubmissionScreen } from './Submission'
import { fixtureCase } from '../../domain/test-helpers'

describe('SubmissionScreen', () => {
  it('Hiển thị form chọn tội danh, kết luận, nút quay lại và nút nộp bài', () => {
    const navigate = vi.fn()
    const caseFile = fixtureCase()
    renderWithGameContext(<SubmissionScreen />, { navigate, caseFile })

    expect(screen.getByText('Chọn kết luận và căn cứ')).toBeDefined()
    expect(screen.getByRole('button', { name: /^Nộp bài$/i })).toBeDefined()

    const backBtn = screen.getByRole('button', { name: /Quay lại phân tích/i })
    fireEvent.click(backBtn)
    expect(navigate).toHaveBeenCalledWith(`case/${caseFile.metadata.id}/analysis`)
  })

  it('Cho phép nộp bài và mở modal xác nhận nộp', () => {
    const dispatch = vi.fn()
    const navigate = vi.fn()
    const caseFile = fixtureCase()
    renderWithGameContext(<SubmissionScreen />, { dispatch, navigate, caseFile })

    // Bấm nút mở modal nộp bài
    const submitBtn = screen.getByRole('button', { name: /^Nộp bài$/i })
    fireEvent.click(submitBtn)

    // Modal xuất hiện
    expect(screen.getByText('Nộp bài và chấm điểm?')).toBeDefined()
    const submitBtns = screen.getAllByRole('button', { name: /Nộp và xem chẩn đoán|Nộp bài/i })
    expect(submitBtns.length).toBeGreaterThan(1)

    // Bấm nút nộp bài trong modal (phần tử thứ 2)
    fireEvent.click(submitBtns[1])
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'SUBMIT',
      }),
    )
    expect(navigate).toHaveBeenCalledWith(`case/${caseFile.metadata.id}/feedback`)
  })

  it('Khi đã nộp bài: hiển thị tóm tắt, nút xem phản hồi, làm lại từ đầu và mở lại', () => {
    const dispatch = vi.fn()
    const navigate = vi.fn()
    const caseFile = fixtureCase()
    renderWithGameContext(<SubmissionScreen />, {
      dispatch,
      navigate,
      caseFile,
      readOnly: true,
      session: {
        sessionId: 'test-session',
        caseId: caseFile.metadata.id,
        caseVersion: caseFile.metadata.version,
        lawBundleId: 'law_bundle_v1',
        currentStage: 'submission',
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

    expect(screen.getByText('Bạn đã nộp bài')).toBeDefined()

    // Nút xem phản hồi chi tiết
    const viewFeedbackBtn = screen.getByRole('button', { name: /Xem phản hồi chi tiết/i })
    fireEvent.click(viewFeedbackBtn)
    expect(navigate).toHaveBeenCalledWith(`case/${caseFile.metadata.id}/feedback`)

    // Nút mở lại để sửa câu trả lời
    const reopenBtn = screen.getByRole('button', { name: /Mở lại để sửa câu trả lời/i })
    fireEvent.click(reopenBtn)
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'REOPEN',
      }),
    )

    // Nút làm lại từ đầu (reset)
    const resetBtn = screen.getByRole('button', { name: /Làm lại từ đầu/i })
    fireEvent.click(resetBtn)
    expect(screen.getByText('Làm lại từ đầu?')).toBeDefined()

    const confirmResetBtn = screen.getByRole('button', { name: /Xóa câu trả lời và làm lại/i })
    fireEvent.click(confirmResetBtn)
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'RESET',
      }),
    )
    expect(navigate).toHaveBeenCalledWith(`case/${caseFile.metadata.id}/brief`)
  })
})
