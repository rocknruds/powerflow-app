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
import { getActorIntelFeeds } from "@/lib/intel-feeds";
import type { IntelFeedItem } from "@/lib/intel-feeds";
import { calcPFScore } from "@/lib/notion";
import { Lock } from "lucide-react";
import ScoreDelta from "@/components/ScoreDelta";
import ScoreChart from "@/components/ScoreChart";
import AssessmentCard from "@/components/AssessmentCard";
import { pfScoreColor, actorTypeBadgeColor } from "@/components/ActorCard";
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

function SectionLabel({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div style={{ width: 3, height: 13, borderRadius: 1.5, backgroundColor: color ?? "var(--accent)", flexShrink: 0 }} />
      <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
        {children}
      </span>
    </div>
  );
}

function ParagraphLabel({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-2">
      <div style={{ width: 3, height: 13, borderRadius: 1.5, backgroundColor: color, flexShrink: 0 }} />
      <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
        {label}
      </span>
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


// Keys match the extractor's exact event_type enum values
const EVENT_TYPE_COLORS: Record<string, string> = {
  "Military or coercive action": "var(--delta-down)",
  "Diplomatic exchange": "var(--accent)",
  "Sanctions or economic measure": "var(--score-mid)",
  "Political transition": "var(--score-authority)",
  "Legal change": "var(--score-authority)",
  "Institutional reform": "var(--score-authority)",
  "Alliance or treaty shift": "var(--accent)",
  "Information-cyber": "var(--delta-down)",
  "Other": "var(--muted)",
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

function truncateToSentences(text: string, maxChars = 300): string {
  const sentences = text.match(/[^.!?]+[.!?]+/g);
  if (!sentences) return text.slice(0, maxChars);
  let result = "";
  for (const s of sentences) {
    if (result.length + s.length > maxChars && result.length > 0) break;
    result += s;
  }
  return result.trim() || sentences[0].trim();
}

export default async function ActorProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const actor = await getActorBySlug(slug);
  if (!actor) notFound();

  const [history, assessment, events, relationships, intelFeeds] = await Promise.all([
    getActorScoreHistory(actor.id),
    getLatestAssessment(actor.id).catch(() => null),
    getActorEvents(actor.id, 6).catch((): NotionEvent[] => []),
    getActorRelationships(actor.id).catch((): ActorRelationships => ({ outgoing: [], incoming: [] })),
    getActorIntelFeeds(actor.id, 4).catch((): IntelFeedItem[] => []),
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
      {/* Hero — renders directly on page background, no card/border/separator */}
      <div className="relative">

        {/* Map — absolute, right-aligned, bleeds off the right viewport edge (desktop only) */}
        <div
          className="absolute inset-y-0 right-0 hidden lg:block"
          style={{ width: "55vw", pointerEvents: "none" }}
          aria-hidden="true"
        >
          <ActorGeoPanel isoCode={actor.iso3} region={actor.region} actorType={actor.actorType} />
        </div>

        {/* Horizontal gradient — solid background through 35%, dissolves to transparent by 62% */}
        <div
          className="absolute inset-0 hidden lg:block"
          style={{
            background: "linear-gradient(to right, var(--background) 35%, transparent 62%)",
            pointerEvents: "none",
            zIndex: 1,
          }}
          aria-hidden="true"
        />

        {/* Bottom gradient — hero dissolves seamlessly into the content section below */}
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: 80,
            background: "linear-gradient(to bottom, transparent, var(--background))",
            pointerEvents: "none",
            zIndex: 2,
          }}
          aria-hidden="true"
        />

        {/* Content */}
        <div className="relative max-w-6xl mx-auto px-6" style={{ zIndex: 3 }}>
          {/* Breadcrumb */}
          <div className="pt-6 pb-2">
            <Link href="/actors" className="text-xs transition-colors inline-flex items-center gap-1" style={{ color: "var(--muted)" }}>
              ← Actor Leaderboard
            </Link>
          </div>

          {/* Mobile map — in-flow, shown only below lg breakpoint */}
          <div className="lg:hidden h-[150px] sm:h-[190px] mb-4 -mx-6 overflow-hidden">
            <ActorGeoPanel isoCode={actor.iso3} region={actor.region} actorType={actor.actorType} />
          </div>

          {/* Metadata + scores — constrained to left ~48% on desktop so text stays clear of the map */}
          <div className="lg:max-w-[48%] pt-4 pb-16">
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
            <h1 className="text-[32px] font-bold" style={{ color: "var(--foreground)", letterSpacing: "-0.5px" }}>{actor.name}</h1>
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
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">

        {/* SECTION 1+2: Score Trajectory (left) + Key Drivers (right) — two-column grid */}
        {actor.scoreReasoning ? (
          <div className="grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-6 items-start">

            {/* Left: Score Trajectory */}
            <div className="rounded-xl p-6" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
              <SectionLabel>Score Trajectory</SectionLabel>
              <ScoreChart snapshots={history} />
            </div>

            {/* Right: Key Drivers */}
            <div className="rounded-xl p-6" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
              <SectionLabel>Key Drivers</SectionLabel>

              <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                {truncateToSentences(actor.scoreReasoning)}
              </p>

              {/* TODO: wire to /actors/[slug]/assessment when Pro tier live */}
              <a
                href="#"
                className="group inline-flex items-center gap-1.5 mt-3 text-xs transition-colors"
                style={{ color: "var(--muted-foreground)" }}
              >
                <Lock size={12} className="shrink-0" />
                <span className="group-hover:text-accent transition-colors">→ Full Assessment</span>
              </a>

              {/* Patron / dependent links */}
              {(patronActors.length > 0 || dependentOnActors.length > 0) && (
                <div className="mt-5 pt-4 space-y-2" style={{ borderTop: "1px solid var(--border)" }}>
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

              {/* Depth + Capabilities chips */}
              {(actor.proxyDepth || actor.capabilities.length > 0) && (
                <div className="mt-4 pt-4 space-y-2" style={{ borderTop: "1px solid var(--border)" }}>
                  {actor.proxyDepth && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>Depth:</span>
                      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{actor.proxyDepth}</span>
                    </div>
                  )}
                  {actor.capabilities.length > 0 && (
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>Capabilities:</span>
                      {actor.capabilities.slice(0, 4).map((cap) => (
                        <span key={cap} className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--surface-raised)", color: "var(--muted)" }}>
                          {cap}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* No scoreReasoning — Score Trajectory full width */
          <div className="rounded-xl p-6" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
            <SectionLabel>Score Trajectory</SectionLabel>
            <ScoreChart snapshots={history} />
          </div>
        )}

        {/* SECTION 3: Recent Intelligence */}
        {intelFeeds.length > 0 && (
          <div>
            <SectionLabel>Recent Intelligence</SectionLabel>
            <div className="space-y-2">
              {intelFeeds.map((feed: IntelFeedItem) => (
                <div
                  key={feed.id}
                  className="rounded-lg px-4 py-3"
                  style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}
                >
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    {(feed.dateIngested || feed.publicationDate) && (
                      <span
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded tabular-nums"
                        style={{ backgroundColor: "var(--surface-raised)", color: "var(--muted)" }}
                      >
                        {new Date(feed.dateIngested ?? feed.publicationDate!).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    )}
                    <PFSignalBadge signal={feed.pfSignal} />
                    {feed.confidenceShift && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{
                          color: "var(--muted)",
                          backgroundColor: "color-mix(in srgb, var(--muted) 10%, transparent)",
                          border: "1px solid color-mix(in srgb, var(--border) 60%, transparent)",
                        }}
                      >
                        {feed.confidenceShift}
                      </span>
                    )}
                    {feed.publication && (
                      <span className="text-[10px] italic ml-auto" style={{ color: "var(--muted)" }}>
                        {feed.publication}
                      </span>
                    )}
                  </div>
                  {feed.soWhatSummary && (
                    <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
                      {feed.soWhatSummary}
                    </p>
                  )}
                  <div className="flex justify-end mt-1.5">
                    <a
                      href="#"
                      className="text-xs transition-colors hover:text-accent"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      → Read brief
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 4: Latest Assessment (full width) */}
        <AssessmentCard assessment={assessment} />

        {/* SECTION 5: Relationships (full width) */}
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
                  {[...relationships.outgoing, ...relationships.incoming]
                    .sort((a, b) => Math.abs(b.alignmentScore ?? 0) - Math.abs(a.alignmentScore ?? 0))
                    .slice(0, 8).map((rel) => {
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
                        <td className="px-4 py-2.5" style={{ color: "var(--foreground)" }}>
                          <Link
                            href={`/actors/${toSlug(rel.counterpartyName)}`}
                            className="font-medium transition-opacity hover:opacity-70"
                            style={{ color: "var(--foreground)" }}
                          >
                            {rel.counterpartyName || "—"}
                          </Link>
                          {rel.notes && (
                            <p className="text-[11px] leading-relaxed mt-0.5 italic" style={{ color: "var(--muted)" }}>
                              {rel.notes}
                            </p>
                          )}
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

        {/* SECTION 6: Recent Events (full width) */}
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
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    {event.date && (
                      <span
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded tabular-nums"
                        style={{ backgroundColor: "var(--surface-raised)", color: "var(--muted)" }}
                      >
                        {new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    )}
                    <EventTypeBadge type={event.eventType} />
                    <PFSignalBadge signal={event.pfSignal} />
                  </div>
                  <p className="text-sm font-medium leading-snug mb-1.5" style={{ color: "var(--foreground)" }}>
                    {event.name || "—"}
                  </p>
                  {event.description && (
                    <p className="text-xs leading-relaxed mb-1" style={{ color: "var(--muted-foreground)" }}>
                      {event.description.length > 220
                        ? event.description.slice(0, 220) + "…"
                        : event.description}
                    </p>
                  )}
                  {event.mechanism && (
                    <p className="text-[11px] leading-relaxed mt-1.5 pt-1.5 italic" style={{ color: "var(--muted)", borderTop: "1px solid var(--border)" }}>
                      {event.mechanism}
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
