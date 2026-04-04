import React from 'react'
import { TrendingUp, TrendingDown, BarChart2, Globe } from 'lucide-react'

function formatPrice(price, decimals = 2) {
  if (price === null || price === undefined) return '—'
  if (price >= 1000) return '$' + price.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  return '$' + price.toFixed(decimals)
}

function formatLarge(val) {
  if (!val) return '—'
  if (val >= 1e12) return '$' + (val / 1e12).toFixed(2) + 'T'
  if (val >= 1e9) return '$' + (val / 1e9).toFixed(2) + 'B'
  if (val >= 1e6) return '$' + (val / 1e6).toFixed(2) + 'M'
  return '$' + val.toLocaleString()
}

function IndexRow({ name, data }) {
  if (!data) return null
  const change = data.change_pct ?? 0
  const isPositive = change >= 0
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-subtext font-medium">{name}</span>
      <div className="flex items-center gap-3">
        <span className="text-xs price-mono text-text font-semibold">{formatPrice(data.price)}</span>
        <span className={`flex items-center gap-1 text-xs font-mono w-16 justify-end ${isPositive ? 'text-gain' : 'text-loss'}`}>
          {isPositive ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
          {isPositive ? '+' : ''}{change?.toFixed(2)}%
        </span>
      </div>
    </div>
  )
}

function CryptoRow({ name, data }) {
  if (!data) return null
  const change = data.change_24h_pct ?? 0
  const isPositive = change >= 0
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
      <div>
        <span className="text-xs text-subtext font-medium">{data.symbol || name}</span>
        <span className="text-xs text-muted ml-1.5">{formatLarge(data.market_cap)}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs price-mono text-text font-semibold">{formatPrice(data.price)}</span>
        <span className={`flex items-center gap-1 text-xs font-mono w-16 justify-end ${isPositive ? 'text-gain' : 'text-loss'}`}>
          {isPositive ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
          {isPositive ? '+' : ''}{change?.toFixed(2)}%
        </span>
      </div>
    </div>
  )
}

export default function NewsPanel({ summary, loading }) {
  return (
    <div className="space-y-4">
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <BarChart2 size={13} className="text-accent" />
          <span className="text-sm font-semibold text-text">Market Indices</span>
        </div>
        <div className="px-4">
          {loading ? (
            <div className="space-y-3 py-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-4 bg-gray-800 rounded animate-pulse" />
              ))}
            </div>
          ) : summary?.indices ? (
            Object.entries(summary.indices).map(([name, data]) => (
              <IndexRow key={name} name={name} data={data} />
            ))
          ) : (
            <p className="text-xs text-muted py-3">Unable to load indices</p>
          )}
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Globe size={13} className="text-accent" />
          <span className="text-sm font-semibold text-text">Crypto Leaders</span>
        </div>
        <div className="px-4">
          {loading ? (
            <div className="space-y-3 py-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-4 bg-gray-800 rounded animate-pulse" />
              ))}
            </div>
          ) : summary?.crypto ? (
            Object.entries(summary.crypto).map(([name, data]) => (
              <CryptoRow key={name} name={name} data={data} />
            ))
          ) : (
            <p className="text-xs text-muted py-3">Unable to load crypto data</p>
          )}
        </div>
      </div>

      {summary?.timestamp && (
        <p className="text-xs text-muted text-center font-mono">
          Last updated: {summary.timestamp}
        </p>
      )}
    </div>
  )
}
