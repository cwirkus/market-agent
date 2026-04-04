import React, { useState, useEffect, useCallback } from 'react'
import { getStockData, getCryptoData } from '../api/client'
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'

const DEFAULT_WATCHLIST = [
  { id: 'AAPL',     type: 'stock',  label: 'AAPL',  name: 'Apple' },
  { id: 'TSLA',     type: 'stock',  label: 'TSLA',  name: 'Tesla' },
  { id: 'NVDA',     type: 'stock',  label: 'NVDA',  name: 'Nvidia' },
  { id: 'MSFT',     type: 'stock',  label: 'MSFT',  name: 'Microsoft' },
  { id: 'bitcoin',  type: 'crypto', label: 'BTC',   name: 'Bitcoin' },
  { id: 'ethereum', type: 'crypto', label: 'ETH',   name: 'Ethereum' },
  { id: 'solana',   type: 'crypto', label: 'SOL',   name: 'Solana' },
]

function formatPrice(price) {
  if (price === null || price === undefined) return '—'
  if (price >= 1000) return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (price >= 1) return '$' + price.toFixed(2)
  return '$' + price.toFixed(4)
}

export default function WatchList({ onSelect, selectedId }) {
  const [prices, setPrices] = useState({})
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const results = {}
    await Promise.allSettled(
      DEFAULT_WATCHLIST.map(async (item) => {
        try {
          const data = item.type === 'crypto'
            ? await getCryptoData(item.id)
            : await getStockData(item.id)
          results[item.id] = data
        } catch {
          results[item.id] = null
        }
      })
    )
    setPrices(results)
    setLastUpdated(new Date())
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 60000)
    return () => clearInterval(interval)
  }, [fetchAll])

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-xs font-bold text-text uppercase tracking-widest">Watchlist</span>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-muted font-mono">
              {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={fetchAll}
            disabled={loading}
            className="p-1 rounded-md hover:bg-surface2 transition-colors"
          >
            <RefreshCw size={11} className={`text-muted ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1">
        {DEFAULT_WATCHLIST.map((item) => {
          const data = prices[item.id]
          const isSelected = selectedId === item.id
          const change = data?.change_pct ?? data?.change_24h_pct ?? 0
          const isPositive = change >= 0

          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id, item.type, data?.name || item.name)}
              className={`
                w-full px-4 py-3 flex items-center justify-between text-left transition-all border-b border-border/50 last:border-0
                ${isSelected
                  ? 'bg-accent/10 border-l-2 border-l-accent'
                  : 'hover:bg-surface2/60 border-l-2 border-l-transparent'
                }
              `}
            >
              <div className="flex items-center gap-2.5">
                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold
                  ${item.type === 'crypto'
                    ? 'bg-violet-500/15 text-violet-400'
                    : 'bg-blue-500/15 text-blue-400'
                  }
                `}>
                  {item.label.substring(0, 2)}
                </div>
                <div>
                  <div className="text-xs font-bold font-mono text-text">{item.label}</div>
                  <div className="text-xs text-muted truncate max-w-[70px]">{item.name}</div>
                </div>
              </div>

              <div className="text-right min-w-[56px]">
                {loading && !data ? (
                  <div className="space-y-1.5">
                    <div className="w-14 h-2.5 skeleton rounded" />
                    <div className="w-10 h-2 skeleton rounded ml-auto" />
                  </div>
                ) : data ? (
                  <>
                    <div className="text-xs price-mono font-semibold text-text">
                      {formatPrice(data.price)}
                    </div>
                    <div className={`flex items-center justify-end gap-0.5 text-xs font-mono ${isPositive ? 'text-gain' : 'text-loss'}`}>
                      {isPositive ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                      {isPositive ? '+' : ''}{change?.toFixed(2)}%
                    </div>
                  </>
                ) : (
                  <span className="text-xs text-muted">—</span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
