import React, { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts'
import { getStockHistory, getCryptoHistory } from '../api/client'
import { Activity } from 'lucide-react'

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
      <div className="bg-gray-900 border border-border rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs text-subtext mb-1">{label}</p>
        <p className="text-sm font-mono font-semibold text-text">{formatPrice(payload[0]?.value)}</p>
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
        const mapped = (raw.data || []).map(d => ({
          date: d.date.substring(0, 10),
          price: d.price,
        }))
        setChartData(mapped)
        if (mapped.length >= 2) {
          setIsUp(mapped[mapped.length - 1].price >= mapped[0].price)
        }
      } else {
        raw = await getStockHistory(assetId, period)
        const mapped = (raw.data || []).map(d => ({
          date: d.date,
          price: d.close,
        }))
        setChartData(mapped)
        if (mapped.length >= 2) {
          setIsUp(mapped[mapped.length - 1].price >= mapped[0].price)
        }
      }
    } catch (e) {
      setError('Failed to load chart data')
    } finally {
      setLoading(false)
    }
  }

  const periods = assetType === 'crypto' ? CRYPTO_DAYS : STOCK_PERIODS
  const lineColor = isUp ? '#10b981' : '#ef4444'
  const currentPrice = chartData.length > 0 ? chartData[chartData.length - 1].price : null
  const startPrice = chartData.length > 0 ? chartData[0].price : null
  const changeAbs = (currentPrice && startPrice) ? currentPrice - startPrice : null
  const changePct = (changeAbs && startPrice) ? (changeAbs / startPrice) * 100 : null

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-accent" />
            <span className="text-sm font-semibold text-text">{assetName || assetId}</span>
          </div>
          {currentPrice !== null && (
            <div className="mt-1 flex items-baseline gap-3">
              <span className="price-mono text-2xl font-bold text-text">{formatPrice(currentPrice)}</span>
              {changePct !== null && (
                <span className={`text-sm font-mono font-medium ${isUp ? 'text-gain' : 'text-loss'}`}>
                  {isUp ? '+' : ''}{changePct.toFixed(2)}%
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-1">
          {periods.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`
                px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors
                ${period === p.value
                  ? 'bg-accent text-white'
                  : 'text-subtext hover:text-text hover:bg-gray-700/50'
                }
              `}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-52 flex items-center justify-center">
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="h-52 flex items-center justify-center text-sm text-loss">{error}</div>
      ) : chartData.length === 0 ? (
        <div className="h-52 flex items-center justify-center text-sm text-muted">No data available</div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={lineColor} stopOpacity={0.15} />
                <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#6b7280', fontFamily: 'JetBrains Mono, monospace' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fontSize: 10, fill: '#6b7280', fontFamily: 'JetBrains Mono, monospace' }}
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
            <Line
              type="monotone"
              dataKey="price"
              stroke={lineColor}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 4, fill: lineColor, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
