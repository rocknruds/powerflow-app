export function getPowerPostureLabel(pfVector: string | null | undefined): string {
  switch (pfVector) {
    case 'Projecting': return 'Projecting'
    case 'Defending': return 'Defending'
    case 'Contesting': return 'Contesting'
    case 'Neutral': return 'Neutral'
    // Legacy value fallback mapping
    case 'From Above (External Pressure)': return 'Projecting'
    case 'Defender': return 'Defending'
    case 'From Below (Challenger)': return 'Contesting'
    case 'From Within (Parallel Governance)': return 'Contesting'
    default: return '—'
  }
}

export function getPowerPostureColor(pfVector: string | null | undefined): string {
  const label = getPowerPostureLabel(pfVector)
  switch (label) {
    case 'Projecting': return 'text-blue-400'
    case 'Defending': return 'text-green-400'
    case 'Contesting': return 'text-orange-400'
    case 'Neutral': return 'text-gray-400'
    default: return 'text-gray-500'
  }
}
