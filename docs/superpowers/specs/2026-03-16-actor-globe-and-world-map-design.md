# Actor Globe & World Map Overhaul

**Date:** 2026-03-16
**Status:** Approved

## Overview

Two related pieces of work:

1. **ActorGlobe** — a small orthographic globe used as a geographic "profile pic" for state actors on `/actors/[slug]`
2. **WorldMap overhaul** — replace the flat Mercator choropleth on `/map` with an interactive orthographic globe featuring drag-to-rotate, click-to-select side panel, and improved visual treatment

Both use `react-simple-maps` (already installed) with orthographic projection and share visual constants (ocean color, stroke color, signal blue).

---

## 1. ActorGlobe Component

### File
`src/components/geo/ActorGlobe.tsx`

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isoCode` | `string` | required | Actor's ISO3 country code |
| `size` | `number` | `280` | Diameter in pixels |

### Behavior
- "use client" component (react-simple-maps requires DOM)
- `ComposableMap` with orthographic projection
- Projection centered on the actor's country using a static `ISO3_CENTERS` lookup object mapping ISO3 codes to `[longitude, latitude]` center coordinates
- Rotation computed as `[-longitude, -latitude, 0]`
- Circular SVG `<clipPath>` so the globe renders as a sphere

### Visual
| Element | Style |
|---------|-------|
| Actor country | `fill: #38bdf8` (signal blue) |
| Other countries | `fill: none`, `stroke: #1e2a3a` |
| Ocean/background | `fill: #0e1220` (circle behind map) |
| Labels/graticule | None |
| Interaction | None |

### ISO3 Centers Lookup
A static object covering all state actors in the registry (~41 entries). Example:
```ts
const ISO3_CENTERS: Record<string, [number, number]> = {
  USA: [-98.5, 39.8],
  CHN: [104.2, 35.9],
  RUS: [105.3, 61.5],
  // ... all state actors
}
```

### Topojson Matching
Uses the existing `ISO_NUMERIC_TO_ALPHA3` mapping from `src/lib/iso-numeric.ts` to match world-atlas 110m feature IDs (numeric strings) to the actor's `isoCode` prop.

---

## 2. ActorGlobe Integration in Profile Page

### File
`src/app/actors/[slug]/page.tsx`

### Hero Layout Change
Current hero (lines 138-168):
```
[actor info]  ...  [score delta]
```

New hero for State actors with `iso3`:
```
[actor info]  ...  [ActorGlobe + score delta stacked below]
```

Non-state actors and State actors without `iso3` retain the current layout (delta only).

### Import
`ActorGlobe` imported via `next/dynamic` with `ssr: false` since react-simple-maps needs the DOM.

### Size
Globe renders at `size={140}` in the hero — appropriate for a profile pic without overwhelming the text.

---

## 3. WorldMap Overhaul

### File
`src/app/map/WorldMap.tsx` (rewrite in place)

### Projection & Interaction
- **Orthographic projection** replacing default Mercator — true globe
- **Drag-to-rotate** via pointer events (`pointerdown`/`pointermove`/`pointerup`) on the SVG container, updating projection `rotation` state
- Scale set larger than a tight sphere so ~60% of the globe is visible — "flatter than Google Earth but still a globe" feel
- Drag smoothed via `requestAnimationFrame` throttling to keep 200+ SVG paths responsive
- Initial rotation centered on `[0, -20, 0]` (Atlantic-centered, slight tilt)

### Visual Treatment
| Element | Style |
|---------|-------|
| Ocean | `#0e1220` background circle |
| Tracked countries | Filled by active layer (PF/Authority/Reach/Vector) — same color ramp as current |
| Untracked countries | `fill: #141c2a`, `stroke: #1e2a3a` — visible land, muted |
| Graticule | Import `Graticule` from `react-simple-maps`, render with `stroke: #1a2235`, `strokeWidth: 0.3` — subtle geographic orientation |

### Drag-to-Rotate Details
- Sensitivity: ~0.5 degrees of rotation per pixel of drag (tunable constant)
- No inertial spin on release — globe stops immediately when pointer lifts
- No rotation bounds — user can freely rotate to any orientation
- Touch support: same pointer events work for single-finger drag on mobile

### Layer Switcher
Preserved from current implementation. Same floating glass-panel aesthetic (`rgba(10,14,26,0.82)` + `backdrop-filter: blur(12px)`). Layers: PF Score, Authority, Reach, PF Vector.

### Legend
Preserved from current implementation. Gradient bar for score layers, color swatches for Vector layer.

### Hover Tooltip
Preserved — follows cursor, shows actor name + active layer value + vector + trend. Only appears for tracked countries.

### Click Side Panel
Replaces the current click-to-navigate behavior. Panel slides in from the right.

**Panel specs:**
- Width: ~320px on desktop; on viewports < 640px, panel overlays the globe at full width
- Same dark glass style as layer switcher
- Close button (x) in top-right corner
- Clicking another country swaps panel content
- Clicking outside or pressing Escape closes the panel

