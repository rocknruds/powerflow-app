"use client"

import { useState } from "react"
import type { BriefContent, BriefSection } from "@/lib/parseBriefContent"

// ─── Inline markdown rendering ──────────────────────────────────────────────

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} style={{ color: "var(--foreground)" }}>
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (part.startsWith("*") && part.endsWith("*") && !part.startsWith("**")) {
      return <em key={i}>{part.slice(1, -1)}</em>
    }
    return <span key={i}>{part}</span>
  })
}

function stripDividers(text: string): string {
  return text
    .split("\n")
    .filter((l) => !/^-{3,}$/.test(l.trim()))
    .join("\n")
}

// ─── Prose ───────────────────────────────────────────────────────────────────

function Prose({ text, centered = false }: { text: string; centered?: boolean }) {
  const paragraphs = stripDividers(text).split(/\n\s*\n/).filter(Boolean)
  return (
    <div className="max-w-[72ch]">
      {paragraphs.map((p, i) => (
        <p key={i} className="text-[1.0625rem] leading-[1.85] mb-6" style={{ color: "var(--muted-foreground)", textAlign: centered ? "center" : "start" }}>
          {renderInline(p.trim())}
        </p>
      ))}
    </div>
  )
}

// ─── Headline Prose (larger text, foreground color) ──────────────────────────

function HeadlineProse({ text }: { text: string }) {
  const paragraphs = stripDividers(text).split(/\n\s*\n/).filter(Boolean)
  return (
    <div className="max-w-[72ch]">
      {paragraphs.map((p, i) => (
        <p key={i} className="text-lg leading-[1.85] mb-6" style={{ color: "var(--foreground)" }}>
          {renderInline(p.trim())}
        </p>
      ))}
    </div>
  )
}

// ─── Section header ──────────────────────────────────────────────────────────

function SectionHeader({ label, isFirst }: { label: string; isFirst: boolean }) {
  return (
    <div className={`flex items-center gap-2 mb-8 max-w-[72ch]${isFirst ? "" : " mt-14"}`}>
      <svg width="10" height="24" viewBox="0 0 18 44" fill="none" aria-hidden="true" className="shrink-0">
        <path
          d="M5.2 8.6C5.2 7.16406 4.03594 6 2.6 6C1.16406 6 0 7.16406 0 8.6V35.4C0 36.8359 1.16406 38 2.6 38C4.03594 38 5.2 36.8359 5.2 35.4V8.6Z"
          fill="#60A5FA"
        />
        <path
          d="M18 2.6C18 1.16406 16.8359 0 15.4 0C13.9641 0 12.8 1.16406 12.8 2.6V41.4C12.8 42.8359 13.9641 44 15.4 44C16.8359 44 18 42.8359 18 41.4V2.6Z"
          fill="#3B4A5C"
        />
      </svg>
      <span
        className="text-lg font-semibold tracking-[0.14em] uppercase"
        style={{ color: "var(--muted-foreground)" }}
      >
        {label}
      </span>
    </div>
  )
}

// ─── Delta badge ─────────────────────────────────────────────────────────────

function DeltaBadge({ delta }: { delta: number }) {
  const isPositive = delta > 0
  const color = isPositive ? "var(--delta-up)" : "var(--delta-down)"
  const bg = isPositive
    ? "color-mix(in srgb, var(--delta-up) 12%, transparent)"
    : "color-mix(in srgb, var(--delta-down) 12%, transparent)"
  return (
    <span
      className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md min-w-[44px] text-center tabular-nums shrink-0"
      style={{ color, backgroundColor: bg }}
    >
      {isPositive ? "+" : ""}{delta}
    </span>
  )
}

// ─── KEY MOVEMENTS renderer ─────────────────────────────────────────────────

// Captures: 1=bold actor, 2=plain actor, 3=delta, 4=parenthetical (optional), 5=body
const ENTRY_RE =
  /^(?:\*\*(.+?)\*\*|([A-Z][^—\n]*?))\s*[—–-]\s*Δ\s*([+-]?\d+(?:\.\d+)?)\s*(?:\(([^)]*)\))?\s*(?:[—–-]|→)\s*([\s\S]+)$/

