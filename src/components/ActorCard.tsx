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
    case "State":
      return "#60a5fa";
    case "Non-State":
      return "#fb923c";
    case "Hybrid":
      return "#a78bfa";
    case "IGO":
      return "#34d399";
    default:
      return "#9ca3af";
  }
}

export function pfScoreColor(score: number): string {
  if (score >= 70) return "#22c55e";
  if (score >= 40) return "#eab308";
  return "#ef4444";
}

export default function ActorCard({ actor, rank, delta }: ActorCardProps) {
  const scoreColor = pfScoreColor(actor.pfScore ?? 0);
  return (
    <Link href={`/actors/${actor.id}`} className="block">
      <div className="bg-[#111111] border border-[#1f2937] rounded-lg p-4 hover:border-[#3b82f6]/50 transition-colors cursor-pointer">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {rank !== undefined && (
              <span className="text-xs text-gray-500 w-5 shrink-0 tabular-nums">
                #{rank}
              </span>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {actor.name || "Unknown"}
              </p>
              <span
                className="text-xs font-medium"
                style={{ color: actorTypeBadgeColor(actor.actorType) }}
              >
                {actor.actorType || "—"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className="text-xl font-bold tabular-nums"
              style={{ color: scoreColor }}
            >
              {actor.pfScore !== null ? actor.pfScore : "—"}
            </span>
            {delta !== undefined && <ScoreDelta delta={delta} />}
          </div>
        </div>
      </div>
    </Link>
  );
}