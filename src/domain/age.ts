import type { DateInterval } from './types'

export interface AgeRange {
  kind: 'range'
  min: number
  max: number
  approximate: boolean
}

export interface UnknownAge {
  kind: 'unknown'
  reason: string
}

export type AgeResult = AgeRange | UnknownAge

export function parseIsoDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }
  return date
}

/** Tuổi tròn năm tại một ngày, tính theo ngày kỷ niệm sinh nhật. */
export function ageInYears(birth: Date, at: Date): number {
  let age = at.getUTCFullYear() - birth.getUTCFullYear()
  const beforeBirthday =
    at.getUTCMonth() < birth.getUTCMonth() ||
    (at.getUTCMonth() === birth.getUTCMonth() && at.getUTCDate() < birth.getUTCDate())
  if (beforeBirthday) age -= 1
  return age
}

/**
 * Tính khoảng tuổi từ hai khoảng ngày đã ghi nguồn.
 * Không suy ra một tuổi duy nhất khi đầu vào là khoảng.
 */
export function computeAgeRange(birth: DateInterval, conduct: DateInterval): AgeResult {
  const birthStart = parseIsoDate(birth.start_date)
  const birthEnd = parseIsoDate(birth.end_date)
  const conductStart = parseIsoDate(conduct.start_date)
  const conductEnd = parseIsoDate(conduct.end_date)

  if (!birthStart || !birthEnd) {
    return { kind: 'unknown', reason: 'Thiếu ngày sinh chính xác hoặc chưa xác định khoảng ngày sinh.' }
  }
  if (!conductStart || !conductEnd) {
    return { kind: 'unknown', reason: 'Thiếu ngày hành vi chính xác hoặc chưa xác định khoảng ngày hành vi.' }
  }
  if (birth.precision === 'unknown' || conduct.precision === 'unknown') {
    return { kind: 'unknown', reason: 'Độ chính xác của ngày sinh hoặc ngày hành vi chưa được xác định.' }
  }
  if (birthStart.getTime() > birthEnd.getTime()) {
    return { kind: 'unknown', reason: 'Khoảng ngày sinh không hợp lệ (bắt đầu sau kết thúc).' }
  }
  if (conductStart.getTime() > conductEnd.getTime()) {
    return { kind: 'unknown', reason: 'Khoảng ngày hành vi không hợp lệ (bắt đầu sau kết thúc).' }
  }

  // Tuổi nhỏ nhất: sinh muộn nhất, hành vi sớm nhất.
  const min = ageInYears(birthEnd, conductStart)
  // Tuổi lớn nhất: sinh sớm nhất, hành vi muộn nhất.
  const max = ageInYears(birthStart, conductEnd)

  return {
    kind: 'range',
    min: Math.max(0, Math.min(min, max)),
    max: Math.max(min, max),
    approximate: birth.precision !== 'day' || conduct.precision !== 'day',
  }
}

export function formatAgeRange(result: AgeResult): string {
  if (result.kind === 'unknown') return 'Chưa xác định'
  if (result.min === result.max) {
    return `${result.min} tuổi${result.approximate ? ' (khoảng)' : ''}`
  }
  return `${result.min}–${result.max} tuổi${result.approximate ? ' (khoảng)' : ''}`
}
