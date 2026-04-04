import React, { useState, useEffect } from 'react'
import Chat from './components/Chat'
import PriceChart from './components/PriceChart'
import WatchList from './components/WatchList'
import NewsPanel from './components/NewsPanel'
import { useMarketSummary, useTopMovers } from './hooks/useMarket'
import { TrendingUp, TrendingDown, Activity, Zap, Wifi, WifiOff } from 'lucide-react'

function formatPrice(price) {
  if (price === null || price === undefined) return '—'
  if (price >= 1000) return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (price >= 1) return '$' + price.toFixed(2)
  return '$' + price.toFixed(4)
}

function MoverCard({ asset }) {
  const isPositive = (asset.change_pct ?? 0) >= 0
  return (
    <div className={`
      relative rounded-xl px-3 py-3 border transition-all duration-200
      ${isPositive
        ? 'bg-gain/5 border-gain/20 hover:border-gain/40'
        : 'bg-loss/5 border-loss/20 hover:border-loss/40'
      }
    `}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-mono font-bold text-text tracking-wider">{asset.ticker}</span>
        <span className={`text-xs font-mono font-bold ${isPositive ? 'text-gain' : 'text-loss'}`}>
          {isPositive ? '+' : ''}{asset.change_pct?.toFixed(2)}%
        </span>
      </div>
      <div className="text-xs text-subtext price-mono">{formatPrice(asset.price)}</div>
    </div>
  )
}

function TickerItem({ name, data }) {
  if (!data?.price) return null
  const change = data.change_pct ?? 0
  const isPos = change >= 0
  return (
    <span className="inline-flex items-center gap-2.5 px-5">
      <span className="text-xs font-mono text-subtext font-medium">{name.replace(' Jones', '')}</span>
      <span className="text-xs price-mono text-text font-semibold">{formatPrice(data.price)}</span>
      <span className={`text-xs font-mono font-semibold ${isPos ? 'text-gain' : 'text-loss'}`}>
        {isPos ? '+' : ''}{change?.toFixed(2)}%
      </span>
    </span>
  )
}

export default function App() {
  const { data: summary, loading: summaryLoading } = useMarketSummary()
  const { data: movers, loading: moversLoading } = useTopMovers()
  const [selectedAsset, setSelectedAsset] = useState({ id: 'bitcoin', type: 'crypto', name: 'Bitcoin' })
  const [serverOnline, setServerOnline] = useState(null)

  useEffect(() => {
    fetch('/health')
      .then(r => r.json())
      .then(d => setServerOnline(d.status === 'ok'))
      .catch(() => setServerOnline(false))
  }, [])

  const handleSelectAsset = (id, type, name) => setSelectedAsset({ id, type, name })

  const tickerItems = summary?.indices ? Object.entries(summary.indices) : []
  const doubled = [...tickerItems, ...tickerItems]

  return (
    <div className="min-h-screen bg-bg text-text">

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-border bg-surface/90 backdrop-blur-md">
        <div className="max-w-[1800px] mx-auto px-6 h-14 flex items-center justify-between gap-4">

          {/* Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-violet-600 flex items-center justify-center shadow-lg shadow-accent/30">
              <Activity size={15} className="text-white" />
            </div>
            <div>
              <span className="text-sm font-bold text-text tracking-tight">MarketAgent</span>
              <span className="hidden sm:inline text-xs text-muted ml-2 font-mono">AI-Powered Intelligence</span>
            </div>
          </div>

          {/* Ticker (scrolling) */}
          {tickerItems.length > 0 && (
            <div className="flex-1 overflow-hidden mx-4">
              <div className="flex ticker-track whitespace-nowrap">
                {doubled.map(([name, data], i) => (
                  <TickerItem key={`${name}-${i}`} name={name} data={data} />
                ))}
              </div>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {serverOnline === true ? (
              <div className="flex items-center gap-1.5 bg-gain/10 border border-gain/20 rounded-full px-3 py-1">
                <div className="w-1.5 h-1.5 rounded-full bg-gain animate-pulse" />
                <span className="text-xs text-gain font-medium">Live</span>
              </div>
            ) : serverOnline === false ? (
              <div className="flex items-center gap-1.5 bg-loss/10 border border-loss/20 rounded-full px-3 py-1">
                <WifiOff size={11} className="text-loss" />
                <span className="text-xs text-loss font-medium">Offline</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-3 py-1">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                <span className="text-xs text-yellow-400 font-medium">Connecting</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <div className="max-w-[1800px] mx-auto px-6 py-5">
        <div className="flex gap-5 items-start">

          {/* LEFT: Watchlist — sticky */}
          <div className="w-[220px] flex-shrink-0 sticky top-[72px]">
            <WatchList onSelect={handleSelectAsset} selectedId={selectedAsset.id} />
          </div>

          {/* CENTER: Chart + Market Data — scrolls with page */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">

            {/* Chart */}
            <PriceChart
              assetId={selectedAsset.id}
              assetType={selectedAsset.type}
              assetName={selectedAsset.name}
            />

            {/* Market Data Grid */}
            <div className="grid grid-cols-2 gap-4">
              <NewsPanel summary={summary} loading={summaryLoading} />
            </div>

            {/* Top Movers */}
            <div className="bg-surface border border-border rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border">
                <div className="w-6 h-6 rounded-md bg-accent/15 flex items-center justify-center">
                  <Zap size={12} className="text-accent" />
                </div>
                <span className="text-sm font-semibold text-text">Top Movers</span>
                <span className="text-xs text-muted ml-1 font-mono">24h</span>
              </div>
              {moversLoading ? (
                <div className="p-4 grid grid-cols-3 gap-2 lg:grid-cols-6">
                  {[1,2,3,4,5,6].map(i => (
                    <div key={i} className="h-16 skeleton rounded-xl" />
                  ))}
                </div>
              ) : movers ? (
                <div className="p-4 space-y-4">
                  <div>
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <TrendingUp size={11} className="text-gain" />
                      <span className="text-xs text-gain font-semibold tracking-wide uppercase">Gainers</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {(movers.gainers || []).map(a => <MoverCard key={a.ticker} asset={a} />)}
                    </div>
                  </div>
                  <div className="border-t border-border pt-4">
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <TrendingDown size={11} className="text-loss" />
                      <span className="text-xs text-loss font-semibold tracking-wide uppercase">Losers</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {(movers.losers || []).map(a => <MoverCard key={a.ticker} asset={a} />)}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted p-5">Unable to load movers</p>
              )}
            </div>
          </div>

          {/* RIGHT: Chat — sticky */}
          <div className="w-[400px] flex-shrink-0 sticky top-[72px]" style={{ height: 'calc(100vh - 88px)' }}>
            <Chat />
          </div>

        </div>
      </div>
    </div>
  )
}
