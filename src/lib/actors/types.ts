/**
 * Actor types for the Actor Registry.
 * Used to resolve actor IDs (e.g. ISO3, org abbreviations) to names and categories.
 */

export type ActorType = "state" | "org" | "nonstate";

export interface Actor {
  id: string;
  name: string;
  type: ActorType;
  aliases?: string[];
}
