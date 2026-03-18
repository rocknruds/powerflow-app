// ─── Actors ────────────────────────────────────────────────────────────────

export type ActorType = 'State' | 'Non-State' | 'Hybrid' | 'IGO' | 'Individual'

export type ScoreTrend = 'Rising' | 'Stable' | 'Declining' | 'Collapsing'

export interface Actor {
  id: string
  name: string
  slug: string
  actorType: ActorType
  subType: string | null
  region: string | null
  authorityScore: number | null
  reachScore: number | null
  pfScore: number | null
  pfVector: string | null      // "From Below (Challenger)" / "Defender" / etc.
  proxyDepth: string | null    // Patron / Principal / Agent / Autonomous / None
  capabilities: string[]
  status: string | null
  iso3: string | null
  lastScored: string | null
  scoreReasoning: string | null
  notes: string | null
  patronStateIds: string[]
  dependentOnIds: string[]
  // Enriched from Score Snapshots
  scoreDelta: number | null
  scoreTrend: ScoreTrend | null
}

export type ActorPublic = Actor  // compat alias

// ─── Score History ─────────────────────────────────────────────────────────

export interface ScoreSnapshot {
  id: string
  actorId: string | null
  score: number | null           // PF Score composite
  authorityScore: number | null  // Now stored separately — enables multi-line chart
  reachScore: number | null      // Now stored separately — enables multi-line chart
  scoreDelta: number | null
  snapshotDate: string | null
  snapshotType: string | null    // Scheduled / Event-Triggered
  triggerNotes: string | null    // Analyst annotation — the "why" behind score movement
}

// A single point on the score history chart.
// All three score lines are available — PF, Authority, Reach.
// annotation surfaces as a callout/tooltip at inflection points (e.g. "Operation Epic Fury").
export interface ScoreHistoryPoint {
  date: string
  pfScore: number
  authorityScore: number | null  // null for snapshots taken before this field was added
  reachScore: number | null      // null for snapshots taken before this field was added
  delta: number | null
  annotation: string | null      // triggerNotes — shown on chart at this date
  snapshotType: string | null
}

export interface ScoreMover {
  actorId: string
  actorSlug: string
  actorName: string
  pfScore: number
  delta: number
  region: string | null
  actorType: ActorType
}

// ─── Conflicts ─────────────────────────────────────────────────────────────

export interface ConflictPublic {
  id: string
  name: string
  region: string | null
  intensity: string | null      // Major War / War / Conflict / Low Intensity / Frozen
  type: string | null
  gapTrend: string | null       // Widening / Stable / Narrowing / Resolved
  currentStatus: string | null
  primaryActors: string | null  // Free-text fallback
  nuclearRisk: string | null
  startYear: number | null
  pfGapScore: number | null
  linkedActorIds: string[]
  linkedActors: ConflictActor[] // Enriched after join — the key signal on conflict cards
}

// Stripped-down actor shape used inside conflict cards.
// delta is what makes this a live intelligence feed rather than a static list.
export interface ConflictActor {
  id: string
  name: string
  pfScore: number | null
  delta: number | null
  actorType: ActorType
}

// ─── Briefs ────────────────────────────────────────────────────────────────

export interface BriefPublic {
  id: string
  title: string
  briefType: string | null      // Weekly / Monthly / Flash / Deep Dive
  status: string | null
  dateRangeStart: string | null
  dateRangeEnd: string | null
  editorialPriority: string | null
  leadThesis: string | null
  summaryDek: string | null      // short 1-2 sentence summary for card display
  bodyPreview: string | null     // truncated first paragraph, used as card fallback
  visibility: string | null
}

export interface BriefFull extends BriefPublic {
  blocks: NotionBlock[]
}

// ─── Notion Blocks ─────────────────────────────────────────────────────────

export interface NotionBlock {
  id: string
  type: string
  content: string
  children?: NotionBlock[]
}

// ─── Actor Relationships ────────────────────────────────────────────────────

export interface ActorRelationship {
  id: string
  title: string
  primaryActorId: string
  comparedActorId: string
  counterpartyName: string
  relationshipType: string | null
  alignmentScore: number | null
  leverageScore: number | null
  dependencyScore: number | null
  lastScored: string | null
  notes: string | null   // 1-2 sentence reasoning from the relationship scorer
}

export interface ActorRelationships {
  outgoing: ActorRelationship[]  // this actor → others
  incoming: ActorRelationship[]  // others → this actor
}

// ─── Map Types ────────────────────────────────────────────────────────────

export interface MapActor {
  name: string
  slug: string
  iso3: string
  pfScore: number | null
  authorityScore: number | null
  reachScore: number | null
  pfVector: string | null
  scoreTrend: string | null
}

export interface MapActorFull extends MapActor {
  scoreReasoning: string | null
  scoreDelta: number | null
  bestRelationship: { name: string; alignment: number } | null
  worstRelationship: { name: string; alignment: number } | null
  recentEvents: { date: string; name: string }[]
}

// ─── Monetization hook ─────────────────────────────────────────────────────

// Not active yet. Wire to your auth session when ready.
export type AccessLevel = 'free' | 'paid'

export interface AccessContext {
  level: AccessLevel
  userId?: string
}
