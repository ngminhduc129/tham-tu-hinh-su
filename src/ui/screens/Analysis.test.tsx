import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithGameContext } from '../../test/test-utils'
import { AnalysisScreen } from './Analysis'
import { fixtureCase } from '../../domain/test-helpers'

describe('AnalysisScreen', () => {
  it('Hiển thị các dấu hiệu cấu thành và cho phép đánh giá', () => {
    const dispatch = vi.fn()
    const caseFile = fixtureCase()
    renderWithGameContext(<AnalysisScreen />, { dispatch, caseFile })

    expect(screen.getByText('Ánh xạ dữ kiện vào từng dấu hiệu')).toBeDefined()

    // Tìm radio options đánh giá dấu hiệu
    const radios = screen.getAllByRole('radio')
    expect(radios.length).toBeGreaterThan(0)

    fireEvent.click(radios[0])
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'SET_ANSWER',
      }),
    )
  })

  it('Có các nút điều hướng chuyển tới Kết luận và quay lại Giả thuyết', () => {
    const navigate = vi.fn()
    const caseFile = fixtureCase()
    renderWithGameContext(<AnalysisScreen />, { navigate, caseFile })

    const backBtn = screen.getByRole('button', { name: /Quay lại giả thuyết/i })
    fireEvent.click(backBtn)
    expect(navigate).toHaveBeenCalledWith(`case/${caseFile.metadata.id}/hypotheses`)

    const nextBtn = screen.getByRole('button', { name: /Đi tới kết luận/i })
    fireEvent.click(nextBtn)
    expect(navigate).toHaveBeenCalledWith(`case/${caseFile.metadata.id}/submission`)
  })
})

