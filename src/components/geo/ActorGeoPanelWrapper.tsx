'use client'

import dynamic from 'next/dynamic'
import type { ActorType } from '@/lib/types'

const ActorGeoPanel = dynamic(() => import('./ActorGeoPanel'), {
  ssr: false,
  loading: () => <div style={{ width: '100%', height: '100%', background: '#0e1220' }} />,
})

export default function ActorGeoPanelWrapper({
  isoCode,
  region,
  actorType,
}: {
  isoCode: string | null
  region: string | null
  actorType: ActorType
}) {
  return <ActorGeoPanel isoCode={isoCode} region={region} actorType={actorType} />
}
