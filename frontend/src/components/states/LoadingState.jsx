export default function LoadingState() {
  return (
    <div role="status" aria-label="Loading buses" className="space-y-3">
      {[0, 1, 2].map((key) => (
        <div key={key} className="animate-pulse rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex justify-between">
            <div className="h-4 w-1/3 rounded bg-slate-200" />
            <div className="h-5 w-16 rounded bg-slate-200" />
          </div>
          <div className="mt-2 h-3 w-1/4 rounded bg-slate-100" />
          <div className="mt-5 h-6 w-full rounded bg-slate-100" />
        </div>
      ))}
      <span className="sr-only">Searching for buses…</span>
    </div>
  )
}
