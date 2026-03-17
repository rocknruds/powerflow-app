'use client'

import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import { GEO_URL, OCEAN_COLOR, LAND_STROKE, SIGNAL_BLUE } from '@/lib/geo-constants'
import { ISO_NUMERIC_TO_ALPHA3 } from '@/lib/iso-numeric'

/**
 * Approximate center coordinates [longitude, latitude] for state actors.
 * Used to rotate the orthographic projection so the actor's country faces the viewer.
 */
const ISO3_CENTERS: Record<string, [number, number]> = {
  AFG: [67.7, 33.9],
  DZA: [2.6, 28.0],
  ARG: [-63.6, -38.4],
  AUS: [133.8, -25.3],
  BHR: [50.6, 26.0],
  BGD: [90.4, 23.7],
  BLR: [27.9, 53.7],
  BRA: [-51.9, -14.2],
  CAN: [-106.3, 56.1],
  CHN: [104.2, 35.9],
  COL: [-74.3, 4.6],
  CUB: [-77.8, 21.5],
  EGY: [30.8, 26.8],
  ETH: [40.5, 9.1],
  FRA: [2.2, 46.2],
  DEU: [10.5, 51.2],
  IND: [78.9, 20.6],
  IDN: [113.9, -0.8],
  IRN: [53.7, 32.4],
  IRQ: [43.7, 33.2],
  ISR: [34.9, 31.0],
  ITA: [12.6, 41.9],
  JPN: [138.3, 36.2],
  KAZ: [66.9, 48.0],
  KEN: [37.9, -0.0],
  PRK: [127.5, 40.3],
  KOR: [128.0, 35.9],
  LBN: [35.9, 33.9],
  LBY: [17.2, 26.3],
  MYS: [101.9, 4.2],
  MEX: [-102.6, 23.6],
  MMR: [96.0, 21.9],
  NGA: [8.7, 9.1],
  PAK: [69.3, 30.4],
  PSE: [35.2, 31.9],
  PHL: [121.8, 12.9],
  QAT: [51.2, 25.4],
  RUS: [105.3, 61.5],
  SAU: [45.1, 23.9],
  ZAF: [22.9, -30.6],
  SSD: [31.3, 6.9],
  SDN: [30.2, 12.9],
  SYR: [38.0, 34.8],
  TWN: [121.0, 23.7],
  TUR: [35.2, 38.9],
  UKR: [31.2, 48.4],
  ARE: [53.8, 23.4],
  GBR: [-3.4, 55.4],
  USA: [-98.5, 39.8],
  VEN: [-66.6, 6.4],
  VNM: [108.3, 14.1],
  YEM: [48.5, 15.6],
  // Kosovo (non-ISO but in registry)
  XKX: [20.9, 42.6],
}

interface ActorGlobeProps {
  isoCode: string
  size?: number
}

export default function ActorGlobe({ isoCode, size = 280 }: ActorGlobeProps) {
  const center = ISO3_CENTERS[isoCode]
  if (!center) return null

  const [lon, lat] = center
  const clipId = `globe-clip-${isoCode}`

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <clipPath id={clipId}>
          <circle cx={size / 2} cy={size / 2} r={size / 2} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        {/* Ocean background */}
        <circle cx={size / 2} cy={size / 2} r={size / 2} fill={OCEAN_COLOR} />
        <ComposableMap
          projection="geoOrthographic"
          projectionConfig={{
            scale: size / 2.2,
            center: [0, 0],
            rotate: [-lon, -lat, 0],
          }}
          width={size}
          height={size}
          style={{ width: size, height: size }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }: { geographies: any[] }) =>
              geographies.map((geo) => {
                const alpha3 = ISO_NUMERIC_TO_ALPHA3[geo.id]
                const isActor = alpha3 === isoCode
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={isActor ? SIGNAL_BLUE : 'none'}
                    stroke={LAND_STROKE}
                    strokeWidth={0.5}
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
      </g>
    </svg>
  )
}
