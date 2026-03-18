import Link from "next/link";
import { getAllPublicActors, enrichActorsWithDeltas } from "@/lib/actors";
import { getLatestDeltaByActor, computeScoreMovers } from "@/lib/scores";
import { getLatestBrief } from "@/lib/briefs";
import { getLatestPublicAssessments } from "@/lib/assessments";
import { getActiveScenariosWithActors } from "@/lib/scenarios";
import ScoreDelta from "@/components/ScoreDelta";
import { pfScoreColor } from "@/components/ActorCard";
import CollapsibleSection from "@/components/CollapsibleSection";
import ScenarioCard from "@/components/ScenarioCard";


export const revalidate = 300;

export default async function HomePage() {
  const [actors, deltaMap, latestBrief, latestAssessments, scenarios] = await Promise.all([
    getAllPublicActors(),
    getLatestDeltaByActor(),
    getLatestBrief(),
    getLatestPublicAssessments(2),
    getActiveScenariosWithActors(),
  ]);

  const enrichedActors = enrichActorsWithDeltas(actors, deltaMap);
  const top5 = enrichedActors.slice(0, 5);

  const deltaRecord: Record<string, number | null> = {};
  for (const [id, delta] of deltaMap.entries()) {
    deltaRecord[id] = delta;
  }

  const { gainers, fallers } = computeScoreMovers(enrichedActors, 3);
  const topGainers = gainers.slice(0, 2).sort((a, b) => b.delta - a.delta);
  const topFallers = fallers.slice(0, 2).sort((a, b) => b.delta - a.delta);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}
    >
      <div className="max-w-[1280px] mx-auto px-6">

        {/* ── Hero ── */}
        <section className="pt-20 pb-14">
          <h1
            className="font-sans font-semibold leading-[1.08] tracking-tight mb-4 text-center"
            style={{ fontSize: "clamp(32px, 4.5vw, 52px)", color: "var(--foreground)" }}
          >
            When one actor moves,
            <br />
            <span style={{ color: "var(--accent)" }}>the network moves with it.</span>
          </h1>

          <p
            className="text-sm leading-[1.75] mb-6 max-w-xl mx-auto text-center"
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
            className="text-[11px] font-mono tracking-wide text-center"
            style={{ color: "var(--muted)" }}
          >
            {actors.length} actors tracked &nbsp;•&nbsp; Authority + Reach scoring &nbsp;•&nbsp; Dependency networks &nbsp;•&nbsp; Updated daily
          </p>
        </section>

        {/* ── Score Movers Band ── */}
        {(topGainers.length > 0 || topFallers.length > 0) && (
          <div
            className="py-5 -mx-6 px-6 rounded-lg"
            style={{
              backgroundColor: "var(--surface-raised)",
              borderTop: "1px solid var(--border)",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: "var(--delta-up)" }}
              />
              <span
                className="text-[10px] font-mono font-medium uppercase tracking-[0.14em]"
                style={{ color: "var(--muted)" }}
              >
                Score movers — last 30 days
              </span>
            </div>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              {topGainers.map((m) => (
                <Link
                  key={m.actorId}
                  href={`/actors/${m.actorSlug}`}
                  className="flex items-center gap-2.5 px-5 py-2 rounded-full transition-colors hover:opacity-80"
                  style={{ backgroundColor: "color-mix(in srgb, var(--delta-up) 6%, transparent)" }}
                >
                  <span className="text-xs font-medium" style={{ color: "var(--foreground)" }}>
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
              <span
                className="w-px h-5"
                style={{ backgroundColor: "color-mix(in srgb, var(--border) 60%, transparent)" }}
              />
              {topFallers.map((m) => (
                <Link
                  key={m.actorId}
                  href={`/actors/${m.actorSlug}`}
                  className="flex items-center gap-2.5 px-5 py-2 rounded-full transition-colors hover:opacity-80"
                  style={{ backgroundColor: "color-mix(in srgb, var(--delta-down) 6%, transparent)" }}
                >
                  <span className="text-xs font-medium" style={{ color: "var(--foreground)" }}>
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
        )}

        {/* ── Featured Brief + Actor Leaderboard ── */}
        <section className="pt-[72px]">
          <div className="flex flex-col md:flex-row md:items-start gap-10">

            {/* Featured brief — left column (dominant) */}
            <div className="md:w-[58%] md:shrink-0">
              <CollapsibleSection label="Featured brief" action={{ label: "All briefs", href: "/briefs" }}>
                {!latestBrief ? (
                  <p className="text-sm" style={{ color: "var(--muted)" }}>
                    No briefs published yet.
                  </p>
                ) : (
                  <Link href={`/briefs/${latestBrief.id}`} className="block group">
                    <div
                      className="p-6 rounded-lg transition-colors"
                      style={{
                        backgroundColor: "var(--surface)",
                        borderTop: "1px solid var(--border)",
                        borderRight: "1px solid var(--border)",
                        borderBottom: "1px solid var(--border)",
                        borderLeft: "3px solid var(--accent)",
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
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
                        {(latestBrief.dateRangeStart || latestBrief.dateRangeEnd) && (
                          <span className="text-[11px] font-mono" style={{ color: "var(--muted)" }}>
                            {latestBrief.dateRangeStart && new Date(latestBrief.dateRangeStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            {latestBrief.dateRangeEnd && ` – ${new Date(latestBrief.dateRangeEnd).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                          </span>
                        )}
                      </div>

                      <p
                        className="text-lg font-medium leading-snug mb-3 group-hover:text-accent transition-colors"
                        style={{ color: "var(--foreground)" }}
                      >
                        {latestBrief.title || "Untitled Brief"}
                      </p>

                      {latestBrief.leadThesis && (
                        <p
                          className="text-sm leading-[1.75] mb-3"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          {latestBrief.leadThesis}
                        </p>
                      )}

                      {!latestBrief.leadThesis && latestBrief.editorialPriority && (
                        <p
                          className="text-sm leading-[1.75] line-clamp-3 mb-3"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          {latestBrief.editorialPriority}
                        </p>
                      )}

                      <span
                        className="text-xs font-medium transition-opacity group-hover:opacity-70"
                        style={{ color: "var(--accent)" }}
                      >
                        Read full brief →
                      </span>
                    </div>
                  </Link>
                )}

                <p className="text-xs mt-4" style={{ color: "var(--muted)" }}>
                  Monthly synthesis brief — coming soon
                </p>
              </CollapsibleSection>
            </div>

            {/* Leaderboard — right column (compact data panel) */}
            <div className="md:flex-1 min-w-0">
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
                        className="flex items-center justify-between py-2.5 transition-colors group"
                        style={idx < 4 ? { borderBottom: "1px solid color-mix(in srgb, var(--border) 50%, transparent)" } : undefined}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="text-sm font-mono font-semibold w-5 shrink-0 tabular-nums"
                            style={{ color: "var(--accent)" }}
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
          </div>
        </section>

        {/* ── Latest Assessments ── */}
        <section className="pt-[72px]">
          <CollapsibleSection label="Latest assessments" action={{ label: "All assessments", href: "/analysis" }}>
            {latestAssessments.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                No assessments published yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {latestAssessments.map((assessment) => (
                  <Link
                    key={assessment.id}
                    href={assessment.actorSlug ? `/actors/${assessment.actorSlug}` : "/analysis"}
                    className="block group"
                  >
                    <div
                      className="p-6 rounded-lg transition-colors h-full"
                      style={{
                        border: "1px solid var(--border)",
                        backgroundColor: "var(--surface)",
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
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
                            className="text-[11px] px-1.5 py-0.5 rounded font-medium"
                            style={{
                              color: "var(--muted-foreground)",
                              backgroundColor: "color-mix(in srgb, var(--muted-foreground) 10%, transparent)",
                            }}
                          >
                            {assessment.confidenceLevel}
                          </span>
                        )}
                        {assessment.generatedOn && (
                          <span className="text-[11px] font-mono ml-auto" style={{ color: "var(--muted)" }}>
                            {new Date(assessment.generatedOn).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        )}
                      </div>
                      <p
                        className="text-sm font-medium leading-snug mb-2 group-hover:text-accent transition-colors"
                        style={{ color: "var(--foreground)" }}
                      >
                        {assessment.title || "Untitled Assessment"}
                      </p>
                      <p
                        className="text-xs leading-[1.75] line-clamp-1"
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

        {/* ── Active Scenarios ── */}
        <section className="pt-[72px]">
          <CollapsibleSection label="Active scenarios" action={{ label: "All conflicts", href: "/conflicts" }}>
            {scenarios.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                No active scenarios.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {scenarios.slice(0, 3).map((s) => (
                  <ScenarioCard key={s.id} scenario={s} />
                ))}
              </div>
            )}
          </CollapsibleSection>
        </section>

        {/* ── How It Works ── */}
        <section
          className="pt-[96px] pb-[72px]"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <CollapsibleSection label="How it works">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
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
                  className="p-6 rounded-lg"
                  style={{ backgroundColor: "var(--surface-raised)" }}
                >
                  <p
                    className="text-2xl font-mono font-bold mb-3"
                    style={{ color: "var(--accent)" }}
                  >
                    {num}
                  </p>
                  <p
                    className="text-sm font-semibold mb-2"
                    style={{ color: "var(--foreground)" }}
                  >
                    {title}
                  </p>
                  <p
                    className="text-xs leading-[1.75]"
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
