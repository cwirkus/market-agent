import { useState, useEffect, useCallback } from 'react'
import { getMarketSummary, getTopMovers, getStockData, getCryptoData, getTrending, getScanner } from '../api/client'

function makeHook(fetcher, refreshMs = 60000) {
  return function useHook(...args) {
    const [data, setData]       = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError]     = useState(null)

    const refetch = useCallback(async () => {
      try {
        setLoading(true)
        const res = await fetcher(...args)
        setData(res)
        setError(null)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(args)])

    useEffect(() => {
      refetch()
      if (refreshMs) {
        const id = setInterval(refetch, refreshMs)
        return () => clearInterval(id)
      }
    }, [refetch])

    return { data, loading, error, refetch }
  }
}

export function useMarketSummary() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const refetch = useCallback(async () => {
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
    refetch()
    const id = setInterval(refetch, 60000)
    return () => clearInterval(id)
  }, [refetch])

  return { data, loading, error, refetch }
}

export function useTopMovers() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const refetch = useCallback(async () => {
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
    refetch()
    const id = setInterval(refetch, 60000)
    return () => clearInterval(id)
  }, [refetch])

  return { data, loading, error, refetch }
}

export function useAssetPrice(assetId, assetType) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const refetch = useCallback(async () => {
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
    refetch()
  }, [refetch])

  return { data, loading, error, refetch }
}

export function useTrending() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const refetch = useCallback(async () => {
    try {
      setLoading(true)
      const res = await getTrending()
      setData(res)
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
    const id = setInterval(refetch, 120000)
    return () => clearInterval(id)
  }, [refetch])

  return { data, loading, error, refetch }
}

export function useScanner() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const refetch = useCallback(async () => {
    try {
      setLoading(true)
      const res = await getScanner()
      setData(res)
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
    const id = setInterval(refetch, 120000)
    return () => clearInterval(id)
  }, [refetch])

  return { data, loading, error, refetch }
}
