'use client'

import { useState, useMemo, useCallback, memo } from 'react'
import {
  ComposableMap,
  Geographies,
  Geography,
} from 'react-simple-maps'
import { useRouter } from 'next/navigation'
import { ISO_NUMERIC_TO_ALPHA3 } from '@/lib/iso-numeric'
import type { MapActor } from '@/lib/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type LayerKey = 'pf' | 'authority' | 'reach' | 'vector'

interface FillEntry {
  fill: string
  actor: MapActor
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'
const BG = '#0e1220'
const LOW = { r: 0x1e, g: 0x2a, b: 0x3a }
const HIGH = { r: 0x38, g: 0xbd, b: 0xf8 }

const VECTOR_COLORS: Record<string, string> = {
  Defender: '#3b82f6',
  'From Above (External Pressure)': '#f59e0b',
  'From Below (Challenger)': '#ef4444',
  'From Within (Parallel Governance)': '#a855f7',
  Neutral: '#6b7280',
}

const LAYERS: { key: LayerKey; label: string }[] = [
  { key: 'pf', label: 'PF Score' },
  { key: 'authority', label: 'Authority' },
  { key: 'reach', label: 'Reach' },
  { key: 'vector', label: 'PF Vector' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  const t = Math.max(0, Math.min(1, score / 100))
  const r = Math.round(LOW.r + (HIGH.r - LOW.r) * t)
  const g = Math.round(LOW.g + (HIGH.g - LOW.g) * t)
  const b = Math.round(LOW.b + (HIGH.b - LOW.b) * t)
  return `rgb(${r},${g},${b})`
}

function getFill(actor: MapActor, layer: LayerKey): string {
  if (layer === 'vector') {
    return actor.pfVector ? (VECTOR_COLORS[actor.pfVector] ?? BG) : BG
  }
  const score =
    layer === 'pf'
      ? actor.pfScore
      : layer === 'authority'
        ? actor.authorityScore
        : actor.reachScore
  return score !== null ? scoreColor(score) : BG
}

function layerLabel(layer: LayerKey): string {
  return LAYERS.find((l) => l.key === layer)!.label
}

function layerValue(actor: MapActor, layer: LayerKey): string {
  if (layer === 'vector') return actor.pfVector ?? 'Unscored'
  const score =
    layer === 'pf'
      ? actor.pfScore
      : layer === 'authority'
        ? actor.authorityScore
        : actor.reachScore
  return score !== null ? String(score) : '\u2014'
}

const TREND_DISPLAY: Record<string, { symbol: string; color: string }> = {
  Rising: { symbol: '\u25B2', color: '#22c55e' },
  Stable: { symbol: '\u2192', color: '#6b7280' },
  Declining: { symbol: '\u25BC', color: '#f59e0b' },
  Collapsing: { symbol: '\u25BC\u25BC', color: '#ef4444' },
}

// ─── Memoized geography layer ─────────────────────────────────────────────────
// Memo prevents re-render on tooltip state changes (mouse move).
// Geography paths are parsed once by react-simple-maps; only fills recompute
// when the active layer changes (via fillMap reference swap).

const MapGeographies = memo(function MapGeographies({
  fillMap,
  onEnter,
  onMove,
  onLeave,
  onClick,
}: {
  fillMap: Record<string, FillEntry>
  onEnter: (actor: MapActor, e: React.MouseEvent) => void
  onMove: (e: React.MouseEvent) => void
  onLeave: () => void
  onClick: (actor: MapActor) => void
}) {
  return (
    <Geographies geography={GEO_URL}>
      {({ geographies }: { geographies: any[] }) =>
        geographies.map((geo) => {
          const alpha3 = ISO_NUMERIC_TO_ALPHA3[geo.id]
          const entry = alpha3 ? fillMap[alpha3] : undefined
          const scored = !!entry

          return (
            <Geography
              key={geo.rsmKey}
              geography={geo}
              fill={entry?.fill ?? BG}
              stroke={BG}
              strokeWidth={0.4}
              style={{
                default: { outline: 'none' },
                hover: scored
                  ? {
                      outline: 'none',
                      filter: 'brightness(1.35)',
                      stroke: '#60a5fa',
                      strokeWidth: 1,
                      cursor: 'pointer',
                    }
                  : { outline: 'none' },
                pressed: { outline: 'none' },
              }}
              onMouseEnter={
                scored
                  ? (e: React.MouseEvent) => onEnter(entry!.actor, e)
                  : undefined
              }
              onMouseMove={scored ? onMove : undefined}
              onMouseLeave={scored ? onLeave : undefined}
              onClick={
                scored ? () => onClick(entry!.actor) : undefined
              }
            />
          )
        })
      }
    </Geographies>
  )
})

// ─── Main component ───────────────────────────────────────────────────────────

export default function WorldMap({ actors }: { actors: MapActor[] }) {
  const router = useRouter()
  const [layer, setLayer] = useState<LayerKey>('pf')
  const [tooltip, setTooltip] = useState<{
    x: number
    y: number
    actor: MapActor
  } | null>(null)

  // ISO3 → actor lookup (stable across renders)
  const actorByIso = useMemo(() => {
    const m: Record<string, MapActor> = {}
    for (const a of actors) m[a.iso3] = a
    return m
  }, [actors])

  // Fill map — recomputes only when layer changes
  const fillMap = useMemo(() => {
    const m: Record<string, FillEntry> = {}
    for (const [iso3, actor] of Object.entries(actorByIso)) {
      m[iso3] = { fill: getFill(actor, layer), actor }
    }
    return m
  }, [actorByIso, layer])

  // Stable callbacks (don't break MapGeographies memo)
  const handleEnter = useCallback(
    (actor: MapActor, e: React.MouseEvent) =>
      setTooltip({ x: e.clientX, y: e.clientY, actor }),
    [],
  )
  const handleMove = useCallback(
    (e: React.MouseEvent) =>
      setTooltip((prev) =>
        prev ? { ...prev, x: e.clientX, y: e.clientY } : null,
      ),
    [],
  )
  const handleLeave = useCallback(() => setTooltip(null), [])
  const handleClick = useCallback(
    (actor: MapActor) => router.push(`/actors/${actor.slug}`),
    [router],
  )

  const trend = tooltip
    ? TREND_DISPLAY[tooltip.actor.scoreTrend ?? ''] ?? {
        symbol: '\u2014',
        color: '#6b7280',
      }
    : null

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: 'calc(100vh - 68px)', backgroundColor: BG }}
    >
      {/* ── Page title ─────────────────────────────────────────── */}
      <div className="absolute top-5 left-6 z-10">
        <h1
          className="text-[11px] font-light tracking-[0.2em] uppercase select-none"
          style={{ color: '#5a6375' }}
        >
          PowerFlow World Map
        </h1>
      </div>

