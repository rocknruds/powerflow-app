'use client'

import { ComposableMap, Geographies, Geography, Graticule } from 'react-simple-maps'
import {
  GEO_URL,
  OCEAN_COLOR,
  LAND_STROKE,
  LAND_UNTRACKED,
  SIGNAL_BLUE,
  GRATICULE_STROKE,
  ISO3_CENTERS,
  REGION_CENTERS,
  COUNTRY_SCALES,
  DEFAULT_GEO_SCALE,
} from '@/lib/geo-constants'
import { ISO_NUMERIC_TO_ALPHA3 } from '@/lib/iso-numeric'
import type { ActorType } from '@/lib/types'

interface ActorGeoPanelProps {
  isoCode: string | null
  region: string | null
  actorType: ActorType
}

function getProjectionConfig(isoCode: string | null, region: string | null, actorType: string) {
  // State actor with known ISO3 center
  if (actorType === 'State' && isoCode && ISO3_CENTERS[isoCode]) {
    const center = ISO3_CENTERS[isoCode]
    const scale = COUNTRY_SCALES[isoCode] ?? DEFAULT_GEO_SCALE
    return { center, scale }
  }

  // Non-state / fallback: use region center
  if (region && REGION_CENTERS[region]) {
    const { center, scale } = REGION_CENTERS[region]
    return { center, scale }
  }

  // Ultimate fallback: world view
  return { center: [0, 20] as [number, number], scale: 150 }
}

export default function ActorGeoPanel({ isoCode, region, actorType }: ActorGeoPanelProps) {
  const { center, scale } = getProjectionConfig(isoCode, region, actorType)
  const shouldHighlight = actorType === 'State' && isoCode && ISO3_CENTERS[isoCode]

  return (
    <div
      style={{ width: '100%', height: '100%', background: OCEAN_COLOR, position: 'relative', overflow: 'hidden' }}
      aria-hidden="true"
      role="presentation"
    >
      <style>{`
        @keyframes geo-glow {
          0%, 100% { opacity: 0.05; }
          50% { opacity: 0.10; }
        }
      `}</style>

      {/* ComposableMap renders its own <svg> — all SVG elements (defs, ellipse, geographies) must be inside it */}
      <ComposableMap
        projection="geoNaturalEarth1"
        projectionConfig={{ center, scale }}
        width={800}
        height={400}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Gradient def inside ComposableMap's SVG so Geography can reference it */}
        <defs>
          <radialGradient id="actor-highlight-grad" gradientUnits="objectBoundingBox" cx="0.5" cy="0.45" r="0.55">
            <stop offset="0%" stopColor={SIGNAL_BLUE} stopOpacity={0.35} />
            <stop offset="55%" stopColor={SIGNAL_BLUE} stopOpacity={0.18} />
            <stop offset="100%" stopColor={SIGNAL_BLUE} stopOpacity={0.08} />
          </radialGradient>
        </defs>

        {/* Ambient glow ellipse — centered in the ComposableMap coordinate space (800x400) */}
        {shouldHighlight && (
          <ellipse
            cx={400}
            cy={200}
            rx={120}
            ry={100}
            fill={SIGNAL_BLUE}
            style={{ animation: 'geo-glow 5s ease-in-out infinite' }}
          />
        )}

        <Graticule stroke={GRATICULE_STROKE} strokeWidth={0.3} />
        <Geographies geography={GEO_URL}>
          {({ geographies }: { geographies: any[] }) =>
            geographies.map((geo) => {
              const alpha3 = ISO_NUMERIC_TO_ALPHA3[geo.id]
              const isActor = shouldHighlight && alpha3 === isoCode
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={isActor ? 'url(#actor-highlight-grad)' : LAND_UNTRACKED}
                  stroke={isActor ? SIGNAL_BLUE : LAND_STROKE}
                  strokeWidth={isActor ? 1.6 : 0.6}
                  style={{
                    default: { outline: 'none' },
                    hover: { outline: 'none' },
                    pressed: { outline: 'none' },
                  }}
                />
              )
            })
          }
        </Geographies>
      </ComposableMap>

      {/* Edge fade overlays — CSS divs on top of SVG */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 35, background: 'linear-gradient(to right, var(--surface), transparent)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 25, background: `linear-gradient(to left, ${OCEAN_COLOR}, transparent)`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 18, background: `linear-gradient(to bottom, ${OCEAN_COLOR}, transparent)`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 18, background: `linear-gradient(to top, ${OCEAN_COLOR}, transparent)`, pointerEvents: 'none' }} />
    </div>
  )
}
