import { queryDatabase, getNumber, getDate, getText, getSelect, getRelationIds } from './notion'
import type { ScoreSnapshot, ScoreHistoryPoint, ScoreMover, Actor } from './types'

const SNAPSHOTS_DB_ID =
  process.env.NOTION_SCORE_SNAPSHOTS_DB_ID ?? 'e96696510cac4435a52e89be9fb6a969'

// ─── Parsing ──────────────────────────────────────────────────────────────

function parseSnapshot(page: any): ScoreSnapshot {
  const props = page.properties
  return {
    id: page.id,
    actorId: getRelationIds(props, 'Actor')[0] ?? null,
    score: getNumber(props, 'Score'),
    authorityScore: getNumber(props, 'Authority Score'),  // populated from score_agent.py >= Mar 2026
    reachScore: getNumber(props, 'Reach Score'),          // populated from score_agent.py >= Mar 2026
    scoreDelta: getNumber(props, 'Score Delta'),
    snapshotDate: getDate(props, 'Snapshot Date'),
    snapshotType: getSelect(props, 'Snapshot Type'),
    triggerNotes: getText(props, 'Trigger Notes') || null,
  }
}

// ─── Queries ──────────────────────────────────────────────────────────────

/**
 * Snapshots from the last N days — used to build the movers panel and delta map.
 */
export async function getRecentSnapshots(days = 30): Promise<ScoreSnapshot[]> {
  const since = new Date()
  since.setDate(since.getDate() - days)

  const pages = await queryDatabase(
    SNAPSHOTS_DB_ID,
    {
      property: 'Snapshot Date',
      date: { on_or_after: since.toISOString().split('T')[0] },
    },
    [{ property: 'Snapshot Date', direction: 'descending' }]
  )

  return pages.map(parseSnapshot)
}

/**
 * Build actorId → most recent score delta map.
 * Used to enrich actors before rendering the scoreboard and conflict cards.
 */
export async function getLatestDeltaByActor(): Promise<Map<string, number | null>> {
  const snapshots = await getRecentSnapshots(30)

  const latestByActor = new Map<string, ScoreSnapshot>()
  for (const snap of snapshots) {
    if (!snap.actorId) continue
    const existing = latestByActor.get(snap.actorId)
    if (
      !existing ||
      (snap.snapshotDate && (!existing.snapshotDate || snap.snapshotDate > existing.snapshotDate))
    ) {
      latestByActor.set(snap.actorId, snap)
    }
  }

  const deltaMap = new Map<string, number | null>()
  for (const [actorId, snap] of latestByActor) {
    deltaMap.set(actorId, snap.scoreDelta)
  }
  return deltaMap
}

/**
 * Full score history for a single actor — used for the trajectory chart.
 *
 * Returns ScoreHistoryPoint[] sorted oldest-first, ready to pass to recharts.
 *
 * Three lines are available: pfScore, authorityScore, reachScore.
 * authorityScore and reachScore will be null for snapshots taken before
 * March 2026 (when those fields were added to the schema). The chart
 * component should handle nulls gracefully — just don't render those lines
 * for early data points.
 *
 * annotation = triggerNotes from the agent — the "why" behind each inflection.
 * This is what makes the chart intelligence rather than just a sparkline.
 * Example: "Operation Epic Fury destroyed IRGC command infrastructure..."
 * shows up as a callout on the chart at that date.
 */
export async function getActorScoreHistory(actorId: string): Promise<ScoreHistoryPoint[]> {
  const pages = await queryDatabase(
    SNAPSHOTS_DB_ID,
    { property: 'Actor', relation: { contains: actorId } },
    [{ property: 'Snapshot Date', direction: 'ascending' }]
  )

  const snapshots = pages.map(parseSnapshot)

  return snapshots
    .filter(
      (s): s is ScoreSnapshot & { snapshotDate: string; score: number } =>
        s.snapshotDate !== null && s.score !== null
    )
    .map((s) => ({
      date: s.snapshotDate,
      pfScore: s.score,
      authorityScore: s.authorityScore,   // null for pre-schema snapshots — handle in chart
      reachScore: s.reachScore,           // null for pre-schema snapshots — handle in chart
      delta: s.scoreDelta,
      annotation: s.triggerNotes,
      snapshotType: s.snapshotType,
    }))
}

// ─── Derived data ─────────────────────────────────────────────────────────

/**
 * Top score movers split into gainers + fallers.
 * Call after enrichActorsWithDeltas() — no extra Notion calls needed.
 */
export function computeScoreMovers(
  actors: Actor[],
  limit = 5
): { gainers: ScoreMover[]; fallers: ScoreMover[] } {
  const withDelta = actors.filter(
    (a): a is Actor & { scoreDelta: number } =>
      a.scoreDelta !== null && a.scoreDelta !== 0 && a.pfScore !== null
  )

  const toMover = (a: Actor & { scoreDelta: number }): ScoreMover => ({
    actorId: a.id,
    actorName: a.name,
    pfScore: a.pfScore!,
    delta: a.scoreDelta,
    region: a.region,
    actorType: a.actorType,
  })

  const gainers = withDelta
    .filter((a) => a.scoreDelta > 0)
    .sort((a, b) => b.scoreDelta - a.scoreDelta)
    .slice(0, limit)
    .map(toMover)

  const fallers = withDelta
    .filter((a) => a.scoreDelta < 0)
    .sort((a, b) => a.scoreDelta - b.scoreDelta)
    .slice(0, limit)
    .map(toMover)

  return { gainers, fallers }
}
