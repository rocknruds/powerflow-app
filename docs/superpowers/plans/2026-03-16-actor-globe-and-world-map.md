# Actor Globe & World Map Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an orthographic globe profile pic for state actors and overhaul the /map page with an interactive drag-to-rotate globe and click-to-select side panel.

**Architecture:** Two components sharing visual constants and the react-simple-maps library. ActorGlobe is a static, non-interactive sphere. WorldMap is a full rewrite with orthographic projection, pointer-event drag rotation, a slide-in side panel for actor details, and expanded data (relationships + events). Both are "use client" components.

**Tech Stack:** React 18, Next.js (App Router), react-simple-maps v3, TypeScript, Notion REST API

**Spec:** `docs/superpowers/specs/2026-03-16-actor-globe-and-world-map-design.md`

---

## Chunk 1: Foundation (constants, types, data layer)

### Task 1: Create shared geo constants

**Files:**
- Create: `src/lib/geo-constants.ts`

- [ ] **Step 1: Create the constants file**

```ts
export const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'
export const OCEAN_COLOR = '#0e1220'
export const LAND_STROKE = '#1e2a3a'
export const LAND_UNTRACKED = '#141c2a'
export const SIGNAL_BLUE = '#38bdf8'
export const GRATICULE_STROKE = '#1a2235'

export const VECTOR_COLORS: Record<string, string> = {
  Defender: '#3b82f6',
  'From Above (External Pressure)': '#f59e0b',
  'From Below (Challenger)': '#ef4444',
  'From Within (Parallel Governance)': '#a855f7',
  Neutral: '#6b7280',
}

export const TREND_DISPLAY: Record<string, { symbol: string; color: string }> = {
  Rising: { symbol: '\u25B2', color: '#22c55e' },
  Stable: { symbol: '\u2192', color: '#6b7280' },
  Declining: { symbol: '\u25BC', color: '#f59e0b' },
  Collapsing: { symbol: '\u25BC\u25BC', color: '#ef4444' },
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/geo-constants.ts
git commit -m "feat: add shared geo visual constants"
```

---

### Task 2: Add ISO numeric-to-name lookup

**Files:**
- Modify: `src/lib/iso-numeric.ts`

Add a new exported `ISO_NUMERIC_TO_NAME` lookup below the existing `ISO_NUMERIC_TO_ALPHA3` map. This maps the same numeric string IDs (used by world-atlas 110m topojson features) to human-readable country names. Covers all ~200 entries in the existing map. Used by the WorldMap side panel to show country names for untracked countries.

- [ ] **Step 1: Add the lookup**

Append to `src/lib/iso-numeric.ts` after the closing `}` of `ISO_NUMERIC_TO_ALPHA3`:

