import React, { useState, useEffect, useCallback } from 'react'
import { getStockData, getCryptoData } from '../api/client'
import { TrendingUp, TrendingDown, RefreshCw, Star } from 'lucide-react'

const DEFAULT_WATCHLIST = [
  { id: 'AAPL', type: 'stock', label: 'AAPL' },
  { id: 'TSLA', type: 'stock', label: 'TSLA' },
  { id: 'NVDA', type: 'stock', label: 'NVDA' },
  { id: 'MSFT', type: 'stock', label: 'MSFT' },
  { id: 'bitcoin', type: 'crypto', label: 'BTC' },
  { id: 'ethereum', type: 'crypto', label: 'ETH' },
  { id: 'solana', type: 'crypto', label: 'SOL' },
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
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Star size={13} className="text-accent" />
          <span className="text-sm font-semibold text-text">Watchlist</span>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-muted font-mono">
              {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={fetchAll}
            disabled={loading}
            className="p-1 rounded hover:bg-gray-700/50 transition-colors"
          >
            <RefreshCw size={12} className={`text-muted ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="divide-y divide-border/50">
        {DEFAULT_WATCHLIST.map((item) => {
          const data = prices[item.id]
          const isSelected = selectedId === item.id
          const change = data?.change_pct ?? data?.change_24h_pct ?? 0
          const isPositive = change >= 0

          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id, item.type, data?.name || item.label)}
              className={`
                w-full flex items-center justify-between px-4 py-3 transition-colors text-left
                ${isSelected
                  ? 'bg-accent/10 border-l-2 border-l-accent'
                  : 'hover:bg-gray-800/50 border-l-2 border-l-transparent'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-mono font-bold ${
                    item.type === 'crypto' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-blue-500/20 text-blue-400'
                  }`}
                >
                  {item.label.substring(0, 2)}
                </div>
                <div>
                  <div className="text-xs font-semibold font-mono text-text tracking-wide">{item.label}</div>
                  <div className="text-xs text-muted capitalize">{item.type}</div>
                </div>
              </div>

              <div className="text-right">
                {loading && !data ? (
                  <div className="w-16 h-3 bg-gray-700 rounded animate-pulse" />
                ) : data ? (
                  <>
                    <div className="text-xs price-mono font-semibold text-text">
                      {formatPrice(data.price)}
                    </div>
                    <div className={`flex items-center justify-end gap-1 text-xs font-mono ${isPositive ? 'text-gain' : 'text-loss'}`}>
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
