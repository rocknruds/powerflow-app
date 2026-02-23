import type { Actor } from "./types";

import actorsData from "@/data/actors/index.json";

const actorsList = actorsData as Actor[];
const byId = new Map<string, Actor>(
  actorsList.map((a) => [a.id.toUpperCase(), a])
);

/**
 * Load all actors from the registry (in-memory from static JSON).
 */
export function loadAllActors(): Actor[] {
  return [...actorsList];
}

/**
 * Get an actor by ID (case-insensitive). Returns undefined if not found.
 */
export function getActorById(id: string): Actor | undefined {
  return byId.get(id.toUpperCase());
}