```ts
/**
 * ISO 3166-1 numeric → country name mapping.
 * Used by the WorldMap side panel to display country names for
 * untracked countries (world-atlas 110m does not include properties.name).
 */
export const ISO_NUMERIC_TO_NAME: Record<string, string> = {
  '004': 'Afghanistan',
  '008': 'Albania',
  '012': 'Algeria',
  '020': 'Andorra',
  '024': 'Angola',
  '028': 'Antigua and Barbuda',
  '032': 'Argentina',
  '051': 'Armenia',
  '036': 'Australia',
  '040': 'Austria',
  '031': 'Azerbaijan',
  '044': 'Bahamas',
  '048': 'Bahrain',
  '050': 'Bangladesh',
  '052': 'Barbados',
  '112': 'Belarus',
  '056': 'Belgium',
  '084': 'Belize',
  '204': 'Benin',
  '064': 'Bhutan',
  '068': 'Bolivia',
  '070': 'Bosnia and Herzegovina',
  '072': 'Botswana',
  '076': 'Brazil',
  '096': 'Brunei',
  '100': 'Bulgaria',
  '854': 'Burkina Faso',
  '108': 'Burundi',
  '132': 'Cabo Verde',
  '116': 'Cambodia',
  '120': 'Cameroon',
  '124': 'Canada',
  '140': 'Central African Republic',
  '148': 'Chad',
  '152': 'Chile',
  '156': 'China',
  '170': 'Colombia',
  '174': 'Comoros',
  '178': 'Congo',
  '180': 'DR Congo',
  '188': 'Costa Rica',
  '384': "Cote d'Ivoire",
  '191': 'Croatia',
  '192': 'Cuba',
  '196': 'Cyprus',
  '203': 'Czechia',
  '208': 'Denmark',
  '262': 'Djibouti',
  '212': 'Dominica',
  '214': 'Dominican Republic',
  '218': 'Ecuador',
  '818': 'Egypt',
  '222': 'El Salvador',
  '226': 'Equatorial Guinea',
  '232': 'Eritrea',
  '233': 'Estonia',
  '748': 'Eswatini',
  '231': 'Ethiopia',
  '242': 'Fiji',
  '246': 'Finland',
  '250': 'France',
  '266': 'Gabon',
  '270': 'Gambia',
  '268': 'Georgia',
  '276': 'Germany',
  '288': 'Ghana',
  '300': 'Greece',
  '308': 'Grenada',
  '320': 'Guatemala',
  '324': 'Guinea',
  '624': 'Guinea-Bissau',
  '328': 'Guyana',
  '332': 'Haiti',
  '340': 'Honduras',
  '348': 'Hungary',
  '352': 'Iceland',
  '356': 'India',
  '360': 'Indonesia',
  '364': 'Iran',
  '368': 'Iraq',
  '372': 'Ireland',
  '376': 'Israel',
  '380': 'Italy',
  '388': 'Jamaica',
  '392': 'Japan',
  '400': 'Jordan',
  '398': 'Kazakhstan',
  '404': 'Kenya',
  '296': 'Kiribati',
  '408': 'North Korea',
  '410': 'South Korea',
  '414': 'Kuwait',
  '417': 'Kyrgyzstan',
  '418': 'Laos',
  '428': 'Latvia',
  '422': 'Lebanon',
  '426': 'Lesotho',
  '430': 'Liberia',
  '434': 'Libya',
  '438': 'Liechtenstein',
  '440': 'Lithuania',
  '442': 'Luxembourg',
  '450': 'Madagascar',
  '454': 'Malawi',
  '458': 'Malaysia',
  '462': 'Maldives',
  '466': 'Mali',
  '470': 'Malta',
  '584': 'Marshall Islands',
  '478': 'Mauritania',
  '480': 'Mauritius',
  '484': 'Mexico',
  '583': 'Micronesia',
  '498': 'Moldova',
  '492': 'Monaco',
  '496': 'Mongolia',
  '499': 'Montenegro',
  '504': 'Morocco',
  '508': 'Mozambique',
  '104': 'Myanmar',
  '516': 'Namibia',
  '520': 'Nauru',
  '524': 'Nepal',
  '528': 'Netherlands',
  '554': 'New Zealand',
  '558': 'Nicaragua',
  '562': 'Niger',
  '566': 'Nigeria',
  '807': 'North Macedonia',
  '578': 'Norway',
  '512': 'Oman',
  '586': 'Pakistan',
  '585': 'Palau',
  '275': 'Palestine',
  '591': 'Panama',
  '598': 'Papua New Guinea',
  '600': 'Paraguay',
  '604': 'Peru',
  '608': 'Philippines',
  '616': 'Poland',
  '620': 'Portugal',
  '634': 'Qatar',
  '642': 'Romania',
  '643': 'Russia',
  '646': 'Rwanda',
  '659': 'Saint Kitts and Nevis',
  '662': 'Saint Lucia',
  '670': 'Saint Vincent and the Grenadines',
  '882': 'Samoa',
  '674': 'San Marino',
  '678': 'Sao Tome and Principe',
  '682': 'Saudi Arabia',
  '686': 'Senegal',
  '688': 'Serbia',
  '690': 'Seychelles',
  '694': 'Sierra Leone',
  '702': 'Singapore',
  '703': 'Slovakia',
  '705': 'Slovenia',
  '090': 'Solomon Islands',
  '706': 'Somalia',
  '710': 'South Africa',
  '728': 'South Sudan',
  '724': 'Spain',
  '144': 'Sri Lanka',
  '729': 'Sudan',
  '740': 'Suriname',
  '752': 'Sweden',
  '756': 'Switzerland',
  '760': 'Syria',
  '158': 'Taiwan',
  '762': 'Tajikistan',
  '834': 'Tanzania',
  '764': 'Thailand',
  '626': 'Timor-Leste',
  '768': 'Togo',
  '776': 'Tonga',
  '780': 'Trinidad and Tobago',
  '788': 'Tunisia',
  '792': 'Turkey',
  '795': 'Turkmenistan',
  '798': 'Tuvalu',
  '800': 'Uganda',
  '804': 'Ukraine',
  '784': 'United Arab Emirates',
  '826': 'United Kingdom',
  '840': 'United States',
  '858': 'Uruguay',
  '860': 'Uzbekistan',
  '548': 'Vanuatu',
  '862': 'Venezuela',
  '704': 'Vietnam',
  '887': 'Yemen',
  '894': 'Zambia',
  '716': 'Zimbabwe',
  // Territories & special codes
  '-99': 'Kosovo',
  '010': 'Antarctica',
  '304': 'Greenland',
  '732': 'Western Sahara',
  '540': 'New Caledonia',
  '238': 'Falkland Islands',
  '630': 'Puerto Rico',
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/iso-numeric.ts
git commit -m "feat: add ISO numeric-to-name lookup for map country labels"
```

