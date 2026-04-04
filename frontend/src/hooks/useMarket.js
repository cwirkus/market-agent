import { useState, useEffect, useCallback } from 'react'
import { getMarketSummary, getTopMovers, getStockData, getCryptoData } from '../api/client'

export function useMarketSummary() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    try {
      setLoading(true)
      const res = await getMarketSummary()
      setData(res)
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
    const interval = setInterval(fetch, 60000)
    return () => clearInterval(interval)
  }, [fetch])

  return { data, loading, error, refetch: fetch }
}

export function useTopMovers() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    try {
      setLoading(true)
      const res = await getTopMovers()
      setData(res)
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
    const interval = setInterval(fetch, 60000)
    return () => clearInterval(interval)
  }, [fetch])

  return { data, loading, error, refetch: fetch }
}

export function useAssetPrice(assetId, assetType) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    if (!assetId) return
    try {
      setLoading(true)
      const res = assetType === 'crypto' ? await getCryptoData(assetId) : await getStockData(assetId)
      setData(res)
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [assetId, assetType])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { data, loading, error, refetch: fetch }
}
