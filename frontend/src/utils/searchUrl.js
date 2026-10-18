export function readSearchFromUrl() {
  const params = new URLSearchParams(window.location.search)
  const search = {
    source: params.get('source') ?? '',
    destination: params.get('destination') ?? '',
    journeyDate: params.get('date') ?? '',
  }
  return search.source && search.destination && search.journeyDate ? search : null
}

export function writeSearchToUrl({ source, destination, journeyDate }) {
  const params = new URLSearchParams({ source, destination, date: journeyDate })
  window.history.replaceState(null, '', `?${params}`)
}
