# Actor Profile Hero Redesign — Geographic Visual Treatment

**Date:** 2026-03-17
**Status:** Approved

## Problem

The actor profile hero section renders a 140x140px orthographic globe in the top-right corner for State actors. The concept is right — geography orients the user and grounds the actor in physical space — but the current treatment is too small, too decorative, and doesn't carry enough visual weight. It reads as a badge, not as a signature product object. Non-state actors get no geographic visual at all.

## Design

Replace the small globe with a large geographic panel occupying ~62% of the hero width. The hero becomes an asymmetric split: actor metadata and scores on the left (~38%), a tightly cropped regional map on the right. The hero height increases to ~270px to accommodate integrated scores, giving the map panel significantly more vertical space.

### Layout: Asymmetric Split

The hero is a flex row with no gap. Left panel has `--surface` background. Right panel has `OCEAN_COLOR` (`#0e1220`) background — hardcoded, not a CSS variable, consistent with how all map colors are defined in `geo-constants.ts`. A soft gradient blends the boundary between the two panels (left edge of map fades into the metadata panel background). No hard border between zones.

```
┌─────────────────────────────────────────────────────────┐
│  ← Actor Leaderboard                                    │
│                                                         │
│  [State] [Middle East] IRN [Widening]    ┊  ░░░░░░░░░  │
│                                          ┊  ░░ MAP ░░░  │
│  Iran                                    ┊  ░░░░░░░░░  │
│  Middle East                             ┊  ░░░░░░░░░  │
│                                          ┊  ░░░░░░░░░  │
│  ─────────────────────────               ┊  ░░░░░░░░░  │
│  PF 62   Auth 68   Reach 57   Δ −3      ┊  ░░░░░░░░░  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Left panel contents (top to bottom):**
- Back link: "← Actor Leaderboard" (existing)
- Badge row: actor type badge (colored), region badge (muted border), ISO3 code (mono, muted), `pfVector` signal badge via existing `PFSignalBadge` component (if present)
- Actor name: 28px, weight 700, `--foreground`, -0.5px letter-spacing
- Subtitle: region for State actors, subType or actorType for Non-State/Hybrid, actorType for IGO. 12px, `--muted`.
- Divider: 1px `--border` with 16px top padding
- Score row: PF Score (`--accent`), Authority (`--score-authority`), Reach (`--score-reach`) — each `text-[26px]` (intentionally smaller than the current 30px standalone panel, since they share space with the actor name), weight 700, `tabular-nums`. Labels above each in `text-[10px]` `--muted`. Recent delta displayed after scores via existing `ScoreDelta` component (colored by direction).

**Right panel contents:**
- Full-height SVG map rendered by `ActorGlobe` component (renamed to `ActorGeoPanel`)
- Edge fades: four absolutely-positioned `<div>` overlays with CSS `linear-gradient` backgrounds, layered on top of the SVG map. Not SVG gradients — CSS overlays.
  - Left edge: 35px wide, gradient from `var(--surface)` to transparent (must use CSS variable for light mode compatibility)
  - Right edge: 25px wide, gradient from `#0e1220` to transparent
  - Top/bottom: 18px tall, gradients from `#0e1220` to transparent

### Projection: Natural Earth

Switch from `geoOrthographic` to `geoNaturalEarth1`. This gives a nearly flat projection with subtle curvature — the feel of a professional atlas or intelligence briefing map. Benefits over orthographic:

- Tight regional cropping without hemisphere-edge distortion
- Consistent rendering for polar vs. equatorial actors
- Edges fade naturally into the dark background (no hard circular globe boundary)

`react-simple-maps` supports `geoNaturalEarth1` natively via the `projection` prop on `ComposableMap`.

### Projection Configuration

Each actor's map is centered and scaled to show their regional context. Two data structures drive this:

**ISO3_CENTERS** (existing, currently in `ActorGlobe.tsx` — move to `geo-constants.ts` as part of this work): Maps ISO3 codes to `[longitude, latitude]` center coordinates. Already has 65+ entries. Used for State actors to center on their country. For Natural Earth projection, these coordinates are passed as the `center` prop on `projectionConfig`.

