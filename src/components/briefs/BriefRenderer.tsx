import type { BriefContent, BriefSection } from "@/lib/parseBriefContent"

// ─── Shared section chrome ──────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="w-1 h-4 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
      <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
        {children}
      </h2>
    </div>
  )
}

function SectionWrapper({ children }: { children: React.ReactNode }) {
  return <div className="space-y-0">{children}</div>
}

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
    <>
      {paragraphs.map((p, i) => (
        <p key={i} className="text-sm leading-relaxed mb-4" style={{ color: "var(--muted-foreground)" }}>
          {renderInline(p.trim())}
        </p>
      ))}
    </>
  )
}

// ─── KEY MOVEMENTS renderer ─────────────────────────────────────────────────

/** Pattern: **Actor Name** — Δ +5 → analytical clause */
const MOVEMENT_RE = /^\*\*(.+?)\*\*\s*[—–-]\s*Δ\s*([+-]?\d+(?:\.\d+)?)\s*→\s*(.+)$/

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
  const lines = stripDividers(raw).split("\n").filter((l) => l.trim())
  const items: { actor: string; delta: number; body: string }[] = []
  let fallbackLines: string[] = []

  for (const line of lines) {
    const m = MOVEMENT_RE.exec(line.trim())
    if (m) {
      items.push({ actor: m[1], delta: parseFloat(m[2]), body: m[3] })
    } else {
      fallbackLines.push(line)
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
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              {item.actor}
            </span>
            <DeltaBadge delta={item.delta} />
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
            {renderInline(item.body)}
          </p>
        </div>
      ))}
      {fallbackLines.length > 0 && <Prose text={fallbackLines.join("\n")} />}
    </>
  )
}

// ─── SCENARIOS TO WATCH renderer ────────────────────────────────────────────

/** Pattern: **Scenario Title**, probability, status text */
const SCENARIO_RE = /^\*\*(.+?)\*\*(?:\s*[,;]\s*|\s*[—–-]\s*)(?:p\s*=\s*)?(\d+%?)\s*[,;]?\s*(.*)$/i

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

function ActivePill() {
  return (
    <span
      className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
      style={{ color: "var(--score-mid)", backgroundColor: "color-mix(in srgb, var(--score-mid) 12%, transparent)" }}
    >
      Active
    </span>
  )
}

function ScenariosSection({ raw }: { raw: string }) {
  const lines = stripDividers(raw).split("\n").filter((l) => l.trim())
  const items: { title: string; probability: string; body: string }[] = []
  let fallbackLines: string[] = []

  for (const line of lines) {
    const m = SCENARIO_RE.exec(line.trim())
    if (m) {
      items.push({ title: m[1], probability: m[2], body: m[3] })
    } else {
      fallbackLines.push(line)
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
            <ActivePill />
          </div>
          {item.body && (
            <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              {renderInline(item.body)}
            </p>
          )}
        </div>
      ))}
      {fallbackLines.length > 0 && <Prose text={fallbackLines.join("\n")} />}
    </>
  )
}

// ─── SCORE LEDGER renderer ──────────────────────────────────────────────────

/** Pattern: **Actor** Δ+5 (old → new) — clause */
const LEDGER_RE = /^\*\*(.+?)\*\*\s*Δ\s*([+-]?\d+(?:\.\d+)?)\s*(?:\(([^)]+)\))?\s*(?:[—–-]\s*)?(.*)$/

function ScoreLedgerSection({ raw }: { raw: string }) {
  const lines = stripDividers(raw).split("\n").filter((l) => l.trim())
  const items: { actor: string; delta: number; range: string; note: string }[] = []
  let fallbackLines: string[] = []

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
            className="flex items-center gap-2 py-1.5 px-3 rounded text-sm"
            style={{ backgroundColor: i % 2 === 0 ? "var(--surface)" : "transparent" }}
          >
            <span className="font-medium shrink-0" style={{ color: "var(--foreground)" }}>
              {item.actor}
            </span>
            <DeltaBadge delta={item.delta} />
            {item.range && (
              <span className="text-xs font-mono" style={{ color: "var(--muted)" }}>
                {item.range}
              </span>
            )}
            {item.note && (
              <span className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>
                {item.note}
              </span>
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
    <div className="space-y-8">
      {content.sections.map((section, i) => (
        <div key={i}>
          {i > 0 && <div className="h-px mb-8" style={{ backgroundColor: "var(--border)" }} />}
          {section.title && (
            <SectionLabel>{section.title}</SectionLabel>
          )}
          <SectionWrapper>
            {renderSection(section)}
          </SectionWrapper>
        </div>
      ))}
    </div>
  )
}
