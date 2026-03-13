import Link from "next/link";
import type { Actor } from "@/lib/types";
import ScoreDelta from "./ScoreDelta";

interface ActorCardProps {
  actor: Actor;
  rank?: number;
  delta?: number;
}

export function actorTypeBadgeColor(type: string): string {
  switch (type) {
    case "State": return "#60a5fa";
    case "Non-State": return "#fb923c";
    case "Hybrid": return "#a78bfa";
    case "IGO": return "#34d399";
    default: return "#9ca3af";
  }
}

export function pfScoreColor(score: number): string {
  if (score >= 70) return "var(--score-high)";
  if (score >= 40) return "var(--score-mid)";
  return "var(--score-low)";
}

export default function ActorCard({ actor, rank, delta }: ActorCardProps) {
  const scoreColor = pfScoreColor(actor.pfScore ?? 0);
  return (
    <Link href={`/actors/${actor.slug}`} className="block">
      <div
        className="rounded-lg p-4 transition-colors cursor-pointer"
        style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {rank !== undefined && (
              <span className="text-xs w-5 shrink-0 tabular-nums" style={{ color: "var(--muted)" }}>
                #{rank}
              </span>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>
                {actor.name || "Unknown"}
              </p>
              <span className="text-xs font-medium" style={{ color: actorTypeBadgeColor(actor.actorType) }}>
                {actor.actorType || "—"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xl font-bold tabular-nums" style={{ color: scoreColor }}>
              {actor.pfScore !== null ? Math.round(actor.pfScore ?? 0) : "—"}
            </span>
            {delta !== undefined && <ScoreDelta delta={delta} />}
          </div>
        </div>
      </div>
    </Link>
  );
}