import { useState } from 'react'

import './App.css'

// source ~/.nvm/nvm.sh
// nvm use 20.19.0
// npm run dev

type DealerAction = {
  label: string
  dealerKey: string
}

const API_BASE_URL = 'http://127.0.0.1:8000'

const dealerActions: DealerAction[] = [
  {
    label: 'Get Audi Richmond',
    dealerKey: 'audi-richmond',
  },
]

function App() {
  const [output, setOutput] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const handleDealerClick = async (dealerKey: string) => {
    setLoading(true)
    setError('')
    setOutput('')

    try {
      const response = await fetch(`${API_BASE_URL}/cars/${dealerKey}`)

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }

      const data = await response.json()
      setOutput(JSON.stringify(data, null, 2))
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">Car Finder</p>
        <h1>Pull dealer inventory titles from the backend</h1>
        <p className="subtitle">
          Click a dealer button to call the backend GET endpoint and print the response.
        </p>
      </section>

      <section className="panel">
        <div className="button-row">
          {dealerActions.map((action) => (
            <button
              key={action.dealerKey}
              type="button"
              className="dealer-button"
              onClick={() => handleDealerClick(action.dealerKey)}
              disabled={loading}
            >
              {action.label}
            </button>
          ))}
        </div>

        {loading && <p className="status">Loading...</p>}
        {error && <p className="status error">{error}</p>}

        {output && (
          <pre className="output">
            {output}
          </pre>
        )}
      </section>
    </main>
  )
}

export default App
