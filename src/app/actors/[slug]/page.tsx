import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getAllPublicActors, getActorBySlug, getActorsByIds, toSlug } from "@/lib/actors";
import { getActorScoreHistory } from "@/lib/scores";
import { getActorEvents } from "@/lib/events";
import type { NotionEvent } from "@/lib/events";
import { getLatestAssessment } from "@/lib/assessments";
import { getActorRelationships } from "@/lib/relationships";
import type { ActorRelationships } from "@/lib/types";
import LogoMark from "@/components/LogoMark";
import { calcPFScore } from "@/lib/notion";
import ScoreDelta from "@/components/ScoreDelta";
import ScoreChart from "@/components/ScoreChart";
import AssessmentCard from "@/components/AssessmentCard";
import { pfScoreColor, actorTypeBadgeColor } from "@/components/ActorCard";

import KeyDrivers from "@/components/KeyDrivers";
import ActorGeoPanel from "@/components/geo/ActorGeoPanelWrapper";

export const revalidate = 300;

export async function generateStaticParams() {
  const actors = await getAllPublicActors();
  return actors.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const actor = await getActorBySlug(slug);
  return { title: actor?.name ?? "Actor Profile" };
}

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
      <LogoMark size={16} />
      <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
        {children}
      </h2>
    </div>
  );
}

function PFSignalBadge({ signal }: { signal: string | null }) {
  if (!signal) return null;
  const colors: Record<string, { text: string; bg: string }> = {
    Widening: { text: "var(--delta-down)", bg: "color-mix(in srgb, var(--delta-down) 12%, transparent)" },
    Narrowing: { text: "var(--delta-up)", bg: "color-mix(in srgb, var(--delta-up) 12%, transparent)" },
    Mixed: { text: "var(--score-mid)", bg: "color-mix(in srgb, var(--score-mid) 12%, transparent)" },
    Stable: { text: "var(--muted)", bg: "color-mix(in srgb, var(--muted) 12%, transparent)" },
    Unclear: { text: "var(--score-mid)", bg: "color-mix(in srgb, var(--score-mid) 12%, transparent)" },
  };
  const c = colors[signal] ?? { text: "var(--muted-foreground)", bg: "color-mix(in srgb, var(--muted) 12%, transparent)" };
  return (
    <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ color: c.text, backgroundColor: c.bg }}>
      {signal}
    </span>
  );
}

function ScoreCell({ label, value, color, sub }: { label: string; value: number | null; color: string; sub?: string }) {
  return (
    <div>
      <p className="text-xs mb-1" style={{ color: "var(--muted)" }}>{label}</p>
      <p className="text-3xl font-bold tabular-nums" style={{ color }}>{value ?? "—"}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{sub}</p>}
    </div>
  );
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  "Military Action": "var(--delta-down)",
  "Diplomatic": "var(--accent)",
  "Economic": "var(--score-mid)",
  "Political": "var(--score-authority)",
  "Humanitarian": "var(--delta-up)",
};

function EventTypeBadge({ type }: { type: string | null }) {
  if (!type) return null;
  const color = EVENT_TYPE_COLORS[type] ?? "var(--muted)";
  return (
    <span
      className="text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap"
      style={{
        color,
        backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
      }}
    >
      {type}
    </span>
  );
}