---

### Task 3: Move MapActor type and add MapActorFull

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/app/map/WorldMap.tsx`

The `MapActor` interface currently lives in `WorldMap.tsx`. Move it to `types.ts` so both the map page and WorldMap component import from a shared location. Add the extended `MapActorFull` type for the new side panel data.

- [ ] **Step 1: Add types to `src/lib/types.ts`**

Add at the bottom of the file, before the closing `AccessContext` interface:

```ts
// ─── Map Types ────────────────────────────────────────────────────────────

export interface MapActor {
  name: string
  slug: string
  iso3: string
  pfScore: number | null
  authorityScore: number | null
  reachScore: number | null
  pfVector: string | null
  scoreTrend: string | null
}

export interface MapActorFull extends MapActor {
  scoreReasoning: string | null
  scoreDelta: number | null
  bestRelationship: { name: string; alignment: number } | null
  worstRelationship: { name: string; alignment: number } | null
  recentEvents: { date: string; name: string }[]
}
```

- [ ] **Step 2: Update WorldMap.tsx to import from types**

In `src/app/map/WorldMap.tsx`, remove the local `MapActor` interface (lines 14-23) and add an import:

```ts
import type { MapActor } from '@/lib/types'
```

Keep the `export` on the component's props so the page can still pass `MapActor[]`.

- [ ] **Step 3: Verify the dev server compiles**

```bash
cd /c/Users/adamr/github/powerflow-app && npx next build 2>&1 | head -30
```

Expected: no type errors related to MapActor.

- [ ] **Step 4: Commit**

```bash
git add src/lib/types.ts src/app/map/WorldMap.tsx
git commit -m "refactor: move MapActor type to shared types, add MapActorFull"
```

---

### Task 4: Add batch data fetch functions

**Files:**
- Modify: `src/lib/relationships.ts`
- Modify: `src/lib/events.ts`

Add `getTopRelationshipsForActors()` and `getRecentEventsForActors()` — batch functions that query once and group server-side.

- [ ] **Step 1: Add `getTopRelationshipsForActors` to `src/lib/relationships.ts`**

Append after the existing `getTopRelationships` function:

```ts
/**
 * Batch fetch best/worst relationship for multiple actors.
 * Single Notion query with compound OR filter, grouped server-side.
 */
