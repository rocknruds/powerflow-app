import Link from "next/link";
import { getAllPublicActors, enrichActorsWithDeltas } from "@/lib/actors";
import { getLatestDeltaByActor, computeScoreMovers } from "@/lib/scores";
import { getLatestBrief } from "@/lib/briefs";
import { getLatestPublicAssessments } from "@/lib/assessments";
import { getActiveScenarios } from "@/lib/scenarios";
import ScoreDelta from "@/components/ScoreDelta";
import { pfScoreColor } from "@/components/ActorCard";
import CollapsibleSection from "@/components/CollapsibleSection";


export const revalidate = 300;

export default async function HomePage() {
  const [actors, deltaMap, latestBrief, latestAssessments, scenarios] = await Promise.all([
    getAllPublicActors(),
    getLatestDeltaByActor(),
    getLatestBrief(),
    getLatestPublicAssessments(3),
    getActiveScenarios(),
  ]);

  const enrichedActors = enrichActorsWithDeltas(actors, deltaMap);
  const top5 = enrichedActors.slice(0, 5);

  const deltaRecord: Record<string, number | null> = {};
  for (const [id, delta] of deltaMap.entries()) {
    deltaRecord[id] = delta;
  }

  const { gainers, fallers } = computeScoreMovers(enrichedActors, 3);
  const topGainers = gainers.slice(0, 3).sort((a, b) => b.delta - a.delta);
  const topFallers = fallers.slice(0, 3).sort((a, b) => b.delta - a.delta);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}
    >
      <div className="max-w-[1280px] mx-auto px-6">

        {/* ── Hero ── */}
        <section
          className="pt-16 pb-6"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <h1
            className="font-sans font-semibold leading-[1.08] tracking-tight mb-4 text-center"
            style={{ fontSize: "clamp(32px, 4.5vw, 52px)", color: "var(--foreground)" }}
          >
            When one actor moves,
            <br />
            <span style={{ color: "var(--accent)" }}>the network moves with it.</span>
          </h1>

          <p
            className="text-sm leading-relaxed mb-6 max-w-xl mx-auto text-center"
            style={{ color: "var(--muted-foreground)" }}
          >
            Track power shifts across actors, dependencies, and conflicts in a single live system.
          </p>

          <div className="flex items-center justify-center gap-3 mb-5">
            <Link
              href="/actors"
              className="px-5 py-2.5 rounded-md text-sm font-medium transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}
            >
              See Today&apos;s Power Shifts
            </Link>
            <Link
              href="/actors"
              className="px-5 py-2.5 rounded-md text-sm transition-colors"
              style={{
                border: "1px solid var(--border)",
                color: "var(--muted-foreground)",
              }}
            >
              Explore the Actor Network
            </Link>
          </div>

          <p
            className="text-[11px] font-mono tracking-wide mb-8 text-center"
            style={{ color: "var(--muted)" }}
          >
            {actors.length} actors tracked &nbsp;•&nbsp; Authority + Reach scoring &nbsp;•&nbsp; Dependency networks &nbsp;•&nbsp; Updated daily
          </p>

          {(topGainers.length > 0 || topFallers.length > 0) && (
            <div className="flex flex-col items-center">
              <div
                className="flex items-center gap-1.5 mb-3 text-[10px] font-medium uppercase tracking-[0.12em]"
                style={{ color: "var(--muted)" }}
              >
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: "var(--score-mid)" }}
                />
                Score movers — last 30 days
              </div>
              <div className="flex items-center w-full overflow-x-auto no-scrollbar">
                <div className="flex-1 flex items-center justify-center gap-5">
                  {topGainers.map((m) => (
                    <Link
                      key={m.actorId}
                      href={`/actors/${m.actorSlug}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors shrink-0"
                      style={{
                        border: "1px solid var(--border)",
                        backgroundColor: "var(--surface)",
                      }}
                    >
                      <span
                        className="text-xs font-medium"
                        style={{ color: "var(--foreground)" }}
                      >
                        {m.actorName}
                      </span>
                      <span
                        className="text-sm font-mono font-semibold tabular-nums"
                        style={{ color: "var(--foreground)" }}
                      >
                        {Math.round(m.pfScore)}
                      </span>
                      <ScoreDelta delta={m.delta} />
                    </Link>
                  ))}
                </div>
                <div className="flex-1 flex items-center justify-center gap-5">
                  {topFallers.map((m) => (
                    <Link
                      key={m.actorId}
                      href={`/actors/${m.actorSlug}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors shrink-0"
                      style={{
                        border: "1px solid var(--border)",
                        backgroundColor: "var(--surface)",
                      }}
                    >
                      <span
                        className="text-xs font-medium"
                        style={{ color: "var(--foreground)" }}
                      >
                        {m.actorName}
                      </span>
                      <span
                        className="text-sm font-mono font-semibold tabular-nums"
                        style={{ color: "var(--foreground)" }}
                      >
                        {Math.round(m.pfScore)}
                      </span>
                      <ScoreDelta delta={m.delta} />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ── Leaderboard + Latest Briefs (two-column) ── */}
        <section
          className="py-12"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex flex-col md:flex-row md:items-start gap-12">
            {/* Leaderboard — left column */}
            <div className="md:w-[45%] md:shrink-0">
              <CollapsibleSection label="Actor leaderboard" action={{ label: "View all", href: "/actors" }}>
                <div>
                  {top5.map((actor, idx) => {
                    const score = actor.pfScore !== null ? Math.round(actor.pfScore) : null;
                    const delta = deltaRecord[actor.id] ?? null;
                    const scoreColor = pfScoreColor(actor.pfScore ?? 0);
                    return (
                      <Link
                        key={actor.id}
                        href={`/actors/${actor.slug}`}
                        className="flex items-center justify-between py-3 transition-colors group"
                        style={{ borderBottom: "1px solid var(--border)" }}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="text-xs font-mono w-4 shrink-0"
                            style={{ color: "var(--muted)" }}
                          >
                            {idx + 1}
                          </span>
                          <span
                            className="text-sm font-medium group-hover:text-accent transition-colors"
                            style={{ color: "var(--foreground)" }}
                          >
                            {actor.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className="text-base font-mono font-medium tabular-nums"
                            style={{ color: scoreColor }}
                          >
                            {score ?? "—"}
                          </span>
                          <ScoreDelta delta={delta} />
                        </div>
                      </Link>
                    );
                  })}
                </div>

                <p className="text-xs mt-4" style={{ color: "var(--muted)" }}>
                  Showing 5 of {actors.length} tracked actors
                </p>
              </CollapsibleSection>
            </div>

            {/* Latest briefs — right column */}
            <div className="md:flex-1 min-w-0">
              <CollapsibleSection label="Latest briefs" action={{ label: "All briefs", href: "/briefs" }}>
                <div className="space-y-3">
                  {/* Weekly brief */}
                  {!latestBrief ? (
                    <p className="text-sm" style={{ color: "var(--muted)" }}>
                      No briefs published yet.
                    </p>
                  ) : (
                    <Link href={`/briefs/${latestBrief.id}`} className="block group">
                      <div
                        className="p-5 rounded-lg transition-colors"
                        style={{
                          border: "1px solid var(--border)",
                          backgroundColor: "var(--surface)",
                        }}
                      >
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          {latestBrief.briefType && (
                            <span
                              className="text-[11px] px-2 py-0.5 rounded font-medium"
                              style={{
                                color: "var(--accent)",
                                border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",
                                backgroundColor: "color-mix(in srgb, var(--accent) 10%, transparent)",
                              }}
                            >
                              {latestBrief.briefType}
                            </span>
                          )}
                          {latestBrief.status && (
                            <span
                              className="text-[11px] px-2 py-0.5 rounded font-medium"
                              style={{
                                color: latestBrief.status === "Final" ? "var(--delta-up)" : "var(--score-mid)",
                                backgroundColor: latestBrief.status === "Final"
                                  ? "color-mix(in srgb, var(--delta-up) 10%, transparent)"
                                  : "color-mix(in srgb, var(--score-mid) 10%, transparent)",
                              }}
                            >
                              {latestBrief.status}
                            </span>
                          )}
                        </div>
                        <p
                          className="text-sm font-medium leading-snug mb-2 group-hover:text-accent transition-colors"
                          style={{ color: "var(--foreground)" }}
                        >
                          {latestBrief.title || "Untitled Brief"}
                        </p>
                        {latestBrief.editorialPriority && (
                          <p
                            className="text-xs leading-relaxed line-clamp-2"
                            style={{ color: "var(--muted-foreground)" }}
                          >
                            {latestBrief.editorialPriority}
                          </p>
                        )}
                      </div>
                    </Link>
                  )}

                  {/* Monthly brief placeholder — mirrors weekly card layout */}
                  <div
                    className="p-5 rounded-lg"
                    style={{
                      border: "1px solid var(--border)",
                      backgroundColor: "var(--surface)",
                      opacity: 0.55,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span
                        className="text-[11px] px-2 py-0.5 rounded font-medium"
                        style={{
                          color: "var(--accent)",
                          border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",
                          backgroundColor: "color-mix(in srgb, var(--accent) 10%, transparent)",
                        }}
                      >
                        Monthly
                      </span>
                      <span
                        className="text-[11px] px-2 py-0.5 rounded font-medium"
                        style={{
                          color: "var(--muted-foreground)",
                          backgroundColor: "color-mix(in srgb, var(--muted-foreground) 10%, transparent)",
                        }}
                      >
                        Coming soon
                      </span>
                    </div>
                    <p
                      className="text-sm font-medium leading-snug mb-2"
                      style={{ color: "var(--foreground)" }}
                    >
                      Monthly Brief — coming soon
                    </p>
                    <p
                      className="text-xs leading-relaxed"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      A monthly synthesis of power shifts, emerging trends, and strategic outlook across all tracked actors.
                    </p>
                  </div>
                </div>
              </CollapsibleSection>
            </div>
          </div>
        </section>

        {/* ── Latest Assessments (full-width row) ── */}
        <section className="py-12" style={{ borderBottom: "1px solid var(--border)" }}>
          <CollapsibleSection label="Latest assessments" action={{ label: "All assessments", href: "/analysis" }}>
            {latestAssessments.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                No assessments published yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {latestAssessments.map((assessment) => (
                  <Link
                    key={assessment.id}
                    href={assessment.actorSlug ? `/actors/${assessment.actorSlug}` : "/analysis"}
                    className="block group"
                  >
                    <div
                      className="p-5 rounded-lg transition-colors h-full"
                      style={{
                        border: "1px solid var(--border)",
                        backgroundColor: "var(--surface)",
                      }}
                    >
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        {assessment.pfSignal && (
                          <span
                            className="text-[11px] px-2 py-0.5 rounded font-medium"
                            style={{
                              color: "var(--accent)",
                              border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",
                              backgroundColor: "color-mix(in srgb, var(--accent) 10%, transparent)",
                            }}
                          >
                            {assessment.pfSignal}
                          </span>
                        )}
                        {assessment.confidenceLevel && (
                          <span
                            className="text-[11px] px-2 py-0.5 rounded font-medium"
                            style={{
                              color: "var(--muted-foreground)",
                              backgroundColor: "color-mix(in srgb, var(--muted-foreground) 10%, transparent)",
                            }}
                          >
                            {assessment.confidenceLevel}
                          </span>
                        )}
                      </div>
                      <p
                        className="text-sm font-medium leading-snug mb-1 group-hover:text-accent transition-colors"
                        style={{ color: "var(--foreground)" }}
                      >
                        {assessment.title || "Untitled Assessment"}
                      </p>
                      {assessment.generatedOn && (
                        <p
                          className="text-[11px] font-mono mb-2"
                          style={{ color: "var(--muted)" }}
                        >
                          {new Date(assessment.generatedOn).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      )}
                      <p
                        className="text-xs leading-relaxed line-clamp-2"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        {assessment.analystCommentary
                          || assessment.currentPosition
                          || "Structured analytical assessment \u2014 doctrine, trajectory, and scenario outlook."}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CollapsibleSection>
        </section>

        {/* ── Active scenarios ── */}
        <section className="py-12" style={{ borderBottom: "1px solid var(--border)" }}>
              <CollapsibleSection label="Active scenarios" action={{ label: "All conflicts", href: "/conflicts" }}>
                {scenarios.length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--muted)" }}>
                    No active scenarios.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {scenarios.slice(0, 3).map((s) => (
                      <div
                        key={s.id}
                        className="p-4 rounded-lg"
                        style={{
                          border: "1px solid var(--border)",
                          backgroundColor: "var(--surface)",
                        }}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p
                            className="text-sm font-medium leading-snug"
                            style={{ color: "var(--foreground)" }}
                          >
                            {s.name || "Unnamed Scenario"}
                          </p>
                          {s.probabilityEstimate !== "" && s.probabilityEstimate !== 0 && (
                            <span
                              className="text-xs font-mono font-medium shrink-0 px-1.5 py-0.5 rounded tabular-nums"
                              style={{
                                color: "var(--accent)",
                                backgroundColor: "color-mix(in srgb, var(--accent) 12%, transparent)",
                              }}
                            >
                              {typeof s.probabilityEstimate === "number"
                                ? `${s.probabilityEstimate}%`
                                : s.probabilityEstimate}
                            </span>
                          )}
                        </div>
                        {s.triggerCondition && (
                          <p
                            className="text-xs leading-relaxed line-clamp-2"
                            style={{ color: "var(--muted)" }}
                          >
                            {s.triggerCondition}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CollapsibleSection>
        </section>

        {/* ── How it works ── */}
        <section
          className="py-12"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <CollapsibleSection label="How it works">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                num: "01",
                title: "Authority × Reach",
                body: "Every actor scored on two dimensions. Internal control and external influence — updated as events unfold.",
              },
              {
                num: "02",
                title: "Dependency mapping",
                body: "Power doesn't move in isolation. See which actors depend on others and how disturbances cascade.",
              },
              {
                num: "03",
                title: "Score trajectories",
                body: "Not a snapshot. A living record of how influence rises, stalls, and collapses over time.",
              },
            ].map(({ num, title, body }) => (
              <div
                key={num}
                className="p-5 rounded-lg"
                style={{
                  border: "1px solid var(--border)",
                  backgroundColor: "var(--surface)",
                }}
              >
                <p
                  className="text-[11px] font-mono mb-3"
                  style={{ color: "var(--accent)" }}
                >
                  {num}
                </p>
                <p
                  className="text-sm font-medium mb-2"
                  style={{ color: "var(--foreground)" }}
                >
                  {title}
                </p>
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {body}
                </p>
              </div>
            ))}
          </div>
          </CollapsibleSection>
        </section>

      </div>
    </div>
  );
}