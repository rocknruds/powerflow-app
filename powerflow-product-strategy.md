# PowerFlow — Product Strategy & Frontend Vision

*Last updated: March 2026*

---

## Product Identity

**PowerFlow is a geopolitical intelligence engine.**

It ingests the static, event-driven perspective of typical news and connects the dots — mapping dependencies, scoring actors, and tracing how disturbances cascade through the system. The result is a continuously updated model of how power actually moves through the world.

**The contrast:**

- News gives you events → stories → forgotten
- PowerFlow gives you events → ingested → model updates → new understanding of the system

News is reactive. PowerFlow is anticipatory. Because when you're tracking underlying structure — who depends on whom, where authority is eroding, where reach is expanding — you can see stress fractures before they produce headlines.

**One-liner:**

> *"PowerFlow is a geopolitical intelligence engine. It ingests the world's information and builds a living model of how power actually moves — so you can see what's shifting before it makes headlines."*

**What it's not:**

- Not a news site (events are inputs, not the product)
- Not a dashboard (dashboards display state; PowerFlow models dynamics)
- Not a data terminal (accessibility is a feature, not an afterthought)

**Category:** Geopolitical intelligence engine — a continuously running model of global power, not a snapshot.

---

## Core Product Philosophy

PowerFlow's central differentiator is **progressive disclosure of complexity** — every piece of information exists at multiple depth levels, and the product teaches users how to read geopolitics as they go deeper. By the time a casual reader hits layer 3, they're reasoning like an analyst because PowerFlow's framework did that to them.

Most intelligence tools are either dumbed-down news aggregators or intimidating analyst terminals. PowerFlow is the bridge.

The goal: **the layman becomes the expert** — not by being lectured at, but by being pulled through a well-designed information architecture that reveals complexity incrementally.

---

## Target Users

### Primary: Informed General Public (Plus tier)

People who read Foreign Affairs, follow geopolitics seriously, want a smarter alternative to news. They want clarity, narrative, and visual elegance — not raw database views. They upgrade because the free tier taught them the framework and now they want more.

### Primary: Analyst / Researcher (Pro tier)

Need structured, longitudinal data to support arguments. Want deep actor profiles, score history, exportable data, and citation-quality sourcing. Likely to pay immediately — bypass the funnel and go straight to Pro.

### Secondary: Policy / Strategy Professional (Pro tier)

Need to monitor specific regions or actor sets. Want watchlists, scenario flags, and dependency chain visibility. Most monetizable audience alongside analysts.

---

## Monetization Architecture

The paywall is not just a revenue gate — it's the mechanism that separates depth layers and rewards curiosity.

### Free — Hook & Credibility

- Homepage feed showing what moved and why (score shifts, major events)
- Actor directory with current PF scores + basic profiles
- Top-level conflict list
- One sample brief
- Enough to establish credibility and drive return visits

### Plus (~$12–15/mo) — Informed Public Tier

- Full actor profiles with score history charts
- Relationship context (who depends on whom)
- Full weekly briefs
- Conflict pages with actor involvement details
- Target: "I read Foreign Affairs and want structured depth"

### Pro (~$40–50/mo) — Analyst Tier

- Actor comparison tool (2–4 actors side-by-side)
- Interactive relationship / dependency network map
- Full Assessments (doctrine-driven, structured analytical documents — the crown jewel)
- Export capabilities
- Eventually: API access

---

## Page Architecture

### 1. Homepage — "The Shift"

**Purpose:** Daily/weekly check-in. Not a news feed — a *movement* feed.

**What it shows:**

- Score delta cards: what changed, by how much (e.g. *Iran −8 this week*)
- Ripple/cascade effects: who else moved as a result
- Top conflict updates
- Brief teaser
- "Why it matters" framing for each major movement

**Paywall:** Free to view surface level. Depth locked behind Plus.

**Design intent:** This is the hook page. The first impression. Must feel like something you've never seen before — not another news dashboard.

---

### 2. Actors Directory

**Purpose:** Browse and discover actors across the registry.

**Features:**

- Filterable by region, actor type (State / Non-State / IGO), score range, recent movement
- Cards: name, current PF score, 30-day trajectory arrow (up/down/flat)
- Search by name or keyword

**Paywall:** Free to browse, profile depth paywalled.

---

### 3. Actor Profile Page ← Heart of the Product

**Purpose:** The primary research and reference destination. Where progressive disclosure lives most fully.

**Sections (top to bottom):**

**Hero Block**

- Actor name, type, region
- Current Authority Score / Reach Score / PF Score
- 30-day trajectory indicator
- One-line status summary

**Score History Chart**

