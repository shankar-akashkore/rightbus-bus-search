import { useState } from 'react'
import { CITY_SUGGESTIONS, SAMPLE_SEARCH, isSameCity } from '../utils/cities'
import { SwapIcon } from './icons'

const EMPTY = { source: '', destination: '', journeyDate: '' }

// Instant feedback before calling the API. The backend validates again.
function validate({ source, destination, journeyDate }) {
  const errors = {}
  if (!source.trim()) errors.source = 'Enter where you are leaving from'
  if (!destination.trim()) errors.destination = 'Enter where you are going'
  else if (source.trim() && isSameCity(source, destination)) {
    errors.destination = 'Source and destination must be different'
  }
  if (!journeyDate) errors.journeyDate = 'Pick a journey date'
  return errors
}

const inputClass = (hasError) =>
  `h-11 w-full rounded-lg border bg-white px-3 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:outline-none ${
    hasError
      ? 'border-red-400 focus:ring-red-200'
      : 'border-slate-300 focus:border-brand-600 focus:ring-brand-100'
  }`

export default function SearchForm({ initialValues, onSearch, isLoading }) {
  const [values, setValues] = useState(initialValues ?? EMPTY)
  const [errors, setErrors] = useState({})

  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  function submit(nextValues) {
    const nextErrors = validate(nextValues)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    onSearch({
      source: nextValues.source.trim(),
      destination: nextValues.destination.trim(),
      journeyDate: nextValues.journeyDate,
    })
  }

  function handleSubmit(event) {
    event.preventDefault()
    submit(values)
  }

  function swapCities() {
    setValues((current) => ({ ...current, source: current.destination, destination: current.source }))
    setErrors({})
  }

  function runSample() {
    setValues(SAMPLE_SEARCH)
    submit(SAMPLE_SEARCH)
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label="Bus search"
      className="rounded-2xl bg-white p-4 shadow-lg ring-1 ring-slate-900/5 sm:p-6"
    >
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_11rem_auto] md:items-start">
        <Field id="source" label="From" error={errors.source}>
          <input
            id="source"
            list="city-options"
            value={values.source}
            onChange={(event) => update('source', event.target.value)}
            placeholder="Leaving from"
            autoComplete="off"
            aria-invalid={Boolean(errors.source)}
            aria-describedby={errors.source ? 'source-error' : undefined}
            className={inputClass(errors.source)}
          />
        </Field>

        <button
          type="button"
          onClick={swapCities}
          aria-label="Swap source and destination"
          title="Swap"
          className="mx-auto flex h-11 w-11 rotate-90 items-center justify-center rounded-full border border-slate-300 text-slate-500 transition hover:border-brand-600 hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 md:mt-[1.375rem] md:rotate-0"
        >
          <SwapIcon className="h-5 w-5" />
        </button>

        <Field id="destination" label="To" error={errors.destination}>
          <input
            id="destination"
            list="city-options"
            value={values.destination}
            onChange={(event) => update('destination', event.target.value)}
            placeholder="Going to"
            autoComplete="off"
            aria-invalid={Boolean(errors.destination)}
            aria-describedby={errors.destination ? 'destination-error' : undefined}
            className={inputClass(errors.destination)}
          />
        </Field>

        <Field id="journeyDate" label="Journey date" error={errors.journeyDate}>
          {/* No "min" date on purpose: the supplied dataset is dated 9 Aug 2026. */}
          <input
            id="journeyDate"
            type="date"
            value={values.journeyDate}
            onChange={(event) => update('journeyDate', event.target.value)}
            aria-invalid={Boolean(errors.journeyDate)}
            aria-describedby={errors.journeyDate ? 'journeyDate-error' : undefined}
            className={inputClass(errors.journeyDate)}
          />
        </Field>

        <button
          type="submit"
          disabled={isLoading}
          className="h-11 rounded-lg bg-brand-700 px-6 font-semibold text-white shadow-sm transition hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-wait disabled:opacity-70 md:mt-[1.375rem] md:min-w-[9.5rem]"
        >
          {isLoading ? 'Searching…' : 'Search buses'}
        </button>
      </div>

      <datalist id="city-options">
        {CITY_SUGGESTIONS.map((city) => (
          <option key={city} value={city} />
        ))}
      </datalist>

      <p className="mt-4 text-sm text-slate-500">
        Try the sample route:{' '}
        <button
          type="button"
          onClick={runSample}
          className="font-medium text-brand-700 underline decoration-brand-600/40 underline-offset-2 hover:decoration-brand-700"
        >
          Bangalore → Mumbai, 9 Aug 2026
        </button>
      </p>
    </form>
  )
}

function Field({ id, label, error, children }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
