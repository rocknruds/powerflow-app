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
    <div className="bg-[#1a1a1a] border border-[#2d3748] rounded-lg p-3 max-w-[260px] shadow-xl">
      <p className="text-xs text-gray-500 mb-2">{label ? formatDate(label) : ""}</p>
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
        <p className="text-xs text-gray-400 border-t border-[#2d3748] pt-2 leading-relaxed">
          {point.annotation.length > 180
            ? point.annotation.slice(0, 180) + "…"
            : point.annotation}
        </p>
      )}
      {point?.delta !== null && point?.delta !== undefined && (
        <div className="mt-1.5 border-t border-[#2d3748] pt-1.5">
          <span
            className="text-xs font-semibold tabular-nums"
            style={{ color: (point.delta ?? 0) >= 0 ? "#22c55e" : "#ef4444" }}
          >
            {(point.delta ?? 0) >= 0 ? "+" : ""}
            {point.delta?.toFixed(1)} Δ
          </span>
        </div>
      )}
    </div>
  );
}

export default function ScoreChart({ snapshots }: ScoreChartProps) {
  if (snapshots.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-gray-600">
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
            stroke="#1f2937"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fill: "#6b7280", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: "#6b7280", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={28}
          />
          <Tooltip content={<CustomTooltip />} />
          {hasComponentScores && (
            <Legend
              formatter={(value) => (
                <span style={{ color: "#9ca3af", fontSize: 11 }}>{value}</span>
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
            stroke="#3b82f6"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }}
            connectNulls={false}
          />

          {/* Authority — secondary line, only if data exists */}
          {hasComponentScores && (
            <Line
              type="monotone"
              dataKey="authorityScore"
              name="Authority"
              stroke="#f59e0b"
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, fill: "#f59e0b", strokeWidth: 0 }}
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
              stroke="#f97316"
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, fill: "#f97316", strokeWidth: 0 }}
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
              fill="#3b82f6"
              stroke="#0a0a0a"
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}