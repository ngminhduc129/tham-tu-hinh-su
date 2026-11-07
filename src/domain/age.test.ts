import { describe, expect, it } from 'vitest'
import { computeAgeRange, formatAgeRange, parseIsoDate } from './age'
import type { DateInterval } from './types'

function interval(
  start: string | null,
  end: string | null,
  precision: DateInterval['precision'] = 'day',
): DateInterval {
  return { start_date: start, end_date: end, precision, source_ids: [] }
}

describe('tính tuổi theo khoảng ngày', () => {
  it('trả một tuổi duy nhất khi cả hai ngày chính xác', () => {
    const result = computeAgeRange(interval('1998-03-15', '1998-03-15'), interval('2024-05-31', '2024-05-31'))
    expect(result.kind).toBe('range')
    if (result.kind !== 'range') return
    expect(result.min).toBe(26)
    expect(result.max).toBe(26)
    expect(result.approximate).toBe(false)
    expect(formatAgeRange(result)).toBe('26 tuổi')
  })

  it('trả khoảng tuổi khi ngày hành vi là một khoảng cắt qua sinh nhật', () => {
    const result = computeAgeRange(interval('1998-03-15', '1998-03-15'), interval('2024-03-01', '2024-05-31'))
    expect(result.kind).toBe('range')
    if (result.kind !== 'range') return
    expect(result.min).toBe(25)
    expect(result.max).toBe(26)
    expect(formatAgeRange(result)).toBe('25–26 tuổi')
  })

  it('đánh dấu approximate khi ngày sinh chỉ biết theo tháng/năm', () => {
    const result = computeAgeRange(interval('1998-01-01', '1998-12-31', 'year'), interval('2024-05-31', '2024-05-31'))
    expect(result.kind).toBe('range')
    if (result.kind !== 'range') return
    expect(result.min).toBe(25)
    expect(result.max).toBe(26)
    expect(result.approximate).toBe(true)
  })

  it('trả unknown khi thiếu ngày hoặc precision unknown, không tự chọn một tuổi', () => {
    expect(computeAgeRange(interval(null, null, 'unknown'), interval('2024-05-31', '2024-05-31')).kind).toBe(
      'unknown',
    )
    expect(
      computeAgeRange(interval('1998-03-15', '1998-03-15'), interval(null, null, 'unknown')).kind,
    ).toBe('unknown')
    expect(
      computeAgeRange(interval('1998-03-15', '1998-03-15', 'unknown'), interval('2024-05-31', '2024-05-31'))
        .kind,
    ).toBe('unknown')
  })

  it('trả unknown khi khoảng ngày không hợp lệ', () => {
    expect(
      computeAgeRange(interval('1998-12-31', '1998-01-01'), interval('2024-05-31', '2024-05-31')).kind,
    ).toBe('unknown')
    expect(
      computeAgeRange(interval('1998-03-15', '1998-03-15'), interval('2024-05-31', '2024-01-01')).kind,
    ).toBe('unknown')
  })

  it('không chấp nhận ngày không tồn tại', () => {
    expect(parseIsoDate('2024-02-30')).toBeNull()
    expect(parseIsoDate('2024-02-29')).not.toBeNull()
    expect(parseIsoDate('31/05/2024')).toBeNull()
  })
})
