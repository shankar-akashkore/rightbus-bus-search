// Runs in the browser on the fetched results: the backend decides which buses are valid,
// the frontend only how to show them, so a filter change needs no new request.

export const DEFAULT_FILTERS = { ac: 'all', seatType: 'all' }

export const SORT_OPTIONS = [
  { value: 'departure', label: 'Earliest departure' },
  { value: 'price', label: 'Price: low to high' },
]

export function applyFilters(buses, { ac, seatType }) {
  return buses.filter((bus) => {
    if (ac === 'ac' && !bus.is_ac) return false
    if (ac === 'non-ac' && bus.is_ac) return false
    if (seatType !== 'all' && bus.seat_type !== seatType) return false
    return true
  })
}

export function sortBuses(buses, sortBy) {
  const sorted = [...buses] // copy: never reorder the API data in place
  if (sortBy === 'price') {
    sorted.sort((a, b) => a.fare - b.fare)
  } else {
    sorted.sort((a, b) => new Date(a.departure_at) - new Date(b.departure_at))
  }
  return sorted
}

export function hasActiveFilters(filters) {
  return filters.ac !== DEFAULT_FILTERS.ac || filters.seatType !== DEFAULT_FILTERS.seatType
}
