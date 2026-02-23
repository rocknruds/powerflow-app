import { NextRequest } from "next/server";
import { loadAllEvents } from "@/lib/events/load";
import {
  sortByDateDesc,
  filterByActors,
  filterByTypes,
  filterByDateRange,
  filterByMinSignificance,
} from "@/lib/events/query";
import type { EventType, Significance } from "@/lib/events/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const actorsParam = searchParams.get("actors");
  const typesParam = searchParams.get("types");
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;
  const minSigParam = searchParams.get("minSig");
  const limitParam = searchParams.get("limit");

  let events = await loadAllEvents();

  if (actorsParam) {
    const actors = actorsParam.split(",").map((s) => s.trim()).filter(Boolean);
    if (actors.length) events = filterByActors(events, actors);
  }

  if (typesParam) {
    const types = typesParam.split(",").map((s) => s.trim()) as EventType[];
    if (types.length) events = filterByTypes(events, types);
  }

  if (from !== undefined || to !== undefined) {
    events = filterByDateRange(events, from, to);
  }

  if (minSigParam) {
    const minSig = parseInt(minSigParam, 10) as Significance;
    if (minSig >= 1 && minSig <= 5) {
      events = filterByMinSignificance(events, minSig);
    }
  }

  events = sortByDateDesc(events);

  const limit = limitParam ? Math.max(0, parseInt(limitParam, 10)) : undefined;
  const result = limit !== undefined ? events.slice(0, limit) : events;

  return Response.json({ count: result.length, events: result });
}
