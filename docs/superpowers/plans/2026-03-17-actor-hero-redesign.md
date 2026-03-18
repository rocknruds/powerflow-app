# Actor Profile Hero Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the small 140px orthographic globe with a large asymmetric-split hero featuring a Natural Earth map panel, integrated scores, and gradient highlight with ambient glow pulse.

**Architecture:** The hero becomes a flex row: 38% metadata+scores left panel, 62% map right panel. The `ActorGlobe` component is replaced entirely by `ActorGeoPanel` using `geoNaturalEarth1` projection. Scores consolidate from a separate section into the hero. The score chart becomes full-width below.

**Tech Stack:** Next.js 16 (React 19), react-simple-maps v3 (geoNaturalEarth1, Graticule, Geographies), Tailwind CSS v4, CSS variables from globals.css

**Spec:** `docs/superpowers/specs/2026-03-17-actor-hero-redesign.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/geo-constants.ts` | Modify | Add ISO3_CENTERS, REGION_CENTERS, COUNTRY_SCALES, DEFAULT_GEO_SCALE |
| `src/components/geo/ActorGeoPanel.tsx` | Create | New Natural Earth map component with gradient fill + glow pulse |
| `src/components/geo/ActorGeoPanelWrapper.tsx` | Create | SSR-safe dynamic import wrapper |
| `src/app/actors/[slug]/page.tsx` | Modify | Restructure hero, integrate scores, full-width chart, move depth/caps |
| `src/components/geo/ActorGlobe.tsx` | Delete | Replaced by ActorGeoPanel |
| `src/components/geo/ActorGlobeWrapper.tsx` | Delete | Replaced by ActorGeoPanelWrapper |

---

### Task 1: Add geo constants

**Files:**
- Modify: `src/lib/geo-constants.ts` (append after line 21)
- Reference: `src/components/geo/ActorGlobe.tsx:11-66` (copy ISO3_CENTERS from here)

- [ ] **Step 1: Add ISO3_CENTERS to geo-constants.ts**

Copy the `ISO3_CENTERS` record from `ActorGlobe.tsx` (lines 11-66) and add it as a named export at the bottom of `geo-constants.ts`:

```typescript
/**
 * Approximate center coordinates [longitude, latitude] for state actors.
 * Used to center the Natural Earth projection on the actor's country.
 */
export const ISO3_CENTERS: Record<string, [number, number]> = {
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
```

- [ ] **Step 2: Add REGION_CENTERS, COUNTRY_SCALES, DEFAULT_GEO_SCALE**

Append directly after `ISO3_CENTERS` in the same file:

```typescript
export const DEFAULT_GEO_SCALE = 600

export const REGION_CENTERS: Record<string, { center: [number, number]; scale: number }> = {
  'Middle East': { center: [45, 28], scale: 600 },
  'East Asia': { center: [115, 35], scale: 450 },
  'South Asia': { center: [78, 24], scale: 500 },
  'Europe': { center: [15, 50], scale: 400 },
  'Sub-Saharan Africa': { center: [20, 0], scale: 350 },
  'North Africa': { center: [15, 28], scale: 450 },
  'Central Asia': { center: [65, 42], scale: 500 },
  'Southeast Asia': { center: [115, 5], scale: 400 },
  'Latin America': { center: [-65, -15], scale: 300 },
  'North America': { center: [-100, 45], scale: 350 },
  'Oceania': { center: [140, -25], scale: 400 },
  'East Africa': { center: [38, 2], scale: 500 },
  'West Africa': { center: [-5, 10], scale: 500 },
  'Eastern Europe': { center: [30, 50], scale: 400 },
  'Caucasus': { center: [44, 42], scale: 800 },
  'Horn of Africa': { center: [42, 6], scale: 600 },
  'Caribbean': { center: [-72, 18], scale: 600 },
}

export const COUNTRY_SCALES: Record<string, number> = {
  // Large countries — zoom out
  RUS: 250,
  USA: 350,
  CAN: 300,
  CHN: 350,
  BRA: 300,
  AUS: 350,
  IND: 400,
  ARG: 350,
  KAZ: 400,
  IDN: 350,
  // Small countries — zoom in
  ISR: 1200,
  PSE: 1200,
  LBN: 1200,
  QAT: 1400,
  BHR: 1400,
  ARE: 900,
  KWT: 1200,
  TWN: 1000,
  XKX: 1200,
}
```

