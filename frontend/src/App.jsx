import { useEffect, useState } from 'react'
import { BusIcon } from './components/icons'
import SearchForm from './components/SearchForm'
import SearchResults from './components/SearchResults'
import ErrorState from './components/states/ErrorState'
import IdleState from './components/states/IdleState'
import LoadingState from './components/states/LoadingState'
import { useBusSearch } from './hooks/useBusSearch'
import { readSearchFromUrl, writeSearchToUrl } from './utils/searchUrl'

export default function App() {
  const [initialSearch] = useState(readSearchFromUrl)
  const { status, data, error, search, retry } = useBusSearch()

  // Run the search from the URL, so a refresh or shared link shows the same results.
  useEffect(() => {
    if (initialSearch) search(initialSearch)
  }, [initialSearch, search])

  function handleSearch(params) {
    writeSearchToUrl(params)
    search(params)
  }

  return (
    <div className="min-h-screen">
      <header className="bg-brand-700 pb-24 text-white">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-4 sm:px-6">
          <BusIcon className="h-7 w-7" />
          <span className="text-xl font-bold tracking-tight">RightBus</span>
        </div>
        <div className="mx-auto max-w-5xl px-4 pt-4 sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Book intercity buses</h1>
          <p className="mt-2 text-brand-100">Compare operators, timings, fares and seats in one search.</p>
        </div>
      </header>

      <main className="mx-auto -mt-16 max-w-5xl px-4 pb-16 sm:px-6">
        <SearchForm
          initialValues={initialSearch}
          onSearch={handleSearch}
          isLoading={status === 'loading'}
        />

        <div className="mt-8">
          {status === 'idle' && <IdleState />}
          {status === 'loading' && <LoadingState />}
          {status === 'error' && <ErrorState error={error} onRetry={retry} />}
          {status === 'success' && <SearchResults data={data} />}
        </div>
      </main>
    </div>
  )
}