export default async function ActorProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const actor = await getActorBySlug(slug);
  if (!actor) notFound();

  const [history, assessment, events, relationships] = await Promise.all([
    getActorScoreHistory(actor.id),
    getLatestAssessment(actor.id).catch(() => null),
    getActorEvents(actor.id, 6).catch((): NotionEvent[] => []),
    getActorRelationships(actor.id).catch((): ActorRelationships => ({ outgoing: [], incoming: [] })),
  ]);

  const [patronActors, dependentOnActors] = await Promise.all([
    actor.patronStateIds.length > 0 ? getActorsByIds(actor.patronStateIds) : Promise.resolve([]),
    actor.dependentOnIds.length > 0 ? getActorsByIds(actor.dependentOnIds) : Promise.resolve([]),
  ]);

  const pf = calcPFScore(actor.authorityScore, actor.reachScore);
  const scoreColor = pfScoreColor(pf ?? 0);
  const latestSnapshot = history[history.length - 1];
  const latestDelta = latestSnapshot?.delta ?? null;

  // Subtitle: State → region only; Non-State/Hybrid → subType or actorType; IGO → actorType
  const subtitle =
    actor.actorType === "State"
      ? actor.region
      : actor.actorType === "Non-State" || actor.actorType === "Hybrid"
      ? actor.subType || actor.actorType
      : actor.actorType;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      {/* Page header — asymmetric split hero */}
      <div style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="pt-6 pb-2">
            <Link href="/actors" className="text-xs transition-colors inline-flex items-center gap-1" style={{ color: "var(--muted)" }}>
              ← Actor Leaderboard
            </Link>
          </div>
        </div>
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row" style={{ minHeight: 270 }}>
          {/* Left panel: metadata + scores (order-last on mobile so map stacks above) */}
          <div className="order-last lg:order-first lg:w-[38%] px-6 py-6 flex flex-col justify-center" style={{ backgroundColor: "var(--surface)" }}>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {actor.actorType && (
                <span
                  className="text-xs font-semibold px-2.5 py-0.5 rounded"
                  style={{
                    color: actorTypeBadgeColor(actor.actorType),
                    border: `1px solid color-mix(in srgb, ${actorTypeBadgeColor(actor.actorType)} 40%, transparent)`,
                    backgroundColor: `color-mix(in srgb, ${actorTypeBadgeColor(actor.actorType)} 12%, transparent)`,
                  }}
                >
                  {actor.actorType}
                </span>
              )}
              {actor.region && <MetaBadge>{actor.region}</MetaBadge>}
              {actor.iso3 && <span className="text-xs font-mono" style={{ color: "var(--muted)" }}>{actor.iso3}</span>}
              {actor.pfVector && <PFSignalBadge signal={actor.pfVector} />}
            </div>
            <h1 className="text-[28px] font-bold" style={{ color: "var(--foreground)", letterSpacing: "-0.5px" }}>{actor.name}</h1>
            {subtitle && (
              <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>{subtitle}</p>
            )}
            <div className="flex items-end gap-5 pt-4 mt-4" style={{ borderTop: "1px solid var(--border)" }}>
              <div>
                <p className="text-[10px] mb-1" style={{ color: "var(--muted)" }}>PF Score</p>
                <p className="text-[22px] sm:text-[26px] font-bold tabular-nums" style={{ color: scoreColor }}>{pf ?? "—"}</p>
              </div>
              <div>
                <p className="text-[10px] mb-1" style={{ color: "var(--muted)" }}>Authority</p>
                <p className="text-[22px] sm:text-[26px] font-bold tabular-nums" style={{ color: "var(--score-authority)" }}>{actor.authorityScore ?? "—"}</p>
              </div>
              <div>
                <p className="text-[10px] mb-1" style={{ color: "var(--muted)" }}>Reach</p>
                <p className="text-[22px] sm:text-[26px] font-bold tabular-nums" style={{ color: "var(--score-reach)" }}>{actor.reachScore ?? "—"}</p>
              </div>
              {latestDelta !== null && (
                <div className="flex flex-col items-start pb-0.5">
                  <ScoreDelta delta={latestDelta} className="text-sm" />
                  <span className="text-[9px] mt-0.5" style={{ color: "var(--muted)" }}>recent Δ</span>
                </div>
              )}
            </div>
          </div>
          {/* Right panel: geographic map (order-first on mobile so it stacks above metadata) */}
          <div className="order-first lg:order-last lg:flex-1 h-[140px] sm:h-[180px] lg:h-auto">
            <ActorGeoPanel isoCode={actor.iso3} region={actor.region} actorType={actor.actorType} />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">

        {/* SECTION 1: Score panel + chart */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          <div className="rounded-xl p-6 flex flex-col gap-6" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
            <ScoreCell label="PF Score" value={pf} color={scoreColor} />
            <div className="w-full h-px" style={{ backgroundColor: "var(--border)" }} />
            <ScoreCell label="Authority Score" value={actor.authorityScore} color="var(--score-authority)" sub="Capacity to coerce" />
            <ScoreCell label="Reach Score" value={actor.reachScore} color="var(--score-reach)" sub="Influence projection" />
            <div className="mt-auto pt-4 space-y-2" style={{ borderTop: "1px solid var(--border)" }}>
              {actor.proxyDepth && (
                <div className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: "var(--muted)" }}>Depth</span>
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{actor.proxyDepth}</span>
                </div>
              )}
              {actor.capabilities.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {actor.capabilities.slice(0, 4).map((cap) => (
                    <span key={cap} className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--surface-raised)", color: "var(--muted)" }}>
                      {cap}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="rounded-xl p-6" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
            <SectionLabel>Score Trajectory</SectionLabel>
            <ScoreChart snapshots={history} />
          </div>
        </div>

        {/* SECTION 2: Key Drivers */}
        {actor.scoreReasoning && (
          <div className="rounded-xl p-6" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
            <SectionLabel>Key Drivers</SectionLabel>
            <KeyDrivers reasoning={actor.scoreReasoning} />
            {(patronActors.length > 0 || dependentOnActors.length > 0) && (
              <div className="mt-4 pt-4 space-y-2" style={{ borderTop: "1px solid var(--border)" }}>
                {patronActors.length > 0 && (
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>Patron:</span>
                    {patronActors.map((pa) => (
                      <Link
                        key={pa.id}
                        href={`/actors/${toSlug(pa.name)}`}
                        className="text-xs px-2 py-0.5 rounded transition-opacity hover:opacity-70"
                        style={{
                          color: "var(--accent)",
                          border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",
                          backgroundColor: "color-mix(in srgb, var(--accent) 10%, transparent)",
                        }}
                      >
                        {pa.name}
                      </Link>
                    ))}
                  </div>
                )}
                {dependentOnActors.length > 0 && (
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>Dependent On:</span>
                    {dependentOnActors.map((da) => (
                      <Link
                        key={da.id}
                        href={`/actors/${toSlug(da.name)}`}
                        className="text-xs px-2 py-0.5 rounded transition-opacity hover:opacity-70"
                        style={{
                          color: "var(--accent)",
                          border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",
                          backgroundColor: "color-mix(in srgb, var(--accent) 10%, transparent)",
                        }}
                      >
                        {da.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* SECTION 3: Latest Assessment (full width) */}
        <AssessmentCard assessment={assessment} />

        {/* SECTION 4: Relationships (full width) */}
        {relationships.outgoing.length + relationships.incoming.length > 0 && (
          <div>
            <SectionLabel>Relationships</SectionLabel>
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Counterparty", "Type", "Alignment", "Leverage", "Dependency"].map((col) => (
                      <th
                        key={col}
                        className="text-left text-[10px] font-semibold uppercase tracking-widest px-4 py-2.5"
                        style={{ color: "var(--muted)" }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...relationships.outgoing, ...relationships.incoming].slice(0, 8).map((rel) => {
                    const alignment = rel.alignmentScore
                    const alignColor =
                      alignment === null || alignment === 0
                        ? "var(--muted)"
                        : alignment > 0
                        ? "var(--delta-up)"
                        : "var(--delta-down)"
                    const alignLabel =
                      alignment === null
                        ? "—"
                        : alignment > 0
                        ? `+${alignment}`
                        : String(alignment)
                    return (
                      <tr
                        key={rel.id}
                        style={{ borderBottom: "1px solid var(--border)" }}
                      >
                        <td className="px-4 py-2.5 font-medium" style={{ color: "var(--foreground)" }}>
                          <Link
                            href={`/actors/${toSlug(rel.counterpartyName)}`}
                            className="transition-opacity hover:opacity-70"
                            style={{ color: "var(--foreground)" }}
                          >
                            {rel.counterpartyName || "—"}
                          </Link>
                        </td>
                        <td className="px-4 py-2.5">
                          {rel.relationshipType ? (
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap"
                              style={{
                                color: "var(--muted)",
                                backgroundColor: "color-mix(in srgb, var(--muted) 12%, transparent)",
                              }}
                            >
                              {rel.relationshipType}
                            </span>
                          ) : (
                            <span style={{ color: "var(--muted)" }}>—</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 tabular-nums font-medium" style={{ color: alignColor }}>
                          {alignLabel}
                        </td>
                        <td className="px-4 py-2.5 tabular-nums" style={{ color: "var(--muted-foreground)" }}>
                          {rel.leverageScore ?? "—"}
                        </td>
                        <td className="px-4 py-2.5 tabular-nums" style={{ color: "var(--muted-foreground)" }}>
                          {rel.dependencyScore ?? "—"}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {relationships.outgoing.length + relationships.incoming.length > 8 && (
              <a href="#" className="text-xs font-medium mt-3 inline-block transition-opacity hover:opacity-70" style={{ color: "var(--accent)" }}>
                View all →
              </a>
            )}
          </div>
        )}

        {/* SECTION 5: Recent Events (full width) */}
        {events.length > 0 && (
          <div>
            <SectionLabel>Recent Events</SectionLabel>
            <div className="space-y-2">
              {events.map((event: NotionEvent) => (
                <div
                  key={event.id}
                  className="rounded-lg px-4 py-3"
                  style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}
                >
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {event.date && (
                      <span
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded tabular-nums"
                        style={{ backgroundColor: "var(--surface-raised)", color: "var(--muted)" }}
                      >
                        {new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    )}
                    <EventTypeBadge type={event.eventType} />
                  </div>
                  <p className="text-sm font-medium leading-snug mb-1" style={{ color: "var(--foreground)" }}>
                    {event.name || "—"}
                  </p>
                  {event.description && (
                    <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
                      {event.description.length > 100
                        ? event.description.slice(0, 100) + "…"
                        : event.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
