export const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'
export const OCEAN_COLOR = '#0e1220'
export const LAND_STROKE = '#1e2a3a'
export const LAND_UNTRACKED = '#141c2a'
export const SIGNAL_BLUE = '#38bdf8'
export const GRATICULE_STROKE = '#1a2235'

export const VECTOR_COLORS: Record<string, string> = {
  Defender: '#3b82f6',
  'From Above (External Pressure)': '#f59e0b',
  'From Below (Challenger)': '#ef4444',
  'From Within (Parallel Governance)': '#a855f7',
  Neutral: '#6b7280',
}

export const TREND_DISPLAY: Record<string, { symbol: string; color: string }> = {
  Rising: { symbol: '\u25B2', color: '#22c55e' },
  Stable: { symbol: '\u2192', color: '#6b7280' },
  Declining: { symbol: '\u25BC', color: '#f59e0b' },
  Collapsing: { symbol: '\u25BC\u25BC', color: '#ef4444' },
}
