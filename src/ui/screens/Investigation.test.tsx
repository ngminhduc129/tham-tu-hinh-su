import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithGameContext } from '../../test/test-utils'
import { InvestigationScreen } from './Investigation'
import { fixtureCase } from '../../domain/test-helpers'

describe('InvestigationScreen', () => {
  it('Hiển thị danh sách tài liệu và nút chuyển sang Bảng chứng cứ', () => {
    const navigate = vi.fn()
    const caseFile = fixtureCase()
    renderWithGameContext(<InvestigationScreen />, { navigate, caseFile })

    // Tiêu đề & nút sang bảng chứng cứ
    expect(screen.getByText('Khu khám phá tài liệu')).toBeDefined()
    const nextBtn = screen.getByRole('button', { name: /Sang bảng chứng cứ/i })
    fireEvent.click(nextBtn)
    expect(navigate).toHaveBeenCalledWith(`case/${caseFile.metadata.id}/evidence`)
  })

  it('Cho phép mở xem tài liệu khả dụng hoặc yêu cầu kiểm tra', () => {
    const dispatch = vi.fn()
    const caseFile = fixtureCase()
    // Session ban đầu chưa xem tài liệu nào
    renderWithGameContext(<InvestigationScreen />, {
      dispatch,
      caseFile,
      session: {
        sessionId: 'test-session',
        caseId: caseFile.metadata.id,
        caseVersion: caseFile.metadata.version,
        lawBundleId: 'law_bundle_v1',
        currentStage: 'investigation',
        status: 'in_progress',
        viewedEvidenceIds: [],
        requestedCheckIds: [],
        answers: {},
        notes: {},
        selectedHints: [],
        updatedAt: new Date().toISOString(),
      },
    })

    // Tìm nút Đọc tài liệu
    const openBtns = screen.getAllByRole('button', { name: /Đọc tài liệu/i })
    expect(openBtns.length).toBeGreaterThan(0)

    fireEvent.click(openBtns[0])
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'VIEW_EVIDENCE',
      }),
    )
  })

  it('Vô hiệu hóa các nút khám phá khi phiên ở trạng thái readOnly', () => {
    const dispatch = vi.fn()
    const caseFile = fixtureCase()
    renderWithGameContext(<InvestigationScreen />, {
      dispatch,
      caseFile,
      readOnly: true,
      session: {
        sessionId: 'test-session',
        caseId: caseFile.metadata.id,
        caseVersion: caseFile.metadata.version,
        lawBundleId: 'law_bundle_v1',
        currentStage: 'investigation',
        status: 'submitted',
        viewedEvidenceIds: [],
        requestedCheckIds: [],
        answers: {},
        notes: {},
        selectedHints: [],
        updatedAt: new Date().toISOString(),
      },
    })

    const openBtns = screen.queryAllByRole('button', { name: /Đọc tài liệu/i })
    for (const btn of openBtns) {
      expect(btn.hasAttribute('disabled')).toBe(true)
    }
  })
})
