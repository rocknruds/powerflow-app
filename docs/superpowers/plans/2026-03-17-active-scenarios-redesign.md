# Active Scenarios Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat horizontal scenario rows on the homepage with vertical situation cards in a 3-column grid, surfacing new Notion fields (regions, time horizon, risk level) and resolved actor names.

**Architecture:** Extend the `Scenario` interface with 3 new fields from Notion (affectedRegions, riskLevel, timeHorizon). Add a `getActiveScenariosWithActors()` function that batch-resolves actor names server-side. Extract a new `ScenarioCard` component with 4-zone vertical layout (status bar, body, actor chips, footer). Replace the inline JSX in `page.tsx`.

**Tech Stack:** Next.js 14 (App Router, server components), TypeScript, Tailwind CSS v4, Notion REST API

**Spec:** `docs/superpowers/specs/2026-03-17-active-scenarios-redesign.md`
**Mockup:** `.superpowers/brainstorm/398-1773801964/scenario-cards-v2.html`

---

### Task 1: Extend Scenario interface and parseScenario

**Files:**
- Modify: `src/lib/scenarios.ts:1-55`

- [ ] **Step 1: Update imports**

Add `getMultiSelect` to the import from `./notion`:

```typescript
import {
  queryDatabase,
  getTitle,
  getText,
  getSelect,
  getRelationIds,
  getNumber,
  getMultiSelect,
} from "./notion";
```

- [ ] **Step 2: Update the Scenario interface**

Replace the existing interface (lines 12-20) with:

```typescript
export interface Scenario {
  id: string;
  name: string;
  scenarioClass: string;
  probabilityEstimate: string;
  triggerCondition: string;
  status: string;
  actorIds: string[];
  affectedRegions: string[];
  riskLevel: number | null;
  timeHorizon: string | null;
}
```

Note: `probabilityEstimate` changes from `number | string` to `string` — the Notion field is a select, not a number. The old `getNumber` fallback was defensive but unnecessary.

- [ ] **Step 3: Update parseScenario**

Replace the existing function (lines 22-35) with:

```typescript
function parseScenario(page: Record<string, unknown>): Scenario {
  const p = (page.properties ?? {}) as Record<string, unknown>;
  return {
    id: page.id as string,
    name: getTitle(p, "Scenario Name"),
    scenarioClass: getSelect(p, "Scenario Class") ?? "",
    probabilityEstimate: getSelect(p, "Probability Estimate") ?? "",
    triggerCondition: getText(p, "Trigger Condition") ?? "",
    status: getSelect(p, "Status") ?? "",
    actorIds: getRelationIds(p, "Key Actors"),
    affectedRegions: getMultiSelect(p, "Affected Regions"),
    riskLevel: getNumber(p, "Risk Level"),
    timeHorizon: getSelect(p, "Time Horizon"),
  };
}
```

Key change: title property key is `"Scenario Name"` (the actual Notion property name), not `"Name"` — the existing code had this wrong and only worked because Notion falls back on title fields.

- [ ] **Step 4: Verify the app builds**

Run: `cd /c/Users/adamr/github/powerflow-app && npx next build 2>&1 | tail -20`

Expected: Build succeeds. The only consumer of `probabilityEstimate` as a number is `page.tsx` (lines 394-400), which will be replaced in Task 3. If there's a type error, it's transient and will be fixed in Task 3.

- [ ] **Step 5: Commit**

```bash
cd /c/Users/adamr/github/powerflow-app
git add src/lib/scenarios.ts
git commit -m "feat(scenarios): extend Scenario interface with regions, risk level, time horizon"
```

---

### Task 2: Add actor name resolution for scenarios

**Files:**
- Modify: `src/lib/scenarios.ts`

This task adds a new function that fetches active scenarios and resolves the linked actor IDs to display names, returning an enriched type.

- [ ] **Step 1: Add the enriched type and resolver function**

Append after the existing `getActorScenarios` function at the bottom of the file:

