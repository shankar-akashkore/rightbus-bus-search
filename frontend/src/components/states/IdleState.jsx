import { BusIcon } from '../icons'

export default function IdleState() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
      <BusIcon className="mx-auto h-10 w-10 text-brand-600" />
      <h2 className="mt-3 font-semibold text-slate-900">Where are you headed?</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">
        Enter your route and travel date to compare buses, timings, fares and seats.
      </p>
    </div>
  )
}
