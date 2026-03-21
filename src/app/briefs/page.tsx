import { getAllPublicBriefs } from "@/lib/briefs";
import Link from "next/link";
import LogoMark from "@/components/LogoMark";
import type { BriefPublic } from "@/lib/types";

export const revalidate = 300;

export const metadata = {
  title: "Intelligence Briefs",
};

// ─── Date helpers ─────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
]

function parseDateParts(iso: string): { year: number; month: number; day: number } | null {
  const parts = iso.split("-")
  if (parts.length < 3) return null
  return { year: +parts[0], month: +parts[1], day: +parts[2] }
}

/** Format an ISO date string (YYYY-MM-DD) without timezone offset issues. */
function fmtDate(d: string | null, opts: Intl.DateTimeFormatOptions): string {
  if (!d) return ""
  const p = parseDateParts(d)
  if (!p) return d
  return new Date(p.year, p.month - 1, p.day).toLocaleDateString("en-US", opts)
}

function fmtShort(d: string | null): string {
  return fmtDate(d, { month: "short", day: "numeric" })
}

function fmtRange(start: string | null, end: string | null, short = false): string {
  const opts: Intl.DateTimeFormatOptions = short
    ? { month: "short", day: "numeric" }
    : { month: "short", day: "numeric", year: "numeric" }
  if (!start) return ""
  const s = fmtDate(start, opts)
  const e = end ? fmtDate(end, opts) : null
  return e ? `${s} – ${e}` : s
}

/** Derive clean heading for monthly briefs: "March 2026" + optional "through March 18". */
function parseBriefHeading(brief: BriefPublic): { name: string; sub: string | null } {
  if (brief.briefType === "Monthly" && brief.dateRangeStart) {
    const s = parseDateParts(brief.dateRangeStart)
    if (s) {
      const name = `${MONTH_NAMES[s.month - 1]} ${s.year}`
      let sub: string | null = null
      if (brief.dateRangeEnd) {
        const e = parseDateParts(brief.dateRangeEnd)
        if (e) {
          const lastDay = new Date(e.year, e.month, 0).getDate()
          if (e.day < lastDay) sub = `through ${MONTH_NAMES[e.month - 1]} ${e.day}`
        }
      }
      return { name, sub }
    }
  }
  const parts = (brief.title || "Untitled Brief").split(" — ")
  return { name: parts[0], sub: parts.length > 1 ? parts.slice(1).join(" — ") : null }
}

// ─── Components ───────────────────────────────────────────────────────────────

function DraftBadge({ status }: { status: string | null }) {
  if (!status || status === "Published") return null
  return (
    <span
      className="text-xs px-2 py-0.5 rounded font-medium"
      style={{
        color: "var(--score-mid)",
        backgroundColor: "color-mix(in srgb, var(--score-mid) 10%, transparent)",
      }}
    >
      {status}
    </span>
  )
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <span
        className="text-xs font-semibold uppercase tracking-widest shrink-0"
        style={{ color: "var(--muted)" }}
      >
        {label}
      </span>
      <div className="flex-1 h-px" style={{ backgroundColor: "var(--border)" }} />
    </div>
  )
}

// ─── Monthly Hero ─────────────────────────────────────────────────────────────

function MonthlyHero({ brief }: { brief: BriefPublic }) {
  const { name: monthTitle, sub: throughDate } = parseBriefHeading(brief)

  return (
    <Link href={`/briefs/${brief.id}`} className="block group">
      <div
        className="rounded-xl p-8 md:p-10 relative overflow-hidden"
        style={{ backgroundColor: "var(--surface-raised)", border: "1px solid var(--border)" }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--score-mid) 8%, transparent) 0%, transparent 60%)",
          }}
        />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--score-mid)" }}
            >
              Monthly Brief
            </span>
            <DraftBadge status={brief.status} />
          </div>

          <h2
            className="text-3xl md:text-4xl font-bold leading-tight group-hover:opacity-90 transition-opacity"
            style={{ color: "var(--foreground)" }}
          >
            {monthTitle}
          </h2>

          {throughDate ? (
            <p className="text-base mt-1 mb-5" style={{ color: "var(--muted)" }}>
              {throughDate}
            </p>
          ) : (
            <div className="mb-5" />
          )}

          {(brief.summaryDek || brief.leadThesis || brief.bodyPreview) && (
            <p className="text-base leading-relaxed max-w-2xl mb-6" style={{ color: "var(--muted-foreground)" }}>
              {brief.summaryDek || brief.leadThesis || brief.bodyPreview}
            </p>
          )}

          <span
            className="text-sm font-medium inline-flex items-center gap-1.5"
            style={{ color: "var(--score-mid)" }}
          >
            Read monthly brief
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </span>
        </div>
      </div>
    </Link>
  )
}

// ─── Weekly Row ───────────────────────────────────────────────────────────────

