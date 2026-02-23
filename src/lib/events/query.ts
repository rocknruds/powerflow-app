import type { Event, EventType, Significance } from "./types";

/**
 * Sort events by date descending (newest first).
 */
export function sortByDateDesc(events: Event[]): Event[] {
  return [...events].sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
}

/**
 * Keep events where at least one actor overlaps with the given list.
 */
export function filterByActors(events: Event[], actors: string[]): Event[] {
  const set = new Set(actors.map((a) => a.toUpperCase()));
  return events.filter((e) => e.actors.some((a) => set.has(a.toUpperCase())));
}

/**
 * Keep events whose type is in the given list.
 */
export function filterByTypes(events: Event[], types: EventType[]): Event[] {
  const set = new Set(types);
  return events.filter((e) => set.has(e.type));
}

/**
 * Keep events within the date range (inclusive).
 * Omit `from` for no lower bound, omit `to` for no upper bound.
 */
export function filterByDateRange(
  events: Event[],
  from?: string,
  to?: string
): Event[] {
  return events.filter((e) => {
    if (from !== undefined && e.date < from) return false;
    if (to !== undefined && e.date > to) return false;
    return true;
  });
}

/**
 * Keep events with significance >= min.
 */
export function filterByMinSignificance(events: Event[], min: Significance): Event[] {
  return events.filter((e) => e.significance >= min);
}
