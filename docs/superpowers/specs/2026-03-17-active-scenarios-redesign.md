# Active Scenarios Redesign — Situation Cards

**Date:** 2026-03-17
**Status:** Approved
**Approach:** B — Vertical Situation Cards (v2 refinement)

## Problem

The current Active Scenarios section on the homepage renders scenarios as flat horizontal rows with minimal visual structure — a probability box, title, scenario class label, and a single-line trigger condition. This makes scenarios feel like text blurbs rather than tracked geopolitical risk objects. The layout lacks hierarchy, underuses available Notion data, and doesn't match the analytical tone of the rest of the platform.

## Design

Each scenario becomes a vertical situation card displayed in a 3-column grid. Cards have four distinct zones that create a clear top-to-bottom scan path.

### Card Structure

**Zone 1 — Status Bar (top)**
A compact header row with a raised background (`--surface-raised`) and bottom border separating it from the body. Contains two elements at opposite ends:
- **Scenario Class badge** (left): uppercase label (e.g., "ESCALATION", "POWER TRANSITION") with color derived from class type. Escalation = red tones (`--delta-down`), Power Transition / External Shock = amber tones (`--score-mid`), De-escalation / Structural Drift / Black Swan = blue tones (`--accent`), State Collapse = red tones.
- **Probability pill** (right): colored dot + percentage value in monospace font. Color tiers: ≥60% red, 30–59% amber, <30% muted. For select-type probability values like "High (50–70%)", extract midpoint for color mapping and display the label text.

**Zone 2 — Content Body (middle)**
Main card body on `--surface` background. Contains:
- **Title**: scenario name, 13.5px, weight 500, `--foreground` color. No line clamp — titles are short enough.
- **Trigger condition**: 11.5px, `--muted` color, clamped to 2 lines with `-webkit-line-clamp: 2`. This keeps card heights uniform.

**Zone 3 — Actor Chips (below body)**
A row of compact chips for each linked Key Actor. Chips use accent-tinted background (`accent 8% opacity`) with accent-tinted border (`accent 18% opacity`) and slightly brightened accent text. Wraps to second row if needed. Actors are resolved from Notion relation IDs to display names.

**Zone 4 — Footer (bottom)**
A compact footer with subtle background differentiation (50% blend of `--surface-raised` and `--surface`). Top border separates it from the card body. Contains:
- **Region chips** (left): full region names (e.g., "Middle East", not "ME") as small bordered chips on `--surface` background.
- **Time horizon** (right): clock icon (SVG, 11px, 45% opacity) + compact label (e.g., "0–6 mo", "6–18 mo", "1–3 yr"). Color: `--muted`.

### Layout

- **Grid**: `grid-template-columns: repeat(3, 1fr)` with `gap: 10px`
- **Section header**: uses existing PF pattern — 14×3px blue bar + uppercase label "Active scenarios", with "All conflicts →" action link on the right
- **Card count**: homepage shows first 3 scenarios (existing `scenarios.slice(0, 3)` behavior preserved)
- **Responsive**: grid collapses to `repeat(2, 1fr)` at `md` and `1fr` at `sm` breakpoints
- **Hover state**: border brightens toward accent (`accent 30%` mixed with `--border`) + soft box shadow (`accent 6%` opacity, 2px 12px blur)

### Section Wrapper

The existing `CollapsibleSection` component wraps the grid. The section retains its current position on the homepage (after Latest Assessments, before How It Works) with `pt-[72px]` top padding.

## Data Model Changes

### New fields to fetch in `scenarios.ts`

The `Scenario` interface and `parseScenario` function need to be extended:

```typescript
export interface Scenario {
  id: string;
  name: string;
  scenarioClass: string;
  probabilityEstimate: string;  // Now always string (select label)
  triggerCondition: string;
  status: string;
  actorIds: string[];
  // New fields:
  affectedRegions: string[];    // multi_select values
  riskLevel: number | null;     // 0–100 number
  timeHorizon: string | null;   // select label e.g. "0–6 months"
}
```

Notion property mappings:
- `Affected Regions` → `affectedRegions` (multi_select → string array)
- `Risk Level` → `riskLevel` (number)
- `Time Horizon` → `timeHorizon` (select)

### Actor name resolution

The current data model stores `actorIds` as Notion page IDs from the Key Actors relation. The redesign needs resolved actor names for the chips. Two approaches:

**Option A (recommended):** Resolve actor names at fetch time in `getActiveScenarios()` by batch-querying the Actors Registry for the referenced page IDs. Cache alongside the scenario data under ISR (300s revalidation). This avoids client-side fetching and keeps the component as a server component.

**Option B:** Pass `actorIds` through and resolve client-side. Worse — adds loading states and complexity.

## Component Architecture

### New component: `ScenarioCard.tsx`

Extract the scenario card into its own component in `src/components/ScenarioCard.tsx`. This replaces the inline JSX currently in `page.tsx` (lines 384–465).

Props:
```typescript
interface ScenarioCardProps {
  scenario: Scenario & { actorNames: string[] };
}
```

### Color mapping utilities

Scenario class → color mapping and probability → color tier mapping should be helper functions within the component file (not exported utilities — they're scenario-specific).

```
scenarioClassColor(className: string) → CSS color string
probabilityColor(label: string) → CSS color string
timeHorizonShort(label: string) → abbreviated string (e.g., "0–6 months" → "0–6 mo")
```

### Probability display

The Notion field is a select with values like "Very High (>70%)", "High (50–70%)", etc. For display:
- Extract the percentage range from the label (regex)
- Show the midpoint as the pill value (e.g., "High (50–70%)" → "60%")
- Use the midpoint for color tier mapping

## Styling

All styling uses Tailwind CSS classes + inline `style` props with CSS variables (matching existing codebase pattern). No new CSS classes in `globals.css` — component-scoped styles only.

Key Tailwind classes:
- Grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5`
- Card: `rounded-[10px] overflow-hidden flex flex-col border transition-colors`
- Status bar: `flex items-center justify-between px-3.5 py-2.5`
- Body: `px-3.5 pt-3.5 pb-2.5 flex-1 flex flex-col gap-1.5`
- Footer: `flex items-center justify-between px-3.5 py-2`

Color-mix expressions for dynamic colors use inline `style` props (Tailwind can't express `color-mix` natively).

## What's NOT Changing

- Section position on homepage (after Latest Assessments)
- `CollapsibleSection` wrapper component
- "All conflicts" action link destination (`/conflicts`)
- ISR revalidation (300s)
- Scenario query filters (`Visibility: Public`, `Status: Active`)
- Maximum 3 cards on homepage (`scenarios.slice(0, 3)`)
- No new pages or routes — this is a homepage section redesign only

## Mockup Reference

Visual mockup: `.superpowers/brainstorm/398-1773801964/scenario-cards-v2.html`
