"use client";

import { useState } from "react";
import Link from "next/link";
import type { Assessment } from "@/lib/assessments";

function getTwoSentences(text: string): string {
  const matches = text.match(/[^.!?]*[.!?]+/g) ?? [];
  return matches.slice(0, 2).join(" ").trim() || text.slice(0, 200);
}

const PF_SIGNAL_COLORS: Record<string, { text: string; bg: string }> = {
  Widening: { text: "var(--delta-down)", bg: "color-mix(in srgb, var(--delta-down) 12%, transparent)" },
  Narrowing: { text: "var(--delta-up)", bg: "color-mix(in srgb, var(--delta-up) 12%, transparent)" },
  Stable: { text: "var(--accent)", bg: "color-mix(in srgb, var(--accent) 12%, transparent)" },
  Mixed: { text: "var(--score-mid)", bg: "color-mix(in srgb, var(--score-mid) 12%, transparent)" },
};

export default function AssessmentCard({ assessment }: { assessment: Assessment | null }) {
  const [expanded, setExpanded] = useState(false);

  if (!assessment) {
    return (
      <p className="text-sm py-1" style={{ color: "var(--muted)" }}>
        No assessment published yet.
      </p>
    );
  }

  const teaser = getTwoSentences(assessment.analystCommentary);
  const signalColors =
    PF_SIGNAL_COLORS[assessment.pfSignal] ??
    { text: "var(--muted-foreground)", bg: "color-mix(in srgb, var(--muted) 12%, transparent)" };

  const timePeriodFormatted = assessment.timePeriod
    ? new Date(assessment.timePeriod).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : null;

  return (
    <div className="rounded-xl" style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-6 pt-5 pb-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1 h-4 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
            Latest Assessment
          </span>
        </div>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <h3 className="text-base font-semibold leading-snug" style={{ color: "var(--foreground)" }}>
            {assessment.title}
          </h3>
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {assessment.pfSignal && (
              <span
                className="text-xs px-2 py-0.5 rounded font-medium"
                style={{ color: signalColors.text, backgroundColor: signalColors.bg }}
              >
                {assessment.pfSignal}
              </span>
            )}
            {assessment.confidenceLevel && (
              <span
                className="text-xs px-2 py-0.5 rounded"
                style={{ color: "var(--muted)", border: "1px solid var(--border)" }}
              >
                {assessment.confidenceLevel}
              </span>
            )}
            {timePeriodFormatted && (
              <span className="text-xs" style={{ color: "var(--muted)" }}>{timePeriodFormatted}</span>
            )}
            <span className="text-xs ml-1 select-none" style={{ color: "var(--muted)" }}>
              {expanded ? "▲" : "▼"}
            </span>
          </div>
        </div>
      </button>

      <div className="px-6 pb-5">
        {!expanded ? (
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
            {teaser}
          </p>
        ) : (
          <>
            <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--muted-foreground)" }}>
              {assessment.analystCommentary}
            </p>
            {assessment.currentPosition && (
              <>
                <div className="my-4 h-px" style={{ backgroundColor: "var(--border)" }} />
                <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                  {assessment.currentPosition}
                </p>
              </>
            )}
          </>
        )}

        <div className="mt-4 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
          <Link
            href={`/analysis/${assessment.id}`}
            className="text-xs font-medium transition-opacity hover:opacity-70"
            style={{ color: "var(--accent)" }}
          >
            View full assessment →
          </Link>
        </div>
      </div>
    </div>
  );
}
