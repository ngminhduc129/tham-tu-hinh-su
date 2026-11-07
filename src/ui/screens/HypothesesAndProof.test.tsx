import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithGameContext } from '../../test/test-utils'
import { HypothesesScreen } from './Hypotheses'
import { ProofMatrixScreen } from './ProofMatrix'
import { fixtureCase } from '../../domain/test-helpers'

describe('HypothesesScreen & ProofMatrixScreen', () => {
  it('HypothesesScreen cho phép toggle chọn chứng cứ ủng hộ và phản bác', () => {
    const dispatch = vi.fn()
    const caseFile = fixtureCase()
    renderWithGameContext(<HypothesesScreen />, { dispatch, caseFile })

    expect(screen.getByText('Hai giả thuyết cạnh tranh')).toBeDefined()

    // Tìm các checkbox chứng cứ ủng hộ/phản bác
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes.length).toBeGreaterThan(0)

    // Bấm toggle checkbox đầu tiên
    fireEvent.click(checkboxes[0])
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'TOGGLE_MULTI',
      }),
    )
  })

  it('HypothesesScreen có nút chuyển tiếp sang Ma trận chứng minh và Phân tích pháp lý', () => {
    const navigate = vi.fn()
    const caseFile = fixtureCase()
    renderWithGameContext(<HypothesesScreen />, { navigate, caseFile })

    const proofBtn = screen.getByRole('button', { name: /^Ma trận chứng minh$/i })
    fireEvent.click(proofBtn)
    expect(navigate).toHaveBeenCalledWith(`case/${caseFile.metadata.id}/proof`)

    const analysisBtn = screen.getByRole('button', { name: /^Sang phân tích pháp lý$/i })
    fireEvent.click(analysisBtn)
    expect(navigate).toHaveBeenCalledWith(`case/${caseFile.metadata.id}/analysis`)
  })

  it('ProofMatrixScreen hiển thị bảng mệnh đề và cho phép đánh giá', () => {
    const dispatch = vi.fn()
    const caseFile = fixtureCase()
    renderWithGameContext(<ProofMatrixScreen />, { dispatch, caseFile })

    expect(screen.getByText('Đối chiếu mệnh đề với từng nguồn')).toBeDefined()

    // Kiểm tra các radio options đánh giá mệnh đề
    const radios = screen.getAllByRole('radio')
    expect(radios.length).toBeGreaterThan(0)

    fireEvent.click(radios[0])
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'SET_ANSWER',
      }),
    )
  })

  it('ProofMatrixScreen có nút chuyển tiếp sang Phân tích pháp lý', () => {
    const navigate = vi.fn()
    const caseFile = fixtureCase()
    renderWithGameContext(<ProofMatrixScreen />, { navigate, caseFile })

    const nextBtn = screen.getByRole('button', { name: /Sang phân tích pháp lý/i })
    fireEvent.click(nextBtn)
    expect(navigate).toHaveBeenCalledWith(`case/${caseFile.metadata.id}/analysis`)
  })
})
