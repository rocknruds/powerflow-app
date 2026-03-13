"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Actor } from "@/lib/types";
import { actorTypeBadgeColor, pfScoreColor } from "./ActorCard";
import ScoreDelta from "./ScoreDelta";

interface ActorTableProps {
  actors: Actor[];
  snapshotDeltaMap: Record<string, number>;
}

type SortKey = "pfScore" | "authorityScore" | "reachScore" | "name";

function ActorTypeBadge({ type }: { type: string }) {
  return (
    <span
      className="text-xs px-2 py-0.5 rounded font-medium"
      style={{
        color: actorTypeBadgeColor(type),
        border: `1px solid color-mix(in srgb, ${actorTypeBadgeColor(type)} 40%, transparent)`,
        backgroundColor: `color-mix(in srgb, ${actorTypeBadgeColor(type)} 12%, transparent)`,
      }}
    >
      {type || "—"}
    </span>
  );
}

function SortHeader({
  label, field, sortBy, sortDir, onClick,
}: {
  label: string; field: SortKey; sortBy: SortKey; sortDir: "asc" | "desc"; onClick: (f: SortKey) => void;
}) {
  const active = sortBy === field;
  return (
    <th
      className="pb-3 pr-4 cursor-pointer select-none whitespace-nowrap transition-colors"
      style={{ color: active ? "var(--foreground)" : "var(--muted)" }}
      onClick={() => onClick(field)}
    >
      {label}{" "}
      {active
        ? <span style={{ color: "var(--accent)" }}>{sortDir === "asc" ? "↑" : "↓"}</span>
        : <span style={{ color: "var(--border)" }}>↕</span>
      }
    </th>
  );
}

export default function ActorTable({ actors, snapshotDeltaMap }: ActorTableProps) {
  const [typeFilter, setTypeFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("pfScore");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const actorTypes = useMemo(() => [...new Set(actors.map((a) => a.actorType).filter(Boolean))].sort(), [actors]);
  const regions = useMemo(() => [...new Set(actors.map((a) => a.region).filter((r): r is string => r !== null))].sort(), [actors]);

  const filtered = useMemo(() => {
    let result = [...actors];
    if (typeFilter) result = result.filter((a) => a.actorType === typeFilter);
    if (regionFilter) result = result.filter((a) => a.region === regionFilter);
    result.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortBy === "name") return dir * a.name.localeCompare(b.name);
      return dir * (((a[sortBy] as number) ?? -1) - ((b[sortBy] as number) ?? -1));
    });
    return result;
  }, [actors, typeFilter, regionFilter, sortBy, sortDir]);

  function toggleSort(field: SortKey) {
    if (sortBy === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(field); setSortDir("desc"); }
  }

  const selectStyle = {
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
    color: "var(--foreground)",
    borderRadius: "6px",
    padding: "6px 12px",
    fontSize: "14px",
    outline: "none",
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={selectStyle}>
          <option value="">All Types</option>
          {actorTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)} style={selectStyle}>
          <option value="">All Regions</option>
          {regions.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <span className="text-xs" style={{ color: "var(--muted)" }}>
          {filtered.length} actor{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs" style={{ borderBottom: "1px solid var(--border)" }}>
              <th className="pb-3 pr-4" style={{ color: "var(--muted)" }}>Rank</th>
              <SortHeader label="Name" field="name" sortBy={sortBy} sortDir={sortDir} onClick={toggleSort} />
              <th className="pb-3 pr-4" style={{ color: "var(--muted)" }}>Type</th>
              <SortHeader label="Authority" field="authorityScore" sortBy={sortBy} sortDir={sortDir} onClick={toggleSort} />
              <SortHeader label="Reach" field="reachScore" sortBy={sortBy} sortDir={sortDir} onClick={toggleSort} />
              <SortHeader label="PF Score" field="pfScore" sortBy={sortBy} sortDir={sortDir} onClick={toggleSort} />
              <th className="pb-3 pr-4" style={{ color: "var(--muted)" }}>Vector</th>
              <th className="pb-3 pr-4" style={{ color: "var(--muted)" }}>Region</th>
              <th className="pb-3" style={{ color: "var(--muted)" }}>Δ</th>
            </tr>
          </thead>
          <tbody style={{ borderColor: "var(--border)" }}>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-16 text-center text-sm" style={{ color: "var(--muted)" }}>
                  No actors found
                </td>
              </tr>
            ) : (
              filtered.map((actor, idx) => {
                const delta = snapshotDeltaMap[actor.id] ?? 0;
                const scoreColor = pfScoreColor(actor.pfScore ?? 0);
                return (
                  <tr key={actor.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td className="py-3 pr-4 tabular-nums text-xs" style={{ color: "var(--muted)" }}>{idx + 1}</td>
                    <td className="py-3 pr-4">
                      <Link href={`/actors/${actor.slug}`} className="font-medium transition-colors" style={{ color: "var(--foreground)" }}>
                        {actor.name || "—"}
                      </Link>
                    </td>
                    <td className="py-3 pr-4"><ActorTypeBadge type={actor.actorType} /></td>
                    <td className="py-3 pr-4 tabular-nums" style={{ color: "var(--muted-foreground)" }}>{actor.authorityScore ?? "—"}</td>
                    <td className="py-3 pr-4 tabular-nums" style={{ color: "var(--muted-foreground)" }}>{actor.reachScore ?? "—"}</td>
                    <td className="py-3 pr-4">
                      <span className="font-bold text-base tabular-nums" style={{ color: scoreColor }}>{actor.pfScore != null ? Math.round(actor.pfScore) : "—"}</span>
                    </td>
                    <td className="py-3 pr-4 text-xs" style={{ color: "var(--muted)" }}>{actor.pfVector || "—"}</td>
                    <td className="py-3 pr-4 text-xs" style={{ color: "var(--muted)" }}>{actor.region || "—"}</td>
                    <td className="py-3"><ScoreDelta delta={delta} /></td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}