**Tracked actor panel contents (top to bottom):**
1. Actor name (bold) + actor type badge + PF Vector badge
2. Score block: PF Score / Authority / Reach as big numbers with labels
3. Score delta + trend arrow
4. Score reasoning — truncated to ~3 lines with text ellipsis
5. Best relationship — highest alignment score: counterparty name + alignment value (green)
6. Worst relationship — lowest alignment score: counterparty name + alignment value (red)
7. Recent events — up to 2 entries, each showing date + event title (truncated)
8. "View full profile ->" link to `/actors/[slug]`

**Untracked country panel:**
1. Country name — resolved via a static `ISO_NUMERIC_TO_NAME` lookup (the world-atlas 110m topojson does NOT include `properties.name`, only numeric IDs). This lookup is added to `src/lib/iso-numeric.ts` alongside the existing `ISO_NUMERIC_TO_ALPHA3` map.
2. "Data Pending" label in muted text
3. "This actor is not yet tracked in the PowerFlow registry." in smaller muted text

**Empty state handling in tracked actor panel:**
- If the actor has no relationships, the relationship rows are hidden (not shown with placeholders)
- If the actor has no recent events, the events section is hidden entirely
- Score reasoning: hidden if null

---

## 4. Data Requirements

### Relocate & Expand MapActor Type

`MapActor` is currently defined in `src/app/map/WorldMap.tsx`. As part of this work, **move it to `src/lib/types.ts`** so both `WorldMap.tsx` and `page.tsx` import from a shared location. Then extend it:

```ts
// Moved from WorldMap.tsx to types.ts
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

// Extended for the new side panel data
export interface MapActorFull extends MapActor {
  scoreReasoning: string | null
  scoreDelta: number | null    // already on enriched Actor, just thread through
  bestRelationship: { name: string; alignment: number } | null
  worstRelationship: { name: string; alignment: number } | null
  recentEvents: { date: string; name: string }[]  // capped to 2 by the fetch function
}
```

Note: `actorType` is omitted — the map page already filters to State actors only, so the type badge in the side panel always shows "State".

### New Batch Fetch Functions

**`getTopRelationshipsForActors(actorIds: string[])`**
- Location: `src/lib/relationships.ts`
- Single query to Actor Relationships DB
- Groups by actor, picks highest and lowest alignment per actor
- Returns: `Map<string, { best: { name, alignment } | null, worst: { name, alignment } | null }>`

**`getRecentEventsForActors(actorIds: string[], limit?: number)`**
- Location: `src/lib/events.ts`
- Single query to Events DB filtered to the given actor IDs
- Groups by actor, takes top 2 most recent per actor
- Returns: `Map<string, { date: string, name: string }[]>`

**Notion API pagination note:** Both queries use compound OR filters (one clause per actor, ~41 actors). This is within Notion's filter limits. However, results may exceed the 100-item default page size — both functions must handle `has_more` / `next_cursor` pagination to ensure complete results. The fetch function caps events at 2 per actor after grouping.

### Map Page Data Fetching
`src/app/map/page.tsx` expands its `Promise.all` to include the two new batch fetches, then merges the results into each `MapActorFull` object before passing to the client `WorldMap` component.

---

## 5. File Change Summary

| File | Change |
|------|--------|
| `src/components/geo/ActorGlobe.tsx` | **New** — static orthographic globe component |
| `src/app/actors/[slug]/page.tsx` | Import globe, render in hero for State actors |
| `src/app/map/WorldMap.tsx` | **Rewrite** — orthographic, drag-to-rotate, side panel |
| `src/app/map/page.tsx` | Expanded data fetching for relationships + events |
| `src/lib/types.ts` | Add `MapActorFull` type |
| `src/lib/relationships.ts` | Add `getTopRelationshipsForActors()` batch function |
| `src/lib/events.ts` | Add `getRecentEventsForActors()` batch function |
| `src/lib/geo-constants.ts` | **New** — shared visual constants for globe components |
| `src/lib/iso-numeric.ts` | Add `ISO_NUMERIC_TO_NAME` lookup for country names |

---

## 6. Shared Constants

Both `ActorGlobe` and `WorldMap` share visual constants. Extract to `src/lib/geo-constants.ts`:

```ts
export const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'
export const OCEAN_COLOR = '#0e1220'
export const LAND_STROKE = '#1e2a3a'
export const LAND_UNTRACKED = '#141c2a'
export const SIGNAL_BLUE = '#38bdf8'
export const GRATICULE_STROKE = '#1a2235'
```

---

## 7. Technical Notes

- **No new dependencies.** `react-simple-maps` (installed) wraps D3 geo internals. Drag rotation uses native pointer events, not d3-drag.
- **Performance.** Orthographic projection hides back-hemisphere geometries, so fewer SVG paths render at any given rotation than the current flat Mercator. `memo` on the Geography layer (already in place) prevents re-renders on tooltip/panel state changes.
- **SSR.** Both `ActorGlobe` and `WorldMap` are "use client" components. `ActorGlobe` imported via `next/dynamic({ ssr: false })` in the profile page. `WorldMap` is already client-only (imported from a server page component).
- **Country names for untracked panel.** The world-atlas 110m topojson does NOT include `properties.name` — only numeric IDs. A static `ISO_NUMERIC_TO_NAME` lookup is added to `src/lib/iso-numeric.ts` to resolve numeric feature IDs to human-readable country names.
