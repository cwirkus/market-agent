import React, { useState, useMemo } from 'react'
import { RefreshCw, ChevronUp, ChevronDown, ChevronsUpDown, Search } from 'lucide-react'
import { useScanner } from '../hooks/useMarket'

function fmt(n) {
  if (n === null || n === undefined) return '—'
  if (n >= 1e9)  return '$' + (n / 1e9).toFixed(2) + 'B'
  if (n >= 1e6)  return '$' + (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3)  return '$' + (n / 1e3).toFixed(1) + 'K'
  return '$' + n.toFixed(2)
}

function fmtPrice(p) {
  if (!p && p !== 0) return '—'
  if (p >= 1000) return '$' + p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (p >= 1)    return '$' + p.toFixed(4)
  if (p >= 0.01) return '$' + p.toFixed(5)
  return '$' + p.toFixed(8)
}

function Pct({ v }) {
  if (v === null || v === undefined) return <span className="text-subtext num">—</span>
  const pos = v >= 0
  return (
    <span className={`num font-medium ${pos ? 'text-gain' : 'text-loss'}`}>
      {pos ? '+' : ''}{v.toFixed(2)}%
    </span>
  )
}

function Signal({ s }) {
  if (!s) return null
  const cls = {
    BREAKOUT: 'sig-breakout',
    HOT:      'sig-hot',
    GEM:      'sig-gem',
    SURGE:    'sig-surge',
  }[s] || ''
  return (
    <span className={`text-[10px] font-bold tracking-widest px-2 py-0.5 rounded ${cls}`}>
      {s}
    </span>
  )
}

function SortIcon({ col, sortBy, dir }) {
  if (sortBy !== col) return <ChevronsUpDown size={11} className="text-muted ml-1 inline" />
  return dir === 'desc'
    ? <ChevronDown size={11} className="text-gain ml-1 inline" />
    : <ChevronUp   size={11} className="text-gain ml-1 inline" />
}

const MCAP_FILTERS = [
  { key: 'all',   label: 'All caps' },
  { key: 'micro', label: 'Micro  <$100M' },
  { key: 'small', label: 'Small  $100M–$500M' },
  { key: 'mid',   label: 'Mid  $500M–$2B' },
]

const CHANGE_FILTERS = [
  { key: 0,  label: 'Any move' },
  { key: 3,  label: '+3%+' },
  { key: 8,  label: '+8%+' },
  { key: 20, label: '+20%+' },
]

const SORT_COLS = [
  { key: 'change_24h',    label: '24H' },
  { key: 'change_7d',     label: '7D' },
  { key: 'vol_mcap_ratio', label: 'V/MC' },
  { key: 'market_cap',    label: 'MCap' },
]