- 3-line recharts visualization: Authority, Reach, PF Score over time
- Zoomable timeline
- Event markers — score changes linked to specific ingested intel items

**Key Drivers**

- What's pushing the score up or down right now
- Drawn from score reasoning field and recent Intel Feeds

**Relationship Map**

- Who this actor depends on (Dependent On)
- Who depends on them (reverse lookup)
- Patron/proxy chain visualization
- Visual indicator of ceiling rules in effect

**Assessment** ← Premium Centerpiece

- The structured analytical document generated by the Assessments agent
- Doctrine-driven, defensible, updated when scores change significantly
- Versioned — historical assessments browsable ("here's what PowerFlow said about Iran in October vs. today")
- This is the thing no other tool has. Feature it prominently.
- Pro tier only

**Related Conflicts**

- Active conflicts this actor is involved in
- Their role, current impact on score

**Intel Feed Summary**

- Recent ingested items that have driven score changes
- Linked to source

**Paywall:** Hero + Score History = Plus. Relationship Map + Assessment + Intel Feed = Pro.

---

### 4. Conflicts Page

**Purpose:** Track active and historical conflicts with full actor involvement context.

**Features:**

- Conflict cards with status, region, involved actors
- Actor delta chips: how each involved party's score has moved since conflict onset
- Timeline of key events driving escalation/de-escalation
- Link to relevant actor profiles and assessments

**Paywall:** Surface list free. Actor deltas + event timelines = Plus/Pro.

---

### 5. Relationship Network Map ← The Killer Visual

**Purpose:** Make the dependency architecture visible in a way that's immediately striking and analytically useful.

**Features:**

- Interactive force-directed graph
- Nodes: actors, sized by PF score
- Edges: dependency relationships — patron/proxy chains, alliance structures, adversarial links
- Edge weight/color: relationship strength and direction
- Click a node → actor profile drawer opens
- Filter by region, actor type, conflict involvement
- "Cascade mode" — select an actor and highlight everything that would be affected by a major score shift

**Paywall:** Pro tier. This is the visual that makes people share the product.

**Design intent:** The visual that makes people say *"I've never seen geopolitics shown this way."*

---

### 6. Actor Comparison Tool

**Purpose:** Side-by-side analytical research for power users.

**Features:**

- Select 2–4 actors
- Overlay or side-by-side score history charts
- Relationship overlap visualization
- Conflict involvement comparison
- Assessment summary comparison
- Export to CSV/PDF

**Paywall:** Pro tier only.

---

### 7. Briefs

**Purpose:** Weekly narrative synthesis. The product's editorial voice.

**Features:**

- Clean, long-form reading experience — narrative first, data supporting
- Organized by region or theme
- Linked to relevant actor profiles and conflicts

**Paywall:** Teaser/intro free. Full brief = Plus.

---

### 8. Research / Explore

**Purpose:** Power user search and discovery layer.

**Features:**

- Full-text search across actors, events, intel feeds, assessments
- Filter by date, region, actor type, conflict
- The entry point for analysts who know what they're looking for

**Paywall:** Pro tier for full access.

---

## The Assessment — Strategic Note

The Assessment agent produces doctrine-driven, structured analytical documents per actor. This is the product's crown jewel and should be treated as such.

**Why it's different:**

- Continuously updated (not a static report)
- Tied to actual scored, calibrated data
- Versioned — the history of the analysis is itself valuable
- Generates the kind of structured, defensible output that would take an analyst hours to produce

**How it surfaces:**

- Primary home: Actor Profile Page (premium section)
- Referenced in Briefs
- Surfaced in Actor Comparison tool
- Eventually: exportable, API-accessible

---

## Build Priority Order

Given current data layer maturity, build in this sequence:

1. **Actor Profile Page** — score history chart + Assessment display. Immediately demonstrates product value.
2. **Homepage "The Shift" feed** — drives return visits, top of funnel.
3. **Relationship Network Map** — the visual that makes people share it and justifies Pro pricing.
4. **Paywall architecture** — must be in before public launch.
5. **Conflicts Page** — actor delta chips, event timelines.
6. **Actor Comparison Tool** — Phase 2, once core experience is solid.
7. **Full Research/Explore layer** — Phase 2.

---

## Design Principles

- **Data before noise.** No unnecessary chrome. The information is the design.
- **Progressive complexity.** Every page works at multiple depth levels. Casual readers aren't lost; analysts aren't bored.
- **Trajectory over position.** Scores matter less than movement. Always show direction and velocity alongside current state.
- **Cascade is the story.** The dependency architecture is PowerFlow's unique insight. Every design decision should make that more visible, not less.
- **Earned authority.** The product should feel like it knows more than you — not because it's inaccessible, but because it's structured and confident. No hedging, no vagueness.

