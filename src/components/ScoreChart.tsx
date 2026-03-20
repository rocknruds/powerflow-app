"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
  Legend,
} from "recharts";
import type { ScoreHistoryPoint } from "@/lib/types";
import type { IntelFeedItem } from "@/lib/intel-feeds";

interface ScoreChartProps {
  snapshots: ScoreHistoryPoint[];
  intelFeeds?: IntelFeedItem[];
}

interface TooltipEntry {
  dataKey: string;
  name: string;
  color: string;
  value: number | null;
  payload: ScoreHistoryPoint;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
}

function formatDateLong(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function PFSignalBadge({ signal }: { signal: string | null }) {
  if (!signal) return null;
  const colors: Record<string, { text: string; bg: string }> = {
    Widening: { text: "var(--delta-down)", bg: "color-mix(in srgb, var(--delta-down) 12%, transparent)" },
    Narrowing: { text: "var(--delta-up)", bg: "color-mix(in srgb, var(--delta-up) 12%, transparent)" },
    Mixed: { text: "var(--score-mid)", bg: "color-mix(in srgb, var(--score-mid) 12%, transparent)" },
    Stable: { text: "var(--muted)", bg: "color-mix(in srgb, var(--muted) 12%, transparent)" },
    Unclear: { text: "var(--score-mid)", bg: "color-mix(in srgb, var(--score-mid) 12%, transparent)" },
  };
  const c = colors[signal] ?? { text: "var(--muted-foreground)", bg: "color-mix(in srgb, var(--muted) 12%, transparent)" };
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ color: c.text, backgroundColor: c.bg }}>
      {signal}
    </span>
  );
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0]?.payload as ScoreHistoryPoint;
  return (
    <div className="rounded-lg p-3 max-w-[260px] shadow-xl" style={{ backgroundColor: "var(--surface-raised)", border: "1px solid var(--border)" }}>
      <p className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>{label ? formatDate(label) : ""}</p>
      <div className="space-y-1 mb-2">
        {payload.map((entry: TooltipEntry) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-4">
            <span className="text-xs" style={{ color: entry.color }}>
              {entry.name}
            </span>
            <span className="text-xs font-semibold tabular-nums" style={{ color: entry.color }}>
              {entry.value !== null ? entry.value : "—"}
            </span>
          </div>
        ))}
      </div>
      {point?.annotation && (
        <p className="text-xs pt-2 leading-relaxed" style={{ color: "var(--muted-foreground)", borderTop: "1px solid var(--border)" }}>
          {point.annotation.length > 180
            ? point.annotation.slice(0, 180) + "…"
            : point.annotation}
        </p>
      )}
      {point?.delta !== null && point?.delta !== undefined && (
        <div className="mt-1.5 pt-1.5" style={{ borderTop: "1px solid var(--border)" }}>
          <span
            className="text-xs font-semibold tabular-nums"
            style={{ color: (point.delta ?? 0) >= 0 ? "var(--delta-up)" : "var(--delta-down)" }}
          >
            {(point.delta ?? 0) >= 0 ? "+" : ""}
            {point.delta != null ? Math.round(point.delta) : ""} Δ
          </span>
        </div>
      )}
    </div>
  );
}

function getMatchingFeeds(feeds: IntelFeedItem[], snapshotDate: string): IntelFeedItem[] {
  const snap = new Date(snapshotDate).getTime();
  const windowStart = snap - 14 * 24 * 60 * 60 * 1000;
  return feeds.filter((f) => {
    const raw = f.dateIngested ?? f.publicationDate;
    if (!raw) return false;
    const t = new Date(raw).getTime();
    return t >= windowStart && t <= snap;
  }).slice(0, 3);
}

