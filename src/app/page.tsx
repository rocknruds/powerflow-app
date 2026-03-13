import Link from "next/link";
import { ArrowRight, TrendingUp, Network, Activity, GitBranch, Zap, Database, Brain, LineChart, Globe } from "lucide-react";
import { getAllPublicActors, enrichActorsWithDeltas } from "@/lib/actors";
import { getLatestDeltaByActor, computeScoreMovers } from "@/lib/scores";
import { getLatestBrief } from "@/lib/briefs";
import { getActiveScenarios } from "@/lib/scenarios";
import ScoreDelta from "@/components/ScoreDelta";
import ActorCard from "@/components/ActorCard";
import { pfScoreColor } from "@/components/ActorCard";
import type { ActorPublic } from "@/lib/types";

export const revalidate = 300;

// ── Features data ──────────────────────────────────────────
const features = [
  {
    icon: Activity,
    title: "Authority & Reach Scoring",
    description:
      "Every actor is scored on two dimensions: Authority (internal control) and Reach (external influence). Scores update as events unfold.",
    color: "var(--score-authority)",
  },
  {
    icon: GitBranch,
    title: "Dependency Mapping",
    description:
      "Understand how power flows through relationships. See which actors depend on others and how disturbances cascade through the system.",
    color: "var(--accent)",
  },
  {
    icon: TrendingUp,
    title: "Score Trajectories",
    description:
      "Track how influence shifts over time. Visualize the rise and fall of actors through historical score analysis.",
    color: "var(--score-high)",
  },
  {
    icon: Zap,
    title: "AI-Powered Intelligence",
    description:
      "Agents continuously ingest intelligence, update scores, and surface reasoning from a private Notion knowledge graph.",
    color: "var(--score-reach)",
  },
];

// ── HowItWorks data ────────────────────────────────────────
const steps = [
  {
    icon: Database,
    number: "01",
    title: "Continuous Ingestion",
    description:
      "Intelligence agents monitor events, analyze developments, and extract signals from a private Notion knowledge graph.",
  },
  {
    icon: Brain,
    number: "02",
    title: "Dynamic Scoring",
    description:
      "Every event updates Authority and Reach scores. The system tracks not just what happened, but how it shifts power dynamics.",
  },
  {
    icon: LineChart,
    number: "03",
    title: "Cascade Analysis",
    description:
      "Dependencies are traced. When one actor shifts, the system maps how disturbances propagate through connected nodes.",
  },
  {
    icon: Globe,
    number: "04",
    title: "Public Interface",
    description:
      "A Next.js app translates analysis into actor profiles, score trajectories, and conflict tracking—designed for clarity, not clutter.",
  },
];

// ── Sub-components ─────────────────────────────────────────
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

// ── ScoreBar ───────────────────────────────────────────────
function ScoreBar({ label, value, color }: { label: string; value: number | null; color: string }) {
  const pct = value !== null ? Math.min(100, Math.max(0, value)) : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: "var(--muted)" }}>{label}</span>
        <span className="text-xs font-medium tabular-nums" style={{ color }}>{value ?? "—"}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--surface-raised)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