**REGION_CENTERS** (new, in `geo-constants.ts`): Maps region strings to `{ center: [lon, lat], scale: number }`. Used for:
- Non-state/Hybrid/IGO actors (center on their `region` field)
- Fallback for State actors missing from `ISO3_CENTERS`

```typescript
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
```

**Scale calculation for State actors:** The component uses a per-country scale override for countries whose geographic extent deviates significantly from the default. Default scale is 600 (suitable for medium-sized countries like Iran, Turkey, Egypt). The `COUNTRY_SCALES` lookup in `geo-constants.ts` overrides this for outliers:

```typescript
export const COUNTRY_SCALES: Record<string, number> = {
  // Large countries — zoom out to show full landmass
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
  // Small countries/territories — zoom in to subregion
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

Unlisted countries use the default scale of 600. These values will need visual tuning during implementation — the numbers above are starting points based on geographic extent.

### Actor Highlight Treatment: Gradient Fill + Border + Ambient Pulse

**State actors** — the actor's country is rendered with:
- **Fill:** SVG `<radialGradient>` with `gradientUnits="objectBoundingBox"` (auto-centers on the path's bounding box). Core at ~35% opacity SIGNAL_BLUE, fading to ~8% at edges. This will appear slightly stretched on geographically elongated countries (Chile, Norway) — acceptable, since the gradient is subtle and decorative.
- **Stroke:** 1.6px SIGNAL_BLUE border. Provides cartographic precision and clear boundary definition.
- **Ambient glow:** A separate SVG `<ellipse>` element rendered *behind* the country geography paths (lower z-order in SVG). Positioned at the country's `ISO3_CENTERS` coordinates (projected into SVG space via the same projection). Size: ~1.3x the country's rendered width/height. Animated with CSS `@keyframes` pulsing between 5–10% opacity over 5 seconds. The ellipse position is approximate — it does not need pixel-perfect alignment with the country boundary, just a soft glow in the right area.

**Non-state / Hybrid / IGO actors** — no country is highlighted:
- All countries render in uniform `LAND_UNTRACKED` (#141c2a) with `LAND_STROKE` (#1e2a3a) borders
- No gradient fill, no border emphasis, no ambient pulse
- The regional crop still provides geographic orientation

**All surrounding countries** (for both actor types):
- Fill: `LAND_UNTRACKED` (#141c2a)
- Stroke: `LAND_STROKE` (#1e2a3a), 0.6px
- No hover states, no interactivity

### Graticule

Subtle latitude/longitude grid lines rendered in the map panel:
- Color: `GRATICULE_STROKE` (#1a2235)
- Stroke width: 0.3px
- Vertical lines have very slight curvature (Natural Earth projection characteristic)
- Creates the atlas/briefing texture without competing with geography

`react-simple-maps` provides a `<Graticule>` component that renders these automatically for the active projection.

### Hero Height

The hero increases from ~140px (current) to ~270px. This is driven by integrating scores into the left panel and giving the map enough vertical space to read as a serious geographic element.

### Score Panel Consolidation

The current page has a separate score panel section below the hero (the `grid-cols-[280px_1fr]` layout with score card left and chart right). With scores moving into the hero:

- **Remove** the standalone score card column (PF Score, Authority, Reach, Depth, Capabilities)
- **Keep** the Score Trajectory chart as the first section below the hero, but render it full-width (remove the grid layout)
- Depth and Capabilities metadata move to the Key Drivers section footer (where patron/dependent links already live)

### Responsive Behavior

Use Tailwind responsive prefixes (matching existing codebase pattern):

- **`lg:` (≥1024px):** Full asymmetric split as described. Hero uses `flex-row`.
- **`md:` to `lg:` (768–1023px):** Map panel stacks above the metadata. Hero uses `flex-col`. Map height fixed at 180px via `h-[180px]`. Full-width. Metadata below with scores in a horizontal row.
- **Below `sm:` (<640px):** Same stacking, map height reduced to 140px via `h-[140px]`. Score values shrink to `text-[22px]`.

The `ActorGeoPanel` component itself is always `w-full h-full` — the parent layout controls sizing via Tailwind classes.

## Component Architecture

### Renamed component: `ActorGeoPanel.tsx`

Replace `ActorGlobe.tsx` with `ActorGeoPanel.tsx` in `src/components/geo/`. This is not a refactor of the existing component — it's a replacement with a different projection, layout role, and rendering approach.

**Props:**
```typescript
interface ActorGeoPanelProps {
  isoCode: string | null    // ISO3 for State actors, null for others
  region: string | null      // Always present — used for centering non-state actors
  actorType: ActorType       // Determines highlight behavior
}
```

No `size` prop — the component fills its container (`width: 100%`, `height: 100%`).

**Fallback behavior:**
- If `actorType` is `"State"` and `isoCode` exists in `ISO3_CENTERS`: center on country, highlight it
- If `actorType` is `"State"` but `isoCode` is missing/unknown: fall back to `REGION_CENTERS` using `region`, no country highlight
- If `actorType` is non-State: use `REGION_CENTERS` with `region`, no highlight
- If `region` is null or not in `REGION_CENTERS`: render a world-level view (center `[0, 20]`, scale `150`) — safe fallback, never renders nothing

**Accessibility:** The SVG element should have `aria-hidden="true"` and `role="presentation"` — the map is decorative/orientational, not interactive or informational. Screen readers should skip it entirely.

### Updated wrapper: `ActorGeoPanelWrapper.tsx`

Same pattern as current — `next/dynamic` with `ssr: false`. Loading placeholder becomes a full-height div with `background: #0e1220` (hardcoded to match `OCEAN_COLOR`, no visible pop-in).