function KeyMovementEntry({
  item,
  isLast,
}: {
  item: { actor: string; delta: number; range: string; body: string }
  isLast: boolean
}) {
  const [open, setOpen] = useState(true)
  return (
    <div
      className="pl-4 mb-0"
      style={{
        borderLeft: "1px solid rgba(255,255,255,0.12)",
        borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.05)",
        paddingBottom: isLast ? "0.5rem" : "1.25rem",
        marginBottom: isLast ? "0" : "0.25rem",
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 w-full text-left py-2 group"
        style={{ cursor: "pointer" }}
      >
        <span className="text-base font-medium" style={{ color: "var(--foreground)" }}>
          {item.actor}
        </span>
        <DeltaBadge delta={item.delta} />
        {item.range && (
          <span className="text-xs font-mono" style={{ color: "var(--muted)" }}>
            {item.range}
          </span>
        )}
        <span
          className="ml-auto text-xs transition-transform duration-150"
          style={{ color: "var(--muted)", transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}
        >
          ▾
        </span>
      </button>
      {open && (
        <p className="text-[1.0625rem] leading-relaxed pb-1 mt-3" style={{ color: "var(--muted-foreground)" }}>
          {renderInline(item.body)}
        </p>
      )}
    </div>
  )
}

function KeyMovementsSection({ raw }: { raw: string }) {
  const cleaned = stripDividers(raw).trim()
  const entryChunks = cleaned.split(/\n\n+/).map((s) => s.trim()).filter(Boolean)
  const items: { actor: string; delta: number; range: string; body: string }[] = []
  const fallbackLines: string[] = []

  for (const chunk of entryChunks) {
    const m = ENTRY_RE.exec(chunk)
    if (m) {
      const rawActor = (m[1] || m[2]).trim()
      const actor = rawActor.replace(/\s*\([^)→\d]+\)\s*/gi, "").trim()
      const parenthetical = m[4] ?? ""
      // Show parenthetical as score range only if it looks numeric (e.g. "50 → 26")
      const range =
        /[→\d]/.test(parenthetical) && !/current conflict/i.test(parenthetical)
          ? parenthetical
          : ""
      items.push({ actor, delta: parseFloat(m[3]), range, body: m[5].trim() })
    } else {
      fallbackLines.push(chunk)
    }
  }

  return (
    <>
      <div>
        {items.map((item, i) => (
          <KeyMovementEntry key={i} item={item} isLast={i === items.length - 1} />
        ))}
      </div>
      {fallbackLines.length > 0 && <Prose text={fallbackLines.join("\n")} />}
    </>
  )
}

// ─── SCENARIOS TO WATCH renderer ────────────────────────────────────────────

const SCENARIO_RE =
  /^\*\*(.+?)\*\*\s*(?:[,;—–-]\s*)?p=(\d+%?)(?:\s*\(([^)]*)\))?\.\s*([\s\S]*)$/i

function ProbabilityBadge({ p }: { p: string }) {
  const num = parseInt(p, 10)
  let color = "var(--muted-foreground)"
  let bg = "color-mix(in srgb, var(--muted) 12%, transparent)"
  if (!isNaN(num)) {
    if (num >= 60) {
      color = "var(--delta-down)"
      bg = "color-mix(in srgb, var(--delta-down) 12%, transparent)"
    } else if (num >= 30) {
      color = "var(--score-mid)"
      bg = "color-mix(in srgb, var(--score-mid) 12%, transparent)"
    } else {
      color = "var(--delta-up)"
      bg = "color-mix(in srgb, var(--delta-up) 12%, transparent)"
    }
  }
  return (
    <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ color, backgroundColor: bg }}>
      p={p.includes("%") ? p : `${p}%`}
    </span>
  )
}

function TriggeredPill({ context }: { context: string }) {
  if (!/already triggered/i.test(context)) return null
  const label = /escalating/i.test(context) ? "Active — Escalating" : "Active"
  return (
    <span
      className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
      style={{
        color: "var(--delta-down)",
        backgroundColor: "color-mix(in srgb, var(--delta-down) 12%, transparent)",
      }}
    >
      {label}
    </span>
  )
}

function ScenarioBody({ body }: { body: string }) {
  const TRIGGER = "Trigger to monitor:"
  const idx = body.indexOf(TRIGGER)
  if (idx === -1) {
    return (
      <p className="text-[1.0625rem] leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
        {renderInline(body)}
      </p>
    )
  }
  const before = body.slice(0, idx).trim()
  const afterTrigger = body.slice(idx + TRIGGER.length).trim()
  return (
    <>
      {before && (
        <p className="text-[1.0625rem] leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
          {renderInline(before)}
        </p>
      )}
      <p className="text-[1.0625rem] leading-relaxed mt-3 block" style={{ color: "var(--muted-foreground)" }}>
        <strong style={{ color: "var(--foreground)" }}>{TRIGGER}</strong>{" "}
        {renderInline(afterTrigger)}
      </p>
    </>
  )
}

