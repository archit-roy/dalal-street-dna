import { useEffect, useState } from 'react'
import { useAppStore } from './stores/store'
import { getSymbols, getSectors, getStockDNA, compareStocks, getSectorDNA } from './api'
import type { EmbeddingPoint } from './api'
import SignatureChart from './components/dna/SignatureChart'
import RadarChart from './components/radar/RadarChart'
import ScatterPlot from './components/radar/ScatterPlot'

const PERIODS = [
  { value: '3mo', label: '3M' },
  { value: '6mo', label: '6M' },
  { value: '1y',  label: '1Y' },
  { value: '2y',  label: '2Y' },
  { value: '5y',  label: '5Y' },
]

export default function App() {
  const {
    selectedSymbols, selectedSector, period, symbols, sectors,
    dnaProfiles, embedding, loading, error, activeTab,
    toggleSymbol, clearSymbols, setSelectedSector, setPeriod,
    setSymbols, setSectors, addDNAProfile, clearDNAProfiles,
    setEmbedding, setLoading, setError, setActiveTab,
  } = useAppStore()

  const [loadingSymbol, setLoadingSymbol] = useState<string | null>(null)

  useEffect(() => {
    getSymbols().then(setSymbols).catch(() => setError('Failed to load symbols'))
    getSectors().then(setSectors).catch(() => setError('Failed to load sectors'))
  }, [])

  const handleAnalyse = async () => {
    if (selectedSymbols.length === 0) return
    setLoading(true)
    setError(null)
    clearDNAProfiles()
    for (const symbol of selectedSymbols) {
      setLoadingSymbol(symbol)
      try {
        const dna = await getStockDNA(symbol, period)
        addDNAProfile(dna)
      } catch (e) {
        setError(`Failed to load ${symbol}`)
      }
    }
    setLoadingSymbol(null)
    setLoading(false)
  }

  const handleCompare = async () => {
    if (selectedSymbols.length < 2) return
    setLoading(true)
    setError(null)
    try {
      const result = await compareStocks(selectedSymbols, period)
      clearDNAProfiles()
      result.profiles.forEach(addDNAProfile)
      setEmbedding(result.embedding)
    } catch (e) {
      setError('Failed to compare stocks')
    }
    setLoading(false)
  }

  const handleSectorDNA = async (sector: string) => {
    setLoading(true)
    setError(null)
    setSelectedSector(sector)
    try {
      const result = await getSectorDNA(sector, period)
      clearDNAProfiles()
      result.profiles.forEach(addDNAProfile)
      setEmbedding(result.embedding)
    } catch (e) {
      setError(`Failed to load ${sector} sector`)
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: 'white' }}>

      {/* Header */}
      <div style={{ borderBottom: '1px solid #27272a', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ color: '#22c55e', fontWeight: 900, fontSize: '1.25rem', letterSpacing: '-0.05em' }}>DALAL ST</span>
          <span style={{ color: '#3f3f46' }}>|</span>
          <span style={{ color: '#71717a', fontSize: '0.875rem' }}>Stock DNA</span>
        </div>

        {/* Period selector */}
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              style={{
                padding: '0.25rem 0.625rem',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: period === p.value ? '#22c55e' : '#27272a',
                color: period === p.value ? '#000' : '#a1a1aa',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid #27272a', display: 'flex', padding: '0 1rem' }}>
        {(['dna', 'sector', 'compare'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.75rem 1rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #22c55e' : '2px solid transparent',
              background: 'transparent',
              color: activeTab === tab ? '#22c55e' : '#71717a',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {tab === 'dna' ? 'Stock DNA' : tab === 'sector' ? 'Sector View' : 'Compare'}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* Stock DNA tab */}
        {activeTab === 'dna' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Symbol picker */}
            <div style={{ background: '#18181b', borderRadius: '0.75rem', border: '1px solid #27272a', padding: '1rem' }}>
              <p style={{ color: '#71717a', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                Pick up to 4 stocks — then hit Analyse
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.75rem' }}>
                {symbols.map(s => (
                  <button
                    key={s.symbol}
                    onClick={() => toggleSymbol(s.symbol)}
                    disabled={!selectedSymbols.includes(s.symbol) && selectedSymbols.length >= 4}
                    style={{
                      padding: '0.25rem 0.625rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      opacity: !selectedSymbols.includes(s.symbol) && selectedSymbols.length >= 4 ? 0.3 : 1,
                      background: selectedSymbols.includes(s.symbol) ? s.sector_color : '#27272a',
                      color: selectedSymbols.includes(s.symbol) ? '#fff' : '#a1a1aa',
                    }}
                  >
                    {s.symbol}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={handleAnalyse}
                  disabled={selectedSymbols.length === 0 || loading}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: selectedSymbols.length === 0 || loading ? '#14532d' : '#22c55e',
                    borderRadius: '0.5rem',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    border: 'none',
                    color: selectedSymbols.length === 0 || loading ? '#fff' : '#000',
                    cursor: selectedSymbols.length === 0 || loading ? 'not-allowed' : 'pointer',
                    opacity: selectedSymbols.length === 0 || loading ? 0.5 : 1,
                  }}
                >
                  {loading ? `Loading ${loadingSymbol}...` : 'Analyse DNA'}
                </button>

                {selectedSymbols.length >= 2 && (
                  <button
                    onClick={handleCompare}
                    disabled={loading}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: '#27272a',
                      borderRadius: '0.5rem',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      border: 'none',
                      color: '#a1a1aa',
                      cursor: loading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Compare + Scatter
                  </button>
                )}

                {selectedSymbols.length > 0 && (
                  <button
                    onClick={() => { clearSymbols(); clearDNAProfiles() }}
                    style={{
                      padding: '0.75rem',
                      background: '#27272a',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      border: 'none',
                      color: '#71717a',
                      cursor: 'pointer',
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>

              {error && <p style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '0.5rem' }}>{error}</p>}
            </div>

            {/* Scatter plot */}
            {embedding.length > 0 && (
              <div style={{ background: '#18181b', borderRadius: '0.75rem', border: '1px solid #27272a', padding: '1rem' }}>
                <ScatterPlot points={embedding} />
              </div>
            )}

            {/* Radar */}
            {dnaProfiles.length > 0 && (
              <div style={{ background: '#18181b', borderRadius: '0.75rem', border: '1px solid #27272a', padding: '1rem' }}>
                <RadarChart profiles={dnaProfiles} />
              </div>
            )}

            {/* Stock cards */}
            {dnaProfiles.map(dna => (
              <div key={dna.symbol} style={{ background: '#18181b', borderRadius: '0.75rem', border: '1px solid #27272a', padding: '1rem' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ width: '4px', height: '2.5rem', borderRadius: '9999px', background: dna.sector_color, flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontWeight: 900, fontSize: '1.125rem', fontFamily: 'monospace' }}>{dna.symbol}</p>
                    <p style={{ color: '#a1a1aa', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {dna.name} · {dna.sector}
                    </p>
                  </div>
                  <div style={{ marginLeft: 'auto', textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontFamily: 'monospace', fontWeight: 700 }}>₹{dna.latest_price.toFixed(0)}</p>
                    <p style={{ fontSize: '0.75rem', color: dna.price_change_1y >= 0 ? '#22c55e' : '#ef4444', fontFamily: 'monospace' }}>
                      {dna.price_change_1y >= 0 ? '+' : ''}{dna.price_change_1y.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Signature */}
                <SignatureChart dna={dna} />

                {/* Style bars */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginTop: '1rem' }}>
                  {dna.style_dimensions.map(dim => (
                    <div key={dim.name} style={{ background: '#27272a', borderRadius: '0.5rem', padding: '0.625rem' }}>
                      <p style={{ color: '#71717a', fontSize: '0.7rem', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dim.label}</p>
                      <div style={{ height: '6px', background: '#3f3f46', borderRadius: '9999px' }}>
                        <div style={{ height: '6px', borderRadius: '9999px', width: `${dim.value * 100}%`, background: dna.sector_color, transition: 'width 1s ease-out' }} />
                      </div>
                      <p style={{ fontSize: '0.7rem', fontFamily: 'monospace', marginTop: '0.25rem', color: '#d4d4d8' }}>
                        {(dim.value * 100).toFixed(0)}
                      </p>
                    </div>
                  ))}
                </div>

              </div>
            ))}

          </div>
        )}

        {/* Sector tab */}
        {activeTab === 'sector' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ color: '#71717a', fontSize: '0.875rem' }}>
              Pick a sector to analyse all its stocks together
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              {sectors.map(s => (
                <button
                  key={s.sector}
                  onClick={() => handleSectorDNA(s.sector)}
                  disabled={loading}
                  style={{
                    padding: '1rem',
                    background: selectedSector === s.sector ? '#1c1c1e' : '#18181b',
                    border: `1px solid ${selectedSector === s.sector ? s.color : '#27272a'}`,
                    borderRadius: '0.75rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                    <div style={{ width: '0.625rem', height: '0.625rem', borderRadius: '9999px', background: s.color }} />
                    <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.875rem' }}>{s.sector}</span>
                  </div>
                  <p style={{ color: '#71717a', fontSize: '0.7rem', fontFamily: 'monospace' }}>
                    {s.stocks.join(' · ')}
                  </p>
                </button>
              ))}
            </div>

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: '#18181b', borderRadius: '0.75rem', border: '1px solid #27272a' }}>
                <div style={{ width: '1rem', height: '1rem', borderRadius: '9999px', border: '2px solid #22c55e', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <span style={{ color: '#71717a', fontSize: '0.875rem' }}>Building sector DNA...</span>
              </div>
            )}

            {embedding.length > 0 && !loading && (
              <div style={{ background: '#18181b', borderRadius: '0.75rem', border: '1px solid #27272a', padding: '1rem' }}>
                <ScatterPlot points={embedding} />
              </div>
            )}

            {dnaProfiles.length > 0 && !loading && (
              <div style={{ background: '#18181b', borderRadius: '0.75rem', border: '1px solid #27272a', padding: '1rem' }}>
                <RadarChart profiles={dnaProfiles} />
              </div>
            )}

          </div>
        )}

        {/* Compare tab */}
        {activeTab === 'compare' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: '#18181b', borderRadius: '0.75rem', border: '1px solid #27272a', padding: '1rem' }}>
              <p style={{ color: '#71717a', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                Pick 2–4 stocks to compare side by side
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.75rem' }}>
                {symbols.map(s => (
                  <button
                    key={s.symbol}
                    onClick={() => toggleSymbol(s.symbol)}
                    disabled={!selectedSymbols.includes(s.symbol) && selectedSymbols.length >= 4}
                    style={{
                      padding: '0.25rem 0.625rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      opacity: !selectedSymbols.includes(s.symbol) && selectedSymbols.length >= 4 ? 0.3 : 1,
                      background: selectedSymbols.includes(s.symbol) ? s.sector_color : '#27272a',
                      color: selectedSymbols.includes(s.symbol) ? '#fff' : '#a1a1aa',
                    }}
                  >
                    {s.symbol}
                  </button>
                ))}
              </div>
              <button
                onClick={handleCompare}
                disabled={selectedSymbols.length < 2 || loading}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: selectedSymbols.length < 2 || loading ? '#14532d' : '#22c55e',
                  borderRadius: '0.5rem',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  border: 'none',
                  color: selectedSymbols.length < 2 || loading ? '#fff' : '#000',
                  cursor: selectedSymbols.length < 2 || loading ? 'not-allowed' : 'pointer',
                  opacity: selectedSymbols.length < 2 || loading ? 0.5 : 1,
                }}
              >
                {loading ? 'Loading...' : `Compare ${selectedSymbols.length} stocks`}
              </button>
            </div>

            {embedding.length > 0 && (
              <div style={{ background: '#18181b', borderRadius: '0.75rem', border: '1px solid #27272a', padding: '1rem' }}>
                <ScatterPlot points={embedding} />
              </div>
            )}

            {dnaProfiles.length > 0 && (
              <div style={{ background: '#18181b', borderRadius: '0.75rem', border: '1px solid #27272a', padding: '1rem' }}>
                <RadarChart profiles={dnaProfiles} />
              </div>
            )}

            {dnaProfiles.map(dna => (
              <div key={dna.symbol} style={{ background: '#18181b', borderRadius: '0.75rem', border: '1px solid #27272a', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{ width: '4px', height: '2rem', borderRadius: '9999px', background: dna.sector_color }} />
                  <div>
                    <p style={{ fontWeight: 900, fontFamily: 'monospace' }}>{dna.symbol}</p>
                    <p style={{ color: '#71717a', fontSize: '0.7rem' }}>{dna.sector}</p>
                  </div>
                  <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <p style={{ fontFamily: 'monospace', fontWeight: 700 }}>₹{dna.latest_price.toFixed(0)}</p>
                    <p style={{ fontSize: '0.7rem', color: dna.price_change_1y >= 0 ? '#22c55e' : '#ef4444', fontFamily: 'monospace' }}>
                      {dna.price_change_1y >= 0 ? '+' : ''}{dna.price_change_1y.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                  {dna.style_dimensions.map(dim => (
                    <div key={dim.name} style={{ background: '#27272a', borderRadius: '0.5rem', padding: '0.5rem' }}>
                      <p style={{ color: '#71717a', fontSize: '0.65rem', marginBottom: '0.25rem' }}>{dim.label}</p>
                      <div style={{ height: '4px', background: '#3f3f46', borderRadius: '9999px' }}>
                        <div style={{ height: '4px', borderRadius: '9999px', width: `${dim.value * 100}%`, background: dna.sector_color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

          </div>
        )}

      </div>
    </div>
  )
}