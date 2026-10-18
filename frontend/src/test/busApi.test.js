import { afterEach, describe, expect, it, vi } from 'vitest'
import { searchBuses } from '../api/busApi'

const params = { source: 'Bangalore', destination: 'Mumbai', journeyDate: '2026-08-09' }

function jsonResponse(status, body) {
  return { ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('searchBuses', () => {
  it('calls the backend search endpoint, never the GDS', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { buses: [] }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(searchBuses(params)).resolves.toEqual({ buses: [] })
    expect(fetchMock.mock.calls[0][0]).toBe(
      '/api/buses/search?source=Bangalore&destination=Mumbai&journey_date=2026-08-09',
    )
  })

  it("turns the backend's error shape into an ApiError", async () => {
    const body = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'source is required',
        details: [{ field: 'source', message: 'source is required' }],
      },
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(422, body)))

    await expect(searchBuses(params)).rejects.toMatchObject({
      name: 'ApiError',
      code: 'VALIDATION_ERROR',
      status: 422,
      message: 'source is required',
    })
  })

  it('reports a network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    await expect(searchBuses(params)).rejects.toMatchObject({ code: 'NETWORK_ERROR' })
  })

  it('handles a non-JSON error, e.g. the dev proxy when the backend is down', async () => {
    const notJson = { ok: false, status: 500, json: () => Promise.reject(new SyntaxError('bad')) }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(notJson))

    await expect(searchBuses(params)).rejects.toMatchObject({ code: 'SERVER_UNREACHABLE', status: 500 })
  })

  it('passes aborts through untouched so the caller can ignore them', async () => {
    const abort = new DOMException('The operation was aborted.', 'AbortError')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abort))

    await expect(searchBuses(params)).rejects.toBe(abort)
  })
})
