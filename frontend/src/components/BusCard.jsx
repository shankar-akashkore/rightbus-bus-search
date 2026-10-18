import {
  daysBetween,
  formatDate,
  formatDuration,
  formatFare,
  formatSeatType,
  formatTime,
} from '../utils/format'

const FEW_SEATS = 5

export default function BusCard({ bus, onViewDetails }) {
  const extraDays = daysBetween(bus.departure_at, bus.arrival_at)
  const fewSeats = bus.seats_available <= FEW_SEATS
  const seatWord = bus.seats_available === 1 ? 'seat' : 'seats'

  return (
    <article
      aria-label={`${bus.operator}, departs ${formatTime(bus.departure_at)}`}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900">{bus.operator}</h3>
          <p className="text-sm text-slate-500">{bus.bus_type}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge highlight={bus.is_ac}>{bus.is_ac ? 'AC' : 'Non-AC'}</Badge>
            <Badge>{formatSeatType(bus.seat_type)}</Badge>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xl font-bold text-slate-900">{formatFare(bus.fare, bus.currency)}</p>
          <p className="text-xs text-slate-500">per seat</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <TimeBlock time={formatTime(bus.departure_at)} date={formatDate(bus.departure_at)} />
        <div className="flex flex-1 flex-col items-center text-xs text-slate-500">
          <span>{formatDuration(bus.duration_minutes)}</span>
          <span className="mt-1 h-px w-full bg-slate-300" aria-hidden="true" />
        </div>
        <TimeBlock
          time={formatTime(bus.arrival_at)}
          date={formatDate(bus.arrival_at)}
          extraDays={extraDays}
          alignRight
        />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <p className={fewSeats ? 'text-sm font-medium text-amber-700' : 'text-sm text-slate-600'}>
          {fewSeats
            ? `Only ${bus.seats_available} ${seatWord} left`
            : `${bus.seats_available} ${seatWord} left`}
        </p>
        <button
          type="button"
          onClick={() => onViewDetails(bus)}
          className="rounded-lg border border-brand-600 px-3 py-1.5 text-sm font-medium text-brand-700 transition hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          View details
        </button>
      </div>
    </article>
  )
}

function Badge({ highlight = false, children }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        highlight ? 'bg-brand-50 text-brand-800' : 'bg-slate-100 text-slate-700'
      }`}
    >
      {children}
    </span>
  )
}

function TimeBlock({ time, date, extraDays = 0, alignRight = false }) {
  return (
    <div className={alignRight ? 'text-right' : undefined}>
      <p className="text-lg font-semibold whitespace-nowrap text-slate-900 tabular-nums">
        {time}
        {extraDays > 0 && (
          <sup className="ml-0.5 text-xs font-semibold text-brand-700" title="Arrives on a later day">
            +{extraDays}
          </sup>
        )}
      </p>
      <p className="text-xs text-slate-500">{date}</p>
    </div>
  )
}
