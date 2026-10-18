// fetch is mocked with a real backend response, so no running backend is needed.
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import searchResponse from './fixtures/searchResponse.json'

const emptyResponse = {
  ...searchResponse,
  destination: 'Delhi',
  total_results: 0,
  buses: [],
  meta: {
    provider_trip_count: 5,
    excluded: { route_mismatch: 5, date_mismatch: 0, unavailable: 0, invalid: 0 },
  },
}

const providerDown = {
  error: {
    code: 'GDS_UNAVAILABLE',
    message: 'Our bus inventory provider is unreachable right now. Please try again shortly.',
    details: [],
  },
}

function jsonResponse(status, body) {
  return { ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) }
}

let fetchMock

beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
  window.history.replaceState(null, '', '/')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

async function search(user, { source = 'Bangalore', destination = 'Mumbai', date = '2026-08-09' } = {}) {
  await user.type(screen.getByLabelText('From'), source)
  await user.type(screen.getByLabelText('To'), destination)
  // Typing into date inputs is unreliable in jsdom, so set the value directly.
  fireEvent.change(screen.getByLabelText('Journey date'), { target: { value: date } })
  await user.click(screen.getByRole('button', { name: 'Search buses' }))
}

describe('bus search page', () => {
  it('shows the matching buses after a search', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, searchResponse))
    const user = userEvent.setup()
    render(<App />)

    await search(user)

    expect(await screen.findAllByRole('article')).toHaveLength(5)
    expect(screen.getByText('5 buses found · Sun, 9 Aug, 2026')).toBeInTheDocument()
    expect(screen.getByText('₹589')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/buses/search?source=Bangalore&destination=Mumbai&journey_date=2026-08-09',
      expect.objectContaining({ signal: expect.anything() }),
    )
    expect(window.location.search).toBe('?source=Bangalore&destination=Mumbai&date=2026-08-09')
  })

  it('shows a loading state while waiting for the backend', async () => {
    let respond
    fetchMock.mockReturnValueOnce(new Promise((resolve) => (respond = resolve)))
    const user = userEvent.setup()
    render(<App />)

    await search(user)

    expect(screen.getByRole('status', { name: 'Loading buses' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Searching…' })).toBeDisabled()

    respond(jsonResponse(200, searchResponse))

    expect(await screen.findAllByRole('article')).toHaveLength(5)
    expect(screen.queryByRole('status', { name: 'Loading buses' })).not.toBeInTheDocument()
  })

  it('explains when no buses run on the route', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, emptyResponse))
    const user = userEvent.setup()
    render(<App />)

    await search(user, { destination: 'Delhi' })

    expect(await screen.findByText('No buses found')).toBeInTheDocument()
    expect(
      screen.getByText(/No buses run from Bangalore to Delhi on Sun, 9 Aug, 2026/),
    ).toBeInTheDocument()
  })

  it('shows the error and recovers on retry when the provider is down', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(502, providerDown))
      .mockResolvedValueOnce(jsonResponse(200, searchResponse))
    const user = userEvent.setup()
    render(<App />)

    await search(user)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Bus partner not responding')
    expect(alert).toHaveTextContent('unreachable right now')

    await user.click(within(alert).getByRole('button', { name: 'Try again' }))

    expect(await screen.findAllByRole('article')).toHaveLength(5)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('stops a same-city search before calling the API', async () => {
    const user = userEvent.setup()
    render(<App />)

    await search(user, { source: 'Bangalore', destination: ' bangalore ' })

    expect(screen.getByText('Source and destination must be different')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('filters and sorts the results without another request', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, searchResponse))
    const user = userEvent.setup()
    render(<App />)
    await search(user)
    await screen.findAllByRole('article')

    const busType = screen.getByRole('group', { name: 'Bus type' })
    await user.click(within(busType).getByRole('button', { name: 'AC' }))
    expect(screen.getAllByRole('article')).toHaveLength(2)
    expect(screen.getByText(/Showing 2 of 5 buses/)).toBeInTheDocument()

    await user.click(within(busType).getByRole('button', { name: 'All' }))
    await user.selectOptions(screen.getByLabelText('Sort by'), 'price')
    const fares = screen
      .getAllByRole('article')
      .map((card) => within(card).getByText(/^₹/).textContent)
    expect(fares).toEqual(['₹589', '₹693', '₹2,426', '₹3,592', '₹7,392'])

    const seatType = screen.getByRole('group', { name: 'Seat type' })
    await user.click(within(seatType).getByRole('button', { name: 'Seater' }))
    expect(screen.getByText('No buses match these filters')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Show all buses' }))
    expect(screen.getAllByRole('article')).toHaveLength(5)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('shows boarding and dropping points in the bus details', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, searchResponse))
    const user = userEvent.setup()
    render(<App />)
    await search(user)

    const [firstBus] = await screen.findAllByRole('article')
    await user.click(within(firstBus).getByRole('button', { name: 'View details' }))

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Boarding points')).toBeInTheDocument()
    expect(within(dialog).getByText('Bannerghatta Road')).toBeInTheDocument()
    expect(within(dialog).getByText('Dropping points')).toBeInTheDocument()
    expect(within(dialog).getByText('Sion Circle - Bank Of India')).toBeInTheDocument()
    expect(within(dialog).getByText(/disagrees with the AC flag/)).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Close details' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('runs the search from a shared link', async () => {
    window.history.replaceState(null, '', '/?source=Bangalore&destination=Mumbai&date=2026-08-09')
    fetchMock.mockResolvedValueOnce(jsonResponse(200, searchResponse))

    render(<App />)

    expect(await screen.findAllByRole('article')).toHaveLength(5)
    expect(screen.getByLabelText('From')).toHaveValue('Bangalore')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