export async function getTopRelationshipsForActors(
  actorIds: string[]
): Promise<Map<string, { best: { name: string; alignment: number } | null; worst: { name: string; alignment: number } | null }>> {
  const result = new Map<string, { best: { name: string; alignment: number } | null; worst: { name: string; alignment: number } | null }>()
  if (actorIds.length === 0) return result

  const filter = {
    or: actorIds.map((id) => ({
      property: 'Primary Actor',
      relation: { contains: id },
    })),
  }

  try {
    const pages = await queryDatabase(RELATIONSHIPS_DB_ID, filter, undefined, 300)

    // Group by primary actor
    const byActor = new Map<string, { counterpartyName: string; alignment: number }[]>()
    for (const page of pages) {
      const rel = parsePage(page, 'outgoing')
      if (rel.primaryActorId && rel.alignmentScore !== null) {
        const list = byActor.get(rel.primaryActorId) ?? []
        list.push({ counterpartyName: rel.counterpartyName, alignment: rel.alignmentScore })
        byActor.set(rel.primaryActorId, list)
      }
    }

    // Pick best (highest alignment) and worst (lowest alignment) per actor
    for (const [actorId, rels] of byActor) {
      const sorted = rels.sort((a, b) => a.alignment - b.alignment)
      const worst = sorted[0] ? { name: sorted[0].counterpartyName, alignment: sorted[0].alignment } : null
      const best = sorted[sorted.length - 1] ? { name: sorted[sorted.length - 1].counterpartyName, alignment: sorted[sorted.length - 1].alignment } : null
      result.set(actorId, { best, worst })
    }
  } catch {
    // Return empty map on error
  }

  return result
}
```

- [ ] **Step 2: Add `getRecentEventsForActors` to `src/lib/events.ts`**

Append after the existing `getActorEvents` function:

```ts
/**
 * Batch fetch recent events for multiple actors.
 * Single Notion query with compound OR filter, grouped server-side.
 * Returns max 2 events per actor, most recent first.
 */
export async function getRecentEventsForActors(
  actorIds: string[],
  limitPerActor = 2
): Promise<Map<string, { date: string; name: string }[]>> {
  const result = new Map<string, { date: string; name: string }[]>()
  if (actorIds.length === 0) return result

  const filter = {
    or: actorIds.map((id) => ({
      property: 'Key Actors',
      relation: { contains: id },
    })),
  }

  try {
    const pages = await queryDatabase(
      EVENTS_DB_ID,
      filter,
      [{ property: 'Date', direction: 'descending' as const }]
    )

    for (const page of pages) {
      const event = parseEvent(page)
      // An event can reference multiple actors — add to each
      for (const actorId of event.actorIds) {
        if (!actorIds.includes(actorId)) continue
        const list = result.get(actorId) ?? []
        if (list.length < limitPerActor) {
          list.push({ date: event.date ?? '', name: event.name })
          result.set(actorId, list)
        }
      }
    }
  } catch {
    // Return empty map on error
  }

  return result
}
```

- [ ] **Step 3: Verify compilation**

```bash
cd /c/Users/adamr/github/powerflow-app && npx next build 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/relationships.ts src/lib/events.ts
git commit -m "feat: add batch relationship and event fetch functions for map"
```

---

## Chunk 2: ActorGlobe component + profile page integration

### Task 5: Create the ActorGlobe component

**Files:**
- Create: `src/components/geo/ActorGlobe.tsx`

This is a static, non-interactive orthographic globe that highlights a single country. Used as a geographic "profile pic" for state actors.

- [ ] **Step 1: Create the component**

Create `src/components/geo/ActorGlobe.tsx`:

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/geo/ActorGlobe.tsx
git commit -m "feat: add ActorGlobe orthographic globe component"
```

---

### Task 6: Integrate ActorGlobe into actor profile page

**Files:**
- Modify: `src/app/actors/[slug]/page.tsx`

Add a dynamic import for ActorGlobe. For State actors with `iso3`, render the globe on the right side of the hero with the score delta stacked below it. Non-state actors keep the current layout.

- [ ] **Step 1: Add the dynamic import**

