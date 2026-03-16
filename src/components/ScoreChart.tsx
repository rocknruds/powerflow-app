"use client";

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

interface ScoreChartProps {
  snapshots: ScoreHistoryPoint[];
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

export default function ScoreChart({ snapshots }: ScoreChartProps) {
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

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart
          data={sorted}
          margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
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
              r={5}
              fill="var(--accent)"
              stroke="var(--background)"
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}