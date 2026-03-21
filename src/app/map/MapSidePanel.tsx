'use client'

import { useEffect, useCallback } from 'react'
import Link from 'next/link'
import type { MapActorFull } from '@/lib/types'
import { VECTOR_COLORS, TREND_DISPLAY } from '@/lib/geo-constants'

interface MapSidePanelProps {
  actor: MapActorFull | null
  untrackedCountryName: string | null
  onClose: () => void
}

export default function MapSidePanel({
  actor,
  untrackedCountryName,
  onClose,
}: MapSidePanelProps) {
  const open = actor !== null || untrackedCountryName !== null

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose],
  )

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, handleKeyDown])

  return (
    <div
      className="absolute top-0 right-0 z-20 h-full transition-transform duration-300 ease-out w-[320px] max-sm:w-full"
      style={{
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        backgroundColor: 'rgba(10,14,26,0.94)',
        backdropFilter: 'blur(16px)',
        borderLeft: '1px solid #1e2530',
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-sm transition-opacity hover:opacity-70"
        style={{ color: '#5a6375' }}
        aria-label="Close panel"
      >
        ✕
      </button>

      <div className="p-6 pt-12 h-full overflow-y-auto">
        {actor ? (
          <TrackedActorPanel actor={actor} />
        ) : untrackedCountryName ? (
          <UntrackedPanel countryName={untrackedCountryName} />
        ) : null}
      </div>
    </div>
  )
}

// ─── Tracked actor panel ──────────────────────────────────────────────────────

function TrackedActorPanel({ actor }: { actor: MapActorFull }) {
  const trend = TREND_DISPLAY[actor.scoreTrend ?? ''] ?? {
    symbol: '\u2014',
    color: '#6b7280',
  }

  return (
    <div className="space-y-5">
      {/* Name + badges */}
      <div>
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded uppercase"
            style={{
              color: '#38bdf8',
              border: '1px solid rgba(56,189,248,0.3)',
              backgroundColor: 'rgba(56,189,248,0.1)',
            }}
          >
            State
          </span>
          {actor.pfVector && (
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded"
              style={{
                color: VECTOR_COLORS[actor.pfVector] ?? '#6b7280',
                backgroundColor: `rgba(${VECTOR_COLORS[actor.pfVector] ? '255,255,255' : '107,114,128'},0.1)`,
              }}
            >
              {actor.pfVector}
            </span>
          )}
        </div>
        <Link
          href={`/actors/${actor.slug}`}
          className="text-xl font-bold tracking-tight transition-opacity hover:opacity-70 block"
          style={{ color: '#e8eaf0' }}
        >
          {actor.name}
        </Link>
      </div>

      {/* Scores */}
      <div
        className="grid grid-cols-3 gap-3 py-4 rounded-lg px-4"
        style={{ backgroundColor: 'rgba(30,37,48,0.6)' }}
      >
        <ScoreBlock label="PF" value={actor.pfScore} />
        <ScoreBlock label="Auth" value={actor.authorityScore} />
        <ScoreBlock label="Reach" value={actor.reachScore} />
      </div>

      {/* Delta + trend */}
      {(actor.scoreDelta !== null || actor.scoreTrend) && (
        <div className="flex items-center gap-3">
          {actor.scoreDelta !== null && (
            <span
              className="text-sm font-mono font-semibold tabular-nums"
              style={{
                color: actor.scoreDelta > 0 ? '#22c55e' : actor.scoreDelta < 0 ? '#ef4444' : '#6b7280',
              }}
            >
              {actor.scoreDelta > 0 ? '+' : ''}{actor.scoreDelta}
            </span>
          )}
          {actor.scoreTrend && (
            <span className="text-xs" style={{ color: trend.color }}>
              {trend.symbol} {actor.scoreTrend}
            </span>
          )}
        </div>
      )}

      {/* Score reasoning */}
      {actor.scoreReasoning && (
        <div>
          <PanelLabel>Key Drivers</PanelLabel>
          <p
            className="text-xs leading-relaxed line-clamp-3"
            style={{ color: '#9ca3b0' }}
          >
            {actor.scoreReasoning}
          </p>
        </div>
      )}

      {/* Relationships */}
      {(actor.bestRelationship || actor.worstRelationship) && (
        <div>
          <PanelLabel>Key Relationships</PanelLabel>
          <div className="space-y-1.5">
            {actor.bestRelationship && (
              <RelRow
                label="Closest"
                name={actor.bestRelationship.name}
                value={actor.bestRelationship.alignment}
                color="#22c55e"
              />
            )}
            {actor.worstRelationship && (
              <RelRow
                label="Most adversarial"
                name={actor.worstRelationship.name}
                value={actor.worstRelationship.alignment}
                color="#ef4444"
              />
            )}
          </div>
        </div>
      )}

      {/* Recent events */}
      {actor.recentEvents.length > 0 && (
        <div>
          <PanelLabel>Recent Events</PanelLabel>
          <div className="space-y-2">
            {actor.recentEvents.map((ev, i) => (
              <div key={i}>
                {ev.date && (
                  <span
                    className="text-[10px] font-mono tabular-nums"
                    style={{ color: '#5a6375' }}
                  >
                    {new Date(ev.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                )}
                <p
                  className="text-xs leading-snug line-clamp-2"
                  style={{ color: '#c0c5d0' }}
                >
                  {ev.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Link to full profile */}
      <Link
        href={`/actors/${actor.slug}`}
        className="inline-flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-70 mt-2"
        style={{ color: '#38bdf8' }}
      >
        View full profile →
      </Link>
    </div>
  )
}

// ─── Untracked panel ──────────────────────────────────────────────────────────

function UntrackedPanel({ countryName }: { countryName: string }) {
  return (
    <div>
      <h2
        className="text-xl font-bold tracking-tight mb-3"
        style={{ color: '#e8eaf0' }}
      >
        {countryName}
      </h2>
      <span
        className="text-[10px] font-semibold px-2 py-0.5 rounded uppercase"
        style={{
          color: '#5a6375',
          border: '1px solid #1e2530',
          backgroundColor: 'rgba(30,37,48,0.6)',
        }}
      >
        Data Pending
      </span>
      <p
        className="text-xs leading-relaxed mt-3"
        style={{ color: '#5a6375' }}
      >
        This actor is not yet tracked in the PowerFlow registry.
      </p>
    </div>
  )
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function PanelLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-2"
      style={{ color: '#5a6375' }}
    >
      {children}
    </p>
  )
}

function ScoreBlock({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="text-center">
      <p className="text-[10px] mb-1" style={{ color: '#5a6375' }}>{label}</p>
      <p className="text-xl font-bold tabular-nums" style={{ color: '#e8eaf0' }}>
        {value !== null ? Math.round(value) : '\u2014'}
      </p>
    </div>
  )
}

function RelRow({
  label,
  name,
  value,
  color,
}: {
  label: string
  name: string
  value: number
  color: string
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <div>
        <span style={{ color: '#5a6375' }}>{label}: </span>
        <span style={{ color: '#c0c5d0' }}>{name}</span>
      </div>
      <span className="font-mono font-medium tabular-nums" style={{ color }}>
        {value > 0 ? '+' : ''}{value}
      </span>
    </div>
  )
}