function WeeklyRow({ brief, last }: { brief: BriefPublic; last: boolean }) {
  return (
    <Link href={`/briefs/${brief.id}`} className="block group">
      <div
        className="flex items-start gap-5 py-4"
        style={{ borderBottom: last ? "none" : "1px solid var(--border)" }}
      >
        <div className="shrink-0 w-28 pt-0.5">
          <span className="text-xs tabular-nums" style={{ color: "var(--muted)" }}>
            {fmtRange(brief.dateRangeStart, brief.dateRangeEnd, true)}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <h4
            className="font-medium text-sm leading-snug mb-1 group-hover:opacity-80 transition-opacity"
            style={{ color: "var(--foreground)" }}
          >
            {brief.title || "Untitled Brief"}
          </h4>
          {(brief.summaryDek || brief.leadThesis || brief.bodyPreview) && (
            <p className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              {brief.summaryDek || brief.leadThesis || brief.bodyPreview}
            </p>
          )}
        </div>

        <div className="shrink-0 flex items-center gap-2 pt-0.5">
          <DraftBadge status={brief.status} />
          <span
            className="text-xs opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: "var(--accent)" }}
          >
            →
          </span>
        </div>
      </div>
    </Link>
  )
}

// ─── Featured weekly (fallback if no monthlies) ───────────────────────────────

function FeaturedWeekly({ brief }: { brief: BriefPublic }) {
  return (
    <Link href={`/briefs/${brief.id}`} className="block group">
      <div
        className="rounded-xl p-8 md:p-10 relative overflow-hidden"
        style={{ backgroundColor: "var(--surface-raised)", border: "1px solid var(--border)" }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--accent) 6%, transparent) 0%, transparent 60%)",
          }}
        />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
              Weekly
            </span>
            <span className="text-xs" style={{ color: "var(--muted)" }}>
              {fmtRange(brief.dateRangeStart, brief.dateRangeEnd)}
            </span>
            <DraftBadge status={brief.status} />
          </div>
          <h2
            className="text-2xl md:text-3xl font-bold leading-tight mb-4 group-hover:opacity-90 transition-opacity"
            style={{ color: "var(--foreground)" }}
          >
            {brief.title || "Untitled Brief"}
          </h2>
          {(brief.summaryDek || brief.leadThesis || brief.bodyPreview) && (
            <p className="text-base leading-relaxed max-w-2xl mb-6" style={{ color: "var(--muted-foreground)" }}>
              {brief.summaryDek || brief.leadThesis || brief.bodyPreview}
            </p>
          )}
          <span
            className="text-sm font-medium inline-flex items-center gap-1.5"
            style={{ color: "var(--accent)" }}
          >
            Read brief
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </span>
        </div>
      </div>
    </Link>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function BriefsPage() {
  const briefs = await getAllPublicBriefs()

  const monthlies = briefs.filter((b) => b.briefType?.toLowerCase() === "monthly")
  const weeklies = briefs.filter((b) => b.briefType?.toLowerCase() === "weekly")
  const others = briefs.filter(
    (b) => !["monthly", "weekly"].includes(b.briefType?.toLowerCase() ?? "")
  )

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      {/* Header */}
      <div className="border-b py-10" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-5xl mx-auto px-6">
          <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--foreground)" }}>
            Intelligence Briefs
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Narrative synthesis — tracking shifts in the global power architecture.
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-14">
        {briefs.length === 0 ? (
          <div
            className="rounded-lg px-6 py-16 text-center text-sm"
            style={{
              border: "1px solid var(--border)",
              backgroundColor: "var(--surface)",
              color: "var(--muted)",
            }}
          >
            No briefs published yet.
          </div>
        ) : (
          <>
            {/* Monthly — featured hero */}
            {monthlies.length > 0 && (
              <section>
                <SectionHeader label="Monthly Analysis" />
                <MonthlyHero brief={monthlies[0]} />
              </section>
            )}

            {/* Weekly — if no monthlies, feature the latest */}
            {!monthlies.length && weeklies.length > 0 && (
              <section>
                <FeaturedWeekly brief={weeklies[0]} />
              </section>
            )}

            {/* Weekly Dispatches */}
            {weeklies.length > 0 && (
              <section>
                <SectionHeader label="Weekly Dispatches" />
                <div
                  className="rounded-lg px-5"
                  style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
                >
                  {/* If no monthly, skip the first weekly since it's already featured */}
                  {(monthlies.length ? weeklies : weeklies.slice(1)).map((b, i, arr) => (
                    <WeeklyRow key={b.id} brief={b} last={i === arr.length - 1} />
                  ))}
                </div>
              </section>
            )}

            {/* Special Reports and other types */}
            {others.length > 0 && (
              <section>
                <SectionHeader label="Special Reports" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {others.map((b) => (
                    <Link key={b.id} href={`/briefs/${b.id}`} className="block group">
                      <div
                        className="rounded-lg p-5 h-full flex flex-col"
                        style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
                      >
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <span
                            className="text-xs font-semibold uppercase tracking-widest"
                            style={{ color: "var(--accent)" }}
                          >
                            {b.briefType}
                          </span>
                          <DraftBadge status={b.status} />
                        </div>
                        <h3
                          className="font-semibold text-sm mb-2 group-hover:opacity-80 transition-opacity"
                          style={{ color: "var(--foreground)" }}
                        >
                          {b.title || "Untitled Brief"}
                        </h3>
                        <p className="text-xs" style={{ color: "var(--muted)" }}>
                          {fmtRange(b.dateRangeStart, b.dateRangeEnd)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