### Keyframe animation

Define the glow pulse animation in the component file using a `<style>` tag inside the SVG or via CSS-in-JS:

```css
@keyframes geo-glow {
  0%, 100% { opacity: 0.05; }
  50% { opacity: 0.10; }
}
```

Applied to the ambient glow `<ellipse>` element only. No animation on the country fill or border.

### Page changes: `[slug]/page.tsx`

1. Replace `ActorGlobe` import with `ActorGeoPanel` wrapper
2. Restructure the hero `<div>` to the asymmetric flex layout
3. Move score display (PF, Authority, Reach) from the grid section into the hero left panel
4. Remove the score card column from the `grid-cols-[280px_1fr]` layout
5. Render the Score Trajectory chart full-width (single column)
6. Move Depth/Capabilities metadata to Key Drivers section
7. Delete `ActorGlobe.tsx` and `ActorGlobeWrapper.tsx` — fully replaced by `ActorGeoPanel.tsx` and `ActorGeoPanelWrapper.tsx`

### New constants: `geo-constants.ts`

Add:
- `ISO3_CENTERS` — moved from `ActorGlobe.tsx`
- `REGION_CENTERS` — region string → center/scale mapping
- `COUNTRY_SCALES` — ISO3 → scale overrides for large/small countries
- Default scale constant: `export const DEFAULT_GEO_SCALE = 600`

### Light mode consideration

The geographic panel uses hardcoded dark colors (`OCEAN_COLOR`, `LAND_STROKE`, etc.) which work in both dark and light mode because the panel is self-contained with its own background. The left-edge gradient must reference the theme's `--surface` variable (not a hardcoded hex) so it blends correctly in both themes. All other map colors remain fixed.

## Data Model Changes

None. All required data (`iso3`, `region`, `actorType`, scores) already exists on the `Actor` interface.

## What's NOT Changing

- Score Trajectory chart (stays as first section after hero, just becomes full-width)
- Key Drivers section
- Assessment section
- Relationships table
- Recent Events section
- ISR revalidation (300s)
- TopoJSON data source (CDN)
- `react-simple-maps` dependency
- No new API calls or data fetching

## What IS Changing

- Hero layout: simple flex row → asymmetric split (38/62)
- Hero height: ~140px → ~270px
- Geographic visual: 140x140 orthographic globe → full-height Natural Earth regional map
- Projection: `geoOrthographic` → `geoNaturalEarth1`
- Actor highlight: solid fill → gradient fill + border emphasis + ambient glow pulse
- Non-state actors: no visual → region crop (no highlight)
- Score display: separate panel below hero → integrated into hero left panel
- Score chart layout: `grid-cols-[280px_1fr]` → full-width single column
- Component: `ActorGlobe.tsx` → `ActorGeoPanel.tsx` (replacement, not refactor)

## Mockup Reference

Visual mockups: `.superpowers/brainstorm/746-1773804035/full-design.html`
