import { useCallback, useEffect, useRef, useState } from 'react'
import { searchBuses } from '../api/busApi'

const IDLE = { status: 'idle', data: null, error: null, params: null }

// Runs searches and tracks which UI state to show: idle -> loading -> success | error.
export function useBusSearch() {
  const [state, setState] = useState(IDLE)
  const controllerRef = useRef(null)

  const search = useCallback(async (params) => {
    // Cancel the previous search so a slow old response can't overwrite newer results.
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller

    setState({ status: 'loading', data: null, error: null, params })
    try {
      const data = await searchBuses(params, { signal: controller.signal })
      setState({ status: 'success', data, error: null, params })
    } catch (error) {
      if (error.name === 'AbortError') return
      setState({ status: 'error', data: null, error, params })
    }
  }, [])

  useEffect(() => () => controllerRef.current?.abort(), []) // abort on unmount

  const retry = useCallback(() => {
    if (state.params) search(state.params)
  }, [search, state.params])

  return { ...state, search, retry }
}
