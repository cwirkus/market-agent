import React, { useState, useEffect } from 'react'
import Scanner from './components/Scanner'
import PriceChart from './components/PriceChart'
import Chat from './components/Chat'
import { useTrending } from './hooks/useMarket'
import { TrendingUp, TrendingDown, BarChart2, MessageSquare, Zap } from 'lucide-react'

// ─── helpers ────────────────────────────────────────────────────────────────

function fmtPrice(p) {
  if (!p && p !== 0) return '—'
  if (p >= 1000) return '$' + p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (p >= 1)    return '$' + p.toFixed(4)
  if (p >= 0.01) return '$' + p.toFixed(5)
  return '$' + p.toFixed(8)
}

function fmt(n) {
  if (!n) return '—'
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B'
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M'
  return '$' + (n / 1e3).toFixed(0) + 'K'
}

// ─── trending panel ──────────────────────────────────────────────────────────

function TrendingPanel() {
  const { data, loading, error, refetch } = useTrending()

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton h-24 rounded border border-border" />
        ))}
      </div>
    )
  }

  if (error) {
    return <p className="text-loss text-sm py-8 text-center">Failed to load trending coins.</p>
  }

  const coins = data?.trending ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-text">Trending Now</h2>
          <p className="text-[11px] text-subtext mt-0.5">What traders are searching — CoinGecko trending</p>
        </div>
        <button
          onClick={refetch}
          className="text-[11px] text-subtext hover:text-text border border-border px-3 py-1.5 rounded transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {coins.map((coin, i) => {
          const pos = coin.change_24h >= 0
          return (
            <div
              key={coin.id}
              className="border border-border bg-surface rounded p-4 hover:border-border2 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="num text-[10px] text-muted">#{i + 1}</span>
                    <span className="text-xs font-bold text-text num tracking-wider">{coin.symbol}</span>
                  </div>
                  <div className="text-[11px] text-subtext mt-0.5">{coin.name}</div>
                </div>
                <span className={`text-[10px] font-semibold num ${pos ? 'text-gain' : 'text-loss'}`}>
                  {pos ? '+' : ''}{coin.change_24h?.toFixed(2)}%
                </span>
              </div>
              <div className="num text-sm font-semibold text-text">{fmtPrice(coin.price)}</div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-muted">MCap</span>
                <span className="num text-[11px] text-subtext">{fmt(coin.market_cap)}</span>
              </div>
              {coin.rank && (
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-muted">Rank</span>
                  <span className="num text-[11px] text-subtext">#{coin.rank}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {data?.timestamp && (
        <p className="text-[11px] text-muted num">{data.timestamp}</p>
      )}
    </div>
  )
}

// ─── tab definitions ─────────────────────────────────────────────────────────

const TABS = [
  { key: 'scanner',  label: 'Scanner',  icon: Zap },
  { key: 'trending', label: 'Trending', icon: TrendingUp },
  { key: 'chart',    label: 'Chart',    icon: BarChart2 },
  { key: 'ai',       label: 'AI',       icon: MessageSquare },
]

// ─── main app ────────────────────────────────────────────────────────────────

export default function App() {
  const [tab, setTab]             = useState('scanner')
  const [serverOnline, setOnline] = useState(null)
  const [chartAsset, setChartAsset] = useState({ id: 'bitcoin', type: 'crypto', name: 'Bitcoin' })
  const [aiPrompt, setAiPrompt]   = useState(null)  // triggers AI chat with pre-filled message

  useEffect(() => {
    fetch('/health')
      .then(r => r.json())
      .then(d => setOnline(d.status === 'ok'))
      .catch(() => setOnline(false))
  }, [])

  function handleAnalyze(coin) {
    setAiPrompt(`Give me a detailed analysis of ${coin.name} (${coin.symbol}). Include: current price momentum, whether the volume spike is significant (Vol/MCap: ${coin.vol_mcap_ratio}), what the 24h move of ${coin.change_24h}% suggests, and whether this looks like a genuine opportunity or a pump to avoid.`)
    setTab('ai')
  }

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col">

      {/* ── Header ── */}
      <header className="flex-shrink-0 border-b border-border bg-surface">
        <div className="max-w-[1600px] mx-auto px-5 h-12 flex items-center gap-6">

          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-6 h-6 flex items-center justify-center">
              <TrendingDown size={16} className="text-gain" style={{ transform: 'scaleY(-1)' }} />
            </div>
            <span className="text-sm font-bold text-text tracking-tight">SCOUT</span>
            <span className="text-[10px] text-muted ml-1 tracking-widest uppercase">Terminal</span>
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-border flex-shrink-0" />

          {/* Tabs */}
          <nav className="flex items-center gap-0 h-full">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`
                  flex items-center gap-1.5 px-4 h-12 text-xs font-medium
                  border-b-2 transition-colors
                  ${tab === key
                    ? 'border-gain text-text'
                    : 'border-transparent text-subtext hover:text-text'
                  }
                `}
              >
                <Icon size={12} />
                {label}
              </button>
            ))}
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Status */}
          {serverOnline === true && (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-gain" />
              <span className="text-[11px] text-subtext">Live</span>
            </div>
          )}
          {serverOnline === false && (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-loss" />
              <span className="text-[11px] text-loss">Offline</span>
            </div>
          )}
          {serverOnline === null && (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse" />
              <span className="text-[11px] text-subtext">Connecting</span>
            </div>
          )}
        </div>
      </header>

      {/* ── Content ── */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-5 py-5">

        {/* Scanner tab */}
        {tab === 'scanner' && (
          <div>
            <div className="flex items-end justify-between mb-4">
              <div>
                <h1 className="text-base font-bold text-text tracking-tight">Opportunity Scanner</h1>
                <p className="text-[11px] text-subtext mt-0.5">
                  Small &amp; mid-cap coins ranked 101–400 by market cap · sorted by 24h momentum
                </p>
              </div>
            </div>
            <Scanner onAnalyze={handleAnalyze} />
          </div>
        )}

        {/* Trending tab */}
        {tab === 'trending' && (
          <div>
            <div className="mb-4">
              <h1 className="text-base font-bold text-text tracking-tight">Trending Coins</h1>
              <p className="text-[11px] text-subtext mt-0.5">
                Most searched coins on CoinGecko right now
              </p>
            </div>
            <TrendingPanel />
          </div>
        )}

        {/* Chart tab */}
        {tab === 'chart' && (
          <div>
            <div className="mb-4">
              <h1 className="text-base font-bold text-text tracking-tight">Price Chart</h1>
              <p className="text-[11px] text-subtext mt-0.5">Historical price data</p>
            </div>
            <div className="max-w-[900px]">
              <PriceChart
                assetId={chartAsset.id}
                assetType={chartAsset.type}
                assetName={chartAsset.name}
              />
            </div>
          </div>
        )}

        {/* AI tab */}
        {tab === 'ai' && (
          <div>
            <div className="mb-4">
              <h1 className="text-base font-bold text-text tracking-tight">AI Analyst</h1>
              <p className="text-[11px] text-subtext mt-0.5">
                Ask about any coin, stock, or market condition
              </p>
            </div>
            <div className="max-w-[780px]" style={{ height: 'calc(100vh - 160px)' }}>
              <Chat initialMessage={aiPrompt} onPromptConsumed={() => setAiPrompt(null)} />
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
