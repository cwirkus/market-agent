import axios from 'axios'

const api = axios.create({
  baseURL: '',
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
})

export const sendChat = (message, session_id = 'default') =>
  api.post('/api/chat', { message, session_id }).then(r => r.data)

export const resetChat = () =>
  api.post('/api/chat/reset').then(r => r.data)

export const getMarketSummary = () =>
  api.get('/api/market/summary').then(r => r.data)

export const getTopMovers = () =>
  api.get('/api/market/top-movers').then(r => r.data)

export const getTrending = () =>
  api.get('/api/market/trending').then(r => r.data)

export const getScanner = (params = {}) =>
  api.get('/api/market/scanner', { params }).then(r => r.data)

export const getStockData = (ticker) =>
  api.get(`/api/stock/${ticker}`).then(r => r.data)

export const getCryptoData = (coinId) =>
  api.get(`/api/crypto/${coinId}`).then(r => r.data)

export const getStockHistory = (ticker, period = '1mo') =>
  api.get(`/api/stock/${ticker}/history`, { params: { period } }).then(r => r.data)

export const getCryptoHistory = (coinId, days = 30) =>
  api.get(`/api/crypto/${coinId}/history`, { params: { days } }).then(r => r.data)

export const calculatePortfolio = (holdings) =>
  api.post('/api/portfolio/value', { holdings }).then(r => r.data)

export default api
