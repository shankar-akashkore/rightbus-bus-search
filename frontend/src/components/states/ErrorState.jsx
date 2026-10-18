import { AlertIcon } from '../icons'

const TITLES = {
  GDS_UNAVAILABLE: 'Bus partner not responding',
  GDS_TIMEOUT: 'Bus partner not responding',
  GDS_BAD_RESPONSE: 'Bus partner sent bad data',
  NETWORK_ERROR: "Can't reach RightBus",
  SERVER_UNREACHABLE: "Can't reach RightBus",
  VALIDATION_ERROR: 'Please check your search',
}

export default function ErrorState({ error, onRetry }) {
  // Retrying won't fix invalid input, so only offer it for failures that can pass.
  const canRetry = error.code !== 'VALIDATION_ERROR'

  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center">
      <AlertIcon className="mx-auto h-9 w-9 text-red-500" />
      <h3 className="mt-2 font-semibold text-red-900">{TITLES[error.code] ?? 'Something went wrong'}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-red-800">{error.message}</p>
      {canRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800"
        >
          Try again
        </button>
      )}
      <p className="mt-3 text-xs text-red-700/70">Error code: {error.code}</p>
    </div>
  )
}