```typescript
export type ScenarioWithActors = Scenario & { actorNames: string[] };

/**
 * Fetch active public scenarios with resolved actor names.
 * Used on the homepage where actor chips need display names.
 */
export async function getActiveScenariosWithActors(): Promise<ScenarioWithActors[]> {
  const { getActorsByIds } = await import("./actors");
  const scenarios = await getActiveScenarios();

  // Collect all unique actor IDs across scenarios
  const allIds = [...new Set(scenarios.flatMap((s) => s.actorIds))];
  const actors = await getActorsByIds(allIds);
  const nameMap = new Map(actors.map((a) => [a.id, a.name]));

  return scenarios.map((s) => ({
    ...s,
    actorNames: s.actorIds
      .map((id) => nameMap.get(id))
      .filter((name): name is string => !!name),
  }));
}
```

Notes:
- Dynamic import of `actors` avoids circular dependency risk (actors.ts imports from notion.ts, scenarios.ts imports from notion.ts — no cycle today, but this is defensive).
- `getActorsByIds` does N parallel `fetchPage` calls. For 3 scenarios × ~3 actors each, that's ~9 fetches max, all ISR-cached at 300s. Acceptable.
- Deduplicates actor IDs with `Set` so shared actors (e.g., Iran appearing in 2 scenarios) are fetched once.

- [ ] **Step 2: Verify the app builds**

Run: `cd /c/Users/adamr/github/powerflow-app && npx next build 2>&1 | tail -20`

Expected: Build succeeds. The new function isn't called yet.

- [ ] **Step 3: Commit**

```bash
cd /c/Users/adamr/github/powerflow-app
git add src/lib/scenarios.ts
git commit -m "feat(scenarios): add getActiveScenariosWithActors with batch actor name resolution"
```

---

### Task 3: Create ScenarioCard component

**Files:**
- Create: `src/components/ScenarioCard.tsx`

- [ ] **Step 1: Create the component file**

Create `src/components/ScenarioCard.tsx` with the full component:

