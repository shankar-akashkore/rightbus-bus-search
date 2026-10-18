// All calls to the RightBus backend go through here; the frontend never calls the GDS.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export class ApiError extends Error {
  constructor(message, { code = 'UNKNOWN_ERROR', status = 0, details = [] } = {}) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.details = details
  }
}

export async function searchBuses({ source, destination, journeyDate }, { signal } = {}) {
  const query = new URLSearchParams({ source, destination, journey_date: journeyDate })

  let response
  try {
    response = await fetch(`${API_BASE_URL}/api/buses/search?${query}`, { signal })
  } catch (error) {
    if (error.name === 'AbortError') throw error // a newer search replaced this one
    throw new ApiError("We couldn't reach RightBus. Check your connection and try again.", {
      code: 'NETWORK_ERROR',
    })
  }

  const body = await response.json().catch(() => null)
  if (response.ok && body) return body

  // Our backend's errors share one shape: { error: { code, message, details } }.
  const apiError = body?.error
  if (apiError) {
    throw new ApiError(apiError.message, {
      code: apiError.code,
      status: response.status,
      details: apiError.details,
    })
  }
  // Anything else, e.g. the dev proxy answering because the backend is down.
  throw new ApiError("We couldn't reach RightBus. Please try again in a moment.", {
    code: response.ok ? 'BAD_RESPONSE' : 'SERVER_UNREACHABLE',
    status: response.status,
  })
}
