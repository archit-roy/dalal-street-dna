export function SkeletonCard() {
  return (
    <div style={{
      background: '#18181b',
      borderRadius: '0.75rem',
      border: '1px solid #27272a',
      padding: '1rem',
      animation: 'pulse 1.5s ease-in-out infinite',
    }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ width: '4px', height: '2.5rem', borderRadius: '9999px', background: '#3f3f46' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div style={{ width: '4rem', height: '1.1rem', background: '#3f3f46', borderRadius: '0.25rem' }} />
          <div style={{ width: '10rem', height: '0.75rem', background: '#3f3f46', borderRadius: '0.25rem' }} />
        </div>
        <div style={{ marginLeft: 'auto', width: '4rem', height: '1rem', background: '#3f3f46', borderRadius: '0.25rem' }} />
      </div>

      {/* Waveform skeleton */}
      <div style={{ width: '100%', height: '220px', background: '#27272a', borderRadius: '0.5rem', marginBottom: '1rem', overflow: 'hidden', position: 'relative' }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)',
          animation: 'shimmer 2s infinite',
        }} />
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            position: 'absolute',
            left: '70px',
            right: '10px',
            top: `${i * 52 + 10}px`,
            height: '40px',
            background: '#3f3f46',
            borderRadius: '0.25rem',
            opacity: 0.5,
          }} />
        ))}
      </div>

      {/* Style bars skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
        {[0,1,2,3,4,5,6,7].map(i => (
          <div key={i} style={{ background: '#27272a', borderRadius: '0.5rem', padding: '0.625rem' }}>
            <div style={{ width: '70%', height: '0.6rem', background: '#3f3f46', borderRadius: '0.25rem', marginBottom: '0.4rem' }} />
            <div style={{ width: '100%', height: '6px', background: '#3f3f46', borderRadius: '9999px' }} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonLabel({ text }: { text: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.75rem 1rem',
      background: '#18181b',
      borderRadius: '0.75rem',
      border: '1px solid #27272a',
    }}>
      <div style={{
        width: '1rem',
        height: '1rem',
        borderRadius: '9999px',
        border: '2px solid #22c55e',
        borderTopColor: 'transparent',
        animation: 'spin 0.8s linear infinite',
        flexShrink: 0,
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{ color: '#71717a', fontSize: '0.875rem' }}>{text}</span>
    </div>
  )
}