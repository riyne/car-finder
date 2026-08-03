import { useState } from 'react'

import './App.css'

// source ~/.nvm/nvm.sh
// nvm use 20.19.0
// npm run dev

const API_BASE_URL = 'http://127.0.0.1:8000'

type StockItem = {
  stock: string
  year: string
  brand: string
  model: string
  link?: string
}

type StockResponse = {
  dealer: string
  count: number
  csv_path: string
  new_stock: StockItem[]
  removed_stock: StockItem[]
}

type DealerConfig = {
  key: string
  label: string
}

const DEALERS: DealerConfig[] = [
  { key: 'audi-richmond', label: 'Audi Richmond' },
  { key: 'audi-capilano', label: 'Audi Capilano' },
  { key: 'openroad-audi', label: 'OpenRoad Audi' },
  { key: 'audi-downtown-vancouver', label: 'Audi Downtown Vancouver' },
]

type DealerState = {
  data: StockResponse | null
  loading: boolean
  error: string
}

const createInitialDealerStates = (): Record<string, DealerState> =>
  DEALERS.reduce((acc, dealer) => {
    acc[dealer.key] = { data: null, loading: false, error: '' }
    return acc
  }, {} as Record<string, DealerState>)

function DealerSection({
  dealer,
  state,
  onCheckUpdatedStock,
}: {
  dealer: DealerConfig
  state: DealerState
  onCheckUpdatedStock: (dealerKey: string) => void
}) {
  const { data, loading, error } = state

  return (
    <section className="panel">
      <div className="button-row">
        <h2 className="dealer-heading">{dealer.label}</h2>
        <button
          type="button"
          className="dealer-button"
          onClick={() => onCheckUpdatedStock(dealer.key)}
          disabled={loading}
        >
          {loading ? 'Checking...' : 'Check updated stock'}
        </button>
      </div>

      {error && <p className="status error">{error}</p>}

      {data && (
        <div className="results-grid">
          <div className="results-column">
            <div className="column-header">
              <h2>New stock</h2>
              <span>{data.new_stock.length}</span>
            </div>
            <div className="card-list">
              {data.new_stock.length === 0 && <p className="empty-state">No new stock found.</p>}
              {data.new_stock.map((item) => (
                <article className="stock-card" key={item.stock}>
                  <div className="stock-card-top">
                    <span className="stock-badge">{item.stock}</span>
                    <span className="stock-meta">{item.year}</span>
                  </div>
                  {item.link ? (
                    <a className="stock-title" href={item.link} target="_blank" rel="noreferrer">
                      {item.brand} {item.model}
                    </a>
                  ) : (
                    <p className="stock-title">{item.brand} {item.model}</p>
                  )}
                </article>
              ))}
            </div>
          </div>

          <div className="results-column">
            <div className="column-header muted">
              <h2>Removed stock</h2>
              <span>{data.removed_stock.length}</span>
            </div>
            <div className="card-list">
              {data.removed_stock.length === 0 && <p className="empty-state">No removed stock found.</p>}
              {data.removed_stock.map((item) => (
                <article className="stock-card removed" key={item.stock}>
                  <div className="stock-card-top">
                    <span className="stock-badge">{item.stock}</span>
                    <span className="stock-meta">{item.year}</span>
                  </div>
                  {item.link ? (
                    <a className="stock-title" href={item.link} target="_blank" rel="noreferrer">
                      {item.brand} {item.model}
                    </a>
                  ) : (
                    <p className="stock-title">{item.brand} {item.model}</p>
                  )}
                </article>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function App() {
  const [dealerStates, setDealerStates] = useState<Record<string, DealerState>>(createInitialDealerStates)

  const handleCheckUpdatedStock = async (dealerKey: string) => {
    setDealerStates((prev) => ({
      ...prev,
      [dealerKey]: { data: null, loading: true, error: '' },
    }))

    try {
      const response = await fetch(`${API_BASE_URL}/cars/${dealerKey}`)

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }

      const responseData = (await response.json()) as StockResponse

      setDealerStates((prev) => ({
        ...prev,
        [dealerKey]: { data: responseData, loading: false, error: '' },
      }))
    } catch (error) {
      setDealerStates((prev) => ({
        ...prev,
        [dealerKey]: {
          data: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }))
    }
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">Car Finder</p>
        <h1>Track stock changes with one click</h1>
        <p className="subtitle">
          Compare the latest scrape against the last saved inventory and see what was added or removed, per dealer.
        </p>
      </section>

      {DEALERS.map((dealer) => (
        <DealerSection
          key={dealer.key}
          dealer={dealer}
          state={dealerStates[dealer.key]}
          onCheckUpdatedStock={handleCheckUpdatedStock}
        />
      ))}
    </main>
  )
}

export default App