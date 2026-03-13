import Link from "next/link";
import { getAllPublicActors, enrichActorsWithDeltas } from "@/lib/actors";
import { getLatestDeltaByActor, computeScoreMovers } from "@/lib/scores";
import { getLatestBrief } from "@/lib/briefs";
import { getActiveScenarios } from "@/lib/scenarios";
import ScoreDelta from "@/components/ScoreDelta";
import ActorCard from "@/components/ActorCard";
import { pfScoreColor } from "@/components/ActorCard";

export const revalidate = 300;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="w-1 h-4 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
      <h2 className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>
        {children}
      </h2>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      className="rounded-lg px-6 py-10 text-center text-sm"
      style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--muted)" }}
    >
      {message}
    </div>
  );
}

export default async function HomePage() {
  const [actors, deltaMap, latestBrief, scenarios] = await Promise.all([
    getAllPublicActors(),
    getLatestDeltaByActor(),
    getLatestBrief(),
    getActiveScenarios(),
  ]);

  const enrichedActors = enrichActorsWithDeltas(actors, deltaMap);
  const top10 = enrichedActors.slice(0, 10);

  const deltaRecord: Record<string, number> = {};
  for (const [id, delta] of deltaMap.entries()) {
    if (delta !== null) deltaRecord[id] = delta;
  }

  const { gainers, fallers } = computeScoreMovers(enrichedActors, 5);
  const movers = [...gainers, ...fallers]
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 5);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="py-16 md:py-20" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-5">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "var(--accent)" }} />
              <span className="text-xs font-medium tracking-widest uppercase" style={{ color: "var(--accent)" }}>
                PowerFlow Lab
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-5" style={{ color: "var(--foreground)" }}>
              PowerFlow
            </h1>
            <p className="text-lg leading-relaxed max-w-xl" style={{ color: "var(--muted)" }}>
              We don&apos;t analyze what governments claim. We analyze where power actually moves.
            </p>
            <div className="flex items-center gap-4 mt-8">
              <Link
                href="/actors"
                className="px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors text-white"
                style={{ backgroundColor: "var(--accent)" }}
              >
                Actor Leaderboard
              </Link>
              <Link
                href="/briefs"
                className="px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors"
                style={{ border: "1px solid var(--border)", color: "var(--muted-foreground)" }}
              >
                Latest Briefs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Score Movers Strip ───────────────────────────────── */}
      {movers.length > 0 && (
        <section className="py-6" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none">
              <span className="text-xs font-semibold uppercase tracking-widest shrink-0" style={{ color: "var(--muted)" }}>
                Score Movers
              </span>
              <div className="h-4 w-px shrink-0" style={{ backgroundColor: "var(--border)" }} />
              {movers.map((m) => (
                <div
                  key={m.actorId}
                  className="flex items-center gap-2.5 shrink-0 rounded-lg px-3 py-2"
                  style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
                >
                  <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                    {m.actorName}
                  </span>
                  <span className="text-sm font-bold tabular-nums" style={{ color: pfScoreColor(m.pfScore) }}>
                    {m.pfScore ? Math.round(m.pfScore) : "—"}
                  </span>
                  <ScoreDelta delta={m.delta} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* ── Left column ───────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-12">
          {/* Actor Leaderboard */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <SectionLabel>Actor Leaderboard</SectionLabel>
              <Link href="/actors" className="text-xs transition-colors" style={{ color: "var(--accent)" }}>
                View all →
              </Link>
            </div>
            {top10.length === 0 ? (
              <EmptyState message="No actors available yet." />
            ) : (
              <div className="space-y-2">
                {top10.map((actor, idx) => (
                  <ActorCard key={actor.id} actor={actor} rank={idx + 1} delta={deltaRecord[actor.id] ?? 0} />
                ))}
              </div>
            )}
          </section>

          {/* Latest Brief */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <SectionLabel>Latest Brief</SectionLabel>
              <Link href="/briefs" className="text-xs transition-colors" style={{ color: "var(--accent)" }}>
                All briefs →
              </Link>
            </div>
            {!latestBrief ? (
              <EmptyState message="No briefs published yet." />
            ) : (
              <Link href={`/briefs/${latestBrief.id}`} className="block">
                <div
                  className="rounded-lg p-6 transition-colors"
                  style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
                >
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {latestBrief.briefType && (
                      <span
                        className="text-xs px-2 py-0.5 rounded font-medium"
                        style={{ color: "var(--accent)", border: "1px solid color-mix(in srgb, var(--accent) 40%, transparent)", backgroundColor: "color-mix(in srgb, var(--accent) 10%, transparent)" }}
                      >
                        {latestBrief.briefType}
                      </span>
                    )}
                    {latestBrief.status && (
                      <span
                        className="text-xs px-2 py-0.5 rounded font-medium"
                        style={{
                          color: latestBrief.status === "Final" ? "var(--delta-up)" : "var(--score-mid)",
                          backgroundColor: latestBrief.status === "Final" ? "color-mix(in srgb, var(--delta-up) 12%, transparent)" : "color-mix(in srgb, var(--score-mid) 12%, transparent)",
                        }}
                      >
                        {latestBrief.status}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg mb-2" style={{ color: "var(--foreground)" }}>
                    {latestBrief.title || "Untitled Brief"}
                  </h3>
                  {(latestBrief.dateRangeStart || latestBrief.dateRangeEnd) && (
                    <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>
                      {latestBrief.dateRangeStart && new Date(latestBrief.dateRangeStart).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      {latestBrief.dateRangeEnd && ` – ${new Date(latestBrief.dateRangeEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
                    </p>
                  )}
                  {latestBrief.editorialPriority && (
                    <p className="text-sm line-clamp-3" style={{ color: "var(--muted-foreground)" }}>
                      {latestBrief.editorialPriority.slice(0, 300)}
                      {latestBrief.editorialPriority.length > 300 && "…"}
                    </p>
                  )}
                  <span className="mt-4 inline-block text-sm font-medium" style={{ color: "var(--accent)" }}>
                    Read full brief →
                  </span>
                </div>
              </Link>
            )}
          </section>
        </div>

        {/* ── Right column ──────────────────────────────────── */}
        <div className="space-y-12">
          <section>
            <div className="flex items-center justify-between mb-6">
              <SectionLabel>Active Scenarios</SectionLabel>
            </div>
            {scenarios.length === 0 ? (
              <EmptyState message="No active scenarios." />
            ) : (
              <div className="space-y-3">
                {scenarios.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-lg p-4"
                    style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-sm font-semibold leading-snug" style={{ color: "var(--foreground)" }}>
                        {s.name || "Unnamed Scenario"}
                      </h3>
                      {s.probabilityEstimate !== "" && s.probabilityEstimate !== 0 && (
                        <span
                          className="shrink-0 text-xs font-bold px-2 py-0.5 rounded tabular-nums"
                          style={{ color: "var(--accent)", backgroundColor: "color-mix(in srgb, var(--accent) 15%, transparent)", border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)" }}
                        >
                          {typeof s.probabilityEstimate === "number" ? `${s.probabilityEstimate}%` : s.probabilityEstimate}
                        </span>
                      )}
                    </div>
                    {s.scenarioClass && (
                      <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                        {s.scenarioClass}
                      </span>
                    )}
                    {s.triggerCondition && (
                      <p className="text-xs mt-2 leading-relaxed" style={{ color: "var(--muted)" }}>
                        {s.triggerCondition.slice(0, 100)}
                        {s.triggerCondition.length > 100 && "…"}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <SectionLabel>Navigate</SectionLabel>
            <div className="space-y-1.5">
              {[
                { href: "/actors", label: "Actor Leaderboard", desc: "All tracked actors by PF Score" },
                { href: "/briefs", label: "Intelligence Briefs", desc: "Weekly & monthly analysis" },
                { href: "/conflicts", label: "Conflicts Overview", desc: "Active conflict registry" },
              ].map(({ href, label, desc }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-start gap-3 p-3 rounded-lg transition-colors group"
                  style={{ border: "1px solid var(--border)" }}
                >
                  <span className="w-1 h-1 rounded-full mt-2 shrink-0" style={{ backgroundColor: "var(--accent)" }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{label}</p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>{desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}