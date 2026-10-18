// Only suggestions: any city can be typed, and the backend decides what matches.
export const CITY_SUGGESTIONS = [
  'Bangalore',
  'Mumbai',
  'Delhi',
  'Chennai',
  'Hyderabad',
  'Pune',
  'Goa',
  'Jaipur',
  'Jodhpur',
  'Jaisalmer',
  'Ahmedabad',
  'Kolkata',
]

// The route and date covered by the supplied GDS data.
export const SAMPLE_SEARCH = { source: 'Bangalore', destination: 'Mumbai', journeyDate: '2026-08-09' }

// Instant same-city check; the backend checks again and also resolves aliases.
export function isSameCity(a, b) {
  const normalize = (city) => city.trim().replace(/\s+/g, ' ').toLowerCase()
  return normalize(a) === normalize(b)
}
