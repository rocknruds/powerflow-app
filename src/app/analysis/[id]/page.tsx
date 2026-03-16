import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getAllAssessments, getAssessmentById } from "@/lib/assessments";
import { pfScoreColor } from "@/components/ActorCard";

export const revalidate = 300;

export async function generateStaticParams() {
  const assessments = await getAllAssessments();
  return assessments.map((a) => ({ id: a.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const assessment = await getAssessmentById(id);
  return { title: assessment?.title ?? "Assessment" };
}

// ─── Inline helpers (copied from actor profile pattern) ─────────────────────

function MetaBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded" style={{ color: "var(--muted)", border: "1px solid var(--border)" }}>
      {children}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="w-1 h-4 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
      <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
        {children}
      </h2>
    </div>
  );
}

const PF_SIGNAL_COLORS: Record<string, { text: string; bg: string }> = {
  Widening: { text: "var(--delta-down)", bg: "color-mix(in srgb, var(--delta-down) 12%, transparent)" },
  Narrowing: { text: "var(--delta-up)", bg: "color-mix(in srgb, var(--delta-up) 12%, transparent)" },
  Stable: { text: "var(--accent)", bg: "color-mix(in srgb, var(--accent) 12%, transparent)" },
  Mixed: { text: "var(--score-mid)", bg: "color-mix(in srgb, var(--score-mid) 12%, transparent)" },
  Unclear: { text: "var(--score-mid)", bg: "color-mix(in srgb, var(--score-mid) 12%, transparent)" },
};

function PFSignalBadge({ signal }: { signal: string | null }) {
  if (!signal) return null;
  const c = PF_SIGNAL_COLORS[signal] ?? { text: "var(--muted-foreground)", bg: "color-mix(in srgb, var(--muted) 12%, transparent)" };
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

// ─── Page ───────────────────────────────────────────────────────────────────

function formatMonthYear(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function formatPeriodRange(dateStr: string | null): string {
  if (!dateStr) return "";
  const formatted = new Date(dateStr).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  return `${formatted}\u2013Present`;
}

export default async function AssessmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const assessment = await getAssessmentById(id);
  if (!assessment) notFound();

  const scoreColor = assessment.pfScore !== null ? pfScoreColor(assessment.pfScore) : "var(--muted)";
  // Derive authority/reach from pfScore for display (sqrt model: PF = √(A×R))
  // These aren't available on the assessment — only show pfScore if present

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      {/* Header */}
      <div className="py-10" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-4xl mx-auto px-6">
          <Link
            href="/analysis"
            className="text-xs transition-colors mb-5 inline-flex items-center gap-1"
            style={{ color: "var(--muted)" }}
          >
            ← Analysis
          </Link>

          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {assessment.region && <MetaBadge>{assessment.region}</MetaBadge>}
            <PFSignalBadge signal={assessment.pfSignal} />
            <ConfidenceBadge level={assessment.confidenceLevel} />
            {assessment.pfScore !== null && (
              <span className="text-xs font-mono" style={{ color: "var(--muted)" }}>
                PF {Math.round(assessment.pfScore)}
              </span>
            )}
            {assessment.generatedOn && (
              <span className="text-xs" style={{ color: "var(--muted)" }}>
                Generated {formatMonthYear(assessment.generatedOn)}
              </span>
            )}
          </div>

          <h1 className="text-3xl font-bold" style={{ color: "var(--foreground)" }}>
            {assessment.title}
          </h1>

          {assessment.timePeriod && (
            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
              {formatPeriodRange(assessment.timePeriod)}
            </p>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Left sidebar */}
          <div className="lg:w-52 shrink-0 space-y-6">
            {assessment.primaryDrivers.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>
                  Primary Drivers
                </p>
                <div className="flex flex-wrap gap-1">
                  {assessment.primaryDrivers.map((d) => (
                    <span
                      key={d}
                      className="text-xs px-2 py-0.5 rounded"
                      style={{ backgroundColor: "var(--surface-raised)", color: "var(--muted-foreground)" }}
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {assessment.riskProfile.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>
                  Risk Profile
                </p>
                <div className="flex flex-wrap gap-1">
                  {assessment.riskProfile.map((r) => (
                    <span
                      key={r}
                      className="text-xs px-2 py-0.5 rounded"
                      style={{ backgroundColor: "var(--surface-raised)", color: "var(--muted-foreground)" }}
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="h-px" style={{ backgroundColor: "var(--border)" }} />

            {assessment.pfScore !== null && (
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: "var(--muted)" }}>PF Score</p>
                  <p className="text-xl font-bold tabular-nums" style={{ color: scoreColor }}>
                    {Math.round(assessment.pfScore)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Main column */}
          <div className="flex-1 space-y-8">
            {assessment.currentPosition && (
              <div>
                <SectionLabel>Current Position</SectionLabel>
                <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                  {assessment.currentPosition}
                </p>
              </div>
            )}

            {assessment.analystCommentary && (
              <>
                {assessment.currentPosition && (
                  <div className="h-px" style={{ backgroundColor: "var(--border)" }} />
                )}
                <div>
                  <SectionLabel>Analyst Commentary</SectionLabel>
                  <p className="text-[0.9rem] leading-relaxed whitespace-pre-line" style={{ color: "var(--muted-foreground)" }}>
                    {assessment.analystCommentary}
                  </p>
                </div>
              </>
            )}

            {assessment.periodReview && (
              <>
                <div className="h-px" style={{ backgroundColor: "var(--border)" }} />
                <div>
                  <SectionLabel>Period Review</SectionLabel>
                  <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--muted-foreground)" }}>
                    {assessment.periodReview}
                  </p>
                </div>
              </>
            )}

            {assessment.outlook && (
              <>
                <div className="h-px" style={{ backgroundColor: "var(--border)" }} />
                <div>
                  <SectionLabel>Outlook</SectionLabel>
                  <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--foreground)", opacity: 0.8 }}>
                    {assessment.outlook}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
