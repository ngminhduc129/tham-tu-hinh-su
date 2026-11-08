import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { App } from '../App'
import { fixtureCase } from '../domain/test-helpers'
import { renderWithGameContext } from '../test/test-utils'
import { Stepper } from './components'

describe('Navigation, Header & Stepper', () => {
  it('Stepper hiển thị đầy đủ các giai đoạn và cho phép điều hướng', () => {
    const navigate = vi.fn()
    const caseFile = fixtureCase()
    renderWithGameContext(<Stepper />, { navigate, caseFile })

    // Kiểm tra các nhãn giai đoạn có mặt
    expect(screen.getByText('Hồ sơ')).toBeDefined()
    expect(screen.getByText('Chứng cứ')).toBeDefined()
    expect(screen.getByText('Giả thuyết')).toBeDefined()
    expect(screen.getByText('Phân tích')).toBeDefined()
    expect(screen.getByText('Kết luận')).toBeDefined()

    // Bấm nút chuyển sang giai đoạn Chứng cứ
    fireEvent.click(screen.getByText('Chứng cứ'))
    expect(navigate).toHaveBeenCalledWith(`case/${caseFile.metadata.id}/evidence`)

    // Bấm nút chuyển sang giai đoạn Phân tích
    fireEvent.click(screen.getByText('Phân tích'))
    expect(navigate).toHaveBeenCalledWith(`case/${caseFile.metadata.id}/analysis`)
  })

  it('Stepper vô hiệu hóa hoặc chặn chuyển sang Feedback nếu chưa nộp bài', () => {
    const navigate = vi.fn()
    const caseFile = fixtureCase()
    renderWithGameContext(<Stepper />, {
      navigate,
      caseFile,
      session: {
        ...fixtureCase() as any,
        sessionId: 'test-session',
        caseId: 'case_001',
        caseVersion: '0.2.0',
        lawBundleId: 'law_bundle_v1',
        currentStage: 'brief',
        status: 'in_progress',
        viewedEvidenceIds: [],
        requestedCheckIds: [],
        answers: {},
        notes: {},
        selectedHints: [],
        updatedAt: new Date().toISOString(),
      },
    })

    const feedbackBtn = screen.getByRole('button', { name: /^Phản hồi$/i })
    // Nút phản hồi bị disabled khi chưa nộp bài
    expect(feedbackBtn.hasAttribute('disabled')).toBe(true)
    fireEvent.click(feedbackBtn)
    expect(navigate).not.toHaveBeenCalled()
  })

  it('App render Header với đầy đủ các nút Sổ tay, Cài đặt và Logo', () => {
    window.location.hash = '#/case/case_001/brief'
    render(<App />)

    // Kiểm tra brand logo
    const brandBtn = screen.getByRole('button', { name: /Thám tử Hình sự — về trang chủ/i })
    expect(brandBtn).toBeDefined()

    // Kiểm tra nút Sổ tay
    const notebookBtn = screen.getByRole('button', { name: /Sổ tay/i })
    expect(notebookBtn).toBeDefined()

    // Kiểm tra nút Cài đặt
    const settingsBtn = screen.getByRole('button', { name: /Cài đặt/i })
    expect(settingsBtn).toBeDefined()

    // Click Sổ tay chuyển hash route
    fireEvent.click(notebookBtn)
    expect(window.location.hash).toContain('notebook')
  })
})
