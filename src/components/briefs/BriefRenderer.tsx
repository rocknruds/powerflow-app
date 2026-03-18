import type { BriefContent, BriefSection } from "@/lib/parseBriefContent"
import CollapsibleSection from "@/components/CollapsibleSection"

// ─── Inline markdown rendering ──────────────────────────────────────────────

/** Render inline **bold** and *italic* as spans. */
function renderInline(text: string): React.ReactNode[] {
  // Match **bold** and *italic* patterns
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

/** Strip raw "---" divider lines from section text. */
function stripDividers(text: string): string {
  return text
    .split("\n")
    .filter((l) => !/^-{3,}$/.test(l.trim()))
    .join("\n")
}

/** Render a block of text as paragraphs with inline formatting. */
function Prose({ text }: { text: string }) {
  const paragraphs = stripDividers(text).split(/\n\s*\n/).filter(Boolean)
  return (
    <div className="max-w-[72ch]">
      {paragraphs.map((p, i) => (
        <p key={i} className="text-base leading-[1.8] mb-5" style={{ color: "var(--muted-foreground)" }}>
          {renderInline(p.trim())}
        </p>
      ))}
    </div>
  )
}

// ─── KEY MOVEMENTS renderer ─────────────────────────────────────────────────

function DeltaBadge({ delta }: { delta: number }) {
  const isPositive = delta > 0
  const color = isPositive ? "var(--delta-up)" : "var(--delta-down)"
  const bg = isPositive
    ? "color-mix(in srgb, var(--delta-up) 12%, transparent)"
    : "color-mix(in srgb, var(--delta-down) 12%, transparent)"
  return (
    <span
      className="text-xs font-mono px-1.5 py-0.5 rounded shrink-0"
      style={{ color, backgroundColor: bg }}
    >
      {isPositive ? "+" : ""}{delta}
    </span>
  )
}

function KeyMovementsSection({ raw }: { raw: string }) {
  const cleaned = stripDividers(raw).trim()

  // Each actor entry is a separate paragraph block in Notion, joined with \n\n.
  const entryChunks = cleaned
    .split(/\n\n+/)
    .map((s) => s.trim())
    .filter(Boolean)

  // Handles all agent formats — optional parenthetical annotation between delta and separator:
  //   Monthly:  **Actor** — Δ ±N (PF old → ~new) — body
  //   Weekly:   **Actor** — Δ ±N → body
  //   Annotated: **Actor** — Δ ±N (internal rebalance) → body
  const ENTRY_RE =
    /^(?:\*\*(.+?)\*\*|([A-Z][^—\n]*?))\s*[—–-]\s*Δ\s*([+-]?\d+(?:\.\d+)?)\s*(?:\([^)]*\))?\s*(?:[—–-]|→)\s*([\s\S]+)$/
  const items: { actor: string; delta: number; body: string }[] = []
  const fallbackLines: string[] = []

  for (const chunk of entryChunks) {
    const m = ENTRY_RE.exec(chunk)
    if (m) {
      // Strip agent-appended context tags from actor names (e.g. "Iran (Current Conflict)")
      const rawActor = (m[1] || m[2]).trim()
      const actor = rawActor.replace(/\s*\(Current Conflict\)\s*/i, '').trim()
      items.push({
        actor,
        delta: parseFloat(m[3]),
        body: m[4].trim(),
      })
    } else {
      fallbackLines.push(chunk)
    }
  }

  return (
    <>
      <div>
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              marginTop: i > 0 ? 24 : 0,
              paddingTop: i > 0 ? 24 : 0,
              borderTop: i > 0 ? "1px solid var(--border)" : "none",
            }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="text-sm"
                style={{ color: "var(--foreground)", fontWeight: 600 }}
              >
                {item.actor}
              </span>
              <DeltaBadge delta={item.delta} />
            </div>
            <p
              className="text-base leading-[1.8]"
              style={{ color: "var(--muted-foreground)" }}
            >
              {renderInline(item.body)}
            </p>
          </div>
        ))}
      </div>
      {fallbackLines.length > 0 && <Prose text={fallbackLines.join("\n")} />}
    </>
  )
}

// ─── SCENARIOS TO WATCH renderer ────────────────────────────────────────────

