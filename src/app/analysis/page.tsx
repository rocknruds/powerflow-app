import { getAllAssessments } from "@/lib/assessments";
import type { AssessmentSummary } from "@/lib/assessments";
import Link from "next/link";
import LogoMark from "@/components/LogoMark";

export const revalidate = 300;
export const metadata = { title: "Analysis" };

const PF_SIGNAL_COLORS: Record<string, { text: string; bg: string }> = {
  Widening:  { text: "var(--delta-down)", bg: "color-mix(in srgb, var(--delta-down) 12%, transparent)" },
  Narrowing: { text: "var(--delta-up)",   bg: "color-mix(in srgb, var(--delta-up) 12%, transparent)" },
  Stable:    { text: "var(--accent)",     bg: "color-mix(in srgb, var(--accent) 12%, transparent)" },
  Mixed:     { text: "var(--score-mid)",  bg: "color-mix(in srgb, var(--score-mid) 12%, transparent)" },
  Unclear:   { text: "var(--muted)",      bg: "color-mix(in srgb, var(--muted) 12%, transparent)" },
};

function PFSignalBadge({ signal }: { signal: string | null }) {
  if (!signal) return null;
  const c = PF_SIGNAL_COLORS[signal] ?? { text: "var(--muted-foreground)", bg: "transparent" };
  return (
    <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ color: c.text, backgroundColor: c.bg }}>
      {signal}
    </span>
  );
}

function ConfidenceBadge({ level }: { level: string | null }) {
  if (!level) return null;
  const colors: Record<string, string> = { High: "var(--delta-up)", Medium: "var(--score-mid)", Low: "var(--delta-down)" };
  return (
    <span className="text-xs px-2 py-0.5 rounded" style={{ color: colors[level] ?? "var(--muted)", border: "1px solid var(--border)" }}>
      {level}
    </span>
  );
}

function formatPeriod(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function getTeaser(text: string, maxLen = 180): string {
  if (!text) return "";
  if (text.length <= maxLen) return text;
  const truncated = text.slice(0, maxLen);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + "\u2026";
}

function AssessmentFeedCard({ assessment }: { assessment: AssessmentSummary }) {
  return (
    <div
      className="rounded-xl p-5 transition-colors"
      style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
        <h3 className="text-base font-semibold leading-snug flex-1" style={{ color: "var(--foreground)" }}>
          {assessment.title}
        </h3>
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <PFSignalBadge signal={assessment.pfSignal} />
          <ConfidenceBadge level={assessment.confidenceLevel} />
        </div>
      </div>

      <div className="flex items-center gap-3 mb-3 flex-wrap">
        {assessment.region && (
          <span className="text-xs" style={{ color: "var(--muted)" }}>{assessment.region}</span>
        )}
        {assessment.timePeriod && (
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            · {formatPeriod(assessment.timePeriod)}–
          </span>
        )}
        {assessment.pfScore !== null && (
          <span className="text-xs font-mono" style={{ color: "var(--muted)" }}>
            · PF {Math.round(assessment.pfScore)}
          </span>
        )}
        {assessment.generatedOn && (
          <span className="text-xs ml-auto" style={{ color: "var(--muted)" }}>
            {formatPeriod(assessment.generatedOn)}
          </span>
        )}
      </div>

      {assessment.analystCommentary && (
        <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--muted-foreground)" }}>
          {getTeaser(assessment.analystCommentary)}
        </p>
      )}

      <Link
        href={`/analysis/${assessment.id}`}
        className="text-xs font-medium transition-opacity hover:opacity-70"
        style={{ color: "var(--accent)" }}
      >
        Read full assessment →
      </Link>
    </div>
  );
}

export default async function AnalysisPage() {
  const assessments = await getAllAssessments();

  const regions = [...new Set(assessments.map((a) => a.region).filter(Boolean))].sort() as string[];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      <div className="py-10" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--foreground)" }}>Analysis</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {assessments.length} assessment{assessments.length !== 1 ? "s" : ""} — doctrine-driven actor analysis, updated as conditions shift
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar filters */}
          {regions.length > 0 && (
            <aside className="lg:w-48 shrink-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
                Region
              </p>
              <div className="space-y-1">
                <Link
                  href="/analysis"
                  className="block text-sm px-2 py-1.5 rounded transition-colors"
                  style={{ color: "var(--foreground)", backgroundColor: "var(--surface-raised)" }}
                >
                  All regions
                </Link>
                {regions.map((r) => (
                  <Link
                    key={r}
                    href={`/analysis?region=${encodeURIComponent(r)}`}
                    className="block text-sm px-2 py-1.5 rounded transition-colors"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {r}
                  </Link>
                ))}
              </div>
            </aside>
          )}

          {/* Feed */}
          <div className="flex-1 space-y-4">
            {assessments.length === 0 ? (
              <div
                className="rounded-lg px-6 py-16 text-center text-sm"
                style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--muted)" }}
              >
                No assessments published yet.
              </div>
            ) : (
              assessments.map((a) => <AssessmentFeedCard key={a.id} assessment={a} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
