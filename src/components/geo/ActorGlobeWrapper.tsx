'use client'

import dynamic from 'next/dynamic'

const ActorGlobe = dynamic(() => import('./ActorGlobe'), {
  ssr: false,
  loading: () => <div style={{ width: 140, height: 140 }} />,
})

export default function ActorGlobeWrapper({ isoCode, size }: { isoCode: string; size?: number }) {
  return <ActorGlobe isoCode={isoCode} size={size} />
}