function ScenariosSection({ raw }: { raw: string }) {
  const entries = stripDividers(raw).split(/\n\n+/).map((s) => s.trim()).filter(Boolean)
  const items: { title: string; probability: string; context: string; body: string }[] = []
  const fallbackLines: string[] = []

  for (const entry of entries) {
    const m = SCENARIO_RE.exec(entry)
    if (m) {
      items.push({ title: m[1], probability: m[2], context: m[3] ?? "", body: m[4] ?? "" })
    } else {
      fallbackLines.push(entry)
    }
  }

  return (
    <>
      {items.map((item, i) => (
        <div
          key={i}
          className="rounded-lg p-4 mb-3"
          style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              {item.title}
            </span>
            <ProbabilityBadge p={item.probability} />
            <TriggeredPill context={item.context} />
          </div>
          {item.body && <ScenarioBody body={item.body} />}
        </div>
      ))}
      {fallbackLines.length > 0 && <Prose text={fallbackLines.join("\n\n")} />}
    </>
  )
}

// ─── SCORE LEDGER ────────────────────────────────────────────────────────────

const LEDGER_RE =
  /^\*\*(.+?)\*\*\s*Δ\s*([+-]?\d+(?:\.\d+)?)\s*(?:\(([^)]+)\))?\s*(?:[—–-]\s*)?(.*)$/

function parseLedgerItems(raw: string) {
  const entries = stripDividers(raw).split(/\n\n+/).map((s) => s.trim()).filter(Boolean)
  const lines = entries.flatMap((e) => e.split("\n")).filter((l) => l.trim())
  const items: { actor: string; delta: number; range: string; note: string }[] = []
  const fallback: string[] = []

  for (const line of lines) {
    const m = LEDGER_RE.exec(line.trim())
    if (m) {
      items.push({ actor: m[1], delta: parseFloat(m[2]), range: m[3] || "", note: m[4] || "" })
    } else {
      fallback.push(line)
    }
  }
  return { items, fallback }
}

// Inline version — used on mobile (renders after Scenarios)
function ScoreLedgerSection({ raw }: { raw: string }) {
  const { items, fallback } = parseLedgerItems(raw)
  if (items.length === 0 && fallback.length > 0) {
    return <Prose text={fallback.join("\n")} />
  }
  return (
    <>
      <div className="divide-y divide-white/5">
        {items.map((item, i) => (
          <div key={i} className="py-3 text-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium shrink-0" style={{ color: "var(--foreground)" }}>
                {item.actor}
              </span>
              <DeltaBadge delta={item.delta} />
              {item.range && (
                <span className="text-xs font-mono" style={{ color: "var(--muted)" }}>
                  {item.range}
                </span>
              )}
            </div>
            {item.note && (
              <p className="text-xs leading-[1.6] mt-1" style={{ color: "var(--muted)" }}>
                {renderInline(item.note)}
              </p>
            )}
          </div>
        ))}
      </div>
      {fallback.length > 0 && <Prose text={fallback.join("\n")} />}
    </>
  )
}

// Extract new score from range string (e.g., "44 → 48" → "48")
function extractNewScore(rangeStr: string): string | null {
  const arrowMatch = rangeStr.match(/→\s*(\d+(?:\.\d+)?)/)
  if (arrowMatch) return arrowMatch[1]
  // Fallback: if no arrow, try to get the last number
  const numbers = rangeStr.match(/\d+(?:\.\d+)?/g)
  return numbers ? numbers[numbers.length - 1] : null
}

// Sidebar version — sticky card, lg breakpoint only
export function ScoreLedgerSidebar({ raw }: { raw: string }) {
  const { items, fallback } = parseLedgerItems(raw)
  const sorted = [...items].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 6)
  return (
    <div
      className="rounded-[20px] p-5 lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto"
      style={{ backgroundColor: "var(--surface)", border: "1px solid rgba(255,255,255,0.08)", width: "100%", minWidth: "400px" }}
    >
      <div
        className="text-sm tracking-[0.14em] uppercase font-semibold mb-5 text-left"
        style={{ color: "var(--muted)" }}
      >
        Score Ledger
      </div>
      <div className="divide-y divide-white/5">
        {sorted.map((item, i) => {
          const newScore = item.range ? extractNewScore(item.range) : null
          return (
            <div key={i} className="py-3.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base font-medium shrink-0" style={{ color: "var(--foreground)" }}>
                  {item.actor}
                </span>
                <DeltaBadge delta={item.delta} />
                {newScore && (
                  <span className="text-xs font-mono" style={{ color: "var(--muted)" }}>
                    {newScore}
                  </span>
                )}
              </div>
              {item.note && (
                <ul className="text-sm leading-relaxed mt-1.5 ml-4 list-disc space-y-1" style={{ color: "var(--muted)" }}>
                  <li>{renderInline(item.note)}</li>
                </ul>
              )}
            </div>
          )
        })}
      </div>
      {fallback.length > 0 && (
        <p className="text-xs mt-3" style={{ color: "var(--muted)" }}>
          {fallback.join(" ")}
        </p>
      )}
    </div>
  )
}

