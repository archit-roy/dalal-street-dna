import type { StockDNA } from '../../api'

interface Props {
  profiles: StockDNA[]
}

const SIZE   = 260
const CENTER = SIZE / 2
const RADIUS = 100
const LEVELS = 4

function polarToXY(angle: number, r: number) {
  return {
    x: CENTER + r * Math.sin(angle),
    y: CENTER - r * Math.cos(angle),
  }
}

export default function RadarChart({ profiles }: Props) {
  if (!profiles.length) return null

  const dims   = profiles[0].style_dimensions
  const n      = dims.length
  const angles = dims.map((_, i) => (2 * Math.PI * i) / n)

  const rings = Array.from({ length: LEVELS }, (_, i) => {
    const r      = (RADIUS / LEVELS) * (i + 1)
    const points = angles.map(a => polarToXY(a, r))
    return points.map((p, j) => `${j === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z'
  })

  const axes = angles.map(a => ({
    x2: polarToXY(a, RADIUS).x,
    y2: polarToXY(a, RADIUS).y,
  }))

  const labels = dims.map((dim, i) => {
    const pos = polarToXY(angles[i], RADIUS + 18)
    return { label: dim.label, ...pos }
  })

  const polygons = profiles.map(profile => {
    const points = profile.style_dimensions.map((dim, i) =>
      polarToXY(angles[i], dim.value * RADIUS)
    )
    const path = points.map((p, j) => `${j === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z'
    return { path, color: profile.sector_color, symbol: profile.symbol }
  })

  return (
    <div style={{ width: '100%' }}>
      <p style={{ color: '#a1a1aa', fontSize: '0.7rem', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
        Style Radar
      </p>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', flexWrap: 'wrap' }}>
        <svg width={SIZE} height={SIZE} style={{ flexShrink: 0 }}>
          {rings.map((d, i) => (
            <path key={i} d={d} fill="none" stroke="#3f3f46" strokeWidth={0.5} />
          ))}
          {axes.map((a, i) => (
            <line key={i} x1={CENTER} y1={CENTER} x2={a.x2} y2={a.y2} stroke="#3f3f46" strokeWidth={0.5} />
          ))}
          {polygons.map(p => (
            <path key={p.symbol} d={p.path} fill={p.color} fillOpacity={0.15} stroke={p.color} strokeWidth={2} />
          ))}
          {labels.map((l, i) => (
            <text key={i} x={l.x} y={l.y} textAnchor="middle" dominantBaseline="middle" fontSize={8} fill="#a1a1aa" fontFamily="monospace">
              {l.label}
            </text>
          ))}
        </svg>

        {/* Legend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '0.5rem' }}>
          {profiles.map(p => (
            <div key={p.symbol} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '0.75rem', height: '0.75rem', borderRadius: '9999px', background: p.sector_color }} />
              <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 700, color: '#d4d4d8' }}>{p.symbol}</span>
              <span style={{ fontSize: '0.7rem', color: '#71717a' }}>{p.sector}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}