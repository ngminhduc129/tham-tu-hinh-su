import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithGameContext } from '../../test/test-utils'
import { EvidenceBoardScreen } from './EvidenceBoard'
import { fixtureCase } from '../../domain/test-helpers'

describe('EvidenceBoardScreen', () => {
  it('Hiển thị tiêu đề, thanh lọc theo vấn đề và nút quay lại tóm tắt hồ sơ', () => {
    const navigate = vi.fn()
    const caseFile = fixtureCase()
    renderWithGameContext(<EvidenceBoardScreen />, { navigate, caseFile })

    expect(screen.getByText('Khám phá hồ sơ & Đánh giá chứng cứ')).toBeDefined()
    const backBtns = screen.getAllByRole('button', { name: /Tóm tắt hồ sơ/i })
    expect(backBtns.length).toBeGreaterThan(0)
    fireEvent.click(backBtns[0])
    expect(navigate).toHaveBeenCalledWith(`case/${caseFile.metadata.id}/brief`)
  })

  it('Cho phép lọc theo vấn đề (issue filter chips)', () => {
    const caseFile = fixtureCase()
    renderWithGameContext(<EvidenceBoardScreen />, { caseFile })

    const allFilterBtn = screen.getByRole('button', { name: 'Tất cả' })
    expect(allFilterBtn).toBeDefined()

    // Bấm chip lọc nếu có
    const chips = screen.getAllByRole('button', { name: /Tất cả|Vấn đề|mất/i })
    expect(chips.length).toBeGreaterThan(0)
    fireEvent.click(chips[0])
  })

  it('Cho phép chọn đáp án đánh giá 4 lớp chứng cứ', () => {
    const dispatch = vi.fn()
    const caseFile = fixtureCase()
    // Session đã mở chứng cứ ev_record_01
    renderWithGameContext(<EvidenceBoardScreen />, {
      dispatch,
      caseFile,
      session: {
        sessionId: 'test-session',
        caseId: caseFile.metadata.id,
        caseVersion: caseFile.metadata.version,
        lawBundleId: 'law_bundle_v1',
        currentStage: 'evidence',
        status: 'in_progress',
        viewedEvidenceIds: ['ev_record_01', 'ev_statement_01'],
        requestedCheckIds: [],
        answers: {},
        notes: {},
        selectedHints: [],
        updatedAt: new Date().toISOString(),
      },
    })

    // Tìm radio options trong phần đánh giá
    const options = screen.getAllByRole('radio')
    expect(options.length).toBeGreaterThan(0)

    // Bấm chọn một option
    fireEvent.click(options[0])
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'SET_ANSWER',
      }),
    )
  })
})
