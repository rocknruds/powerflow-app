import { getAllPublicConflicts, enrichConflictsWithActors } from "@/lib/conflicts";
import { getLatestDeltaByActor } from "@/lib/scores";
import type { ConflictPublic, ConflictActor } from "@/lib/types";

export const revalidate = 300;

export const metadata = {
  title: "Conflicts",
};

// Intensity → color
const INTENSITY_COLORS: Record<string, { dot: string; label: string; bg: string }> = {
  "Major War": { dot: "var(--delta-down)", label: "var(--delta-down)", bg: "color-mix(in srgb, var(--delta-down) 12%, transparent)" },
  War: { dot: "var(--score-reach)", label: "var(--score-reach)", bg: "color-mix(in srgb, var(--score-reach) 12%, transparent)" },
  Conflict: { dot: "var(--score-mid)", label: "var(--score-mid)", bg: "color-mix(in srgb, var(--score-mid) 12%, transparent)" },
  "Low Intensity": { dot: "var(--muted)", label: "var(--muted-foreground)", bg: "color-mix(in srgb, var(--muted) 12%, transparent)" },
  Frozen: { dot: "var(--accent)", label: "var(--accent)", bg: "color-mix(in srgb, var(--accent) 12%, transparent)" },
};

function IntensityBadge({ intensity }: { intensity: string | null }) {
  if (!intensity) return null;
  const c = INTENSITY_COLORS[intensity] ?? {
    dot: "var(--muted)",
    label: "var(--muted-foreground)",
    bg: "color-mix(in srgb, var(--muted) 12%, transparent)",
  };
  return (
    <span
      className="flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded"
      style={{ color: c.label, backgroundColor: c.bg }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: c.dot }}
      />
      {intensity}
    </span>
  );
}

function ActorDeltaChip({ actor }: { actor: ConflictActor }) {
  const pf = actor.pfScore != null ? Math.round(actor.pfScore).toString() : "—";
  const hasDelta = actor.delta !== null;
  const positive = (actor.delta ?? 0) >= 0;

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
      <span className="text-xs font-medium" style={{ color: "var(--foreground)" }}>{actor.name}</span>
      <span className="text-xs font-mono" style={{ color: "var(--muted)" }}>{pf}</span>
      {hasDelta && (
        <span
          className="text-[10px] font-semibold tabular-nums"
          style={{ color: positive ? "var(--delta-up)" : "var(--delta-down)" }}
        >
          {positive ? "+" : ""}
          {actor.delta != null ? Math.round(actor.delta) : ""}
        </span>
      )}
    </div>
  );
}

function GapTrendBadge({ trend }: { trend: string | null }) {
  if (!trend) return null;
  const map: Record<string, string> = {
    Widening: "var(--delta-down)",
    Narrowing: "var(--delta-up)",
    Stable: "var(--muted)",
    Resolved: "var(--accent)",
  };
  const color = map[trend] ?? "var(--muted-foreground)";
  return (
    <span className="text-xs" style={{ color }}>
      {trend === "Widening" ? "↑ " : trend === "Narrowing" ? "↓ " : ""}
      {trend}
    </span>
  );
}

function ConflictCard({ conflict }: { conflict: ConflictPublic }) {
  return (
    <div className="rounded-xl p-5 transition-colors" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
      {/* Card header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold leading-snug" style={{ color: "var(--foreground)" }}>
            {conflict.name}
          </h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {conflict.region && (
              <span className="text-xs" style={{ color: "var(--muted)" }}>{conflict.region}</span>
            )}
            {conflict.type && (
              <span className="text-xs" style={{ color: "var(--muted)" }}>· {conflict.type}</span>
            )}
            {conflict.startYear && (
              <span className="text-xs" style={{ color: "var(--muted)" }}>· {conflict.startYear}–</span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <IntensityBadge intensity={conflict.intensity} />
          {conflict.gapTrend && (
            <GapTrendBadge trend={conflict.gapTrend} />
          )}
        </div>
      </div>

      {/* Status line */}
      {conflict.currentStatus && (
        <p className="text-xs leading-relaxed mb-3 line-clamp-2" style={{ color: "var(--muted)" }}>
          {conflict.currentStatus}
        </p>
      )}

      {/* Actor delta chips — the differentiating feature */}
      {conflict.linkedActors.length > 0 && (
        <div className="pt-3" style={{ borderTop: "1px solid var(--border)" }}>
          <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>
            Linked Actors
          </p>
          <div className="flex flex-wrap gap-2">
            {conflict.linkedActors.map((actor) => (
              <ActorDeltaChip key={actor.id} actor={actor} />
            ))}
          </div>
        </div>
      )}

      {/* Nuclear risk indicator */}
      {conflict.nuclearRisk && conflict.nuclearRisk !== "None" && (
        <div className="mt-3 pt-2.5" style={{ borderTop: "1px solid var(--border)" }}>
          <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--delta-down)" }}>
            ☢ Nuclear Risk: {conflict.nuclearRisk}
          </span>
        </div>
      )}
    </div>
  );
}

export default async function ConflictsPage() {
  const [conflicts, deltaMap] = await Promise.all([
    getAllPublicConflicts(),
    getLatestDeltaByActor(),
  ]);

  const enriched = await enrichConflictsWithActors(conflicts, deltaMap);

  // Group by intensity for visual hierarchy
  const majorWars = enriched.filter((c) => c.intensity === "Major War");
  const wars = enriched.filter((c) => c.intensity === "War");
  const others = enriched.filter(
    (c) => c.intensity !== "Major War" && c.intensity !== "War"
  );

  function ConflictGroup({
    label,
    items,
  }: {
    label: string;
    items: ConflictPublic[];
  }) {
    if (items.length === 0) return null;
    return (
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-5">
          <span className="w-1 h-4 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
          <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>
            {label}
          </h2>
          <span className="text-xs" style={{ color: "var(--muted)" }}>({items.length})</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {items.map((c) => (
            <ConflictCard key={c.id} conflict={c} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      {/* Page header */}
      <div className="py-10" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
              PowerFlow Lab
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--foreground)" }}>Conflicts</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {enriched.length} tracked conflict{enriched.length !== 1 ? "s" : ""} — actor scores inline
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {enriched.length === 0 ? (
          <div className="rounded-lg px-6 py-16 text-center text-sm" style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--muted)" }}>
            No public conflicts in the registry yet.
          </div>
        ) : (
          <>
            <ConflictGroup label="Major Wars" items={majorWars} />
            <ConflictGroup label="Active Wars" items={wars} />
            <ConflictGroup label="Other Conflicts" items={others} />
          </>
        )}
      </div>
    </div>
  );
}