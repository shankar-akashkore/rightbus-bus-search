// Times are read straight from the API's local ISO strings, with no timezone conversion,
// so a bus leaving Bangalore at 4 PM shows 4:00 PM wherever the user is.

export function formatFare(amount, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const SEAT_LABELS = { sleeper: 'Sleeper', seater: 'Seater', 'semi-sleeper': 'Semi-sleeper' }

export function formatSeatType(seatType) {
  return SEAT_LABELS[seatType] ?? 'Seat type n/a'
}

export function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return `${hours}h ${String(rest).padStart(2, '0')}m`
}

export function formatTime(isoDateTime) {
  const [hours, minutes] = isoDateTime.slice(11, 16).split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${period}`
}

const shortDate = new Intl.DateTimeFormat('en-IN', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
})
const longDate = new Intl.DateTimeFormat('en-IN', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

const toUtcDate = (iso) => new Date(`${iso.slice(0, 10)}T00:00:00Z`)

export function formatDate(iso) {
  return shortDate.format(toUtcDate(iso))
}

export function formatLongDate(iso) {
  return longDate.format(toUtcDate(iso))
}

// Calendar days (not 24-hour periods), for the "+1" next-day marker.
export function daysBetween(fromIso, toIso) {
  return Math.round((toUtcDate(toIso) - toUtcDate(fromIso)) / 86_400_000)
}
