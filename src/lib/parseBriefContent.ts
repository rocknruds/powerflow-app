// ─── Types ──────────────────────────────────────────────────────────────────

export interface BriefSection {
  type: string   // lowercase slug: "headline", "key-movements", "analytical-synthesis", etc.
  title: string  // display heading: "THE HEADLINE", "KEY MOVEMENTS", etc.
  raw: string    // body text under this heading
}

export interface BriefContent {
  sections: BriefSection[]
}

// ─── Known section headings ─────────────────────────────────────────────────

const SECTION_HEADINGS: Record<string, string> = {
  "THE HEADLINE": "headline",
  "KEY MOVEMENTS": "key-movements",
  "ANALYTICAL SYNTHESIS": "analytical-synthesis",
  "SCENARIOS TO WATCH": "scenarios-to-watch",
  "SCORE LEDGER": "score-ledger",
}

// ─── Preamble junk patterns ─────────────────────────────────────────────────

/** Lines at the top of the content that are artifacts — not real section content. */
function isPreambleJunk(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed) return true
  // Any markdown heading that isn't a recognized section (e.g. "# POWERFLOW WEEKLY BRIEF",
  // "## Mar 1 – Mar 8, 2026") — checked AFTER the caller already tested for section headings
  if (/^#{1,3}\s/.test(trimmed)) return true
  // Standalone date string like "Mar 1 – Mar 8, 2026" (no heading prefix)
  if (/^[A-Z][a-z]{2}\s+\d{1,2}\s*[–—-]\s*[A-Z][a-z]{2}\s+\d{1,2},?\s*\d{4}$/.test(trimmed)) return true
  // Raw horizontal rule
  if (/^-{3,}$/.test(trimmed)) return true
  return false
}

// ─── Parser ─────────────────────────────────────────────────────────────────

/**
 * Parse a raw brief body string (from Notion) into a structured BriefContent.
 *
 * Strips preamble junk (markdown title, standalone dates, "---" dividers)
 * before the first real section heading, then splits on ## headings.
 */
export function parseBriefContent(body: string): BriefContent {
  const rawLines = body.split("\n")

  // Strip preamble junk before first real section heading
  let start = 0
  for (let i = 0; i < rawLines.length; i++) {
    const trimmed = rawLines[i].trim()
    const heading = trimmed.match(/^##\s+(.+)/)
    if (heading && heading[1].trim().toUpperCase() in SECTION_HEADINGS) {
      start = i
      break
    }
    if (!isPreambleJunk(rawLines[i])) {
      start = i
      break
    }
  }

  const lines = rawLines.slice(start)

  // Split into sections on ## heading boundaries
  const sections: BriefSection[] = []
  let currentTitle = ""
  let currentType = "preamble"
  let currentBody: string[] = []

  for (const line of lines) {
    const heading = line.trim().match(/^##\s+(.+)/)
    if (heading) {
      const normalized = heading[1].trim().toUpperCase()
      if (normalized in SECTION_HEADINGS) {
        // Flush previous section
        if (currentBody.length > 0 || currentTitle) {
          sections.push({
            type: currentType,
            title: currentTitle,
            raw: currentBody.join("\n").trim(),
          })
        }
        currentTitle = normalized
        currentType = SECTION_HEADINGS[normalized]
        currentBody = []
        continue
      }
    }
    currentBody.push(line)
  }

  // Flush last section
  if (currentBody.length > 0 || currentTitle) {
    sections.push({
      type: currentType,
      title: currentTitle,
      raw: currentBody.join("\n").trim(),
    })
  }

  return { sections }
}
