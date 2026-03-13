import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getAllPublicActors, getActorBySlug } from "@/lib/actors";
import { getActorScoreHistory } from "@/lib/scores";
import { getActorEvents } from "@/lib/events";
import type { NotionEvent } from "@/lib/events";
import { getActorScenarios } from "@/lib/scenarios";
import type { Scenario } from "@/lib/scenarios";
import { calcPFScore } from "@/lib/notion";
import ScoreDelta from "@/components/ScoreDelta";
import ScoreChart from "@/components/ScoreChart";
import { pfScoreColor, actorTypeBadgeColor } from "@/components/ActorCard";

export const revalidate = 300;

export async function generateStaticParams() {
  const actors = await getAllPublicActors();
  return actors.map((a) => ({ slug: a.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const actor = await getActorBySlug(slug);
  return { title: actor?.name ?? "Actor Profile" };
}

function MetaBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs text-gray-500 px-2 py-0.5 border border-[#1f2937] rounded">
      {children}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="w-1 h-4 bg-[#3b82f6] rounded-full" />
      <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
        {children}
      </h2>
    </div>
  );
}

function PFSignalBadge({ signal }: { signal: string | null }) {
  if (!signal) return null;
  const colors: Record<string, { text: string; bg: string }> = {
    Widening: { text: "#ef4444", bg: "#ef444415" },
    Narrowing: { text: "#22c55e", bg: "#22c55e15" },
    Mixed: { text: "#f59e0b", bg: "#f59e0b15" },
    Stable: { text: "#6b7280", bg: "#6b728015" },
    Unclear: { text: "#eab308", bg: "#eab30815" },
  };
  const c = colors[signal] ?? { text: "#9ca3af", bg: "#9ca3af15" };
  return (
    <span
      className="text-xs px-2 py-0.5 rounded font-medium"
      style={{ color: c.text, backgroundColor: c.bg }}
    >
      {signal}
    </span>
  );
}

function ScoreCell({
  label,
  value,
  color,
  sub,
}: {
  label: string;
  value: number | null;
  color: string;
  sub?: string;
}) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-3xl font-bold tabular-nums" style={{ color }}>
        {value ?? "—"}
      </p>
      {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
    </div>
  );
}

export default async function ActorProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const actor = await getActorBySlug(slug);
if (!actor) notFound();

const [history, events, scenarios] = await Promise.all([
  getActorScoreHistory(actor.id),
  getActorEvents(actor.id, 6),
  getActorScenarios(actor.id),
]);

  if (!actor) notFound();

  const pf = calcPFScore(actor.authorityScore, actor.reachScore);
  const scoreColor = pfScoreColor(pf ?? 0);
  const latestSnapshot = history[history.length - 1];
  const latestDelta = latestSnapshot?.delta ?? null;

  // Format lastScored for display
  const lastScoredFormatted = actor.lastScored
    ? new Date(actor.lastScored).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="border-b border-[#1f2937] py-8">
        <div className="max-w-6xl mx-auto px-6">
          <Link
            href="/actors"
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors mb-5 inline-flex items-center gap-1"
          >
            ← Actor Leaderboard
          </Link>

          {/* Actor name + meta row */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {actor.actorType && (
                  <span
                    className="text-xs font-semibold px-2.5 py-0.5 rounded border"
                    style={{
                      color: actorTypeBadgeColor(actor.actorType),
                      borderColor: `${actorTypeBadgeColor(actor.actorType)}40`,
                      backgroundColor: `${actorTypeBadgeColor(actor.actorType)}12`,
                    }}
                  >
                    {actor.actorType}
                  </span>
                )}
                {actor.region && <MetaBadge>{actor.region}</MetaBadge>}
                {actor.iso3 && (
                  <span className="text-xs text-gray-600 font-mono">
                    {actor.iso3}
                  </span>
                )}
                {actor.pfVector && (
                  <PFSignalBadge signal={actor.pfVector} />
                )}
              </div>
              <h1 className="text-4xl font-bold text-white tracking-tight">
                {actor.name}
              </h1>
              {actor.subType && (
                <p className="text-sm text-gray-500 mt-1">{actor.subType}</p>
              )}
            </div>

            {latestDelta !== null && (
              <div className="flex flex-col items-end gap-1">
                <ScoreDelta delta={latestDelta} className="text-base" />
                <span className="text-xs text-gray-600">recent Δ</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">

        {/* ── Hero: scores (left) + chart (right) ─────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">

          {/* Score panel */}
          <div className="bg-[#111111] border border-[#1f2937] rounded-xl p-6 flex flex-col gap-6">
            <ScoreCell
              label="PF Score"
              value={pf}
              color={scoreColor}
              sub="Authority × 0.6 + Reach × 0.4"
            />
            <div className="w-full h-px bg-[#1f2937]" />
            <ScoreCell
              label="Authority Score"
              value={actor.authorityScore}
              color="#f59e0b"
              sub="Capacity to coerce"
            />
            <ScoreCell
              label="Reach Score"
              value={actor.reachScore}
              color="#f97316"
              sub="Influence projection"
            />

            {/* Metadata footer */}
            <div className="mt-auto pt-4 border-t border-[#1f2937] space-y-2">
              {actor.proxyDepth && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Depth</span>
                  <span className="text-xs text-gray-400">{actor.proxyDepth}</span>
                </div>
              )}
              {actor.capabilities.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {actor.capabilities.slice(0, 4).map((cap) => (
                    <span
                      key={cap}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-[#1f2937] text-gray-500"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chart panel */}
          <div className="bg-[#111111] border border-[#1f2937] rounded-xl p-6">
            <SectionLabel>Score Trajectory</SectionLabel>
            <ScoreChart snapshots={history} />
          </div>
        </div>

        {/* ── Score Reasoning ──────────────────────────────────────── */}
        {actor.scoreReasoning && (
          <div className="bg-[#111111] border border-[#1f2937] rounded-xl p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <SectionLabel>Score Reasoning</SectionLabel>
              {lastScoredFormatted && (
                <span className="text-xs text-gray-600 whitespace-nowrap">
                  Last scored {lastScoredFormatted}
                </span>
              )}
            </div>
            {/*
              NOTE: scoreReasoning currently pulls from Actor.scoreReasoning (Score Reasoning field).
              Future migration path: replace with the most recent PowerFlow Assessment for this actor
              (from the PowerFlow Assessments DB, filtered by Actor relation field).
              That's the intended long-term home for this content — period-specific analytical snapshots
              written by the assessment agent. The data structure is already there (e6a475420b96467ab43e77632f7a7032).
            */}
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
              {actor.scoreReasoning}
            </p>
          </div>
        )}

        {/* ── Events + Scenarios row ────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Recent Events */}
          <div>
            <SectionLabel>Recent Events</SectionLabel>
            {events.length === 0 ? (
              <div className="rounded-lg border border-[#1f2937] bg-[#111111] px-5 py-8 text-center text-sm text-gray-600">
                No linked events found.
              </div>
            ) : (
              <div className="space-y-2">
                {events.map((event: NotionEvent) => (
                  <div
                    key={event.id}
                    className="rounded-lg border border-[#1f2937] bg-[#111111] px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-white font-medium leading-snug">
                        {event.name || "—"}
                      </p>
                      {event.date && (
                        <span className="text-xs text-gray-600 whitespace-nowrap shrink-0">
                          {new Date(event.date).toLocaleDateString("en-US", {
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                    {event.pfSignal && (
                      <span className="mt-1 inline-block text-[10px] px-1.5 py-0.5 rounded bg-[#1f2937] text-gray-500">
                        {event.pfSignal}
                      </span>
                    )}
                    {event.description && (
                      <p className="text-xs text-gray-500 mt-1.5 leading-relaxed line-clamp-2">
                        {event.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Scenarios */}
          <div>
            <SectionLabel>Active Scenarios</SectionLabel>
            {!scenarios || scenarios.length === 0 ? (
              <div className="rounded-lg border border-[#1f2937] bg-[#111111] px-5 py-8 text-center text-sm text-gray-600">
                No active scenarios linked.
              </div>
            ) : (
              <div className="space-y-2">
                {scenarios.map((s: Scenario) => (
                  <div
                    key={s.id}
                    className="rounded-lg border border-[#1f2937] bg-[#111111] px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm text-white font-medium leading-snug">
                        {s.name || "—"}
                      </p>
                      {s.probabilityEstimate !== null && (
                        <span className="text-xs font-semibold tabular-nums text-[#3b82f6]">
                          {s.probabilityEstimate}%
                        </span>
                      )}
                    </div>
                    {s.scenarioClass && (
                      <span className="text-[10px] text-gray-600 uppercase tracking-wide">
                        {s.scenarioClass}
                      </span>
                    )}
                    {s.triggerCondition && (
                      <p className="text-xs text-gray-500 mt-1.5 leading-relaxed line-clamp-2">
                        {s.triggerCondition}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}