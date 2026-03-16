import {
  queryDatabase,
  fetchPage,
  getTitle,
  getText,
  getNumber,
  getSelect,
  getMultiSelect,
  getDate,
  getFormula,
  getRelationIds,
} from './notion'
import type { Actor, ActorType, ScoreTrend } from './types'

const ACTORS_DB_ID = process.env.NOTION_ACTORS_DB_ID ?? '742dea54-b13e-4c64-81b7-2c058483de4e'

// Notion stores IGO as "International Organization" — normalize to code value
const ACTOR_TYPE_MAP: Record<string, ActorType> = {
  'International Organization': 'IGO',
}

function normalizeActorType(raw: string | null): ActorType {
  if (!raw) return 'State'
  return ACTOR_TYPE_MAP[raw] ?? (raw as ActorType)
}

export function deriveTrend(delta: number | null): ScoreTrend | null {
  if (delta === null) return null
  if (delta >= 5) return 'Rising'
  if (delta <= -10) return 'Collapsing'
  if (delta < -2) return 'Declining'
  return 'Stable'
}

export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

function computePFScore(authority: number | null, reach: number | null): number | null {
  if (authority === null || reach === null) return null
  return Math.round(Math.sqrt(authority * reach))
}

function parsePage(page: any): Actor {
  const props = page.properties
  const authorityScore = getNumber(props, 'Authority Score')
  const reachScore = getNumber(props, 'Reach Score')
  const pfScore = computePFScore(authorityScore, reachScore) ?? getFormula(props, 'PF Score')

  return {
    id: page.id,
    name: getTitle(props, 'Name'),
    slug: toSlug(getTitle(props, 'Name')),
    actorType: normalizeActorType(getSelect(props, 'Actor Type')),
    subType: getSelect(props, 'Sub-Type'),
    region: getSelect(props, 'Region'),
    authorityScore,
    reachScore,
    pfScore,
    pfVector: getSelect(props, 'PF Vector'),
    proxyDepth: getSelect(props, 'Proxy Depth'),
    capabilities: getMultiSelect(props, 'Capabilities'),
    status: getSelect(props, 'Status'),
    iso3: getText(props, 'ISO3 / Identifier') || null,
    lastScored: getDate(props, 'Last Scored'),
    scoreReasoning: getText(props, 'Score Reasoning') || null,
    notes: getText(props, 'Notes') || null,
    patronStateIds: getRelationIds(props, 'Patron State'),
    dependentOnIds: getRelationIds(props, 'Dependent On'),
    // Enriched later by enrichActorsWithDeltas()
    scoreDelta: null,
    scoreTrend: null,
  }
}

// ─── Queries ──────────────────────────────────────────────────────────────

/**
 * All public active actors, sorted by PF Score descending.
 * Returns full data including Score Reasoning — gate this later with auth when needed.
 */
export async function getAllPublicActors(): Promise<Actor[]> {
  const pages = await queryDatabase(
    ACTORS_DB_ID,
    {
      and: [
        { property: 'Visibility', select: { equals: 'Public' } },
        { property: 'Status', select: { equals: 'Active' } },
      ],
    },
    [{ property: 'Authority Score', direction: 'descending' }]
  )
  return pages.map(parsePage)
}

/**
 * Fetch a single actor by Notion page ID.
 */
export async function getActorById(id: string): Promise<Actor | null> {
  const page = await fetchPage(id)
  if (!page) return null
  return parsePage(page)
}

/**
 * Fetch multiple actors by ID in parallel.
 * Used for the comparison tool and conflict card enrichment.
 */
export async function getActorsByIds(ids: string[]): Promise<Actor[]> {
  const results = await Promise.all(ids.map(getActorById))
  return results.filter((a): a is Actor => a !== null)
}

/**
 * Fetch by slug. Less efficient — use for SSG param resolution only.
 */
export async function getActorBySlug(slug: string): Promise<Actor | null> {
  const actors = await getAllPublicActors()
  return actors.find((a) => a.slug === slug) ?? null
}

/**
 * Enrich actors with score deltas + derived trend.
 * Pass in the deltaMap from getLatestDeltaByActor() in scores.ts.
 */
export function enrichActorsWithDeltas<T extends Actor>(
  actors: T[],
  deltaMap: Map<string, number | null>
): T[] {
  return actors.map((actor) => {
    const delta = deltaMap.get(actor.id) ?? null
    return { ...actor, scoreDelta: delta, scoreTrend: deriveTrend(delta) }
  })
}

/**
 * All public actor slugs — used for generateStaticParams in Next.js.
 */
export async function getAllPublicActorSlugs(): Promise<{ slug: string }[]> {
  const actors = await getAllPublicActors()
  return actors.map((a) => ({ slug: a.slug }))
}