// ─── Section dispatcher ─────────────────────────────────────────────────────

function renderSection(section: BriefSection) {
  switch (section.type) {
    case "key-movements":
      return <KeyMovementsSection raw={section.raw} />
    case "scenarios-to-watch":
      return <ScenariosSection raw={section.raw} />
    case "score-ledger":
      return <ScoreLedgerSection raw={section.raw} />
    default:
      return <Prose text={section.raw} />
  }
}

// ─── Display labels ──────────────────────────────────────────────────────────

const DISPLAY_LABELS: Record<string, string> = {
  "THE HEADLINE": "The Headline",
  "KEY MOVEMENTS": "Key Movements",
  "ANALYTICAL SYNTHESIS": "Analytical Commentary",
  "ANALYTICAL COMMENTARY": "Analytical Commentary",
  "SCENARIOS TO WATCH": "Scenarios to Watch",
  "SCORE LEDGER": "Score Ledger",
}

// ─── Main component ──────────────────────────────────────────────────────────

/**
 * Renders brief sections. Excludes "score-ledger" by default — that section
 * is rendered separately in the sticky sidebar via ScoreLedgerSidebar.
 * Pass exclude={[]} to render all sections.
 */
export default function BriefRenderer({
  content,
  exclude = ["score-ledger"],
}: {
  content: BriefContent
  exclude?: string[]
}) {
  const sections = content.sections.filter((s) => !exclude.includes(s.type))
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

  if (sections.length === 0) {
    return (
      <div
        className="rounded-lg px-6 py-12 text-center text-sm"
        style={{
          border: "1px solid var(--border)",
          backgroundColor: "var(--surface)",
          color: "var(--muted)",
        }}
      >
        No content available for this brief.
      </div>
    )
  }

  let firstHeader = true

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  return (
    <div>
      {sections.map((section, i) => {
        // Untitled preamble — plain prose
        if (!section.title) {
          return (
            <div key={i}>
              {i > 0 && (
                <div className="mb-12 mt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />
              )}
              <div className="pb-10">
                {renderSection(section)}
              </div>
            </div>
          )
        }

        // THE HEADLINE — no section header label, just content
        if (section.type === "headline") {
          return (
            <div key={i}>
              {i > 0 && (
                <div className="mb-12 mt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />
              )}
              <div className="pb-10">
                <HeadlineProse text={section.raw} />
              </div>
            </div>
          )
        }

        const label = DISPLAY_LABELS[section.title] || section.title
        const isFirst = firstHeader
        firstHeader = false

        const sectionMargin = section.title && ["ANALYTICAL COMMENTARY", "ANALYTICAL SYNTHESIS"].includes(section.title) ? "my-[27px]" : ""
        const isCollapsible = section.title && ["ANALYTICAL COMMENTARY", "ANALYTICAL SYNTHESIS"].includes(section.title)
        const sectionKey = `section-${i}`
        const isExpanded = expandedSections[sectionKey] !== false // default to expanded

        return (
          <div key={i}>
            {i > 0 && (
              <div className="mb-12 mt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />
            )}
            <section className={`pb-10 ${sectionMargin}`}>
              {isCollapsible ? (
                <button
                  onClick={() => toggleSection(sectionKey)}
                  className="flex items-center gap-2 mb-8 w-full text-left group/toggle focus:outline-none"
                  style={{ cursor: "pointer" }}
                >
                  <span
                    className="text-lg font-semibold tracking-[0.14em] uppercase group-hover/toggle:opacity-70 transition-opacity"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {label}
                  </span>
                </button>
              ) : (
                <SectionHeader label={label} isFirst={isFirst} />
              )}
              {isExpanded && renderSection(section)}
            </section>
          </div>
        )
      })}
    </div>
  )
}
