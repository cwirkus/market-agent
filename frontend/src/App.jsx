import React, { useState, useEffect } from 'react'
import Chat from './components/Chat'
import PriceChart from './components/PriceChart'
import WatchList from './components/WatchList'
import NewsPanel from './components/NewsPanel'
import { useMarketSummary, useTopMovers } from './hooks/useMarket'
import { TrendingUp, TrendingDown, Activity, BarChart2, Zap } from 'lucide-react'

function formatPrice(price) {
  if (price === null || price === undefined) return '—'
  if (price >= 1000) return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (price >= 1) return '$' + price.toFixed(2)
  return '$' + price.toFixed(4)
}

function MoverCard({ asset, type }) {
  const isPositive = (asset.change_pct ?? 0) >= 0
  return (
    <div className="bg-gray-900/60 border border-border rounded-lg px-3 py-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-semibold text-accent">{asset.ticker}</span>
        <span className={`text-xs font-mono font-bold ${isPositive ? 'text-gain' : 'text-loss'}`}>
          {isPositive ? '+' : ''}{asset.change_pct?.toFixed(2)}%
        </span>
      </div>
      <div className="text-xs text-subtext mt-0.5 price-mono">{formatPrice(asset.price)}</div>
    </div>
  )
}

export default function App() {
  const { data: summary, loading: summaryLoading } = useMarketSummary()
  const { data: movers, loading: moversLoading } = useTopMovers()
  const [selectedAsset, setSelectedAsset] = useState({
    id: 'bitcoin',
    type: 'crypto',
    name: 'Bitcoin',
  })
  const [serverOnline, setServerOnline] = useState(null)

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8001'}/health`)
      .then(r => r.json())
      .then(d => setServerOnline(d.status === 'ok'))
      .catch(() => setServerOnline(false))
  }, [])

  const handleSelectAsset = (id, type, name) => {
    setSelectedAsset({ id, type, name })
  }

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* Navbar */}
      <nav className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <Activity size={16} className="text-white" />
            </div>
            <div>
              <span className="text-sm font-bold text-text tracking-tight">MarketAgent</span>
              <span className="text-xs text-muted ml-2 font-mono hidden sm:inline">AI-Powered Market Intelligence</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Compact index bar */}
            {summary?.indices && Object.entries(summary.indices).map(([name, data]) => {
              if (!data || !data.price) return null
              const change = data.change_pct ?? 0
              const isPos = change >= 0
              return (
                <div key={name} className="hidden lg:flex items-center gap-2">
                  <span className="text-xs text-muted font-mono">{name.replace(' Jones', '')}</span>
                  <span className="text-xs price-mono text-text font-semibold">{formatPrice(data.price)}</span>
                  <span className={`text-xs font-mono ${isPos ? 'text-gain' : 'text-loss'}`}>
                    {isPos ? '+' : ''}{change?.toFixed(2)}%
                  </span>
                </div>
              )
            })}

            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${serverOnline === true ? 'bg-gain animate-pulse' : serverOnline === false ? 'bg-loss' : 'bg-yellow-500 animate-pulse'}`} />
              <span className="text-xs text-muted">
                {serverOnline === true ? 'Live' : serverOnline === false ? 'Offline' : 'Connecting'}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-[1600px] mx-auto px-6 py-5">
        <div className="flex gap-5 h-[calc(100vh-80px)]">

          {/* LEFT COLUMN */}
          <div className="flex-1 min-w-0 flex flex-col gap-4 overflow-y-auto pr-1">

            {/* Market Summary Row */}
            <div>
              <NewsPanel summary={summary} loading={summaryLoading} />
            </div>

            {/* Price Chart */}
            <PriceChart
              assetId={selectedAsset.id}
              assetType={selectedAsset.type}
              assetName={selectedAsset.name}
            />

            {/* Top Movers */}
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <Zap size={13} className="text-accent" />
                <span className="text-sm font-semibold text-text">Top Movers</span>
                <span className="text-xs text-muted ml-1">Today</span>
              </div>
              {moversLoading ? (
                <div className="p-4">
                  <div className="grid grid-cols-3 gap-2">
                    {[1,2,3,4,5,6].map(i => (
                      <div key={i} className="h-14 bg-gray-800 rounded-lg animate-pulse" />
                    ))}
                  </div>
                </div>
              ) : movers ? (
                <div className="p-4 space-y-3">
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <TrendingUp size={11} className="text-gain" />
                      <span className="text-xs text-gain font-semibold">Top Gainers</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {(movers.gainers || []).map(a => <MoverCard key={a.ticker} asset={a} />)}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <TrendingDown size={11} className="text-loss" />
                      <span className="text-xs text-loss font-semibold">Top Losers</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {(movers.losers || []).map(a => <MoverCard key={a.ticker} asset={a} />)}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted p-4">Unable to load movers</p>
              )}
            </div>

            {/* Watchlist */}
            <WatchList onSelect={handleSelectAsset} selectedId={selectedAsset.id} />
          </div>

          {/* RIGHT COLUMN — Chat */}
          <div className="w-[420px] flex-shrink-0 flex flex-col">
            <Chat />
          </div>
        </div>
      </div>
    </div>
  )
}