// ── ActorPreviewCard ───────────────────────────────────────
function ActorPreviewCard({ actor, delta }: { actor: ActorPublic; delta: number | null }) {
  const positive = delta !== null && delta >= 0;
  const hasDelta = delta !== null;

  return (
    <Link href={`/actors/${actor.slug}`} className="block group">
      <div
        className="rounded-lg p-6 flex flex-col gap-4 transition-colors"
        style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p
              className="text-base font-semibold leading-snug group-hover:text-[var(--accent)] transition-colors"
              style={{ color: "var(--foreground)" }}
            >
              {actor.name}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
              {actor.actorType ?? actor.subType ?? "—"}
            </p>
          </div>
          {hasDelta && (
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium shrink-0"
              style={{
                color: positive ? "var(--delta-up)" : "var(--delta-down)",
                backgroundColor: positive
                  ? "color-mix(in srgb, var(--delta-up) 10%, transparent)"
                  : "color-mix(in srgb, var(--delta-down) 10%, transparent)",
              }}
            >
              {positive ? "↑" : "↓"} {positive ? "+" : ""}{delta?.toFixed(1)}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <ScoreBar label="Authority" value={actor.authorityScore} color="var(--score-authority)" />
          <ScoreBar label="Reach" value={actor.reachScore} color="var(--score-reach)" />
        </div>

        <div className="flex items-center gap-1.5 mt-auto">
          <span className="text-xs" style={{ color: "var(--muted)" }}>View detailed analysis</span>
          <ArrowRight className="w-3 h-3" style={{ color: "var(--muted)" }} />
        </div>
      </div>
    </Link>
  );
}

// ── Page ───────────────────────────────────────────────────
export default async function HomePage() {
  const [actors, deltaMap, latestBrief, scenarios] = await Promise.all([
    getAllPublicActors(),
    getLatestDeltaByActor(),
    getLatestBrief(),
    getActiveScenarios(),
  ]);

  const enrichedActors = enrichActorsWithDeltas(actors, deltaMap);
  const top10 = enrichedActors.slice(0, 10);

  const deltaRecord: Record<string, number | null> = {};
  for (const [id, delta] of deltaMap.entries()) {
    deltaRecord[id] = delta;
  }

  const { gainers, fallers } = computeScoreMovers(enrichedActors, 5);
  const movers = [...gainers, ...fallers]
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 5);

  // Top 4 by PF score for the preview grid
  const previewActors = enrichedActors.slice(0, 4);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}>

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 px-6" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-7xl mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm mb-8"
              style={{
                backgroundColor: "color-mix(in srgb, var(--accent) 10%, transparent)",
                border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)",
                color: "var(--accent)",
              }}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Geopolitical Intelligence Platform</span>
            </div>

            <h1 className="text-5xl md:text-7xl mb-6 tracking-tight font-serif" style={{ color: "var(--foreground)" }}>
              Track How Power
              <br />
              <span style={{ color: "var(--accent)" }}>Actually Moves</span>
            </h1>

            <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              Not as states declare it, but as events reveal it. PowerFlow maps authority, reach, and
              dependencies across actors—creating a living record of geopolitical reality.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link
                href="/actors"
                className="w-full sm:w-auto px-6 py-3 rounded-md text-sm font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/briefs"
                className="w-full sm:w-auto px-6 py-3 rounded-md text-sm font-semibold transition-colors"
                style={{ border: "1px solid var(--border)", color: "var(--muted-foreground)" }}
              >
                Latest Briefs
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto pt-8" style={{ borderTop: "1px solid var(--border)" }}>
              <div>
                <div className="text-3xl font-serif mb-1" style={{ color: "var(--foreground)" }}>{actors.length}+</div>
                <div className="text-sm" style={{ color: "var(--muted)" }}>Tracked Actors</div>
              </div>
              <div>
                <div className="text-3xl font-serif mb-1" style={{ color: "var(--accent)" }}>Live</div>
                <div className="text-sm" style={{ color: "var(--muted)" }}>Real-time Updates</div>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <TrendingUp className="w-5 h-5" style={{ color: "var(--score-high)" }} />
                <div className="text-3xl font-serif" style={{ color: "var(--foreground)" }}>24/7</div>
                <div className="ml-2 text-sm" style={{ color: "var(--muted)" }}>Intelligence</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Score Movers Strip ─────────────────────────────── */}
      {movers.length > 0 && (
        <section className="py-6" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center gap-4 overflow-x-auto pb-2">
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
                  <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{m.actorName}</span>
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

      {/* ── Features ──────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ backgroundColor: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl mb-4 tracking-tight font-serif" style={{ color: "var(--foreground)" }}>
              Intelligence That Adapts
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: "var(--muted-foreground)" }}>
              A living record of geopolitical reality, not just another static dashboard
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-8 rounded-lg transition-all"
                style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}
              >
                <div
                  className="w-12 h-12 rounded-lg mb-4 flex items-center justify-center"
                  style={{ backgroundColor: `color-mix(in srgb, ${feature.color} 15%, transparent)` }}
                >
                  <feature.icon className="w-6 h-6" style={{ color: feature.color }} />
                </div>
                <h3 className="text-xl mb-3 font-semibold" style={{ color: "var(--foreground)" }}>{feature.title}</h3>
                <p className="leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────── */}
      <section className="py-24 px-6" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl mb-4 tracking-tight font-serif" style={{ color: "var(--foreground)" }}>
              From Events to Insight
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: "var(--muted-foreground)" }}>
              A systematic approach to understanding how power actually operates
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {index < steps.length - 1 && (
                  <div
                    className="hidden lg:block absolute top-7 left-full w-full h-px"
                    style={{ backgroundColor: "var(--border)", transform: "translateX(-50%)" }}
                  />
                )}
                <div className="relative z-10">
                  <div
                    className="w-14 h-14 rounded-lg flex items-center justify-center mb-4"
                    style={{
                      backgroundColor: "color-mix(in srgb, var(--accent) 10%, transparent)",
                      border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)",
                    }}
                  >
                    <step.icon className="w-7 h-7" style={{ color: "var(--accent)" }} />
                  </div>
                  <div className="text-5xl font-serif mb-2" style={{ color: "var(--foreground)", opacity: 0.2 }}>
                    {step.number}
                  </div>
                  <h3 className="text-lg mb-2 font-semibold" style={{ color: "var(--foreground)" }}>{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Actor Intelligence Preview ─────────────────────── */}
      {previewActors.length > 0 && (
        <section className="py-24 px-6" style={{ backgroundColor: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl mb-4 tracking-tight font-serif" style={{ color: "var(--foreground)" }}>
                Actor Intelligence
              </h2>
              <p className="text-lg max-w-2xl mx-auto" style={{ color: "var(--muted-foreground)" }}>
                Real-time scoring and analysis across states and non-state actors
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
              {previewActors.map((actor) => (
                <ActorPreviewCard key={actor.id} actor={actor} delta={deltaRecord[actor.id] ?? null} />
              ))}
            </div>
            <div className="flex justify-center mt-10">
              <Link
                href="/actors"
                className="px-6 py-2.5 rounded-md text-sm font-medium transition-colors"
                style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}
              >
                Explore All Actors
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Live Data ─────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-12">

          <section>
            <div className="flex items-center justify-between mb-6">
              <SectionLabel>Actor Leaderboard</SectionLabel>
              <Link href="/actors" className="text-xs transition-colors" style={{ color: "var(--accent)" }}>View all →</Link>
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

          <section>
            <div className="flex items-center justify-between mb-6">
              <SectionLabel>Latest Brief</SectionLabel>
              <Link href="/briefs" className="text-xs transition-colors" style={{ color: "var(--accent)" }}>All briefs →</Link>
            </div>
            {!latestBrief ? (
              <EmptyState message="No briefs published yet." />
            ) : (
              <Link href={`/briefs/${latestBrief.id}`} className="block">
                <div className="rounded-lg p-6 transition-colors" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {latestBrief.briefType && (
                      <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ color: "var(--accent)", border: "1px solid color-mix(in srgb, var(--accent) 40%, transparent)", backgroundColor: "color-mix(in srgb, var(--accent) 10%, transparent)" }}>
                        {latestBrief.briefType}
                      </span>
                    )}
                    {latestBrief.status && (
                      <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ color: latestBrief.status === "Final" ? "var(--delta-up)" : "var(--score-mid)", backgroundColor: latestBrief.status === "Final" ? "color-mix(in srgb, var(--delta-up) 12%, transparent)" : "color-mix(in srgb, var(--score-mid) 12%, transparent)" }}>
                        {latestBrief.status}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg mb-2" style={{ color: "var(--foreground)" }}>{latestBrief.title || "Untitled Brief"}</h3>
                  {(latestBrief.dateRangeStart || latestBrief.dateRangeEnd) && (
                    <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>
                      {latestBrief.dateRangeStart && new Date(latestBrief.dateRangeStart).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      {latestBrief.dateRangeEnd && ` – ${new Date(latestBrief.dateRangeEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
                    </p>
                  )}
                  {latestBrief.editorialPriority && (
                    <p className="text-sm line-clamp-3" style={{ color: "var(--muted-foreground)" }}>
                      {latestBrief.editorialPriority.slice(0, 300)}{latestBrief.editorialPriority.length > 300 && "…"}
                    </p>
                  )}
                  <span className="mt-4 inline-block text-sm font-medium" style={{ color: "var(--accent)" }}>Read full brief →</span>
                </div>
              </Link>
            )}
          </section>
        </div>

        <div className="space-y-12">
          <section>
            <SectionLabel>Active Scenarios</SectionLabel>
            {scenarios.length === 0 ? (
              <EmptyState message="No active scenarios." />
            ) : (
              <div className="space-y-3">
                {scenarios.map((s) => (
                  <div key={s.id} className="rounded-lg p-4" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-sm font-semibold leading-snug" style={{ color: "var(--foreground)" }}>{s.name || "Unnamed Scenario"}</h3>
                      {s.probabilityEstimate !== "" && s.probabilityEstimate !== 0 && (
                        <span className="shrink-0 text-xs font-bold px-2 py-0.5 rounded tabular-nums" style={{ color: "var(--accent)", backgroundColor: "color-mix(in srgb, var(--accent) 15%, transparent)", border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)" }}>
                          {typeof s.probabilityEstimate === "number" ? `${s.probabilityEstimate}%` : s.probabilityEstimate}
                        </span>
                      )}
                    </div>
                    {s.scenarioClass && <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--muted)" }}>{s.scenarioClass}</span>}
                    {s.triggerCondition && <p className="text-xs mt-2 leading-relaxed" style={{ color: "var(--muted)" }}>{s.triggerCondition.slice(0, 100)}{s.triggerCondition.length > 100 && "…"}</p>}
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
                <Link key={href} href={href} className="flex items-start gap-3 p-3 rounded-lg transition-colors" style={{ border: "1px solid var(--border)" }}>
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
