import { queryDatabase, getTitle, getText, getNumber, getSelect, getRelationIds } from './notion'
import { getActorsByIds } from './actors'
import type { ConflictPublic, ConflictActor } from './types'

const CONFLICTS_DB_ID = process.env.NOTION_CONFLICTS_DB_ID ?? 'db9f622892a74cdd942981c330e90886'

const INTENSITY_ORDER = ['Major War', 'War', 'Conflict', 'Low Intensity', 'Frozen']

function parsePage(page: any): Omit<ConflictPublic, 'linkedActors'> {
  const props = page.properties
  return {
    id: page.id,
    name: getTitle(props, 'Conflict Name'),
    region: getSelect(props, 'Region'),
    intensity: getSelect(props, 'Intensity'),
    type: getSelect(props, 'Type'),
    gapTrend: getSelect(props, 'Gap Trend'),
    currentStatus: getText(props, 'Current Status') || null,
    primaryActors: getText(props, 'Primary Actors') || null,
    nuclearRisk: getSelect(props, 'Nuclear Risk'),
    startYear: getNumber(props, 'Start Year'),
    pfGapScore: getNumber(props, 'PF Gap Score'),
    linkedActorIds: getRelationIds(props, 'Linked Actors'),
    linkedActors: [],  // populated by enrichConflictsWithActors()
  }
}

// ─── Queries ──────────────────────────────────────────────────────────────

/**
 * All public conflicts, sorted by intensity (most severe first).
 */
export async function getAllPublicConflicts(): Promise<ConflictPublic[]> {
  const pages = await queryDatabase(
    CONFLICTS_DB_ID,
    { property: 'Visibility', select: { equals: 'Public' } },
    [{ property: 'Start Year', direction: 'descending' }]
  )

  return pages
    .map(parsePage)
    .map((c) => ({ ...c, linkedActors: [] }))
    .sort((a, b) => {
      const aIdx = INTENSITY_ORDER.indexOf(a.intensity ?? '')
      const bIdx = INTENSITY_ORDER.indexOf(b.intensity ?? '')
      return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx)
    })
}

/**
 * Enrich conflicts with their linked actor data + deltas.
 *
 * This is the key function for the conflict cards: each card can show
 * "Iran ↓29  ·  PF 14.8" inline, tying the conflict directly to
 * the scoring system. That's what differentiates this from a news feed.
 *
 * Pass in the actor deltaMap from getLatestDeltaByActor() to avoid
 * redundant Notion calls.
 */
export async function enrichConflictsWithActors(
  conflicts: ConflictPublic[],
  deltaMap: Map<string, number | null>
): Promise<ConflictPublic[]> {
  // Collect all unique actor IDs across all conflicts
  const allIds = [...new Set(conflicts.flatMap((c) => c.linkedActorIds))]
  if (allIds.length === 0) return conflicts

  // Fetch all needed actors in parallel
  const actors = await getActorsByIds(allIds)
  const actorById = new Map(actors.map((a) => [a.id, a]))

  return conflicts.map((conflict) => ({
    ...conflict,
    linkedActors: conflict.linkedActorIds
      .map((id): ConflictActor | null => {
        const actor = actorById.get(id)
        if (!actor) return null
        return {
          id: actor.id,
          name: actor.name,
          pfScore: actor.pfScore,
          delta: deltaMap.get(actor.id) ?? null,
          actorType: actor.actorType,
        }
      })
      .filter((a): a is ConflictActor => a !== null),
  }))
}
