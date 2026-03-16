# PowerFlow App — Claude Code Context

## What This Is
PowerFlow public-facing Next.js frontend. Displays actor scores, conflict tracking,
and geopolitical intelligence derived from the Notion data store.

## Stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS v4 with `@tailwindcss/postcss`
- Recharts for score history charts
- Raw Notion REST API (no SDK) — ISR at 300s revalidation

## Key Files

### Data layer (`src/lib/`)
- `notion.ts` — base client: `queryDatabase()`, `fetchPage()`, property extractors
- `types.ts` — all TypeScript interfaces (Actor, ScoreSnapshot, ConflictPublic, etc.)
- `actors.ts` — actor queries + enrichment
- `scores.ts` — score history, delta map, score movers
- `conflicts.ts` — conflict queries + actor enrichment
- `briefs.ts` — brief queries + block parsing
- `relationships.ts` — Actor Relationships + Relationship Score Snapshots queries
- `scenarios.ts` — scenario queries
- `events.ts` — events timeline queries

### Pages
- `src/app/page.tsx` — homepage (hero + leaderboard + how it works + latest brief)
- `src/app/actors/page.tsx` — actor leaderboard
- `src/app/actors/[slug]/page.tsx` — actor profile (score panel + chart + relationships)
- `src/app/conflicts/page.tsx` — conflict cards with actor delta chips
- `src/app/briefs/page.tsx` + `[id]/page.tsx` — brief list + full brief

### Components
- `src/components/ScoreChart.tsx` — recharts 3-line chart (PF/Authority/Reach)
- `src/components/ScoreDelta.tsx` — delta badge (accepts `number | null`)
- `src/components/ActorCard.tsx` — actor card + `pfScoreColor()` + `actorTypeBadgeColor()`
- `src/components/Masthead.tsx` — nav with LogoMark
- `src/components/LogoMark.tsx` — SVG logo mark, `size` + `dark` props

## Notion Database IDs
Set in `.env.local`. Use page/database IDs — NOT collection IDs (those are MCP only).
```
NOTION_ACTORS_DB_ID=7aa6bbc818ad4a35a4059fbe2537d115
NOTION_SCORE_SNAPSHOTS_DB_ID=e96696510cac4435a52e89be9fb6a969
NOTION_CONFLICTS_DB_ID=db9f622892a74cdd942981c330e90886
NOTION_BRIEFS_DB_ID=df4e70c01fa1460d8f9bb6c26f05dc1a
NOTION_SCENARIOS_DB_ID=430eb13962d44154b9761785faf01300
NOTION_EVENTS_DB_ID=70e9768bfcec49a9aa8565d5aa1f1881
NOTION_ACTOR_RELATIONSHIPS_DB_ID=aa748f6b63414f5ea09ca208a4398ccb
NOTION_RELATIONSHIP_SNAPSHOTS_DB_ID=dc005b19722d4cdba3248026ec9f6969
```

## Design System
Tokens live in `src/app/globals.css` under `@theme inline`.
Key tokens: `--background`, `--surface`, `--surface-raised`, `--border`,
`--foreground`, `--muted`, `--muted-foreground`, `--accent`,
`--score-pf` (blue), `--score-authority` (amber), `--score-reach` (orange),
`--delta-up` (green), `--delta-down` (red).

Section label pattern: `h-[3px] w-[14px]` blue bar + small-caps text.
Dark mode only for now. Light mode deferred.

## Critical Patterns

### Slug vs UUID
Actor pages use URL slugs (`/actors/united-states`), not Notion UUIDs.
Always resolve slug → actor via `getActorBySlug(slug)` first.
Then pass `actor.id` (UUID) to all downstream queries.
`generateStaticParams` must use `a.slug`, never `a.id`.

### PF Score
Computed client-side: `calcPFScore(auth, reach)` in `notion.ts`.
`√(Authority × Reach)` (geometric mean). Do not use Notion formula field — returns null issues.

### Relationship display (Option A — locked)
Asymmetric rows. On actor profile:
- "Actor's assessments" = outgoing rows (actor is Primary)
- "How others score Actor" = incoming rows (actor is Compared, labeled per counterparty)
Never flip perspective on incoming rows — scores belong to the primary actor's POV.

### ISR revalidation
All pages export `export const revalidate = 300`.
Data is cached — don't expect live updates without revalidation.

### Tailwind v4
Uses `@tailwindcss/postcss`, NOT `postcss-tailwind`.
Custom tokens via `@theme inline` in globals.css.
VSCode: `"css.lint.unknownAtRules": "ignore"` in `.vscode/settings.json`.
ShadCN components: install with `npx shadcn@latest add <component>` — they inherit tokens.

## PF Score Color Scale
`pfScoreColor()` in `ActorCard.tsx`:
- 70+ → `var(--delta-up)` green
- 50–69 → `var(--score-pf)` blue  
- 30–49 → amber
- <30 → `var(--delta-down)` red