export default function ScoreChart({ snapshots, intelFeeds }: ScoreChartProps) {
  const [selectedPoint, setSelectedPoint] = useState<ScoreHistoryPoint | null>(null);

  if (snapshots.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-sm" style={{ color: "var(--muted)" }}>
        No score history available yet.
      </div>
    );
  }

  // Sort ascending by date for correct line rendering
  const sorted = [...snapshots].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Find annotated points (event-triggered snapshots with notes) to mark on chart
  const annotatedPoints = sorted.filter(
    (s) => s.annotation && s.snapshotType === "Event-Triggered"
  );

  // Check if we have component scores to show
  const hasComponentScores = sorted.some(
    (s) => s.authorityScore !== null || s.reachScore !== null
  );

  const matchingFeeds = selectedPoint && intelFeeds
    ? getMatchingFeeds(intelFeeds, selectedPoint.date)
    : [];

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart
          data={sorted}
          margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
          onClick={(data) => {
            const pt: ScoreHistoryPoint | null = data?.activePayload?.[0]?.payload ?? null;
            setSelectedPoint((prev) =>
              prev && pt && prev.date === pt.date ? null : pt
            );
          }}
          style={{ cursor: "pointer" }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip content={<CustomTooltip />} />
          {hasComponentScores && (
            <Legend
              formatter={(value) => (
                <span style={{ color: "var(--muted-foreground)", fontSize: 11 }}>{value}</span>
              )}
              iconType="plainline"
              wrapperStyle={{ paddingTop: 12 }}
            />
          )}

          {/* PF Score — primary line, always shown */}
          <Line
            type="monotone"
            dataKey="pfScore"
            name="PF Score"
            stroke="var(--accent)"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, fill: "var(--accent)", strokeWidth: 0 }}
            connectNulls={false}
          />

          {/* Authority — secondary line, only if data exists */}
          {hasComponentScores && (
            <Line
              type="monotone"
              dataKey="authorityScore"
              name="Authority"
              stroke="var(--score-authority)"
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, fill: "var(--score-authority)", strokeWidth: 0 }}
              strokeDasharray="4 2"
              connectNulls={false}
            />
          )}

          {/* Reach — tertiary line, only if data exists */}
          {hasComponentScores && (
            <Line
              type="monotone"
              dataKey="reachScore"
              name="Reach"
              stroke="var(--score-reach)"
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, fill: "var(--score-reach)", strokeWidth: 0 }}
              strokeDasharray="2 3"
              connectNulls={false}
            />
          )}

          {/* Annotated event dots — visible markers for inflection points */}
          {annotatedPoints.map((pt, i) => (
            <ReferenceDot
              key={i}
              x={pt.date}
              y={pt.pfScore}
              r={6}
              fill={selectedPoint?.date === pt.date ? "var(--accent)" : "var(--accent)"}
              stroke="white"
              strokeWidth={2}
              cursor="pointer"
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Click-to-explain panel */}
      {selectedPoint && (
        <div
          style={{ borderTop: "1px solid var(--border)" }}
          className="mt-0 pt-4"
          onClick={() => setSelectedPoint(null)}
        >
          <div
            className="rounded-lg p-4"
            style={{ backgroundColor: "var(--surface-raised)", border: "1px solid var(--border)", cursor: "default" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded tabular-nums"
                  style={{ backgroundColor: "var(--surface)", color: "var(--muted)" }}
                >
                  {formatDateLong(selectedPoint.date)}
                </span>
                {selectedPoint.delta !== null && selectedPoint.delta !== undefined && (
                  <span
                    className="text-xs font-semibold tabular-nums px-1.5 py-0.5 rounded"
                    style={{
                      color: (selectedPoint.delta ?? 0) >= 0 ? "var(--delta-up)" : "var(--delta-down)",
                      backgroundColor: (selectedPoint.delta ?? 0) >= 0
                        ? "color-mix(in srgb, var(--delta-up) 12%, transparent)"
                        : "color-mix(in srgb, var(--delta-down) 12%, transparent)",
                    }}
                  >
                    {(selectedPoint.delta ?? 0) >= 0 ? "+" : ""}
                    {Math.round(selectedPoint.delta ?? 0)} Δ
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedPoint(null)}
                className="text-xs leading-none"
                style={{ color: "var(--muted)", background: "none", border: "none", cursor: "pointer", padding: "2px 4px" }}
              >
                ✕
              </button>
            </div>

            {/* Annotation — primary "why" */}
            {selectedPoint.annotation && (
              <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--foreground)" }}>
                {selectedPoint.annotation}
              </p>
            )}

            {/* Matching intel feeds */}
            {matchingFeeds.length > 0 && (
              <div className="space-y-2" style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>
                  Intel from this period
                </p>
                {matchingFeeds.map((feed) => (
                  <div
                    key={feed.id}
                    className="rounded px-3 py-2"
                    style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
                  >
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {(feed.dateIngested ?? feed.publicationDate) && (
                        <span
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded tabular-nums"
                          style={{ backgroundColor: "var(--surface-raised)", color: "var(--muted)" }}
                        >
                          {new Date(feed.dateIngested ?? feed.publicationDate!).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      )}
                      <PFSignalBadge signal={feed.pfSignal} />
                    </div>
                    {feed.soWhatSummary && (
                      <p className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                        {feed.soWhatSummary}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
