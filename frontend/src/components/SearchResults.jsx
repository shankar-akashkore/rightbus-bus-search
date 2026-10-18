import { useMemo, useState } from 'react'
import { DEFAULT_FILTERS, applyFilters, sortBuses } from '../utils/filters'
import { formatLongDate } from '../utils/format'
import BusCard from './BusCard'
import BusDetailsModal from './BusDetailsModal'
import FilterBar from './FilterBar'
import EmptyState from './states/EmptyState'

// Filter/sort state lives here, so each new search (which remounts this) starts fresh.
export default function SearchResults({ data }) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [sortBy, setSortBy] = useState('departure')
  const [selectedBus, setSelectedBus] = useState(null)

  const visibleBuses = useMemo(
    () => sortBuses(applyFilters(data.buses, filters), sortBy),
    [data.buses, filters, sortBy],
  )
  const when = formatLongDate(data.journey_date)

  if (data.total_results === 0) {
    return (
      <EmptyState
        title="No buses found"
        message={`No buses run from ${data.source} to ${data.destination} on ${when}. Try another date or route.`}
      />
    )
  }

  const total = data.total_results
  const summary =
    visibleBuses.length === total
      ? `${total} ${total === 1 ? 'bus' : 'buses'} found`
      : `Showing ${visibleBuses.length} of ${total} buses`

  return (
    <section aria-labelledby="results-heading">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="results-heading" className="text-lg font-semibold text-slate-900">
          {data.source} → {data.destination}
        </h2>
        <p className="text-sm text-slate-600" aria-live="polite">
          {summary} · {when}
        </p>
      </div>

      <FilterBar
        filters={filters}
        onFiltersChange={setFilters}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      <div className="mt-4">
        {visibleBuses.length === 0 ? (
          <EmptyState
            title="No buses match these filters"
            message="Try removing a filter to see more buses."
            action={{ label: 'Show all buses', onClick: () => setFilters(DEFAULT_FILTERS) }}
          />
        ) : (
          <ul className="space-y-3">
            {visibleBuses.map((bus) => (
              <li key={bus.trip_id}>
                <BusCard bus={bus} onViewDetails={setSelectedBus} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {selectedBus && <BusDetailsModal bus={selectedBus} onClose={() => setSelectedBus(null)} />}
    </section>
  )
}
