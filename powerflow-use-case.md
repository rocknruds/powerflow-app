### Dynamic Query — "Ask the Model"

**Purpose:** Answer emergent relational questions using the live knowledge graph — not keyword search, not a chatbot, but a structured intelligence query backed by scored, timestamped data.

**Primary use case — multi-hop relational query:**

Iran fires missiles at the UAE. A user wants to know: how does that affect UAE-US relations? And what about the Saudis — given their existing friction with the UAE, does this bring them closer to Washington or push them further out?* That's five relationship edges being queried simultaneously — Iran→UAE, UAE→US, Iran→Saudi, Saudi→US, Saudi→UAE — with a single causal event as the trigger. No news site answers that. No dashboard answers that. PowerFlow answers it because all five relationships are scored, the missile event is ingested, and cascade effects are already modeled. The query surface routes the question to the right subgraph and synthesizes across it. This is also where the "View in Network" toggle earns its place — seeing those five edges light up simultaneously is the moment a user understands what PowerFlow actually is.

**Secondary use case — time-delayed single query:**
A few weeks after the Iran conflict escalates, a user wants to know: *how has this affected US-China relations?* They're not looking to browse actor profiles or read a brief. They have a specific question about cross-actor dynamics triggered by a specific event. No other surface in the product answers that directly.

**What it does:**
Takes a natural language question, identifies the relevant actors, relationships, score movements, and intel feeds, and returns a structured answer grounded in PowerFlow's model.

**Output:**

- **Narrative answer** — direct, assertion-first, no hedging. Scoped to the question. Reads like a mini-brief, not a chatbot response.
- **Supporting data panel** — the receipts. Actor score cards showing relevant movements over the relevant window. Intel feed items that drove those changes. Assessment excerpts where applicable. The answer shows its work.
- **"View in Network" toggle** — surfaces the relevant nodes and edges in the relationship graph, highlighting the dependency chains that bear on the question. Optional, not required to understand the answer.

**Why it matters:**
The difference between this and asking ChatGPT the same question is provenance. The answer is backed by scored, calibrated, versioned data — not training weights. That has to be visible in the output, which is why the supporting data panel is non-negotiable. Hide the receipts and you've built a chatbot with extra steps.

**Paywall:** Pro tier. This is the feature that converts analysts immediately.

**Design intent:** The moment the "geopolitical intelligence engine" positioning stops being a claim and starts being a demonstration.
