'use client'

import { useState, useMemo, useCallback, useRef, memo } from 'react'
import {
  ComposableMap,
  Geographies,
  Geography,
  Graticule,
  Sphere,
} from 'react-simple-maps'
import { ISO_NUMERIC_TO_ALPHA3, ISO_NUMERIC_TO_NAME } from '@/lib/iso-numeric'
import {
  GEO_URL,
  OCEAN_COLOR,
  LAND_STROKE,
  LAND_UNTRACKED,
  GRATICULE_STROKE,
  VECTOR_COLORS,
  TREND_DISPLAY,
} from '@/lib/geo-constants'
import type { MapActorFull } from '@/lib/types'
import MapSidePanel from './MapSidePanel'

// ─── Types ────────────────────────────────────────────────────────────────────

type LayerKey = 'pf' | 'authority' | 'reach' | 'vector'

interface FillEntry {
  fill: string
  actor: MapActorFull
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LOW = { r: 0x1e, g: 0x2a, b: 0x3a }
const HIGH = { r: 0x38, g: 0xbd, b: 0xf8 }
const DRAG_SENSITIVITY = 0.5

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

function getFill(actor: MapActorFull, layer: LayerKey): string {
  if (layer === 'vector') {
    return actor.pfVector ? (VECTOR_COLORS[actor.pfVector] ?? OCEAN_COLOR) : OCEAN_COLOR
  }
  const score =
    layer === 'pf'
      ? actor.pfScore
      : layer === 'authority'
        ? actor.authorityScore
        : actor.reachScore
  return score !== null ? scoreColor(score) : OCEAN_COLOR
}

function layerLabel(layer: LayerKey): string {
  return LAYERS.find((l) => l.key === layer)!.label
}

function layerValue(actor: MapActorFull, layer: LayerKey): string {
  if (layer === 'vector') return actor.pfVector ?? 'Unscored'
  const score =
    layer === 'pf'
      ? actor.pfScore
      : layer === 'authority'
        ? actor.authorityScore
        : actor.reachScore
  return score !== null ? String(score) : '\u2014'
}

// ─── Memoized geography layer ─────────────────────────────────────────────────

const MapGeographies = memo(function MapGeographies({
  fillMap,
  onHoverEnter,
  onHoverMove,
  onHoverLeave,
  onClick,
}: {
  fillMap: Record<string, FillEntry>
  onHoverEnter: (actor: MapActorFull, e: React.MouseEvent) => void
  onHoverMove: (e: React.MouseEvent) => void
  onHoverLeave: () => void
  onClick: (geoId: string, actor: MapActorFull | null) => void
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
              fill={entry?.fill ?? LAND_UNTRACKED}
              stroke={LAND_STROKE}
              strokeWidth={0.4}
              style={{
                default: { outline: 'none' },
                hover: {
                  outline: 'none',
                  filter: scored ? 'brightness(1.35)' : 'brightness(1.1)',
                  stroke: scored ? '#60a5fa' : LAND_STROKE,
                  strokeWidth: scored ? 1 : 0.6,
                  cursor: 'pointer',
                },
                pressed: { outline: 'none' },
              }}
              onMouseEnter={
                scored
                  ? (e: React.MouseEvent) => onHoverEnter(entry!.actor, e)
                  : undefined
              }
              onMouseMove={scored ? onHoverMove : undefined}
              onMouseLeave={scored ? onHoverLeave : undefined}
              onClick={() => onClick(geo.id, entry?.actor ?? null)}
            />
          )
        })
      }
    </Geographies>
  )
})

// ─── Main component ───────────────────────────────────────────────────────────

