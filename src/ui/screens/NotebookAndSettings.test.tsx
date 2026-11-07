import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithGameContext } from '../../test/test-utils'
import { NotebookScreen } from './Notebook'
import { SettingsScreen } from './Settings'
import { fixtureCase } from '../../domain/test-helpers'

describe('NotebookScreen & SettingsScreen', () => {
  it('NotebookScreen hỗ trợ tìm kiếm và nút quay lại', () => {
    const navigate = vi.fn()
    const caseFile = fixtureCase()
    renderWithGameContext(<NotebookScreen />, { navigate, caseFile })

    expect(screen.getByText('Sổ tay thuật ngữ và nguồn pháp lý')).toBeDefined()

    // Ô tìm kiếm
    const searchInput = screen.getByPlaceholderText(/Ví dụ: nguồn, giới hạn, dấu hiệu/i)
    fireEvent.change(searchInput, { target: { value: 'chứng cứ' } })
    expect(searchInput.getAttribute('value')).toBe('chứng cứ')

    // Nút quay lại
    const backBtn = screen.getByRole('button', { name: /Về giới thiệu/i })
    fireEvent.click(backBtn)
    expect(navigate).toHaveBeenCalledWith(`case/${caseFile.metadata.id}/brief`)
  })

  it('SettingsScreen hiển thị các nút xuất dữ liệu và xóa dữ liệu', () => {
    const navigate = vi.fn()
    const caseFile = fixtureCase()
    renderWithGameContext(<SettingsScreen />, { navigate, caseFile })

    expect(screen.getByText('Quản lý phiên chơi trên thiết bị')).toBeDefined()

    // Nút xuất bản sao lưu
    const exportBtn = screen.getByRole('button', { name: /Xuất phiên chơi/i })
    expect(exportBtn).toBeDefined()

    // Nút xóa phiên của case này
    const resetCaseBtn = screen.getByRole('button', { name: /Làm lại case hiện tại/i })
    fireEvent.click(resetCaseBtn)

    // Modal xác nhận xuất hiện
    expect(screen.getByText('Làm lại case hiện tại?')).toBeDefined()
  })

  it('SettingsScreen có nút quay lại trang chủ', () => {
    const navigate = vi.fn()
    const caseFile = fixtureCase()
    renderWithGameContext(<SettingsScreen />, { navigate, caseFile })

    const returnBtn = screen.getByRole('button', { name: /Về trang chủ/i })
    fireEvent.click(returnBtn)
    expect(navigate).toHaveBeenCalledWith('')
  })
})
