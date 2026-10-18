import { useEffect, useRef } from 'react'
import { formatDate, formatDuration, formatFare, formatSeatType, formatTime } from '../utils/format'
import { CloseIcon } from './icons'

// Native <dialog> + showModal(): the browser handles the backdrop, focus trap and Esc.
export default function BusDetailsModal({ bus, onClose }) {
  const dialogRef = useRef(null)
  const closeButtonRef = useRef(null)
  // Captured on first render, before showModal() moves focus, so focus can return to it.
  const openerRef = useRef(document.activeElement)

  useEffect(() => {
    const dialog = dialogRef.current
    const opener = openerRef.current
    if (!dialog.open) dialog.showModal()
    // Start on the close button; otherwise Chrome focuses the scrollable body.
    closeButtonRef.current?.focus()
    return () => opener?.focus?.()
  }, [])

  // A click on the backdrop lands on the <dialog> element itself.
  function handleClick(event) {
    if (event.target === dialogRef.current) onClose()
  }

  const policy = bus.cancellation_policy

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={handleClick}
      aria-labelledby="bus-details-title"
      className="m-auto w-[calc(100%-2rem)] max-w-3xl rounded-2xl bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-900/60"
    >
      <div className="max-h-[85vh] overflow-y-auto">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <h2 id="bus-details-title" className="text-lg font-semibold">
              {bus.operator}
            </h2>
            <p className="text-sm text-slate-500">
              {bus.bus_type} · {bus.is_ac ? 'AC' : 'Non-AC'} · {formatSeatType(bus.seat_type)}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-6 px-5 py-5">
          <dl className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-4">
            <Fact label="Departure" value={`${formatTime(bus.departure_at)}, ${formatDate(bus.departure_at)}`} />
            <Fact label="Arrival" value={`${formatTime(bus.arrival_at)}, ${formatDate(bus.arrival_at)}`} />
            <Fact label="Duration" value={formatDuration(bus.duration_minutes)} />
            <Fact label="Fare" value={`${formatFare(bus.fare, bus.currency)} · ${bus.seats_available} left`} />
          </dl>

          <div className="grid gap-6 md:grid-cols-2">
            <StopList title="Boarding points" stops={bus.boarding_points} />
            <StopList title="Dropping points" stops={bus.dropping_points} />
          </div>

          {bus.amenities.length > 0 && (
            <section>
              <SectionTitle>Amenities</SectionTitle>
              <ul className="mt-2 flex flex-wrap gap-2">
                {bus.amenities.map((amenity) => (
                  <li key={amenity} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                    {amenity}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {policy && (
            <section>
              <SectionTitle>Cancellation &amp; changes</SectionTitle>
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                <li>{policy.is_cancellable ? '✓ Cancellable' : '✗ Not cancellable'}</li>
                <li>
                  {policy.reschedule_allowed
                    ? `✓ Rescheduling allowed (${
                        policy.reschedule_charge
                          ? `${formatFare(policy.reschedule_charge, bus.currency)} fee`
                          : 'free'
                      })`
                    : '✗ Rescheduling not allowed'}
                </li>
              </ul>
            </section>
          )}

          {bus.data_warnings.length > 0 && (
            <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <h3 className="text-sm font-semibold text-amber-900">Provider data notes</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900">
                {bus.data_warnings.map((warning) => (
                  <li key={warning.code}>{warning.message}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </dialog>
  )
}

function SectionTitle({ children }) {
  return (
    <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{children}</h3>
  )
}

function Fact({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-semibold text-slate-900">{value}</dd>
    </div>
  )
}

function StopList({ title, stops }) {
  return (
    <section>
      <SectionTitle>{title}</SectionTitle>
      {stops.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">The operator hasn't listed any.</p>
      ) : (
        <ol className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200">
          {stops.map((stop, index) => (
            <li key={`${stop.name}-${index}`} className="flex gap-3 px-3 py-2.5">
              <span className="w-[4.5rem] shrink-0 text-sm font-semibold text-slate-900 tabular-nums">
                {stop.time}
              </span>
              <div className="min-w-0 text-sm">
                <p className="text-slate-800">
                  {stop.name}
                  {stop.is_nearest && (
                    <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-brand-800">
                      Nearest
                    </span>
                  )}
                </p>
                {stop.contact && <p className="text-xs text-slate-500">Contact: {stop.contact}</p>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
