import { describe, expect, it } from 'vitest'
import {
  daysBetween,
  formatDate,
  formatDuration,
  formatFare,
  formatLongDate,
  formatSeatType,
  formatTime,
} from '../utils/format'

describe('format helpers', () => {
  it('formats local ISO times as 12-hour clock times', () => {
    expect(formatTime('2026-08-09T16:04:00')).toBe('4:04 PM')
    expect(formatTime('2026-08-10T13:30:00')).toBe('1:30 PM')
    expect(formatTime('2026-08-09T12:00:00')).toBe('12:00 PM')
    expect(formatTime('2026-08-09T00:15:00')).toBe('12:15 AM')
  })

  it('formats durations', () => {
    expect(formatDuration(1140)).toBe('19h 00m')
    expect(formatDuration(65)).toBe('1h 05m')
  })

  it('formats fares in rupees with Indian digit grouping', () => {
    expect(formatFare(2426)).toBe('₹2,426')
    expect(formatFare(100000)).toBe('₹1,00,000')
  })

  it('formats dates without shifting them across timezones', () => {
    expect(formatDate('2026-08-10T11:00:00')).toBe('Mon, 10 Aug')
    expect(formatLongDate('2026-08-09')).toBe('Sun, 9 Aug, 2026')
  })

  it('counts calendar days between departure and arrival', () => {
    expect(daysBetween('2026-08-09T16:00:00', '2026-08-10T11:00:00')).toBe(1)
    expect(daysBetween('2026-08-09T06:00:00', '2026-08-09T11:00:00')).toBe(0)
  })

  it('labels seat types', () => {
    expect(formatSeatType('sleeper')).toBe('Sleeper')
    expect(formatSeatType('unknown')).toBe('Seat type n/a')
  })
})