- [ ] **Step 3: Verify build**

Run: `cd c:/Users/adamr/github/powerflow-app && npx next build 2>&1 | tail -20`
Expected: Build succeeds. New exports don't break anything — they're purely additive.

- [ ] **Step 4: Commit**

```bash
git add src/lib/geo-constants.ts
git commit -m "feat: add geo constants for actor hero redesign (ISO3_CENTERS, REGION_CENTERS, COUNTRY_SCALES)"
```

---

### Task 2: Create ActorGeoPanel component

**Files:**
- Create: `src/components/geo/ActorGeoPanel.tsx`
- Reference: `src/lib/geo-constants.ts` (constants), `src/lib/iso-numeric.ts` (ISO_NUMERIC_TO_ALPHA3), `src/types/react-simple-maps.d.ts` (type defs)

- [ ] **Step 1: Create ActorGeoPanel.tsx**

Create `src/components/geo/ActorGeoPanel.tsx` with the full component:

```tsx
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
```

- [ ] **Step 2: Verify build**

Run: `cd c:/Users/adamr/github/powerflow-app && npx next build 2>&1 | tail -20`
Expected: Build succeeds. Component isn't imported yet so no rendering, but TypeScript and imports must compile.

- [ ] **Step 3: Commit**

```bash
git add src/components/geo/ActorGeoPanel.tsx
git commit -m "feat: create ActorGeoPanel with Natural Earth projection and glow pulse"
```

---

### Task 3: Create ActorGeoPanelWrapper

**Files:**
- Create: `src/components/geo/ActorGeoPanelWrapper.tsx`
- Reference: `src/components/geo/ActorGlobeWrapper.tsx` (pattern to follow)

- [ ] **Step 1: Create ActorGeoPanelWrapper.tsx**

Create `src/components/geo/ActorGeoPanelWrapper.tsx`:

```tsx
'use client'

import dynamic from 'next/dynamic'
import type { ActorType } from '@/lib/types'

const ActorGeoPanel = dynamic(() => import('./ActorGeoPanel'), {
  ssr: false,
  loading: () => <div style={{ width: '100%', height: '100%', background: '#0e1220' }} />,
})

export default function ActorGeoPanelWrapper({
  isoCode,
  region,
  actorType,
}: {
  isoCode: string | null
  region: string | null
  actorType: ActorType
}) {
  return <ActorGeoPanel isoCode={isoCode} region={region} actorType={actorType} />
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/geo/ActorGeoPanelWrapper.tsx
git commit -m "feat: add SSR-safe wrapper for ActorGeoPanel"
```

---

### Task 4: Restructure hero section in page.tsx

**Files:**
- Modify: `src/app/actors/[slug]/page.tsx:1-179` (imports + hero block)

This is the main layout change. Replace the import, then rewrite the hero from line 136 to line 179.

- [ ] **Step 1: Update the import**

In `src/app/actors/[slug]/page.tsx`, change line 19:

From:
```typescript
import ActorGlobe from "@/components/geo/ActorGlobeWrapper";
```

To:
```typescript
import ActorGeoPanel from "@/components/geo/ActorGeoPanelWrapper";
```

- [ ] **Step 2: Replace the hero section**

Replace lines 136-179 (the entire `{/* Page header */}` div) with the new asymmetric split hero:

```tsx
      {/* Page header — asymmetric split hero */}
      <div style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="pt-6 pb-2">
            <Link href="/actors" className="text-xs transition-colors inline-flex items-center gap-1" style={{ color: "var(--muted)" }}>
              ← Actor Leaderboard
            </Link>
          </div>
        </div>
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row" style={{ minHeight: 270 }}>
          {/* Left panel: metadata + scores (order-last on mobile so map stacks above) */}
          <div className="order-last lg:order-first lg:w-[38%] px-6 py-6 flex flex-col justify-center" style={{ backgroundColor: "var(--surface)" }}>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {actor.actorType && (
                <span
                  className="text-xs font-semibold px-2.5 py-0.5 rounded"
                  style={{
                    color: actorTypeBadgeColor(actor.actorType),
                    border: `1px solid color-mix(in srgb, ${actorTypeBadgeColor(actor.actorType)} 40%, transparent)`,
                    backgroundColor: `color-mix(in srgb, ${actorTypeBadgeColor(actor.actorType)} 12%, transparent)`,
                  }}
                >
                  {actor.actorType}
                </span>
              )}
              {actor.region && <MetaBadge>{actor.region}</MetaBadge>}
              {actor.iso3 && <span className="text-xs font-mono" style={{ color: "var(--muted)" }}>{actor.iso3}</span>}
              {actor.pfVector && <PFSignalBadge signal={actor.pfVector} />}
            </div>
            <h1 className="text-[28px] font-bold" style={{ color: "var(--foreground)", letterSpacing: "-0.5px" }}>{actor.name}</h1>
            {subtitle && (
              <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>{subtitle}</p>
            )}
            <div className="flex items-end gap-5 pt-4 mt-4" style={{ borderTop: "1px solid var(--border)" }}>
              <div>
                <p className="text-[10px] mb-1" style={{ color: "var(--muted)" }}>PF Score</p>
                <p className="text-[22px] sm:text-[26px] font-bold tabular-nums" style={{ color: scoreColor }}>{pf ?? "—"}</p>
              </div>
              <div>
                <p className="text-[10px] mb-1" style={{ color: "var(--muted)" }}>Authority</p>
                <p className="text-[22px] sm:text-[26px] font-bold tabular-nums" style={{ color: "var(--score-authority)" }}>{actor.authorityScore ?? "—"}</p>
              </div>
              <div>
                <p className="text-[10px] mb-1" style={{ color: "var(--muted)" }}>Reach</p>
                <p className="text-[22px] sm:text-[26px] font-bold tabular-nums" style={{ color: "var(--score-reach)" }}>{actor.reachScore ?? "—"}</p>
              </div>
              {latestDelta !== null && (
                <div className="flex flex-col items-start pb-0.5">
                  <ScoreDelta delta={latestDelta} className="text-sm" />
                  <span className="text-[9px] mt-0.5" style={{ color: "var(--muted)" }}>recent Δ</span>
                </div>
              )}
            </div>
          </div>
          {/* Right panel: geographic map (order-first on mobile so it stacks above metadata) */}
          <div className="order-first lg:order-last lg:flex-1 h-[140px] sm:h-[180px] lg:h-auto">
            <ActorGeoPanel isoCode={actor.iso3} region={actor.region} actorType={actor.actorType} />
          </div>
        </div>
      </div>
```

- [ ] **Step 3: Verify build**

Run: `cd c:/Users/adamr/github/powerflow-app && npx next build 2>&1 | tail -20`
Expected: Build succeeds. The hero now renders with the new layout.

- [ ] **Step 4: Commit**

```bash
git add src/app/actors/[slug]/page.tsx
git commit -m "feat: restructure hero with asymmetric split layout and integrated scores"
```

---

### Task 5: Score chart full-width + move depth/capabilities

**Files:**
- Modify: `src/app/actors/[slug]/page.tsx:184-263` (score panel grid + key drivers section)

- [ ] **Step 1: Replace the score panel grid with full-width chart**

Replace lines 184-213 (the entire `{/* SECTION 1: Score panel + chart */}` grid) with a full-width chart only:

```tsx
        {/* SECTION 1: Score Trajectory (full width) */}
        <div className="rounded-xl p-6" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
          <SectionLabel>Score Trajectory</SectionLabel>
          <ScoreChart snapshots={history} />
        </div>
```

This removes the `ScoreCell` score card column entirely. Scores are now in the hero.

- [ ] **Step 2: Add depth/capabilities to Key Drivers section**

In the Key Drivers section (currently lines 215-263 after step 1 changes), add depth and capabilities metadata after the patron/dependent links. Inside the `{actor.scoreReasoning && (...)}` block, after the existing patron/dependent `<div>` (before the closing `</div>` of the rounded-xl container), add:

```tsx
            {(actor.proxyDepth || actor.capabilities.length > 0) && (
              <div className="mt-4 pt-4 space-y-2" style={{ borderTop: "1px solid var(--border)" }}>
                {actor.proxyDepth && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>Depth:</span>
                    <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{actor.proxyDepth}</span>
                  </div>
                )}
                {actor.capabilities.length > 0 && (
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>Capabilities:</span>
                    {actor.capabilities.slice(0, 4).map((cap) => (
                      <span key={cap} className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--surface-raised)", color: "var(--muted)" }}>
                        {cap}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
```