export default function WorldMap({ actors }: { actors: MapActorFull[] }) {
  const [layer, setLayer] = useState<LayerKey>('pf')
  const [rotation, setRotation] = useState<[number, number, number]>([0, -20, 0])
  const [tooltip, setTooltip] = useState<{
    x: number
    y: number
    actor: MapActorFull
  } | null>(null)
  const [selectedActor, setSelectedActor] = useState<MapActorFull | null>(null)
  const [selectedCountryName, setSelectedCountryName] = useState<string | null>(null)

  // Drag state (refs to avoid re-renders during drag)
  const isDragging = useRef(false)
  const rafId = useRef<number>(0)
  const dragStart = useRef<{ x: number; y: number; rotation: [number, number, number] }>({
    x: 0,
    y: 0,
    rotation: [0, -20, 0],
  })

  // ISO3 → actor lookup
  const actorByIso = useMemo(() => {
    const m: Record<string, MapActorFull> = {}
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

  // ── Drag handlers ─────────────────────────────────────────────────────────

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      isDragging.current = true
      dragStart.current = { x: e.clientX, y: e.clientY, rotation: [...rotation] as [number, number, number] }
      ;(e.target as Element).setPointerCapture(e.pointerId)
    },
    [rotation],
  )

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return
    cancelAnimationFrame(rafId.current)
    const clientX = e.clientX
    const clientY = e.clientY
    rafId.current = requestAnimationFrame(() => {
      const dx = clientX - dragStart.current.x
      const dy = clientY - dragStart.current.y
      const [r0, r1, r2] = dragStart.current.rotation
      setRotation([
        r0 + dx * DRAG_SENSITIVITY,
        Math.max(-90, Math.min(90, r1 - dy * DRAG_SENSITIVITY)),
        r2,
      ])
    })
  }, [])

  const handlePointerUp = useCallback(() => {
    isDragging.current = false
    cancelAnimationFrame(rafId.current)
  }, [])

  // ── Tooltip handlers ──────────────────────────────────────────────────────

  const handleHoverEnter = useCallback(
    (actor: MapActorFull, e: React.MouseEvent) =>
      setTooltip({ x: e.clientX, y: e.clientY, actor }),
    [],
  )
  const handleHoverMove = useCallback(
    (e: React.MouseEvent) =>
      setTooltip((prev) =>
        prev ? { ...prev, x: e.clientX, y: e.clientY } : null,
      ),
    [],
  )
  const handleHoverLeave = useCallback(() => setTooltip(null), [])

  // ── Click handler ─────────────────────────────────────────────────────────

  const handleClick = useCallback(
    (geoId: string, actor: MapActorFull | null) => {
      if (actor) {
        setSelectedActor(actor)
        setSelectedCountryName(null)
      } else {
        // Untracked country
        const name = ISO_NUMERIC_TO_NAME[geoId] ?? null
        if (name) {
          setSelectedActor(null)
          setSelectedCountryName(name)
        }
      }
    },
    [],
  )

  const handleClosePanel = useCallback(() => {
    setSelectedActor(null)
    setSelectedCountryName(null)
  }, [])

  // Close panel when clicking the globe background (not a country)
  const handleBackgroundClick = useCallback(() => {
    if (selectedActor || selectedCountryName) {
      handleClosePanel()
    }
  }, [selectedActor, selectedCountryName, handleClosePanel])

  const trend = tooltip
    ? TREND_DISPLAY[tooltip.actor.scoreTrend ?? ''] ?? {
        symbol: '\u2014',
        color: '#6b7280',
      }
    : null

  const panelOpen = selectedActor !== null || selectedCountryName !== null

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: 'calc(100vh - 68px)', backgroundColor: OCEAN_COLOR }}
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

      {/* ── Globe ────────────────────────────────────────────────── */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ cursor: isDragging.current ? 'grabbing' : 'grab', width: '100%', height: '100%' }}
      >
        <ComposableMap
          projection="geoOrthographic"
          projectionConfig={{
            scale: 280,
            center: [0, 0],
            rotate: rotation,
          }}
          width={800}
          height={600}
          style={{ width: '100%', height: '100%' }}
        >
          <Sphere
            id="globe-sphere"
            fill={OCEAN_COLOR}
            stroke={LAND_STROKE}
            strokeWidth={0.5}
            onClick={handleBackgroundClick}
          />
          <Graticule
            stroke={GRATICULE_STROKE}
            strokeWidth={0.3}
          />
          <MapGeographies
            fillMap={fillMap}
            onHoverEnter={handleHoverEnter}
            onHoverMove={handleHoverMove}
            onHoverLeave={handleHoverLeave}
            onClick={handleClick}
          />
        </ComposableMap>
      </div>

      {/* ── Tooltip ────────────────────────────────────────────── */}
      {tooltip && !isDragging.current && (
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

      {/* ── Side Panel ──────────────────────────────────────────── */}
      <MapSidePanel
        actor={selectedActor}
        untrackedCountryName={selectedCountryName}
        onClose={handleClosePanel}
      />
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
