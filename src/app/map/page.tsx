import { getAllPublicActors, enrichActorsWithDeltas } from '@/lib/actors'
import { getLatestDeltaByActor } from '@/lib/scores'
import WorldMap from './WorldMap'

export const revalidate = 300
export const metadata = { title: 'World Map' }

/** ISO3 codes that need normalization for topojson matching */
const ISO3_NORMALIZE: Record<string, string> = {
  'CHN-CCP': 'CHN',
}

export default async function MapPage() {
  const [actors, deltaMap] = await Promise.all([
    getAllPublicActors(),
    getLatestDeltaByActor(),
  ])

  const enriched = enrichActorsWithDeltas(actors, deltaMap)

  const mapActors = enriched
    .filter((a) => a.actorType === 'State' && a.iso3)
    .map((a) => ({
      name: a.name,
      slug: a.slug,
      iso3: ISO3_NORMALIZE[a.iso3!] ?? a.iso3!,
      pfScore: a.pfScore,
      authorityScore: a.authorityScore,
      reachScore: a.reachScore,
      pfVector: a.pfVector,
      scoreTrend: a.scoreTrend,
    }))

  return <WorldMap actors={mapActors} />
}