Note: if `scoreReasoning` is null, the entire Key Drivers section doesn't render — and depth/capabilities won't show either. This matches the existing behavior where they were coupled to the score panel. If an actor has capabilities but no scoreReasoning, they won't display — this is an acceptable edge case since nearly all scored actors have reasoning.

- [ ] **Step 3: Remove the now-unused ScoreCell component**

Delete the `ScoreCell` function (lines 70-78 in the original file). It's no longer used anywhere — scores are now rendered inline in the hero.

- [ ] **Step 4: Verify build**

Run: `cd c:/Users/adamr/github/powerflow-app && npx next build 2>&1 | tail -20`
Expected: Build succeeds. No unused import warnings.

- [ ] **Step 5: Commit**

```bash
git add src/app/actors/[slug]/page.tsx
git commit -m "feat: full-width score chart, move depth/capabilities to key drivers"
```

---

### Task 6: Delete old globe components

**Files:**
- Delete: `src/components/geo/ActorGlobe.tsx`
- Delete: `src/components/geo/ActorGlobeWrapper.tsx`

- [ ] **Step 1: Verify no other imports of ActorGlobe exist**

Run: `grep -r "ActorGlobe" src/ --include="*.tsx" --include="*.ts"` in the powerflow-app directory.
Expected: No results (the page.tsx import was already changed in Task 4).

- [ ] **Step 2: Delete old files**

```bash
cd c:/Users/adamr/github/powerflow-app
rm src/components/geo/ActorGlobe.tsx src/components/geo/ActorGlobeWrapper.tsx
```

- [ ] **Step 3: Verify build**

Run: `cd c:/Users/adamr/github/powerflow-app && npx next build 2>&1 | tail -20`
Expected: Build succeeds. No broken imports.

- [ ] **Step 4: Commit**

```bash
git add -u src/components/geo/ActorGlobe.tsx src/components/geo/ActorGlobeWrapper.tsx
git commit -m "chore: delete ActorGlobe and ActorGlobeWrapper (replaced by ActorGeoPanel)"
```

---

### Task 7: Visual verification and tuning

**Files:**
- Potentially modify: `src/lib/geo-constants.ts` (scale tuning), `src/components/geo/ActorGeoPanel.tsx` (glow ellipse sizing)

- [ ] **Step 1: Start dev server and verify visually**

Run: `cd c:/Users/adamr/github/powerflow-app && npx next dev`

Open the following actor profiles in the browser and verify:
1. **State actor (large country):** `/actors/united-states` or `/actors/russia` — map should show zoomed-out view
2. **State actor (medium country):** `/actors/iran` or `/actors/turkey` — map should show tight regional crop with highlighted country
3. **State actor (small country):** `/actors/israel` or `/actors/qatar` — map should zoom into subregion
4. **Non-State actor:** `/actors/hezbollah` or `/actors/houthis` — map should show region crop, no country highlighted
5. **Responsive:** Resize browser below 1024px — map should stack above metadata. Below 640px — map should shrink to 140px height.

Check for:
- Country highlight gradient fill visible and readable
- Glow pulse animation running (subtle, 5s cycle)
- Edge fades blending smoothly with surrounding UI
- Score values rendering correctly in hero
- Back link "← Actor Leaderboard" accessible
- No layout overflow or horizontal scroll

- [ ] **Step 2: Tune scales if needed**

If any country appears too zoomed in or out, adjust `COUNTRY_SCALES` values in `geo-constants.ts`. If any region crop is poorly centered, adjust `REGION_CENTERS` coordinates.

- [ ] **Step 3: Commit any tuning changes**

```bash
git add src/lib/geo-constants.ts src/components/geo/ActorGeoPanel.tsx
git commit -m "fix: tune geo scales and glow positioning after visual review"
```

(Skip this commit if no tuning was needed.)

---

### Task 8: Final build verification

- [ ] **Step 1: Clean build**

Run: `cd c:/Users/adamr/github/powerflow-app && rm -rf .next && npx next build 2>&1 | tail -30`
Expected: Build succeeds with no errors or warnings related to changed files.

- [ ] **Step 2: Verify no dead code**

Run the following in the powerflow-app directory:
- `grep -r "ActorGlobe" src/` — Expected: no results
- `grep -r "ScoreCell" src/` — Expected: no results
- `grep -r "geoOrthographic" src/` — Expected: no results

- [ ] **Step 3: Final commit if needed**

If any cleanup was required, commit it:
```bash
git commit -m "chore: clean up dead references from hero redesign"
```
