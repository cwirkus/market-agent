import React, { useState, useEffect } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts'
import { getStockHistory, getCryptoHistory } from '../api/client'
import { TrendingUp, TrendingDown } from 'lucide-react'

const STOCK_PERIODS = [
  { label: '1D', value: '1d' },
  { label: '1W', value: '5d' },
  { label: '1M', value: '1mo' },
  { label: '3M', value: '3mo' },
  { label: '6M', value: '6mo' },
  { label: '1Y', value: '1y' },
]

const CRYPTO_DAYS = [
  { label: '1D', value: 1 },
  { label: '1W', value: 7 },
  { label: '1M', value: 30 },
  { label: '3M', value: 90 },
  { label: '1Y', value: 365 },
]

function formatPrice(price) {
  if (!price) return '—'
  if (price >= 1000) return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (price >= 1) return '$' + price.toFixed(2)
  return '$' + price.toFixed(6)
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0d1117] border border-[#1e2433] rounded-xl px-3.5 py-2.5 shadow-2xl">
        <p className="text-xs text-[#475569] mb-1 font-mono">{label}</p>
        <p className="text-sm font-mono font-bold text-[#e2e8f0]">{formatPrice(payload[0]?.value)}</p>
      </div>
    )
  }
  return null
}

export default function PriceChart({ assetId, assetType, assetName }) {
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState(assetType === 'crypto' ? 30 : '1mo')
  const [isUp, setIsUp] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!assetId) return
    fetchData()
  }, [assetId, assetType, period])

  async function fetchData() {
    setLoading(true)
    setError(null)
    try {
      let raw
      if (assetType === 'crypto') {
        raw = await getCryptoHistory(assetId, period)
        const mapped = (raw.data || []).map(d => ({ date: d.date.substring(0, 10), price: d.price }))
        setChartData(mapped)
        if (mapped.length >= 2) setIsUp(mapped[mapped.length - 1].price >= mapped[0].price)
      } else {
        raw = await getStockHistory(assetId, period)
        const mapped = (raw.data || []).map(d => ({ date: d.date, price: d.close }))
        setChartData(mapped)
        if (mapped.length >= 2) setIsUp(mapped[mapped.length - 1].price >= mapped[0].price)
      }
    } catch {
      setError('Failed to load chart data')
    } finally {
      setLoading(false)
    }
  }

  const periods = assetType === 'crypto' ? CRYPTO_DAYS : STOCK_PERIODS
  const lineColor = isUp ? '#10b981' : '#f43f5e'
  const gradientId = isUp ? 'gradientGain' : 'gradientLoss'
  const currentPrice = chartData.length > 0 ? chartData[chartData.length - 1].price : null
  const startPrice = chartData.length > 0 ? chartData[0].price : null
  const changeAbs = (currentPrice && startPrice) ? currentPrice - startPrice : null
  const changePct = (changeAbs && startPrice) ? (changeAbs / startPrice) * 100 : null

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 flex-shrink-0">
      {/* Chart Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="text-xs text-muted font-mono uppercase tracking-widest mb-1">{assetType}</div>
          <div className="text-xl font-bold text-text">{assetName || assetId}</div>
          {currentPrice !== null && (
            <div className="flex items-baseline gap-3 mt-1.5">
              <span className="price-mono text-3xl font-bold text-text">{formatPrice(currentPrice)}</span>
              {changePct !== null && (
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-sm font-mono font-bold ${
                  isUp ? 'bg-gain/10 text-gain' : 'bg-loss/10 text-loss'
                }`}>
                  {isUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  {isUp ? '+' : ''}{changePct.toFixed(2)}%
                </div>
              )}
            </div>
          )}
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-1 bg-surface2/60 border border-border rounded-xl p-1">
          {periods.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`
                px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all
                ${period === p.value
                  ? 'bg-accent text-white shadow-sm shadow-accent/30'
                  : 'text-muted hover:text-subtext hover:bg-surface2'
                }
              `}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      {loading ? (
        <div className="h-52 flex items-center justify-center">
          <div className="flex gap-2 items-center">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="h-52 flex items-center justify-center text-sm text-loss/80">{error}</div>
      ) : chartData.length === 0 ? (
        <div className="h-52 flex items-center justify-center text-sm text-muted">No data available</div>
      ) : (
        <ResponsiveContainer width="100%" height={210}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradientGain" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradientLoss" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#475569', fontFamily: 'JetBrains Mono, monospace' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fontSize: 10, fill: '#475569', fontFamily: 'JetBrains Mono, monospace' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => {
                if (v >= 1000) return '$' + (v / 1000).toFixed(1) + 'k'
                if (v >= 1) return '$' + v.toFixed(0)
                return '$' + v.toFixed(4)
              }}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="price"
              stroke={lineColor}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 4, fill: lineColor, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
