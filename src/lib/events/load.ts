import type { Event, EventType, EventSource, EventLocation } from "./types";

import indexData from "@/data/events/index.json";

const EVENT_TYPES: EventType[] = [
  "conflict",
  "border_change",
  "legal_action",
  "sanction",
  "treaty",
];

function assert(condition: boolean, filename: string, message: string): void {
  if (!condition) {
    throw new Error(`Invalid event in ${filename}: ${message}`);
  }
}

function validateSource(s: unknown, filename: string): s is EventSource {
  if (typeof s !== "object" || s === null) return false;
  const o = s as Record<string, unknown>;
  return (
    typeof o.title === "string" &&
    typeof o.org === "string" &&
    typeof o.url === "string" &&
    typeof o.date === "string"
  );
}

function validateLocation(loc: unknown, filename: string): loc is EventLocation {
  if (typeof loc !== "object" || loc === null) return false;
  const o = loc as Record<string, unknown>;
  if (o.kind === "point") {
    return (
      Array.isArray(o.coordinates) &&
      o.coordinates.length === 2 &&
      typeof o.coordinates[0] === "number" &&
      typeof o.coordinates[1] === "number"
    );
  }
  if (o.kind === "bbox") {
    return (
      Array.isArray(o.coordinates) &&
      o.coordinates.length === 4 &&
      (o.coordinates as unknown[]).every((n) => typeof n === "number")
    );
  }
  return false;
}

function validateEvent(data: unknown, filename: string): Event {
  assert(typeof data === "object" && data !== null, filename, "event must be an object");
  const o = data as Record<string, unknown>;

  assert(typeof o.id === "string", filename, "missing or invalid field 'id'");
  assert(typeof o.date === "string", filename, "missing or invalid field 'date'");
  assert(typeof o.type === "string", filename, "missing or invalid field 'type'");
  assert(EVENT_TYPES.includes(o.type as EventType), filename, `invalid event type '${o.type}'`);
  assert(typeof o.title === "string", filename, "missing or invalid field 'title'");
  assert(typeof o.summary === "string", filename, "missing or invalid field 'summary'");
  assert(Array.isArray(o.actors), filename, "missing or invalid field 'actors'");
  assert(
    (o.actors as unknown[]).every((a) => typeof a === "string"),
    filename,
    "field 'actors' must be string[]"
  );
  assert(
    typeof o.significance === "number" &&
      Number.isInteger(o.significance) &&
      o.significance >= 1 &&
      o.significance <= 5,
    filename,
    "missing or invalid field 'significance' (must be 1-5)"
  );
  assert(Array.isArray(o.sources), filename, "missing or invalid field 'sources'");
  assert(
    (o.sources as unknown[]).every((s) => validateSource(s, filename)),
    filename,
    "field 'sources' must be array of { title, org, url, date }"
  );

  if (o.tags !== undefined) {
    assert(Array.isArray(o.tags), filename, "field 'tags' must be string[]");
    assert(
      (o.tags as unknown[]).every((t) => typeof t === "string"),
      filename,
      "field 'tags' must be string[]"
    );
  }

  if (o.location !== undefined) {
    assert(validateLocation(o.location, filename), filename, "invalid field 'location'");
  }

  return data as Event;
}

/**
 * Load all events from index.json: iterates over index.files and dynamically
 * imports each JSON event file. Validates shape at runtime; throws with filename
 * and missing/invalid field if any event is invalid.
 */
export async function loadAllEvents(): Promise<Event[]> {
  const index = indexData as { files: string[] };
  const events: Event[] = [];

  for (const file of index.files) {
    let raw: unknown;
    try {
      const mod = await import(`@/data/events/${file}`);
      raw = (mod as { default?: unknown }).default ?? mod;
    } catch (err) {
      throw new Error(
        `Event file not found or invalid: ${file}. ${err instanceof Error ? err.message : String(err)}`
      );
    }
    events.push(validateEvent(raw, file));
  }

  return events;
}