      {/* ── Layer switcher ─────────────────────────────────────── */}
      <div
        className="absolute top-4 right-6 z-10 flex gap-0.5 p-1 rounded-lg"
        style={{
          backgroundColor: 'rgba(10,14,26,0.82)',
          backdropFilter: 'blur(12px)',
          border: '1px solid #1e2530',
        }}
      >
        {LAYERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setLayer(key)}
            className="px-3 py-1.5 text-[11px] font-medium rounded-md transition-all duration-150"
            style={{
              color: layer === key ? '#e8eaf0' : '#5a6375',
              backgroundColor:
                layer === key ? '#1e2530' : 'transparent',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Map ────────────────────────────────────────────────── */}
      <ComposableMap
        projectionConfig={{ scale: 155, center: [10, 2] }}
        width={960}
        height={480}
        style={{ width: '100%', height: '100%' }}
      >
        <MapGeographies
          fillMap={fillMap}
          onEnter={handleEnter}
          onMove={handleMove}
          onLeave={handleLeave}
          onClick={handleClick}
        />
      </ComposableMap>

      {/* ── Tooltip ────────────────────────────────────────────── */}
      {tooltip && (
        <div
          className="fixed pointer-events-none z-50 px-3.5 py-2.5 rounded-lg"
          style={{
            left: tooltip.x + 16,
            top: tooltip.y - 16,
            backgroundColor: 'rgba(10,14,26,0.94)',
            border: '1px solid #1e2530',
            backdropFilter: 'blur(12px)',
            maxWidth: 260,
          }}
        >
          <div
            className="text-[13px] font-semibold leading-tight"
            style={{ color: '#e8eaf0' }}
          >
            {tooltip.actor.name}
          </div>

          <div className="mt-1.5 flex flex-col gap-0.5">
            <Row
              label={layerLabel(layer)}
              value={layerValue(tooltip.actor, layer)}
              valueColor="#e8eaf0"
            />
            {layer !== 'vector' && tooltip.actor.pfVector && (
              <Row
                label="Vector"
                value={tooltip.actor.pfVector}
                valueColor={
                  VECTOR_COLORS[tooltip.actor.pfVector] ?? '#6b7280'
                }
              />
            )}
            <Row
              label="Trend"
              value={`${trend!.symbol} ${tooltip.actor.scoreTrend ?? 'Unknown'}`}
              valueColor={trend!.color}
            />
          </div>
        </div>
      )}

      {/* ── Legend ──────────────────────────────────────────────── */}
      <div
        className="absolute bottom-6 left-6 z-10 px-3.5 py-3 rounded-lg"
        style={{
          backgroundColor: 'rgba(10,14,26,0.82)',
          backdropFilter: 'blur(12px)',
          border: '1px solid #1e2530',
        }}
      >
        {layer === 'vector' ? (
          <div className="flex flex-col gap-1.5">
            <span
              className="text-[10px] font-medium uppercase tracking-[0.15em] mb-0.5"
              style={{ color: '#5a6375' }}
            >
              PF Vector
            </span>
            {Object.entries(VECTOR_COLORS).map(([label, color]) => (
              <div
                key={label}
                className="flex items-center gap-2 text-[11px]"
              >
                <div
                  className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span style={{ color: '#c0c5d0' }}>{label}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <span
              className="text-[10px] font-medium uppercase tracking-[0.15em]"
              style={{ color: '#5a6375' }}
            >
              {layerLabel(layer)}
            </span>
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] tabular-nums"
                style={{ color: '#5a6375' }}
              >
                0
              </span>
              <div
                className="rounded-sm"
                style={{
                  width: 120,
                  height: 8,
                  background: 'linear-gradient(to right, #1e2a3a, #38bdf8)',
                }}
              />
              <span
                className="text-[10px] tabular-nums"
                style={{ color: '#5a6375' }}
              >
                100
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Tooltip row ──────────────────────────────────────────────────────────────

function Row({
  label,
  value,
  valueColor,
}: {
  label: string
  value: string
  valueColor: string
}) {
  return (
    <div className="flex items-center gap-1.5 text-[11px]">
      <span style={{ color: '#5a6375' }}>{label}:</span>
      <span className="font-medium" style={{ color: valueColor }}>
        {value}
      </span>
    </div>
  )
}
