import { queryDatabase, getNumber, getDate, getText, getSelect, getRelationIds } from './notion'
import type { ScoreSnapshot, ScoreHistoryPoint, ScoreMover, Actor } from './types'

const SNAPSHOTS_DB_ID =
  process.env.NOTION_SCORE_SNAPSHOTS_DB_ID ?? 'e96696510cac4435a52e89be9fb6a969'

// ─── Parsing ──────────────────────────────────────────────────────────────

function parseSnapshot(page: Record<string, unknown>): ScoreSnapshot {
  const props = (page.properties ?? {}) as Record<string, unknown>
  return {
    id: page.id as string,
    actorId: getRelationIds(props, 'Linked Actor')[0] ?? null,
    score: getNumber(props, 'PF Score'),
    authorityScore: getNumber(props, 'Authority Score'),
    reachScore: getNumber(props, 'Reach Score'),
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
 * Query an actor's snapshot history to find the delta from their last
 * different PF score. Used for actors (like score anchors) whose recent
 * snapshots all carry the same score.
 */
async function fetchLastDifferentDelta(
  actorId: string,
  currentScore: number
): Promise<number | null> {
  try {
    const pages = await queryDatabase(
      SNAPSHOTS_DB_ID,
      { property: 'Linked Actor', relation: { contains: actorId } },
      [{ property: 'Snapshot Date', direction: 'descending' }]
    )
    const roundedCurrent = Math.round(currentScore)

    for (const page of pages) {
      const score = getNumber(
        (page.properties ?? {}) as Record<string, unknown>,
        'PF Score'
      )
      if (score !== null && Math.round(score) !== roundedCurrent) {
        return roundedCurrent - Math.round(score)
      }
    }
    return null
  } catch {
    return null
  }
}

/**
 * Enrich a delta map with historical deltas for actors without recent changes.
 * For actors whose latest 30-day snapshot has no meaningful delta, queries
 * their full snapshot history to find the last different PF score.
 */
export async function fillMissingDeltas(
  actors: Actor[],
  deltaMap: Map<string, number | null>
): Promise<Map<string, number | null>> {
  const enriched = new Map(deltaMap)

  const missing = actors.filter((a) => {
    const delta = deltaMap.get(a.id)
    return (delta === null || delta === undefined || delta === 0) && a.pfScore !== null
  })

  if (missing.length === 0) return enriched

  const results = await Promise.all(
    missing.map(async (actor) => ({
      actorId: actor.id,
      delta: await fetchLastDifferentDelta(actor.id, actor.pfScore!),
    }))
  )

  for (const { actorId, delta } of results) {
    if (delta !== null && delta !== 0) {
      enriched.set(actorId, delta)
    }
  }

  return enriched
}

/**
 * Full score history for a single actor — used for the trajectory chart.
 *
 * Returns ScoreHistoryPoint[] sorted oldest-first, ready to pass to recharts.
 * Three lines: pfScore, authorityScore, reachScore.
 * authorityScore and reachScore will be null for snapshots before March 2026.
 * annotation = triggerNotes from the agent — the "why" behind each inflection.
 */
export async function getActorScoreHistory(actorId: string): Promise<ScoreHistoryPoint[]> {
  try {
    const pages = await queryDatabase(
      SNAPSHOTS_DB_ID,
      { property: 'Linked Actor', relation: { contains: actorId } },
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
        authorityScore: s.authorityScore,
        reachScore: s.reachScore,
        delta: s.scoreDelta,
        annotation: s.triggerNotes,
        snapshotType: s.snapshotType,
      }))
  } catch {
    return []
  }
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
    actorSlug: a.slug,
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