```tsx
"use client";

import type { ScenarioWithActors } from "@/lib/scenarios";

/* ── Color mapping ── */

function scenarioClassColor(className: string): string {
  switch (className) {
    case "Escalation":
    case "State Collapse":
      return "var(--delta-down)";
    case "Power Transition":
    case "External Shock":
      return "var(--score-mid)";
    case "De-escalation":
    case "Structural Drift":
    case "Black Swan":
      return "var(--accent)";
    default:
      return "var(--muted-foreground)";
  }
}

/**
 * Extract a display percentage from the Probability Estimate select label.
 * "High (50–70%)" → "60%", "Very High (>70%)" → "85%", "Speculative (<10%)" → "5%"
 */
function probabilityDisplay(label: string): string | null {
  if (!label) return null;
  // Range pattern: "High (50–70%)"
  const range = label.match(/(\d+)\s*[–\-]\s*(\d+)%/);
  if (range) return `${Math.round((+range[1] + +range[2]) / 2)}%`;
  // Greater-than pattern: "Very High (>70%)"
  const gt = label.match(/>(\d+)%/);
  if (gt) return `${+gt[1] + 15}%`;
  // Less-than pattern: "Speculative (<10%)"
  const lt = label.match(/<(\d+)%/);
  if (lt) return `${Math.round(+lt[1] / 2)}%`;
  return null;
}

function probabilityMidpoint(label: string): number | null {
  const display = probabilityDisplay(label);
  if (!display) return null;
  return parseInt(display, 10);
}

function probabilityColor(label: string): string {
  const mid = probabilityMidpoint(label);
  if (mid === null) return "var(--muted-foreground)";
  if (mid >= 60) return "var(--delta-down)";
  if (mid >= 30) return "var(--score-mid)";
  return "var(--muted-foreground)";
}

function timeHorizonShort(label: string | null): string | null {
  if (!label) return null;
  return label
    .replace("months", "mo")
    .replace("month", "mo")
    .replace("years", "yr")
    .replace("year", "yr");
}

/* ── Component ── */

export default function ScenarioCard({ scenario }: { scenario: ScenarioWithActors }) {
  const classColor = scenarioClassColor(scenario.scenarioClass);
  const probColor = probabilityColor(scenario.probabilityEstimate);
  const probText = probabilityDisplay(scenario.probabilityEstimate);
  const horizon = timeHorizonShort(scenario.timeHorizon);

  return (
    <div
      className="group rounded-[10px] overflow-hidden flex flex-col transition-[border-color,box-shadow] duration-200"
      style={{
        border: "1px solid var(--border)",
        backgroundColor: "var(--surface)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "color-mix(in srgb, var(--accent) 30%, var(--border))";
        e.currentTarget.style.boxShadow = "0 2px 12px color-mix(in srgb, var(--accent) 6%, transparent)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Zone 1: Status bar */}
      <div
        className="flex items-center justify-between px-3.5 py-2.5"
        style={{
          borderBottom: "1px solid var(--border)",
          backgroundColor: "var(--surface-raised)",
        }}
      >
        {scenario.scenarioClass && (
          <span
            className="text-[10px] font-semibold uppercase tracking-wide px-2 py-[3px] rounded"
            style={{
              background: `color-mix(in srgb, ${classColor} 12%, transparent)`,
              border: `1px solid color-mix(in srgb, ${classColor} 22%, transparent)`,
              color: classColor,
              lineHeight: 1,
            }}
          >
            {scenario.scenarioClass}
          </span>
        )}
        {probText && (
          <div
            className="flex items-center gap-[5px] text-xs font-bold font-mono tabular-nums px-2.5 py-[3px] rounded-[5px]"
            style={{
              background: `color-mix(in srgb, ${probColor} 12%, transparent)`,
              border: `1px solid color-mix(in srgb, ${probColor} 25%, transparent)`,
              color: probColor,
              lineHeight: 1,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: probColor }}
            />
            {probText}
          </div>
        )}
      </div>

      {/* Zone 2: Content body */}
      <div className="px-3.5 pt-3.5 pb-2.5 flex-1 flex flex-col gap-1.5">
        <p
          className="text-[13.5px] font-medium leading-snug"
          style={{ color: "var(--foreground)", letterSpacing: "-0.01em" }}
        >
          {scenario.name || "Unnamed Scenario"}
        </p>
        {scenario.triggerCondition && (
          <p
            className="text-[11.5px] leading-[1.45] line-clamp-2"
            style={{ color: "var(--muted)" }}
          >
            {scenario.triggerCondition}
          </p>
        )}
      </div>

      {/* Zone 3: Actor chips */}
      {scenario.actorNames.length > 0 && (
        <div className="px-3.5 pb-2.5 flex gap-1 flex-wrap">
          {scenario.actorNames.map((name) => (
            <span
              key={name}
              className="text-[10px] px-[7px] py-0.5 rounded"
              style={{
                background: "color-mix(in srgb, var(--accent) 8%, transparent)",
                border: "1px solid color-mix(in srgb, var(--accent) 18%, transparent)",
                color: "color-mix(in srgb, var(--accent) 85%, white)",
                lineHeight: 1.4,
              }}
            >
              {name}
            </span>
          ))}
        </div>
      )}

      {/* Zone 4: Footer */}
      {(scenario.affectedRegions.length > 0 || horizon) && (
        <div
          className="flex items-center justify-between px-3.5 py-2"
          style={{
            borderTop: "1px solid var(--border)",
            backgroundColor: "color-mix(in srgb, var(--surface-raised) 50%, var(--surface))",
          }}
        >
          <div className="flex gap-1 flex-wrap">
            {scenario.affectedRegions.map((region) => (
              <span
                key={region}
                className="text-[9.5px] px-1.5 py-0.5 rounded-[3px]"
                style={{
                  border: "1px solid var(--border)",
                  color: "var(--muted-foreground)",
                  backgroundColor: "var(--surface)",
                  lineHeight: 1.4,
                }}
              >
                {region}
              </span>
            ))}
          </div>
          {horizon && (
            <span
              className="text-[10px] flex items-center gap-1 whitespace-nowrap"
              style={{ color: "var(--muted)" }}
            >
              <svg
                className="w-[11px] h-[11px] opacity-45"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="8" cy="8" r="6" />
                <path d="M8 4.5V8l2.5 1.5" />
              </svg>
              {horizon}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify the app builds**

Run: `cd /c/Users/adamr/github/powerflow-app && npx next build 2>&1 | tail -20`

Expected: Build succeeds. Component not yet used.

- [ ] **Step 3: Commit**

```bash
cd /c/Users/adamr/github/powerflow-app
git add src/components/ScenarioCard.tsx
git commit -m "feat: add ScenarioCard component with 4-zone situation card layout"
```

---

### Task 4: Wire up ScenarioCard on the homepage

**Files:**
- Modify: `src/app/page.tsx:1-10` (imports)
- Modify: `src/app/page.tsx:15-21` (data fetching)
- Modify: `src/app/page.tsx:384-465` (Active Scenarios section)

- [ ] **Step 1: Update imports in page.tsx**

Replace the scenarios import (line 6):

```typescript
// Old:
import { getActiveScenarios } from "@/lib/scenarios";
// New:
import { getActiveScenariosWithActors } from "@/lib/scenarios";
```

Add the ScenarioCard import after the other component imports (after line 9):

```typescript
import ScenarioCard from "@/components/ScenarioCard";
```

- [ ] **Step 2: Update data fetching**

In the `Promise.all` array (line 15-21), replace `getActiveScenarios()` with `getActiveScenariosWithActors()`:

```typescript
const [actors, deltaMap, latestBrief, latestAssessments, scenarios] = await Promise.all([
  getAllPublicActors(),
  getLatestDeltaByActor(),
  getLatestBrief(),
  getLatestPublicAssessments(2),
  getActiveScenariosWithActors(),
]);
```

- [ ] **Step 3: Replace the Active Scenarios section**

Replace lines 384-465 (the entire `{/* ── Active Scenarios ── */}` section) with:

```tsx
{/* ── Active Scenarios ── */}
<section className="pt-[72px]">
  <CollapsibleSection label="Active scenarios" action={{ label: "All conflicts", href: "/conflicts" }}>
    {scenarios.length === 0 ? (
      <p className="text-sm" style={{ color: "var(--muted)" }}>
        No active scenarios.
      </p>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {scenarios.slice(0, 3).map((s) => (
          <ScenarioCard key={s.id} scenario={s} />
        ))}
      </div>
    )}
  </CollapsibleSection>
