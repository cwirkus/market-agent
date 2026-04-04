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

function Row({ label, sub, price, change }) {
  if (!price) return null
  const isPositive = (change ?? 0) >= 0
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-0">
      <div>
        <div className="text-xs font-semibold text-text">{label}</div>
        {sub && <div className="text-xs text-muted">{sub}</div>}
      </div>
      <div className="text-right">
        <div className="text-xs price-mono font-semibold text-text">{formatPrice(price)}</div>
        <div className={`flex items-center justify-end gap-0.5 text-xs font-mono ${isPositive ? 'text-gain' : 'text-loss'}`}>
          {isPositive ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
          {isPositive ? '+' : ''}{change?.toFixed(2)}%
        </div>
      </div>
    </div>
  )
}

function SkeletonRows({ count = 3 }) {
  return (
    <div className="space-y-3 py-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex justify-between items-center">
          <div className="w-20 h-3 skeleton rounded" />
          <div className="w-16 h-3 skeleton rounded" />
        </div>
      ))}
    </div>
  )
}

export default function NewsPanel({ summary, loading }) {
  return (
    <>
      {/* Market Indices */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border">
          <div className="w-6 h-6 rounded-md bg-blue-500/15 flex items-center justify-center">
            <BarChart2 size={12} className="text-blue-400" />
          </div>
          <span className="text-xs font-bold text-text uppercase tracking-widest">Indices</span>
        </div>
        <div className="px-4">
          {loading ? <SkeletonRows count={3} /> : summary?.indices ? (
            Object.entries(summary.indices).map(([name, data]) => (
              data && <Row
                key={name}
                label={name.replace(' Jones', '').replace('Composite', '')}
                price={data.price}
                change={data.change_pct}
              />
            ))
          ) : (
            <p className="text-xs text-muted py-3">Unable to load data</p>
          )}
        </div>
      </div>

      {/* Crypto Leaders */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border">
          <div className="w-6 h-6 rounded-md bg-violet-500/15 flex items-center justify-center">
            <Globe size={12} className="text-violet-400" />
          </div>
          <span className="text-xs font-bold text-text uppercase tracking-widest">Crypto</span>
        </div>
        <div className="px-4">
          {loading ? <SkeletonRows count={3} /> : summary?.crypto ? (
            Object.entries(summary.crypto).map(([name, data]) => (
              data && <Row
                key={name}
                label={data.symbol || name}
                sub={formatLarge(data.market_cap)}
                price={data.price}
                change={data.change_24h_pct}
              />
            ))
          ) : (
            <p className="text-xs text-muted py-3">Unable to load data</p>
          )}
        </div>
      </div>
    </>
  )
}