/**
 * Format: **Scenario Title** p=55% (context). Body text.
 * Groups: 1=title, 2=probability, 3=parenthetical context (optional), 4=body
 */
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
  const isTriggered = /already triggered/i.test(context)
  const isEscalating = /escalating/i.test(context)
  if (!isTriggered) return null
  const label = isEscalating ? "Active — Escalating" : "Active"
  return (
    <span
      className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
      style={{ color: "var(--delta-down)", backgroundColor: "color-mix(in srgb, var(--delta-down) 12%, transparent)" }}
    >
      {label}
    </span>
  )
}

function ScenariosSection({ raw }: { raw: string }) {
  // Each scenario is a paragraph block → separated by \n\n
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
          {item.body && (
            <p className="text-base leading-[1.8]" style={{ color: "var(--muted-foreground)" }}>
              {renderInline(item.body)}
            </p>
          )}
        </div>
      ))}
      {fallbackLines.length > 0 && <Prose text={fallbackLines.join("\n\n")} />}
    </>
  )
}

// ─── SCORE LEDGER renderer ──────────────────────────────────────────────────

/** Pattern: **Actor** Δ+5 (old → new) — clause */
const LEDGER_RE = /^\*\*(.+?)\*\*\s*Δ\s*([+-]?\d+(?:\.\d+)?)\s*(?:\(([^)]+)\))?\s*(?:[—–-]\s*)?(.*)$/

function ScoreLedgerSection({ raw }: { raw: string }) {
  // Each actor entry is a paragraph block → separated by \n\n
  const entries = stripDividers(raw).split(/\n\n+/).map((s) => s.trim()).filter(Boolean)
  // Also handle single-line-per-entry format (legacy)
  const lines = entries.flatMap((e) => e.split("\n")).filter((l) => l.trim())

  const items: { actor: string; delta: number; range: string; note: string }[] = []
  const fallbackLines: string[] = []

  for (const line of lines) {
    const m = LEDGER_RE.exec(line.trim())
    if (m) {
      items.push({ actor: m[1], delta: parseFloat(m[2]), range: m[3] || "", note: m[4] || "" })
    } else {
      fallbackLines.push(line)
    }
  }

  if (items.length === 0 && fallbackLines.length > 0) {
    return <Prose text={fallbackLines.join("\n")} />
  }

  return (
    <>
      <div className="space-y-1">
        {items.map((item, i) => (
          <div
            key={i}
            className="py-3 px-3 rounded text-sm"
            style={{ backgroundColor: i % 2 === 0 ? "var(--surface)" : "transparent" }}
          >
            <div className="flex items-center gap-2 mb-1 flex-wrap">
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
              <p className="text-sm leading-[1.6]" style={{ color: "var(--muted-foreground)" }}>
                {renderInline(item.note)}
              </p>
            )}
          </div>
        ))}
      </div>
      {fallbackLines.length > 0 && <Prose text={fallbackLines.join("\n")} />}
    </>
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

// ─── Display labels (title case for CollapsibleSection) ─────────────────────

const DISPLAY_LABELS: Record<string, string> = {
  "THE HEADLINE": "The Headline",
  "KEY MOVEMENTS": "Key Movements",
  "ANALYTICAL SYNTHESIS": "Analytical Synthesis",
  "SCENARIOS TO WATCH": "Scenarios to Watch",
  "SCORE LEDGER": "Score Ledger",
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function BriefRenderer({ content }: { content: BriefContent }) {
  if (content.sections.length === 0) {
    return (
      <div
        className="rounded-lg px-6 py-12 text-center text-sm"
        style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--muted)" }}
      >
        No content available for this brief.
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {content.sections.map((section, i) => {
        const label = DISPLAY_LABELS[section.title] || section.title
        const isLast = i === content.sections.length - 1

        // Sections without a title (preamble) render as plain prose
        if (!section.title) {
          return (
            <div key={i} className="pb-12">
              {renderSection(section)}
            </div>
          )
        }

        return (
          <section
            key={i}
            className="pt-2 pb-12"
            style={{ borderBottom: isLast ? "none" : "1px solid var(--border)" }}
          >
            <CollapsibleSection label={label} headerGap="mb-8">
              {renderSection(section)}
            </CollapsibleSection>
          </section>
        )
      })}
    </div>
  )
}
