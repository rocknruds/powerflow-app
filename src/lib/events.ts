import { queryDatabase, getTitle, getText, getSelect, getDate, getRelationIds } from "./notion";

const EVENTS_DB_ID = process.env.NOTION_EVENTS_DB_ID ?? "70e9768bfcec49a9aa8565d5aa1f1881";

export interface NotionEvent {
  id: string;
  name: string;
  date: string | null;
  eventType: string | null;
  pfSignal: string | null;
  description: string;
  mechanism: string | null;
  trajectory: string | null;
  actorIds: string[];
}

function parseEvent(page: Record<string, unknown>): NotionEvent {
  const p = page.properties ?? {};
  return {
    id: page.id as string,
    name: getTitle(p, "Event Name") || getTitle(p, "Name"),
    date: getDate(p, "Date"),
    eventType: getSelect(p, "Event Type"),
    pfSignal: getSelect(p, "PF Signal"),
    description: getText(p, "Description"),
    mechanism: getText(p, "Mechanism") || null,
    trajectory: getText(p, "Trajectory") || null,
    actorIds: getRelationIds(p, "Key Actors"),
  };
}

export async function getActorEvents(actorId: string, limit = 5): Promise<NotionEvent[]> {
  const pages = await queryDatabase(
    EVENTS_DB_ID,
    {
      property: "Key Actors",
      relation: { contains: actorId },
    },
    [{ property: "Date", direction: "descending" }]
  );
  return pages.slice(0, limit).map(parseEvent);
}

/**
 * Batch fetch recent events for multiple actors.
 * Single Notion query with compound OR filter, grouped server-side.
 * Returns max 2 events per actor, most recent first.
 */
export async function getRecentEventsForActors(
  actorIds: string[],
  limitPerActor = 2
): Promise<Map<string, { date: string; name: string }[]>> {
  const result = new Map<string, { date: string; name: string }[]>()
  if (actorIds.length === 0) return result

  const filter = {
    or: actorIds.map((id) => ({
      property: 'Key Actors',
      relation: { contains: id },
    })),
  }

  try {
    const pages = await queryDatabase(
      EVENTS_DB_ID,
      filter,
      [{ property: 'Date', direction: 'descending' as const }]
    )

    for (const page of pages) {
      const event = parseEvent(page)
      // An event can reference multiple actors — add to each
      for (const actorId of event.actorIds) {
        if (!actorIds.includes(actorId)) continue
        const list = result.get(actorId) ?? []
        if (list.length < limitPerActor) {
          list.push({ date: event.date ?? '', name: event.name })
          result.set(actorId, list)
        }
      }
    }
  } catch {
    // Return empty map on error
  }

  return result
}