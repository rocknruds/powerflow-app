/**
 * Canonical event types for the Event Spine.
 * Used by briefings, timelines, relations, and map layers.
 */

export type EventType =
  | "conflict"
  | "border_change"
  | "legal_action"
  | "sanction"
  | "treaty";

export type Significance = 1 | 2 | 3 | 4 | 5;

export interface EventSource {
  title: string;
  org: string;
  url: string;
  date: string;
}

export interface EventLocationPoint {
  kind: "point";
  coordinates: [number, number]; // [lng, lat]
}

export interface EventLocationBbox {
  kind: "bbox";
  coordinates: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
}

export type EventLocation = EventLocationPoint | EventLocationBbox;

export interface Event {
  id: string;
  date: string; // ISO YYYY-MM-DD
  type: EventType;
  title: string;
  summary: string;
  actors: string[]; // ISO3 codes
  tags?: string[];
  significance: Significance;
  sources: EventSource[];
  location?: EventLocation;
}
