import { useState, useRef } from 'react'
import axios from 'axios'

interface StyleDimension {
  name: string
  label: string
  value: number
}

interface SectorPerf {
  sector: string
  sector_color: string
  total_pnl: number
  win_rate: number
  n_trades: number
}

interface MonthlyPnl {
  month: string
  pnl: number
  trades: number
}

interface Trade {
  symbol: string
  sector: string
  sector_color: string
  buy_date: string
  sell_date: string
  holding_days: number
  buy_price: number
  sell_price: number
  pnl: number
  pnl_pct: number
  is_winner: boolean
}

interface TraderResult {
  total_trades: number
  total_pnl: number
  win_rate: number
  avg_holding_days: number
  avg_winner_days: number
  avg_loser_days: number
  best_trade: { symbol: string; pnl: number; pnl_pct: number; days: number }
  worst_trade: { symbol: string; pnl: number; pnl_pct: number; days: number }
  style_dimensions: StyleDimension[]
  sector_performance: SectorPerf[]
  monthly_pnl: MonthlyPnl[]
  trades: Trade[]
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'

export default function TraderAnalyser() {
  const [result, setResult] = useState<TraderResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showTrades, setShowTrades] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setError(null)
    setResult(null)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await axios.post(`${API_URL}/api/trader/analyse`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResult(res.data)
    } catch (e: any) {
      setError(e.response?.data?.detail ?? 'Failed to analyse trades')
    }
    setLoading(false)
  }

  const maxAbsPnl = result
    ? Math.max(...result.monthly_pnl.map(m => Math.abs(m.pnl)))
    : 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* Upload card */}
      <div style={{ background: '#18181b', borderRadius: '0.75rem', border: '1px solid #27272a', padding: '1rem' }}>
        <p style={{ color: '#a1a1aa', fontSize: '0.7rem', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
          Trader Style Analyser
        </p>
        <p style={{ color: '#71717a', fontSize: '0.8rem', marginBottom: '1rem' }}>
          Upload your Zerodha or Groww trade history CSV to analyse your trading patterns.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          onChange={handleUpload}
          style={{ display: 'none' }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.875rem',
            background: loading ? '#27272a' : '#22c55e',
            borderRadius: '0.5rem',
            fontWeight: 700,
            fontSize: '0.875rem',
            border: 'none',
            color: loading ? '#a1a1aa' : '#000',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Analysing your trades...' : '📂 Upload Trade History CSV'}
        </button>
        {error && <p style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '0.5rem' }}>{error}</p>}
        <p style={{ color: '#3f3f46', fontSize: '0.7rem', marginTop: '0.75rem' }}>
          Your data never leaves your browser session. Not stored anywhere.
        </p>
      </div>

      {result && (
        <>
          {/* Summary stats */}
          <div style={{ background: '#18181b', borderRadius: '0.75rem', border: '1px solid #27272a', padding: '1rem' }}>
            <p style={{ color: '#a1a1aa', fontSize: '0.7rem', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
              Summary
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              {[
                { label: 'Total trades', value: result.total_trades.toString() },
                { label: 'Win rate', value: `${(result.win_rate * 100).toFixed(0)}%` },
                { label: 'Total P&L', value: `₹${result.total_pnl.toFixed(0)}`, color: result.total_pnl >= 0 ? '#22c55e' : '#ef4444' },
                { label: 'Avg holding', value: `${result.avg_holding_days.toFixed(0)} days` },
                { label: 'Winners held', value: `${result.avg_winner_days.toFixed(0)} days` },
                { label: 'Losers held', value: `${result.avg_loser_days.toFixed(0)} days`, color: result.avg_loser_days > result.avg_winner_days ? '#ef4444' : '#22c55e' },
              ].map(s => (
                <div key={s.label} style={{ background: '#27272a', borderRadius: '0.5rem', padding: '0.625rem' }}>
                  <p style={{ color: '#71717a', fontSize: '0.7rem', marginBottom: '0.25rem' }}>{s.label}</p>
                  <p style={{ fontFamily: 'monospace', fontWeight: 700, color: s.color ?? '#fff' }}>{s.value}</p>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginTop: '0.5rem' }}>
              <div style={{ background: '#14532d', borderRadius: '0.5rem', padding: '0.625rem', border: '1px solid #166534' }}>
                <p style={{ color: '#86efac', fontSize: '0.7rem', marginBottom: '0.25rem' }}>Best trade</p>
                <p style={{ fontFamily: 'monospace', fontWeight: 700, color: '#22c55e' }}>{result.best_trade.symbol}</p>
                <p style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#22c55e' }}>+₹{result.best_trade.pnl.toFixed(0)} ({result.best_trade.pnl_pct.toFixed(1)}%)</p>
              </div>
              <div style={{ background: '#450a0a', borderRadius: '0.5rem', padding: '0.625rem', border: '1px solid #7f1d1d' }}>
                <p style={{ color: '#fca5a5', fontSize: '0.7rem', marginBottom: '0.25rem' }}>Worst trade</p>
                <p style={{ fontFamily: 'monospace', fontWeight: 700, color: '#ef4444' }}>{result.worst_trade.symbol}</p>
                <p style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#ef4444' }}>₹{result.worst_trade.pnl.toFixed(0)} ({result.worst_trade.pnl_pct.toFixed(1)}%)</p>
              </div>
            </div>
          </div>

          {/* Trader DNA */}
          <div style={{ background: '#18181b', borderRadius: '0.75rem', border: '1px solid #27272a', padding: '1rem' }}>
            <p style={{ color: '#a1a1aa', fontSize: '0.7rem', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
              Trader DNA
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              {result.style_dimensions.map(dim => (
                <div key={dim.name} style={{ background: '#27272a', borderRadius: '0.5rem', padding: '0.625rem' }}>
                  <p style={{ color: '#71717a', fontSize: '0.7rem', marginBottom: '0.25rem' }}>{dim.label}</p>
                  <div style={{ height: '6px', background: '#3f3f46', borderRadius: '9999px' }}>
                    <div style={{
                      height: '6px',
                      borderRadius: '9999px',
                      width: `${dim.value * 100}%`,
                      background: '#22c55e',
                      transition: 'width 1s ease-out',
                    }} />
                  </div>
                  <p style={{ fontSize: '0.7rem', fontFamily: 'monospace', marginTop: '0.25rem', color: '#d4d4d8' }}>
                    {(dim.value * 100).toFixed(0)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly P&L */}
          <div style={{ background: '#18181b', borderRadius: '0.75rem', border: '1px solid #27272a', padding: '1rem' }}>
            <p style={{ color: '#a1a1aa', fontSize: '0.7rem', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
              Monthly P&L
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {result.monthly_pnl.map(m => (
                <div key={m.month} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#71717a', width: '4rem', flexShrink: 0 }}>{m.month.slice(0, 7)}</span>
                  <div style={{ flex: 1, height: '20px', background: '#27272a', borderRadius: '0.25rem', position: 'relative' }}>
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: m.pnl >= 0 ? '50%' : `${50 - (Math.abs(m.pnl) / maxAbsPnl) * 50}%`,
                      width: `${(Math.abs(m.pnl) / maxAbsPnl) * 50}%`,
                      background: m.pnl >= 0 ? '#22c55e' : '#ef4444',
                      borderRadius: '0.25rem',
                      opacity: 0.8,
                    }} />
                    <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: '1px', background: '#3f3f46' }} />
                  </div>
                  <span style={{
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    color: m.pnl >= 0 ? '#22c55e' : '#ef4444',
                    width: '5rem',
                    textAlign: 'right',
                    flexShrink: 0,
                  }}>
                    {m.pnl >= 0 ? '+' : ''}₹{m.pnl.toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Sector performance */}
          <div style={{ background: '#18181b', borderRadius: '0.75rem', border: '1px solid #27272a', padding: '1rem' }}>
            <p style={{ color: '#a1a1aa', fontSize: '0.7rem', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
              Sector Performance
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {result.sector_performance.map(s => (
                <div key={s.sector} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#27272a', borderRadius: '0.5rem', padding: '0.625rem' }}>
                  <div style={{ width: '0.625rem', height: '0.625rem', borderRadius: '9999px', background: s.sector_color, flexShrink: 0 }} />
                  <span style={{ fontWeight: 700, fontSize: '0.8rem', width: '5rem' }}>{s.sector}</span>
                  <span style={{ color: '#71717a', fontSize: '0.7rem' }}>{s.n_trades} trades</span>
                  <span style={{ color: '#71717a', fontSize: '0.7rem' }}>{(s.win_rate * 100).toFixed(0)}% wins</span>
                  <span style={{
                    marginLeft: 'auto',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    color: s.total_pnl >= 0 ? '#22c55e' : '#ef4444',
                  }}>
                    {s.total_pnl >= 0 ? '+' : ''}₹{s.total_pnl.toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Trade log */}
          <div style={{ background: '#18181b', borderRadius: '0.75rem', border: '1px solid #27272a', padding: '1rem' }}>
            <button
              onClick={() => setShowTrades(t => !t)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a1a1aa', fontSize: '0.7rem', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em', padding: 0, marginBottom: showTrades ? '0.75rem' : 0 }}
            >
              {showTrades ? '▼' : '▶'} Trade Log ({result.total_trades} trades)
            </button>
            {showTrades && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: '0.7rem', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #27272a' }}>
                      {['Symbol', 'Buy', 'Sell', 'Days', 'P&L', '%'].map(h => (
                        <th key={h} style={{ padding: '0.375rem 0.5rem', textAlign: 'left', color: '#71717a', fontFamily: 'monospace', fontWeight: 400 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.trades.map((t, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #1c1c1e' }}>
                        <td style={{ padding: '0.375rem 0.5rem', fontFamily: 'monospace', fontWeight: 700, color: t.sector_color }}>{t.symbol}</td>
                        <td style={{ padding: '0.375rem 0.5rem', color: '#71717a' }}>{t.buy_date}</td>
                        <td style={{ padding: '0.375rem 0.5rem', color: '#71717a' }}>{t.sell_date}</td>
                        <td style={{ padding: '0.375rem 0.5rem', color: '#a1a1aa' }}>{t.holding_days}d</td>
                        <td style={{ padding: '0.375rem 0.5rem', fontFamily: 'monospace', color: t.is_winner ? '#22c55e' : '#ef4444' }}>
                          {t.pnl >= 0 ? '+' : ''}₹{t.pnl.toFixed(0)}
                        </td>
                        <td style={{ padding: '0.375rem 0.5rem', fontFamily: 'monospace', color: t.is_winner ? '#22c55e' : '#ef4444' }}>
                          {t.pnl_pct >= 0 ? '+' : ''}{t.pnl_pct.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}