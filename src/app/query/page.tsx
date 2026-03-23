"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import LogoMark from "@/components/LogoMark"
import { pfScoreColor } from "@/components/ActorCard"
import { getPowerPostureLabel } from "@/lib/powerPosture"

const EXAMPLES = [
  "Iran-US impact on Gulf alignments?",
  "What's driving the US-Canada shift?",
  "Israel's multi-front exposure?",
]

interface SupportingActor {
  id: string
  name: string
  pfScore: number | null
  authorityScore: number | null
  reachScore: number | null
  pfVector: string | null
  slug: string
}

interface QueryResult {
  narrative: string
  meta: {
    actors: string[]
    keyFinding: string
    confidence: "High" | "Medium" | "Low"
  }
  supportingActors: SupportingActor[]
  relContext: string[]
  feedContext: string[]
}

function renderMarkdown(text: string): React.ReactNode {
  return text.split('\n').map((line, i) => {
    // Strip ## and # headers — render as bold paragraph instead
    const headerMatch = line.match(/^#{1,3}\s+(.+)/)
    if (headerMatch) {
      return (
        <p key={i} className="text-sm font-semibold mb-2 mt-4" style={{ color: "var(--foreground)" }}>
          {headerMatch[1]}
        </p>
      )
    }
    // Empty line = spacer
    if (!line.trim()) return <div key={i} className="h-2" />
    // Inline bold: replace **text** with <strong>
    const parts = line.split(/(\*\*[^*]+\*\*)/)
    const rendered = parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j} style={{ color: "var(--foreground)" }}>{part.slice(2, -2)}</strong>
      }
      return <span key={j}>{part}</span>
    })
    return (
      <p key={i} className="text-sm leading-relaxed mb-2" style={{ color: "var(--muted-foreground)" }}>
        {rendered}
      </p>
    )
  })
}

const CONFIDENCE_COLORS: Record<string, string> = {
  High: "var(--delta-up)",
  Medium: "var(--score-mid)",
  Low: "var(--delta-down)",
}

export default function QueryPage() {
  const [question, setQuestion] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<QueryResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    document.title = "Query — PowerFlow"
  }, [])

  async function runQuery() {
    if (!question.trim() || loading) return
    setLoading(true)
    setResult(null)
    setError(null)
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Query failed")
      setResult(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      runQuery()
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      {/* Page header */}
      <div className="py-10" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--foreground)" }}>Ask the Model</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Relational intelligence queries backed by live actor scores and scored dependencies
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">

        {/* Query input */}
        <div className="space-y-3">
          <div
            className="rounded-2xl px-6 pt-4 pb-3"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <textarea
              rows={1}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask a geopolitical intelligence question…"
              className="w-full text-sm resize-none focus:outline-none bg-transparent"
              style={{ color: "var(--foreground)" }}
            />
            <div className="flex justify-end pt-1">
              <button
                onClick={runQuery}
                disabled={!question.trim() || loading}
                className="px-5 py-1.5 rounded-xl text-sm font-medium text-white transition-opacity"
                style={{
                  backgroundColor: "var(--accent)",
                  opacity: !question.trim() || loading ? 0.5 : 1,
                  cursor: !question.trim() || loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Running…" : "Run Query"}
              </button>
            </div>
          </div>

          {/* Example chips */}
          <div className="flex flex-wrap gap-2 justify-center">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => setQuestion(ex)}
                className="text-xs px-3 py-1.5 rounded-md transition-colors cursor-pointer"
                style={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--muted-foreground)",
                }}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
        {/* Loading */}
        {loading && (
          <div
            className="rounded-xl p-8 text-center animate-pulse"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <p className="text-sm" style={{ color: "var(--muted)" }}>Querying the model…</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="rounded-xl p-5"
            style={{
              backgroundColor: "color-mix(in srgb, var(--delta-down) 8%, var(--surface))",
              border: "1px solid color-mix(in srgb, var(--delta-down) 30%, transparent)",
            }}
          >
            <p className="text-sm font-medium" style={{ color: "var(--delta-down)" }}>{error}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-6">

            {/* Main two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 items-start">

              {/* Left: narrative */}
              <div
                className="rounded-xl p-6 space-y-4"
                style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                    Analysis
                  </span>
                  {result.meta.confidence && (
                    <span
                      className="text-xs px-2 py-0.5 rounded font-medium"
                      style={{
                        color: CONFIDENCE_COLORS[result.meta.confidence] ?? "var(--muted)",
                        border: `1px solid color-mix(in srgb, ${CONFIDENCE_COLORS[result.meta.confidence] ?? "var(--muted)"} 35%, transparent)`,
                        backgroundColor: `color-mix(in srgb, ${CONFIDENCE_COLORS[result.meta.confidence] ?? "var(--muted)"} 10%, transparent)`,
                      }}
                    >
                      {result.meta.confidence} confidence
                    </span>
                  )}
                </div>

                <div>{renderMarkdown(result.narrative)}</div>

                {result.meta.keyFinding && (
                  <div
                    className="rounded-lg px-4 py-3"
                    style={{
                      backgroundColor: "var(--surface-raised)",
                      borderLeft: "3px solid var(--accent)",
                    }}
                  >
                    <p className="text-sm italic leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                      {result.meta.keyFinding}
                    </p>
                  </div>
                )}
              </div>

              {/* Right: supporting actors */}
              {result.supportingActors.length > 0 && (
                <div className="space-y-3">
                  <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                    Supporting Data
                  </span>
                  {result.supportingActors.map((actor) => {
                    const scoreColor = pfScoreColor(actor.pfScore ?? 0)
                    return (
                      <div
                        key={actor.id}
                        className="rounded-xl p-4"
                        style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <Link
                            href={`/actors/${actor.slug}`}
                            className="text-sm font-semibold leading-snug transition-opacity hover:opacity-70"
                            style={{ color: "var(--foreground)" }}
                          >
                            {actor.name}
                          </Link>
                          <span className="text-xl font-bold tabular-nums shrink-0" style={{ color: scoreColor }}>
                            {actor.pfScore != null ? Math.round(actor.pfScore) : "—"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs tabular-nums" style={{ color: "var(--muted)" }}>
                            Auth {actor.authorityScore ?? "—"}
                          </span>
                          <span className="text-xs tabular-nums" style={{ color: "var(--muted)" }}>
                            Reach {actor.reachScore ?? "—"}
                          </span>
                          {actor.pfVector && (
                            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                              {getPowerPostureLabel(actor.pfVector)}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Receipts */}
            {(result.relContext.length > 0 || result.feedContext.length > 0) && (
              <div
                className="rounded-xl p-5 space-y-4"
                style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                  Receipts
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.relContext.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                        Relationships
                      </p>
                      {result.relContext.slice(0, 5).map((line, i) => (
                        <p key={i} className="text-[11px] font-mono leading-relaxed" style={{ color: "var(--muted)" }}>
                          {line}
                        </p>
                      ))}
                    </div>
                  )}
                  {result.feedContext.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                        Intel
                      </p>
                      {result.feedContext.slice(0, 5).map((line, i) => (
                        <p key={i} className="text-[11px] font-mono leading-relaxed" style={{ color: "var(--muted)" }}>
                          {line}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  )
}
