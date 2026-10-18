import { describe, expect, it } from 'vitest'
import { DEFAULT_FILTERS, applyFilters, hasActiveFilters, sortBuses } from '../utils/filters'

const buses = [
  { trip_id: 'A', is_ac: true, seat_type: 'sleeper', fare: 2426, departure_at: '2026-08-09T16:00:00' },
  { trip_id: 'B', is_ac: false, seat_type: 'sleeper', fare: 589, departure_at: '2026-08-09T23:03:00' },
  { trip_id: 'C', is_ac: false, seat_type: 'seater', fare: 693, departure_at: '2026-08-09T09:15:00' },
]

const ids = (list) => list.map((bus) => bus.trip_id)

describe('applyFilters', () => {
  it('keeps every bus with the default filters', () => {
    expect(ids(applyFilters(buses, DEFAULT_FILTERS))).toEqual(['A', 'B', 'C'])
  })

  it('filters by AC and Non-AC', () => {
    expect(ids(applyFilters(buses, { ac: 'ac', seatType: 'all' }))).toEqual(['A'])
    expect(ids(applyFilters(buses, { ac: 'non-ac', seatType: 'all' }))).toEqual(['B', 'C'])
  })

  it('filters by seat type', () => {
    expect(ids(applyFilters(buses, { ac: 'all', seatType: 'seater' }))).toEqual(['C'])
    expect(ids(applyFilters(buses, { ac: 'all', seatType: 'sleeper' }))).toEqual(['A', 'B'])
  })

  it('combines filters', () => {
    expect(ids(applyFilters(buses, { ac: 'non-ac', seatType: 'sleeper' }))).toEqual(['B'])
  })
})

describe('sortBuses', () => {
  it('sorts by price, cheapest first', () => {
    expect(ids(sortBuses(buses, 'price'))).toEqual(['B', 'C', 'A'])
  })

  it('sorts by real departure time, earliest first', () => {
    expect(ids(sortBuses(buses, 'departure'))).toEqual(['C', 'A', 'B'])
  })

  it('leaves the original list untouched', () => {
    sortBuses(buses, 'price')
    expect(ids(buses)).toEqual(['A', 'B', 'C'])
  })
})

describe('hasActiveFilters', () => {
  it('is false for the defaults and true once a filter is set', () => {
    expect(hasActiveFilters(DEFAULT_FILTERS)).toBe(false)
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, seatType: 'seater' })).toBe(true)
  })
})
