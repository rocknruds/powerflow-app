import { NextRequest } from "next/server"
import { getAllPublicActors } from "@/lib/actors"
import { getTopRelationships } from "@/lib/relationships"
import { getActorIntelFeeds } from "@/lib/intel-feeds"

export async function POST(req: NextRequest) {
  const { question } = await req.json()
  if (!question || typeof question !== "string") {
    return Response.json({ error: "Missing question" }, { status: 400 })
  }

  const actors = await getAllPublicActors()
  const top20 = actors.slice(0, 20)

  const actorContext = top20.map(a =>
    `${a.name} (PF:${a.pfScore ?? "?"}, Auth:${a.authorityScore ?? "?"}, Reach:${a.reachScore ?? "?"}, Vector:${a.pfVector ?? "?"}, Region:${a.region ?? "?"})`
  ).join("\n")

  const mentionedActors = top20.filter(a =>
    question.toLowerCase().includes(a.name.toLowerCase().split(" ")[0].toLowerCase())
  ).slice(0, 4)

  const relContext: string[] = []
  const feedContext: string[] = []

  await Promise.all(mentionedActors.map(async (actor) => {
    const rels = await getTopRelationships(actor.id, 5)
    rels.forEach(r => {
      relContext.push(`${actor.name} → ${r.counterpartyName}: alignment=${r.alignmentScore ?? "?"}, leverage=${r.leverageScore ?? "?"}, type=${r.relationshipType ?? "?"}`)
    })
    const feeds = await getActorIntelFeeds(actor.id, 3)
    feeds.forEach(f => {
      if (f.soWhatSummary) feedContext.push(`[${actor.name}] ${f.soWhatSummary}`)
    })
  }))

  const systemPrompt = `You are PowerFlow's analytical engine. You answer geopolitical intelligence questions using scored, calibrated actor data — not general knowledge.

ACTOR REGISTRY (top 20 by PF Score):
${actorContext}

RELATIONSHIP DATA:
${relContext.join("\n") || "No relationship data retrieved for this query."}

RECENT INTELLIGENCE:
${feedContext.join("\n") || "No recent intel retrieved for this query."}

INSTRUCTIONS:
- Answer directly and assertively. No hedging, no "it's complicated".
- Lead with the most important finding.
- Reference specific scores and relationships from the data above.
- Keep the answer under 200 words.
- End with a JSON block in this exact format (after your narrative):
\`\`\`json
{
  "actors": ["Actor Name 1", "Actor Name 2"],
  "keyFinding": "one sentence summary",
  "confidence": "High|Medium|Low"
}
\`\`\``

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: question }],
    }),
  })

  if (!response.ok) {
    return Response.json({ error: "Model error" }, { status: 500 })
  }

  const data = await response.json()
  const raw = data.content?.[0]?.text ?? ""

  const jsonMatch = raw.match(/```json\n([\s\S]*?)\n```/)
  let meta: { actors: string[]; keyFinding: string; confidence: string } = {
    actors: [],
    keyFinding: "",
    confidence: "Medium",
  }
  if (jsonMatch) {
    try { meta = JSON.parse(jsonMatch[1]) } catch {}
  }
  const narrative = raw.replace(/```json[\s\S]*?```/, "").trim()

  const supportingActors = (meta.actors as string[])
    .map(name => top20.find(a => a.name === name))
    .filter(Boolean)

  return Response.json({
    narrative,
    meta,
    supportingActors: supportingActors.map(a => ({
      id: a!.id,
      name: a!.name,
      pfScore: a!.pfScore,
      authorityScore: a!.authorityScore,
      reachScore: a!.reachScore,
      pfVector: a!.pfVector,
      slug: a!.slug,
    })),
    relContext,
    feedContext,
  })
}
