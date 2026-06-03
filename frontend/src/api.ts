import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000',
  timeout: 120000,
})

// --- Types ---

export interface StockSymbol {
  symbol: string
  sector: string
  sector_color: string
}

export interface SectorInfo {
  sector: string
  color: string
  stocks: string[]
}

export interface SignatureChannel {
  name: string
  label: string
  unit: string
  values: number[]
  raw_min: number
  raw_max: number
}

export interface StyleDimension {
  name: string
  label: string
  value: number
}

export interface StockDNA {
  symbol: string
  name: string
  sector: string
  sector_color: string
  period: string
  data_points: number
  latest_price: number
  price_change_1y: number
  dates: string[]
  channels: SignatureChannel[]
  style_dimensions: StyleDimension[]
}

export interface EmbeddingPoint {
  symbol: string
  name: string
  sector: string
  sector_color: string
  x: number
  y: number
  latest_price: number
  price_change_1y: number
  style_dimensions: StyleDimension[]
}

// --- API calls ---

export const getSymbols = async (): Promise<StockSymbol[]> => {
  const res = await client.get('/api/stocks/symbols')
  return res.data
}

export const getSectors = async (): Promise<SectorInfo[]> => {
  const res = await client.get('/api/stocks/sectors')
  return res.data
}

export const getStockDNA = async (
  symbol: string,
  period: string = '1y'
): Promise<StockDNA> => {
  const res = await client.get(`/api/stocks/dna/${symbol}?period=${period}`)
  return res.data
}

export const compareStocks = async (
  symbols: string[],
  period: string = '1y'
): Promise<{ profiles: StockDNA[]; embedding: EmbeddingPoint[] }> => {
  const params = symbols.map(s => `symbols=${s}`).join('&')
  const res = await client.get(`/api/stocks/compare?${params}&period=${period}`)
  return res.data
}

export const getSectorDNA = async (
  sector: string,
  period: string = '1y'
): Promise<{ sector: string; profiles: StockDNA[]; embedding: EmbeddingPoint[] }> => {
  const res = await client.get(`/api/stocks/sector-dna/${sector}?period=${period}`)
  return res.data
}