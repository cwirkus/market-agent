import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

function formatPrice(price) {
  if (price === null || price === undefined) return '—'
  if (price >= 1000) return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (price >= 1) return '$' + price.toFixed(2)
  return '$' + price.toFixed(6)
}

function formatMarketCap(val) {
  if (!val) return '—'
  if (val >= 1e12) return '$' + (val / 1e12).toFixed(2) + 'T'
  if (val >= 1e9) return '$' + (val / 1e9).toFixed(2) + 'B'
  if (val >= 1e6) return '$' + (val / 1e6).toFixed(2) + 'M'
  return '$' + val.toLocaleString()
}

export default function MarketCard({ asset, onClick, isSelected }) {
  if (!asset) return null

  const name = asset.name || asset.ticker || asset.coin_id || asset.symbol || '—'
  const ticker = asset.ticker || asset.symbol || asset.coin_id || ''
  const price = asset.price
  const change = asset.change_pct ?? asset.change_24h_pct ?? 0
  const marketCap = asset.market_cap
  const isPositive = change >= 0

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left p-4 rounded-lg border transition-all duration-150
        ${isSelected
          ? 'border-accent bg-accent/10'
          : 'border-border bg-surface hover:border-gray-600 hover:bg-gray-800/60'
        }
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-accent tracking-widest uppercase">
              {ticker.length > 6 ? ticker.substring(0, 6) : ticker}
            </span>
          </div>
          <div className="text-sm text-subtext truncate mt-0.5">{name}</div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="price-mono text-sm font-semibold text-text">
            {formatPrice(price)}
          </div>
          <div className={`flex items-center justify-end gap-1 mt-0.5 text-xs font-mono ${isPositive ? 'text-gain' : 'text-loss'}`}>
            {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {isPositive ? '+' : ''}{change?.toFixed(2)}%
          </div>
        </div>
      </div>
      {marketCap && (
        <div className="mt-2 pt-2 border-t border-border/50">
          <span className="text-xs text-muted">Mkt Cap: <span className="text-subtext font-mono">{formatMarketCap(marketCap)}</span></span>
        </div>
      )}
    </button>
  )
}
