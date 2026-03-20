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

const ISO3_NORMALIZE: Record<string, string> = {
  'CHN-CCP': 'CHN',
}

interface ActorGeoPanelProps {
  isoCode: string | null
  region: string | null
  actorType: ActorType
}

function getProjectionConfig(isoCode: string | null, region: string | null, actorType: string) {
  const normalizedIso = isoCode ? (ISO3_NORMALIZE[isoCode] ?? isoCode) : null
  // State actor with known ISO3 center
  if (actorType === 'State' && normalizedIso && ISO3_CENTERS[normalizedIso]) {
    const center = ISO3_CENTERS[normalizedIso]
    const scale = COUNTRY_SCALES[normalizedIso] ?? DEFAULT_GEO_SCALE
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
  const normalizedIso = isoCode ? (ISO3_NORMALIZE[isoCode] ?? isoCode) : null
  const { center, scale } = getProjectionConfig(isoCode, region, actorType)
  const shouldHighlight = actorType === 'State' && normalizedIso && ISO3_CENTERS[normalizedIso]

  return (
    <div
      style={{ width: '100%', height: '100%', background: OCEAN_COLOR, position: 'relative', overflow: 'hidden' }}
      aria-hidden="true"
      role="presentation"
    >
      <style>{`
        @keyframes geo-glow {
          0%, 100% { opacity: 0.12; }
          50% { opacity: 0.28; }
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
          <filter id="country-glow-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="12" />
          </filter>
        </defs>

        <Graticule stroke={GRATICULE_STROKE} strokeWidth={0.3} />
        <Geographies geography={GEO_URL}>
          {({ geographies }: { geographies: any[] }) => {
            const geos = geographies.map((geo) => {
              const alpha3 = ISO_NUMERIC_TO_ALPHA3[geo.id]
              const isActor = shouldHighlight && alpha3 === normalizedIso
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

            // Country-shaped glow: blurred copy of the highlighted country rendered on top
            const actorGeo = shouldHighlight
              ? geographies.find((geo) => ISO_NUMERIC_TO_ALPHA3[geo.id] === normalizedIso)
              : null

            return (
              <>
                {geos}
                {actorGeo && (
                  <Geography
                    geography={actorGeo}
                    fill={SIGNAL_BLUE}
                    stroke={SIGNAL_BLUE}
                    strokeWidth={4}
                    style={{
                      default: { outline: 'none', filter: 'url(#country-glow-blur)', animation: 'geo-glow 5s ease-in-out infinite' },
                      hover: { outline: 'none', filter: 'url(#country-glow-blur)', animation: 'geo-glow 5s ease-in-out infinite' },
                      pressed: { outline: 'none', filter: 'url(#country-glow-blur)', animation: 'geo-glow 5s ease-in-out infinite' },
                    }}
                  />
                )}
              </>
            )
          }}
        </Geographies>
      </ComposableMap>

      {/* Edge fade overlays — CSS divs on top of SVG */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 35, background: 'linear-gradient(to right, var(--background), transparent)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 25, background: `linear-gradient(to left, ${OCEAN_COLOR}, transparent)`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 18, background: `linear-gradient(to bottom, ${OCEAN_COLOR}, transparent)`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 18, background: `linear-gradient(to top, ${OCEAN_COLOR}, transparent)`, pointerEvents: 'none' }} />
    </div>
  )
}
