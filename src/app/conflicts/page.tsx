import { getAllPublicConflicts, enrichConflictsWithActors } from "@/lib/conflicts";
import { getLatestDeltaByActor } from "@/lib/scores";
import type { ConflictPublic, ConflictActor } from "@/lib/types";

export const revalidate = 300;

export const metadata = {
  title: "Conflicts",
};

// Intensity → color
const INTENSITY_COLORS: Record<string, { dot: string; label: string; border: string }> = {
  "Major War": { dot: "#ef4444", label: "#ef4444", border: "#ef444420" },
  War: { dot: "#f97316", label: "#f97316", border: "#f9731620" },
  Conflict: { dot: "#eab308", label: "#eab308", border: "#eab30820" },
  "Low Intensity": { dot: "#6b7280", label: "#9ca3af", border: "#6b728020" },
  Frozen: { dot: "#3b82f6", label: "#60a5fa", border: "#3b82f620" },
};

function IntensityBadge({ intensity }: { intensity: string | null }) {
  if (!intensity) return null;
  const c = INTENSITY_COLORS[intensity] ?? {
    dot: "#6b7280",
    label: "#9ca3af",
    border: "#6b728020",
  };
  return (
    <span
      className="flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded"
      style={{ color: c.label, backgroundColor: c.border }}
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
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0f172a] border border-[#1f2937]">
      <span className="text-xs font-medium text-white">{actor.name}</span>
      <span className="text-xs text-gray-500 font-mono">{pf}</span>
      {hasDelta && (
        <span
          className="text-[10px] font-semibold tabular-nums"
          style={{ color: positive ? "#22c55e" : "#ef4444" }}
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
    Widening: "#ef4444",
    Narrowing: "#22c55e",
    Stable: "#6b7280",
    Resolved: "#3b82f6",
  };
  const color = map[trend] ?? "#9ca3af";
  return (
    <span className="text-xs" style={{ color }}>
      {trend === "Widening" ? "↑ " : trend === "Narrowing" ? "↓ " : ""}
      {trend}
    </span>
  );
}

function ConflictCard({ conflict }: { conflict: ConflictPublic }) {
  return (
    <div className="bg-[#111111] border border-[#1f2937] rounded-xl p-5 hover:border-[#2d3748] transition-colors">
      {/* Card header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-white leading-snug">
            {conflict.name}
          </h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {conflict.region && (
              <span className="text-xs text-gray-600">{conflict.region}</span>
            )}
            {conflict.type && (
              <span className="text-xs text-gray-600">· {conflict.type}</span>
            )}
            {conflict.startYear && (
              <span className="text-xs text-gray-600">· {conflict.startYear}–</span>
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
        <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2">
          {conflict.currentStatus}
        </p>
      )}

      {/* Actor delta chips — the differentiating feature */}
      {conflict.linkedActors.length > 0 && (
        <div className="border-t border-[#1f2937] pt-3">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">
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
        <div className="mt-3 border-t border-[#1f2937] pt-2.5">
          <span className="text-[10px] font-semibold text-red-500 uppercase tracking-wide">
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
          <span className="w-1 h-4 bg-[#3b82f6] rounded-full" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            {label}
          </h2>
          <span className="text-xs text-gray-700">({items.length})</span>
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
      <div className="border-b border-[#1f2937] py-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
            <span className="text-xs font-semibold uppercase tracking-widest text-[#3b82f6]">
              PowerFlow Lab
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">Conflicts</h1>
          <p className="text-gray-500 text-sm">
            {enriched.length} tracked conflict{enriched.length !== 1 ? "s" : ""} — actor scores inline
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {enriched.length === 0 ? (
          <div className="rounded-lg border border-[#1f2937] bg-[#111111] px-6 py-16 text-center text-sm text-gray-600">
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