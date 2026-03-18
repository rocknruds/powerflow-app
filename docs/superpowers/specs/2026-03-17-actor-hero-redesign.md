# Actor Profile Hero Redesign — Geographic Visual Treatment

**Date:** 2026-03-17
**Status:** Approved

## Problem

The actor profile hero section renders a 140x140px orthographic globe in the top-right corner for State actors. The concept is right — geography orients the user and grounds the actor in physical space — but the current treatment is too small, too decorative, and doesn't carry enough visual weight. It reads as a badge, not as a signature product object. Non-state actors get no geographic visual at all.

## Design

Replace the small globe with a large geographic panel occupying ~62% of the hero width. The hero becomes an asymmetric split: actor metadata and scores on the left (~38%), a tightly cropped regional map on the right. The hero height increases to ~270px to accommodate integrated scores, giving the map panel significantly more vertical space.

### Layout: Asymmetric Split

The hero is a flex row with no gap. Left panel has `--surface` background. Right panel has `--ocean` (#0e1220) background. A soft gradient blends the boundary between the two panels (left edge of map fades into the metadata panel background). No hard border between zones.

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
- Badge row: actor type badge (colored), region badge (muted border), ISO3 code (mono, muted), PF signal badge (if present)
- Actor name: 28px, weight 700, `--foreground`, -0.5px letter-spacing
- Subtitle: region for State actors, subType or actorType for Non-State/Hybrid, actorType for IGO. 12px, `--muted`.
- Divider: 1px `--border` with 16px top padding
- Score row: PF Score (`--accent`), Authority (`--score-authority`), Reach (`--score-reach`) — each 26px, weight 700, tabular-nums. Labels above each in 10px `--muted`. Recent delta displayed after scores (colored by direction).

**Right panel contents:**
- Full-height SVG map rendered by `ActorGlobe` component (renamed to `ActorGeoPanel`)
- Edge fades: gradient overlays on all four edges blending into surrounding colors
  - Left edge: 35px gradient from `--surface` to transparent
  - Right edge: 25px gradient from `--ocean` to transparent
  - Top/bottom: 18px gradients from `--ocean` to transparent

### Projection: Natural Earth

Switch from `geoOrthographic` to `geoNaturalEarth1`. This gives a nearly flat projection with subtle curvature — the feel of a professional atlas or intelligence briefing map. Benefits over orthographic:

- Tight regional cropping without hemisphere-edge distortion
- Consistent rendering for polar vs. equatorial actors
- Edges fade naturally into the dark background (no hard circular globe boundary)

`react-simple-maps` supports `geoNaturalEarth1` natively via the `projection` prop on `ComposableMap`.

### Projection Configuration

Each actor's map is centered and scaled to show their regional context. Two data structures drive this:

**ISO3_CENTERS** (existing, in `ActorGlobe.tsx`): Maps ISO3 codes to `[longitude, latitude]` center coordinates. Already has 65+ entries. Used for State actors to center on their country.

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
}
```

**Scale calculation for State actors:** The component uses a per-country scale based on the country's geographic extent. Large countries (Russia, USA, China, Brazil) use a lower scale to show the full landmass. Small countries (Israel, Lebanon, Qatar) use a higher scale zoomed into the subregion. This is derived from a `COUNTRY_SCALES` lookup in `geo-constants.ts` with a sensible default (~600) for unlisted countries.

### Actor Highlight Treatment: Gradient Fill + Border + Ambient Pulse

**State actors** — the actor's country is rendered with:
- **Fill:** Radial gradient centered on the country. Core at ~35% opacity SIGNAL_BLUE, fading to ~8% at edges. Gives the country depth and visual weight without being flat or loud.
- **Stroke:** 1.6px SIGNAL_BLUE border. Provides cartographic precision and clear boundary definition.
- **Ambient glow:** A radial ellipse behind the country with a CSS keyframe animation pulsing between 5–10% opacity over 5 seconds. Reinforces the "living model" product identity. Implemented as a separate SVG `<ellipse>` element behind the country paths, animated with `@keyframes`.

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

- **≥1024px (lg):** Full asymmetric split as described
- **<1024px (md):** Map panel stacks above the metadata. Map height fixed at 180px. Full-width. Metadata below with scores in a horizontal row.
- **<640px (sm):** Same stacking, map height reduced to 140px. Score values shrink to 22px.

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

### Updated wrapper: `ActorGeoPanelWrapper.tsx`

Same pattern as current — `next/dynamic` with `ssr: false`. Loading placeholder becomes a full-height div with `--ocean` background (no visible pop-in).

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

### New constants: `geo-constants.ts`

Add:
- `REGION_CENTERS` — region string → center/scale mapping
- `COUNTRY_SCALES` — ISO3 → scale overrides for large/small countries
- `OCEAN_BG` alias for `OCEAN_COLOR` if naming clarity helps

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