export default function Scanner({ onAnalyze }) {
  const { data, loading, error, refetch } = useScanner()

  const [mcapFilter, setMcapFilter] = useState('all')
  const [minChange,  setMinChange]  = useState(0)
  const [sortBy,     setSortBy]     = useState('change_24h')
  const [sortDir,    setSortDir]    = useState('desc')
  const [search,     setSearch]     = useState('')

  function handleSort(col) {
    if (sortBy === col) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(col)
      setSortDir('desc')
    }
  }

  const rows = useMemo(() => {
    if (!data?.coins) return []
    let list = [...data.coins]

    // MCap filter
    if (mcapFilter === 'micro') list = list.filter(c => c.market_cap < 100_000_000)
    else if (mcapFilter === 'small') list = list.filter(c => c.market_cap >= 100_000_000 && c.market_cap < 500_000_000)
    else if (mcapFilter === 'mid')   list = list.filter(c => c.market_cap >= 500_000_000 && c.market_cap <= 2_000_000_000)

    // Min 24h change
    if (minChange !== 0) list = list.filter(c => c.change_24h >= minChange)

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(c =>
        c.name?.toLowerCase().includes(q) || c.symbol?.toLowerCase().includes(q)
      )
    }

    // Sort
    list.sort((a, b) => {
      const av = a[sortBy] ?? 0
      const bv = b[sortBy] ?? 0
      return sortDir === 'desc' ? bv - av : av - bv
    })

    return list
  }, [data, mcapFilter, minChange, search, sortBy, sortDir])

  function ThCol({ col, children }) {
    return (
      <th
        className="px-3 py-2.5 text-left text-[11px] font-semibold text-subtext uppercase tracking-wider cursor-pointer select-none whitespace-nowrap hover:text-text transition-colors"
        onClick={() => handleSort(col)}
      >
        {children}
        <SortIcon col={col} sortBy={sortBy} dir={sortDir} />
      </th>
    )
  }

  return (
    <div className="flex flex-col gap-3">

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">

        {/* Search */}
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search coin..."
            className="h-8 pl-7 pr-3 bg-surface border border-border rounded text-xs text-text placeholder-muted focus:outline-none focus:border-border2 w-36"
          />
        </div>

        {/* MCap filter */}
        <div className="flex items-center gap-1">
          {MCAP_FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setMcapFilter(f.key)}
              className={`h-8 px-3 rounded text-[11px] font-medium transition-colors whitespace-nowrap
                ${mcapFilter === f.key
                  ? 'bg-surface2 border border-border2 text-text'
                  : 'text-subtext hover:text-text border border-transparent'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Min change filter */}
        <div className="flex items-center gap-1">
          {CHANGE_FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setMinChange(f.key)}
              className={`h-8 px-3 rounded text-[11px] font-medium transition-colors whitespace-nowrap
                ${minChange === f.key
                  ? 'bg-surface2 border border-border2 text-gain'
                  : 'text-subtext hover:text-text border border-transparent'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Spacer + right side */}
        <div className="flex-1" />

        {data?.timestamp && (
          <span className="text-[11px] text-muted num">
            {data.timestamp}
          </span>
        )}

        <button
          onClick={refetch}
          disabled={loading}
          className="h-8 px-3 flex items-center gap-1.5 border border-border rounded text-[11px] text-subtext hover:text-text hover:border-border2 transition-colors disabled:opacity-40"
        >
          <RefreshCw size={11} className={loading ? 'spin-slow' : ''} />
          Refresh
        </button>
      </div>

      {/* Signal legend */}
      <div className="flex items-center gap-3 text-[10px]">
        <span className="text-muted uppercase tracking-wider font-medium">Signals:</span>
        <span className="sig-breakout px-2 py-0.5 rounded font-bold tracking-wider">BREAKOUT</span>
        <span className="text-subtext">24h &gt;20%</span>
        <span className="sig-hot px-2 py-0.5 rounded font-bold tracking-wider">HOT</span>
        <span className="text-subtext">24h &gt;8% + high vol</span>
        <span className="sig-gem px-2 py-0.5 rounded font-bold tracking-wider">GEM</span>
        <span className="text-subtext">MCap &lt;$100M + moving</span>
        <span className="sig-surge px-2 py-0.5 rounded font-bold tracking-wider">SURGE</span>
        <span className="text-subtext">Vol/MCap &gt;0.8</span>
      </div>

      {/* Table */}
      <div className="border border-border rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-surface border-b border-border">
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-subtext uppercase tracking-wider w-12">#</th>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-subtext uppercase tracking-wider">Name</th>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-subtext uppercase tracking-wider">Price</th>
                <ThCol col="change_24h">24H %</ThCol>
                <ThCol col="change_7d">7D %</ThCol>
                <ThCol col="market_cap">MCap</ThCol>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-subtext uppercase tracking-wider">Vol 24H</th>
                <ThCol col="vol_mcap_ratio">V/MC</ThCol>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-subtext uppercase tracking-wider">Signal</th>
                <th className="px-3 py-2.5 text-right text-[11px] font-semibold text-subtext uppercase tracking-wider">AI</th>
              </tr>
            </thead>
            <tbody>
              {loading && !data && (
                <>
                  <tr>
                    <td colSpan={10} className="px-4 pt-6 pb-1 text-center">
                      <div className="flex items-center justify-center gap-2 text-xs text-subtext">
                        <RefreshCw size={12} className="spin-slow text-gain" />
                        Fetching coins from CoinGecko — this takes ~15s on first load...
                      </div>
                    </td>
                  </tr>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/50">
                      {Array.from({ length: 10 }).map((_, j) => (
                        <td key={j} className="px-3 py-3">
                          <div className="skeleton h-3.5 rounded w-full" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </>
              )}

              {!loading && error && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-loss text-sm">
                    Failed to load scanner data. {error}
                  </td>
                </tr>
              )}

              {!loading && !error && rows.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-subtext text-sm">
                    No coins match the current filters.
                  </td>
                </tr>
              )}

              {rows.map((coin, idx) => (
                <tr key={coin.id} className="scanner-row border-b border-border/50 transition-colors">
                  <td className="px-3 py-2.5">
                    <span className="num text-muted text-[11px]">{coin.rank ?? idx + 101}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-col">
                      <span className="font-semibold text-text text-xs">{coin.name}</span>
                      <span className="num text-muted text-[10px] tracking-wider">{coin.symbol}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="num text-text text-xs">{fmtPrice(coin.price)}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <Pct v={coin.change_24h} />
                  </td>
                  <td className="px-3 py-2.5">
                    <Pct v={coin.change_7d} />
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="num text-text text-xs">{fmt(coin.market_cap)}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="num text-subtext text-xs">{fmt(coin.volume_24h)}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`num text-xs font-medium ${coin.vol_mcap_ratio >= 0.5 ? 'text-amber' : 'text-subtext'}`}>
                      {coin.vol_mcap_ratio?.toFixed(2) ?? '—'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <Signal s={coin.signal} />
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button
                      onClick={() => onAnalyze && onAnalyze(coin)}
                      className="text-[11px] text-blue hover:text-text border border-border hover:border-border2 px-2 py-0.5 rounded transition-colors"
                    >
                      Analyze
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rows.length > 0 && (
          <div className="px-4 py-2 border-t border-border bg-surface">
            <span className="text-[11px] text-muted">
              Showing {rows.length} coins · Ranked by market cap 101–400 · Data: CoinGecko
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
