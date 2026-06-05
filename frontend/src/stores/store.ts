import { create } from 'zustand'
import type { StockDNA, StockSymbol, SectorInfo, EmbeddingPoint } from '../api'

interface AppState {
  // Selection
  selectedSymbols: string[]
  selectedSector: string | null
  period: string

  // Data
  symbols: StockSymbol[]
  sectors: SectorInfo[]
  dnaProfiles: StockDNA[]
  embedding: EmbeddingPoint[]

  // UI
  loading: boolean
  error: string | null
  activeTab: 'dna' | 'sector' | 'compare' | 'pulse' | 'trader'

  // Actions
  toggleSymbol: (symbol: string) => void
  clearSymbols: () => void
  setSelectedSector: (sector: string | null) => void
  setPeriod: (period: string) => void
  setSymbols: (symbols: StockSymbol[]) => void
  setSectors: (sectors: SectorInfo[]) => void
  addDNAProfile: (dna: StockDNA) => void
  clearDNAProfiles: () => void
  setEmbedding: (embedding: EmbeddingPoint[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setActiveTab: (tab: 'dna' | 'sector' | 'compare' | 'pulse' | 'trader') => void
}

export const useAppStore = create<AppState>((set) => ({
  selectedSymbols: [],
  selectedSector:  null,
  period:          '1y',
  symbols:         [],
  sectors:         [],
  dnaProfiles:     [],
  embedding:       [],
  loading:         false,
  error:           null,
  activeTab:       'dna',

  toggleSymbol: (symbol) => set((state) => ({
    selectedSymbols: state.selectedSymbols.includes(symbol)
      ? state.selectedSymbols.filter(s => s !== symbol)
      : [...state.selectedSymbols, symbol],
  })),
  clearSymbols:       () => set({ selectedSymbols: [] }),
  setSelectedSector:  (sector) => set({ selectedSector: sector }),
  setPeriod:          (period) => set({ period }),
  setSymbols:         (symbols) => set({ symbols }),
  setSectors:         (sectors) => set({ sectors }),
  addDNAProfile:      (dna) => set((state) => ({
    dnaProfiles: [
      ...state.dnaProfiles.filter(p => p.symbol !== dna.symbol),
      dna,
    ],
  })),
  clearDNAProfiles:   () => set({ dnaProfiles: [], embedding: [] }),
  setEmbedding:       (embedding) => set({ embedding }),
  setLoading:         (loading) => set({ loading }),
  setError:           (error) => set({ error }),
  setActiveTab:       (tab) => set({ activeTab: tab }),
}))