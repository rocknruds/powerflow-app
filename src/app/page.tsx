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
      <span className="w-1 h-4 bg-[#3b82f6] rounded-full" />
      <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
        {children}
      </h2>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-[#1f2937] bg-[#111111] px-6 py-10 text-center text-sm text-gray-600">
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

  // Delta record for ActorCard (id → delta number)
  const deltaRecord: Record<string, number> = {};
  for (const [id, delta] of deltaMap.entries()) {
    if (delta !== null) deltaRecord[id] = delta;
  }

  // Top movers — gainers and fallers combined, sorted by absolute delta
  const { gainers, fallers } = computeScoreMovers(enrichedActors, 5);
  const movers = [...gainers, ...fallers]
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="border-b border-[#1f2937] py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] animate-pulse" />
              <span className="text-xs font-medium tracking-widest uppercase text-[#3b82f6]">
                PowerFlow Lab
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white leading-tight mb-5">
              PowerFlow
            </h1>
            <p className="text-lg text-gray-400 leading-relaxed max-w-xl">
              We don&apos;t analyze what governments claim. We analyze where
              power actually moves.
            </p>
            <div className="flex items-center gap-4 mt-8">
              <Link
                href="/actors"
                className="px-5 py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Actor Leaderboard
              </Link>
              <Link
                href="/briefs"
                className="px-5 py-2.5 border border-[#1f2937] hover:border-[#3b82f6]/50 text-gray-300 hover:text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Latest Briefs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Score Movers Strip ────────────────────────────────── */}
      {movers.length > 0 && (
        <section className="border-b border-[#1f2937] py-6">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none">
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-600 shrink-0">
                Score Movers
              </span>
              <div className="h-4 w-px bg-[#1f2937] shrink-0" />
              {movers.map((m) => (
                <div
                  key={m.actorId}
                  className="flex items-center gap-2.5 shrink-0 bg-[#111111] border border-[#1f2937] rounded-lg px-3 py-2"
                >
                  <span className="text-sm font-semibold text-white">
                    {m.actorName}
                  </span>
                  <span
                    className="text-sm font-bold tabular-nums"
                    style={{ color: pfScoreColor(m.pfScore) }}
                  >
                    {m.pfScore || "—"}
                  </span>
                  <ScoreDelta delta={m.delta} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* ── Left column: Leaderboard + Brief ─────────────────── */}
        <div className="lg:col-span-2 space-y-12">
          {/* Actor Leaderboard */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <SectionLabel>Actor Leaderboard</SectionLabel>
              <Link
                href="/actors"
                className="text-xs text-[#3b82f6] hover:text-[#60a5fa] transition-colors"
              >
                View all →
              </Link>
            </div>
            {top10.length === 0 ? (
              <EmptyState message="No actors available yet." />
            ) : (
              <div className="space-y-2">
                {top10.map((actor, idx) => (
                  <ActorCard
                    key={actor.id}
                    actor={actor}
                    rank={idx + 1}
                    delta={deltaRecord[actor.id] ?? 0}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Latest Brief */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <SectionLabel>Latest Brief</SectionLabel>
              <Link
                href="/briefs"
                className="text-xs text-[#3b82f6] hover:text-[#60a5fa] transition-colors"
              >
                All briefs →
              </Link>
            </div>
            {!latestBrief ? (
              <EmptyState message="No briefs published yet." />
            ) : (
              <Link href={`/briefs/${latestBrief.id}`} className="block">
                <div className="bg-[#111111] border border-[#1f2937] rounded-lg p-6 hover:border-[#3b82f6]/50 transition-colors">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {latestBrief.briefType && (
                      <span className="text-xs px-2 py-0.5 rounded border border-[#3b82f6]/40 text-[#3b82f6] bg-[#3b82f6]/10 font-medium">
                        {latestBrief.briefType}
                      </span>
                    )}
                    {latestBrief.status && (
                      <span
                        className="text-xs px-2 py-0.5 rounded font-medium"
                        style={{
                          color:
                            latestBrief.status === "Final"
                              ? "#22c55e"
                              : "#eab308",
                          backgroundColor:
                            latestBrief.status === "Final"
                              ? "#22c55e18"
                              : "#eab30818",
                        }}
                      >
                        {latestBrief.status}
                      </span>
                    )}
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">
                    {latestBrief.title || "Untitled Brief"}
                  </h3>
                  {(latestBrief.dateRangeStart || latestBrief.dateRangeEnd) && (
                    <p className="text-xs text-gray-500 mb-3">
                      {latestBrief.dateRangeStart &&
                        new Date(latestBrief.dateRangeStart).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric", year: "numeric" }
                        )}
                      {latestBrief.dateRangeEnd &&
                        ` – ${new Date(latestBrief.dateRangeEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
                    </p>
                  )}
                  {latestBrief.editorialPriority && (
                    <p className="text-sm text-gray-400 line-clamp-3">
                      {latestBrief.editorialPriority.slice(0, 300)}
                      {latestBrief.editorialPriority.length > 300 && "…"}
                    </p>
                  )}
                  <span className="mt-4 inline-block text-sm text-[#3b82f6] font-medium">
                    Read full brief →
                  </span>
                </div>
              </Link>
            )}
          </section>
        </div>

        {/* ── Right column: Active Scenarios ───────────────────── */}
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
                    className="bg-[#111111] border border-[#1f2937] rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-sm font-semibold text-white leading-snug">
                        {s.name || "Unnamed Scenario"}
                      </h3>
                      {s.probabilityEstimate !== "" &&
                        s.probabilityEstimate !== 0 && (
                          <span className="shrink-0 text-xs font-bold px-2 py-0.5 rounded bg-[#3b82f6]/15 text-[#60a5fa] tabular-nums border border-[#3b82f6]/30">
                            {typeof s.probabilityEstimate === "number"
                              ? `${s.probabilityEstimate}%`
                              : s.probabilityEstimate}
                          </span>
                        )}
                    </div>
                    {s.scenarioClass && (
                      <span className="text-xs text-gray-600 font-medium uppercase tracking-wide">
                        {s.scenarioClass}
                      </span>
                    )}
                    {s.triggerCondition && (
                      <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                        {s.triggerCondition.slice(0, 100)}
                        {s.triggerCondition.length > 100 && "…"}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Quick links */}
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
                  className="flex items-start gap-3 p-3 rounded-lg border border-[#1f2937] hover:border-[#3b82f6]/40 hover:bg-[#111111] transition-colors group"
                >
                  <span className="w-1 h-1 rounded-full bg-[#3b82f6] mt-2 shrink-0 group-hover:bg-[#60a5fa] transition-colors" />
                  <div>
                    <p className="text-sm font-medium text-white group-hover:text-[#60a5fa] transition-colors">
                      {label}
                    </p>
                    <p className="text-xs text-gray-600">{desc}</p>
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
