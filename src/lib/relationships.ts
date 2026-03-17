import {
  queryDatabase,
  getTitle,
  getNumber,
  getSelect,
  getDate,
  getRelationIds,
} from './notion'
import type { ActorRelationship, ActorRelationships } from './types'

const RELATIONSHIPS_DB_ID =
  process.env.NOTION_ACTOR_RELATIONSHIPS_DB_ID ?? 'aa748f6b63414f5ea09ca208a4398ccb'

function parsePage(page: any, direction: 'outgoing' | 'incoming'): ActorRelationship {
  const props = page.properties
  const title = getTitle(props, 'Relationship')

  // Title format: "A → B"
  // outgoing: we are A, counterparty is B (part after " → ")
  // incoming: we are B, counterparty is A (part before " → ")
  const parts = title.split(' → ')
  const counterpartyName =
    direction === 'outgoing'
      ? (parts[1]?.trim() ?? title)
      : (parts[0]?.trim() ?? title)

  const primaryActorIds = getRelationIds(props, 'Primary Actor')
  const comparedActorIds = getRelationIds(props, 'Compared Actor')

  return {
    id: page.id,
    title,
    primaryActorId: primaryActorIds[0] ?? '',
    comparedActorId: comparedActorIds[0] ?? '',
    counterpartyName,
    relationshipType: getSelect(props, 'Relationship Type'),
    alignmentScore: getNumber(props, 'Alignment Score'),
    leverageScore: getNumber(props, 'Leverage Score'),
    dependencyScore: getNumber(props, 'Dependency Score'),
    lastScored: getDate(props, 'Last Scored'),
  }
}

export async function getActorRelationships(actorId: string): Promise<ActorRelationships> {
  try {
    const [outgoingPages, incomingPages] = await Promise.all([
      queryDatabase(
        RELATIONSHIPS_DB_ID,
        { property: 'Primary Actor', relation: { contains: actorId } },
        undefined,
        300
      ),
      queryDatabase(
        RELATIONSHIPS_DB_ID,
        { property: 'Compared Actor', relation: { contains: actorId } },
        undefined,
        300
      ),
    ])

    const outgoing = outgoingPages.slice(0, 50).map((p) => parsePage(p, 'outgoing'))
    const incoming = incomingPages.slice(0, 50).map((p) => parsePage(p, 'incoming'))

    return { outgoing, incoming }
  } catch {
    return { outgoing: [], incoming: [] }
  }
}

export async function getTopRelationships(
  actorId: string,
  limit = 6
): Promise<ActorRelationship[]> {
  try {
    const { outgoing, incoming } = await getActorRelationships(actorId)

    // Merge, preferring outgoing when same counterparty exists in both
    const seen = new Map<string, ActorRelationship>()
    for (const rel of outgoing) {
      seen.set(rel.counterpartyName, rel)
    }
    for (const rel of incoming) {
      if (!seen.has(rel.counterpartyName)) {
        seen.set(rel.counterpartyName, rel)
      }
    }

    return [...seen.values()]
      .sort((a, b) => Math.abs(b.alignmentScore ?? 0) - Math.abs(a.alignmentScore ?? 0))
      .slice(0, limit)
  } catch {
    return []
  }
}

/**
 * Batch fetch best/worst relationship for multiple actors.
 * Single Notion query with compound OR filter, grouped server-side.
 */
export async function getTopRelationshipsForActors(
  actorIds: string[]
): Promise<Map<string, { best: { name: string; alignment: number } | null; worst: { name: string; alignment: number } | null }>> {
  const result = new Map<string, { best: { name: string; alignment: number } | null; worst: { name: string; alignment: number } | null }>()
  if (actorIds.length === 0) return result

  const filter = {
    or: actorIds.map((id) => ({
      property: 'Primary Actor',
      relation: { contains: id },
    })),
  }

  try {
    const pages = await queryDatabase(RELATIONSHIPS_DB_ID, filter, undefined, 300)

    // Group by primary actor
    const byActor = new Map<string, { counterpartyName: string; alignment: number }[]>()
    for (const page of pages) {
      const rel = parsePage(page, 'outgoing')
      if (rel.primaryActorId && rel.alignmentScore !== null) {
        const list = byActor.get(rel.primaryActorId) ?? []
        list.push({ counterpartyName: rel.counterpartyName, alignment: rel.alignmentScore })
        byActor.set(rel.primaryActorId, list)
      }
    }

    // Pick best (highest alignment) and worst (lowest alignment) per actor
    for (const [actorId, rels] of byActor) {
      const sorted = rels.sort((a, b) => a.alignment - b.alignment)
      const worst = sorted[0] ? { name: sorted[0].counterpartyName, alignment: sorted[0].alignment } : null
      const best = sorted[sorted.length - 1] ? { name: sorted[sorted.length - 1].counterpartyName, alignment: sorted[sorted.length - 1].alignment } : null
      result.set(actorId, { best, worst })
    }
  } catch {
    // Return empty map on error
  }

  return result
}