At the top of `src/app/actors/[slug]/page.tsx`, after the existing imports, add:

```ts
import dynamic from "next/dynamic";

const ActorGlobe = dynamic(() => import("@/components/geo/ActorGlobe"), {
  ssr: false,
  loading: () => <div style={{ width: 140, height: 140 }} />,
});
```

- [ ] **Step 2: Update the hero layout**

Replace the right side of the hero flex container. Find the block that currently renders the score delta (the `{latestDelta !== null && ...}` section inside the `flex items-start justify-between` div).

Replace this section of the hero:
```tsx
            {latestDelta !== null && (
              <div className="flex flex-col items-end gap-1">
                <ScoreDelta delta={latestDelta} className="text-base" />
                <span className="text-xs" style={{ color: "var(--muted)" }}>recent Δ</span>
              </div>
            )}
```

With:
```tsx
            <div className="flex flex-col items-end gap-2 shrink-0">
              {actor.actorType === "State" && actor.iso3 && (
                <ActorGlobe isoCode={actor.iso3} size={140} />
              )}
              {latestDelta !== null && (
                <div className="flex flex-col items-end gap-1">
                  <ScoreDelta delta={latestDelta} className="text-base" />
                  <span className="text-xs" style={{ color: "var(--muted)" }}>recent Δ</span>
                </div>
              )}
            </div>
```

- [ ] **Step 3: Verify in browser**

```bash
cd /c/Users/adamr/github/powerflow-app && npm run dev
```

Navigate to a state actor profile (e.g., `/actors/united-states`, `/actors/china`). Confirm:
- Globe renders on the right side of the hero, 140px diameter
- The actor's country is highlighted in signal blue (#38bdf8)
- Other countries show as outlines only
- Globe is circular (clipped)
- Score delta appears below the globe
- Non-state actor profiles (e.g., `/actors/hamas`) show delta only, no globe

- [ ] **Step 4: Commit**

```bash
git add src/app/actors/[slug]/page.tsx
git commit -m "feat: integrate ActorGlobe into state actor profile hero"
```

---

## Chunk 3: WorldMap rewrite — core globe with drag rotation

### Task 7: Rewrite WorldMap with orthographic projection and drag rotation

**Files:**
- Rewrite: `src/app/map/WorldMap.tsx`

Full rewrite. This task covers: orthographic projection, ocean/land styling, graticule, drag-to-rotate, layer switcher (preserved), hover tooltip (preserved), legend (preserved). The side panel is Task 8.

- [ ] **Step 1: Rewrite `src/app/map/WorldMap.tsx`**

```tsx
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
```

- [ ] **Step 2: Do NOT commit yet** — WorldMap imports MapSidePanel which doesn't exist until Task 8. Proceed directly to Task 8 and commit both together.

---

### Task 8: Create the MapSidePanel component

**Files:**
- Create: `src/app/map/MapSidePanel.tsx`

The slide-in side panel that appears when clicking a country. Shows full actor details for tracked countries, "Data Pending" for untracked ones.

- [ ] **Step 1: Create `src/app/map/MapSidePanel.tsx`**

```tsx
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
        <h2
          className="text-xl font-bold tracking-tight"
          style={{ color: '#e8eaf0' }}
        >
          {actor.name}
        </h2>
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
```

- [ ] **Step 2: Commit both WorldMap and MapSidePanel together**

```bash
git add src/app/map/WorldMap.tsx src/app/map/MapSidePanel.tsx
git commit -m "feat: rewrite WorldMap with orthographic globe, drag rotation, and side panel"
```

---

## Chunk 4: Map page data fetching + final wiring

### Task 9: Update map page data fetching

**Files:**
- Modify: `src/app/map/page.tsx`

Expand the server component to fetch relationships and events, merge into `MapActorFull` objects, and pass to `WorldMap`.

- [ ] **Step 1: Rewrite `src/app/map/page.tsx`**

