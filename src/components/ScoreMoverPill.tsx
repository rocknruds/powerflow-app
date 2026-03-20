"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import ScoreDelta from "./ScoreDelta"

interface CascadeActor {
  id: string
  name: string
  slug: string
  scoreDelta: number | null
}

interface ScoreMoverPillProps {
  actorId: string
  actorSlug: string
  actorName: string
  pfScore: number
  delta: number
  cascadeActors: CascadeActor[]
}

export default function ScoreMoverPill({
  actorSlug,
  actorName,
  pfScore,
  delta,
  cascadeActors,
}: ScoreMoverPillProps) {
  const [hovered, setHovered] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isPositive = delta >= 0
  const hasCascade = cascadeActors.length > 0

  function handleMouseEnter() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setHovered(true)
  }

  function handleMouseLeave() {
    timeoutRef.current = setTimeout(() => setHovered(false), 150)
  }

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link
        href={`/actors/${actorSlug}`}
        className="flex items-center gap-2.5 px-5 py-2 rounded-full transition-colors hover:opacity-80"
        style={{
          backgroundColor: isPositive
            ? "color-mix(in srgb, var(--delta-up) 6%, transparent)"
            : "color-mix(in srgb, var(--delta-down) 6%, transparent)",
        }}
      >
        <span className="text-xs font-medium" style={{ color: "var(--foreground)" }}>
          {actorName}
        </span>
        <span
          className="text-sm font-mono font-semibold tabular-nums"
          style={{ color: "var(--foreground)" }}
        >
          {Math.round(pfScore)}
        </span>
        <ScoreDelta delta={delta} />
        {/* Cascade indicator dot */}
        {hasCascade && (
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{
              backgroundColor: "var(--accent)",
              opacity: 0.7,
            }}
            title="Has cascade effects"
          />
        )}
      </Link>

      {/* Cascade popover */}
      {hasCascade && hovered && (
        <div
          className="absolute bottom-full left-1/2 mb-2 z-50 rounded-lg px-3 py-2.5 min-w-[180px]"
          style={{
            transform: "translateX(-50%)",
            backgroundColor: "var(--surface-raised)",
            border: "1px solid var(--border)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Arrow */}
          <div
            className="absolute left-1/2 -bottom-1.5 w-3 h-3 rotate-45"
            style={{
              transform: "translateX(-50%) rotate(45deg)",
              backgroundColor: "var(--surface-raised)",
              borderRight: "1px solid var(--border)",
              borderBottom: "1px solid var(--border)",
            }}
          />

          <p
            className="text-[9px] font-semibold uppercase tracking-widest mb-2"
            style={{ color: "var(--muted)" }}
          >
            Cascade
          </p>

          <div className="space-y-1.5">
            {cascadeActors.map((ca) => (
              <Link
                key={ca.id}
                href={`/actors/${ca.slug}`}
                className="flex items-center justify-between gap-3 group"
              >
                <span
                  className="text-xs group-hover:opacity-70 transition-opacity"
                  style={{ color: "var(--foreground)" }}
                >
                  {ca.name}
                </span>
                <ScoreDelta delta={ca.scoreDelta} className="text-[10px]" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
