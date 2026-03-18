import {
  queryDatabase,
  getTitle,
  getText,
  getSelect,
  getDate,
  getRelationIds,
} from './notion'

const INTEL_FEEDS_DB_ID =
  process.env.NOTION_INTEL_FEEDS_DB_ID ?? '3835cb822ae441a5a18cb4271d9fe955'

export interface IntelFeedItem {
  id: string
  title: string
  soWhatSummary: string | null
  mechanism: string | null       // causal pathway: why/how this changes power
  trajectory: string | null      // structural vs. cyclical; recovery timeframe
  cascadeEffects: string | null  // second/third-order downstream chain
  pfSignal: string | null        // Widening / Narrowing / Mixed / Stable / Unclear
  confidenceShift: string | null // Major Update / Minor Update / Confirms Existing / New Thread
  publication: string | null
  dateIngested: string | null
  publicationDate: string | null
  actorIds: string[]
}

function parseFeed(page: Record<string, unknown>): IntelFeedItem {
  const props = (page.properties ?? {}) as Record<string, unknown>
  return {
    id: page.id as string,
    title: getTitle(props, 'Title'),
    soWhatSummary: getText(props, 'So What Summary') || null,
    mechanism: getText(props, 'Mechanism') || null,
    trajectory: getText(props, 'Trajectory') || null,
    cascadeEffects: getText(props, 'Cascade Effects') || null,
    pfSignal: getSelect(props, 'PF Signal'),
    confidenceShift: getSelect(props, 'Confidence Shift'),
    publication: getText(props, 'Publication') || null,
    dateIngested: getDate(props, 'Date Ingested'),
    publicationDate: getDate(props, 'Publication Date'),
    actorIds: getRelationIds(props, 'Actors Involved'),
  }
}

/**
 * Recent Intel Feeds for a specific actor — used on the actor profile page.
 * Returns up to `limit` items, most recent first.
 */
export async function getActorIntelFeeds(
  actorId: string,
  limit = 5
): Promise<IntelFeedItem[]> {
  try {
    const pages = await queryDatabase(
      INTEL_FEEDS_DB_ID,
      { property: 'Actors Involved', relation: { contains: actorId } },
      [{ property: 'Date Ingested', direction: 'descending' }]
    )
    return pages.slice(0, limit).map(parseFeed)
  } catch {
    return []
  }
}