```tsx
import { getAllPublicActors, enrichActorsWithDeltas } from '@/lib/actors'
import { getLatestDeltaByActor } from '@/lib/scores'
import { getTopRelationshipsForActors } from '@/lib/relationships'
import { getRecentEventsForActors } from '@/lib/events'
import type { MapActorFull } from '@/lib/types'
import WorldMap from './WorldMap'

export const revalidate = 300
export const metadata = { title: 'World Map' }

/** ISO3 codes that need normalization for topojson matching */
const ISO3_NORMALIZE: Record<string, string> = {
  'CHN-CCP': 'CHN',
}

export default async function MapPage() {
  const [actors, deltaMap] = await Promise.all([
    getAllPublicActors(),
    getLatestDeltaByActor(),
  ])

  const enriched = enrichActorsWithDeltas(actors, deltaMap)

  const stateActors = enriched.filter((a) => a.actorType === 'State' && a.iso3)
  const actorIds = stateActors.map((a) => a.id)

  const [relMap, eventsMap] = await Promise.all([
    getTopRelationshipsForActors(actorIds),
    getRecentEventsForActors(actorIds),
  ])

  const mapActors: MapActorFull[] = stateActors.map((a) => {
    const rels = relMap.get(a.id)
    const events = eventsMap.get(a.id) ?? []
    return {
      name: a.name,
      slug: a.slug,
      iso3: ISO3_NORMALIZE[a.iso3!] ?? a.iso3!,
      pfScore: a.pfScore,
      authorityScore: a.authorityScore,
      reachScore: a.reachScore,
      pfVector: a.pfVector,
      scoreTrend: a.scoreTrend,
      scoreReasoning: a.scoreReasoning,
      scoreDelta: a.scoreDelta,
      bestRelationship: rels?.best ?? null,
      worstRelationship: rels?.worst ?? null,
      recentEvents: events,
    }
  })

  return <WorldMap actors={mapActors} />
}
```

- [ ] **Step 2: Verify everything compiles**

```bash
cd /c/Users/adamr/github/powerflow-app && npx next build 2>&1 | tail -20
```

Expected: build succeeds with no type errors.

- [ ] **Step 3: Verify in browser**

```bash
cd /c/Users/adamr/github/powerflow-app && npm run dev
```

Navigate to `/map`. Verify:
- Globe renders with orthographic projection
- Drag to rotate works (click and drag spins the globe)
- Layer switcher changes country fills
- Hover tooltip shows on tracked countries
- Click a tracked country → side panel slides in from right with scores, reasoning, relationships, events, and "View full profile" link
- Click an untracked country → side panel shows country name + "Data Pending"
- Press Escape → panel closes
- Click another country while panel is open → content swaps
- On narrow viewport (< 640px), panel is full width

- [ ] **Step 4: Commit**

```bash
git add src/app/map/page.tsx
git commit -m "feat: expand map page data fetching with relationships and events"
```

---

### Task 10: Update WorldMap.tsx to import from geo-constants

**Files:**
- Modify: `src/app/map/WorldMap.tsx`

The WorldMap rewrite in Task 7 already imports from `geo-constants`. This task is a verification step — confirm the existing WorldMap.tsx (from Task 7) correctly uses the shared constants and doesn't duplicate them.

- [ ] **Step 1: Verify no duplicate constant definitions**

Check that `WorldMap.tsx` does NOT define its own `GEO_URL`, `BG`, or color constants — it should import them all from `@/lib/geo-constants`. The only constants that should remain local are `LOW`, `HIGH` (color ramp endpoints), `DRAG_SENSITIVITY`, `VECTOR_COLORS`, and `LAYERS`.

- [ ] **Step 2: Final integration test**

Run the dev server and test the complete flow:
1. Home page loads
2. `/actors/united-states` — globe renders in hero
3. `/actors/hamas` — no globe, delta only
4. `/map` — globe with drag, layers, tooltip, side panel
5. Click US on map → panel shows scores, relationships, events, "View full profile" link
6. Click the link → navigates to actor profile with globe in hero

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete ActorGlobe and WorldMap overhaul"
```
