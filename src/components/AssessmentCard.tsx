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
  if (!assessment) return null;

  const teaser = getTwoSentences(assessment.analystCommentary);
  const signalColors =
    PF_SIGNAL_COLORS[assessment.pfSignal] ??
    { text: "var(--muted-foreground)", bg: "color-mix(in srgb, var(--muted) 12%, transparent)" };

  const timePeriodFormatted = assessment.timePeriod
    ? new Date(assessment.timePeriod).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : null;

  return (
    <div
      className="rounded-lg px-4 py-2.5"
      style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}
    >
      <div className="flex items-center gap-2 flex-wrap mb-1">
        {timePeriodFormatted && (
          <span
            className="text-[10px] font-mono px-1.5 py-0.5 rounded tabular-nums"
            style={{ backgroundColor: "var(--surface-raised)", color: "var(--muted)" }}
          >
            {timePeriodFormatted}
          </span>
        )}
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
            className="text-[10px] px-1.5 py-0.5 rounded"
            style={{ color: "var(--muted)", border: "1px solid var(--border)" }}
          >
            {assessment.confidenceLevel}
          </span>
        )}
      </div>

      <p className="text-sm font-medium leading-snug mb-1" style={{ color: "var(--foreground)" }}>
        {assessment.title}
      </p>

      <p className="text-xs leading-relaxed mb-2" style={{ color: "var(--muted-foreground)" }}>
        {teaser}
      </p>

      <Link
        href={`/analysis/${assessment.id}`}
        className="text-xs font-medium transition-opacity hover:opacity-70"
        style={{ color: "var(--accent)" }}
      >
        View full assessment →
      </Link>
    </div>
  );
}