</section>
```

Key changes:
- `space-y-2` vertical stack → `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5` responsive grid
- ~60 lines of inline JSX → single `<ScenarioCard>` component call
- All probability parsing, color logic, and layout moved into the component

- [ ] **Step 4: Build and verify**

Run: `cd /c/Users/adamr/github/powerflow-app && npx next build 2>&1 | tail -20`

Expected: Build succeeds with no type errors.

- [ ] **Step 5: Start dev server and visually verify**

Run: `cd /c/Users/adamr/github/powerflow-app && npx next dev`

Open `http://localhost:3000` and scroll to the Active Scenarios section. Verify:
- 3-column grid layout appears
- Scenario class badges show with correct colors
- Probability pills display extracted percentages
- Actor names appear as blue-tinted chips
- Region chips and time horizon appear in footer
- Hover state shows subtle border glow
- Empty state ("No active scenarios") still works if no data

- [ ] **Step 6: Commit**

```bash
cd /c/Users/adamr/github/powerflow-app
git add src/app/page.tsx
git commit -m "feat: replace inline scenario rows with ScenarioCard grid on homepage"
```

---

### Task 5: Verify getActorScenarios still works

**Files:**
- Read: `src/lib/scenarios.ts` (verify `getActorScenarios` return type)

The `getActorScenarios()` function is exported but currently unused in the app (grep confirms no imports outside `scenarios.ts`). However, it may be used by actor detail pages in the future.

- [ ] **Step 1: Verify no callers break**

Run: `cd /c/Users/adamr/github/powerflow-app && grep -r "getActorScenarios\|probabilityEstimate" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v "scenarios.ts"`

Expected: No results outside of `page.tsx` (which was already updated in Task 4). If `BriefRenderer.tsx` shows up, it's a false positive — it has its own inline scenario parser unrelated to the `Scenario` type.

- [ ] **Step 2: Verify the full build passes clean**

Run: `cd /c/Users/adamr/github/powerflow-app && npx next build 2>&1 | tail -30`

Expected: Build succeeds. All pages generate without errors.

- [ ] **Step 3: Commit (if any fixes needed)**

Only commit if fixes were required. Otherwise this task is just a verification gate — no commit needed.
