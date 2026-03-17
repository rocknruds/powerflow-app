import { getAllPublicActors, enrichActorsWithDeltas } from '@/lib/actors'
import { getLatestDeltaByActor } from '@/lib/scores'
import { getTopRelationshipsForActors } from '@/lib/relationships'
import { getRecentEventsForActors } from '@/lib/events'
import type { MapActorFull } from '@/lib/types'
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

  const stateActors = enriched.filter((a) => a.actorType === 'State' && a.iso3)
  const actorIds = stateActors.map((a) => a.id)

  const [relMap, eventsMap] = await Promise.all([
    getTopRelationshipsForActors(actorIds),
    getRecentEventsForActors(actorIds),
  ])

  const mapActors: MapActorFull[] = stateActors.map((a) => {
    const rels = relMap.get(a.id)
    const events = eventsMap.get(a.id) ?? []
    return {
      name: a.name,
      slug: a.slug,
      iso3: ISO3_NORMALIZE[a.iso3!] ?? a.iso3!,
      pfScore: a.pfScore,
      authorityScore: a.authorityScore,
      reachScore: a.reachScore,
      pfVector: a.pfVector,
      scoreTrend: a.scoreTrend,
      scoreReasoning: a.scoreReasoning,
      scoreDelta: a.scoreDelta,
      bestRelationship: rels?.best ?? null,
      worstRelationship: rels?.worst ?? null,
      recentEvents: events,
    }
  })

  return <WorldMap actors={mapActors} />
}
