import { DEFAULT_FILTERS, SORT_OPTIONS, hasActiveFilters } from '../utils/filters'

const AC_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'ac', label: 'AC' },
  { value: 'non-ac', label: 'Non-AC' },
]

const SEAT_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'sleeper', label: 'Sleeper' },
  { value: 'seater', label: 'Seater' },
]

export default function FilterBar({ filters, onFiltersChange, sortBy, onSortChange }) {
  return (
    <div className="flex flex-wrap items-end gap-x-6 gap-y-3 rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
      <ToggleGroup
        label="Bus type"
        options={AC_OPTIONS}
        value={filters.ac}
        onChange={(ac) => onFiltersChange({ ...filters, ac })}
      />
      <ToggleGroup
        label="Seat type"
        options={SEAT_OPTIONS}
        value={filters.seatType}
        onChange={(seatType) => onFiltersChange({ ...filters, seatType })}
      />

      <div className="flex items-end gap-4 sm:ml-auto">
        {hasActiveFilters(filters) && (
          <button
            type="button"
            onClick={() => onFiltersChange(DEFAULT_FILTERS)}
            className="h-9 text-sm font-medium text-brand-700 hover:underline"
          >
            Clear filters
          </button>
        )}
        <div>
          <label
            htmlFor="sort-by"
            className="mb-1 block text-xs font-semibold tracking-wide text-slate-500 uppercase"
          >
            Sort by
          </label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={(event) => onSortChange(event.target.value)}
            className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-800 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 focus:outline-none"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

function ToggleGroup({ label, options, value, onChange }) {
  return (
    <div role="group" aria-label={label}>
      <span className="mb-1 block text-xs font-semibold tracking-wide text-slate-500 uppercase">
        {label}
      </span>
      <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
        {options.map((option) => {
          const active = value === option.value
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option.value)}
              className={`h-8 rounded-md px-3 text-sm font-medium transition ${
                active ? 'bg-brand-700 text-white shadow-sm' : 'text-slate-600 hover:bg-white'
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
