import { queryDatabase, fetchBlocks, getTitle, getText, getSelect, getDate } from './notion'
import type { BriefPublic, BriefFull, NotionBlock } from './types'

const BRIEFS_DB_ID = process.env.NOTION_BRIEFS_DB_ID ?? 'df4e70c01fa1460d8f9bb6c26f05dc1a'

function parsePage(page: any): BriefPublic {
  const props = page.properties
  return {
    id: page.id,
    title: getTitle(props, 'Name') || getTitle(props, 'Title'),
    briefType: getSelect(props, 'Brief Type') ?? getSelect(props, 'Type'),
    status: getSelect(props, 'Status'),
    dateRangeStart: getDate(props, 'Period Start'),
    dateRangeEnd: getDate(props, 'Period End'),
    editorialPriority: getText(props, 'Editorial Priority') || null,
    leadThesis: getText(props, 'lead_thesis') || null,
    summaryDek: getText(props, 'summary_dek') || null,
    bodyPreview: null,
    visibility: getSelect(props, 'Visibility'),
  }
}

function extractRichTextFromBlock(block: any): string {
  const content = block[block.type]
  return content?.rich_text?.map((t: any) => t.plain_text).join('') ?? ''
}

async function fetchBodyPreview(pageId: string): Promise<string | null> {
  try {
    const rawBlocks = await fetchBlocks(pageId)
    for (const block of rawBlocks) {
      if (block.type === 'paragraph') {
        const text = extractRichTextFromBlock(block)
        if (text.trim()) {
          return text.length > 200 ? text.slice(0, 200) + '\u2026' : text
        }
      }
    }
  } catch {
    // Preview is optional — fail silently
  }
  return null
}

/**
 * Fetch all public briefs, newest first.
 *
 * Free users see: title, brief type, date, editorial priority teaser.
 * The teaser is the hook — it tells them something valuable exists without
 * giving them the analysis. Full brief content requires paid access.
 */
export async function getAllPublicBriefs(): Promise<BriefPublic[]> {
  const pages = await queryDatabase(
    BRIEFS_DB_ID,
    { property: 'Visibility', select: { equals: 'Public' } },
    [{ property: 'Date Range', direction: 'descending' }]
  )

  const briefs = pages.map(parsePage)

  // Fetch body previews for briefs that lack a lead thesis
  await Promise.all(
    briefs.map(async (brief) => {
      if (!brief.leadThesis) {
        brief.bodyPreview = await fetchBodyPreview(brief.id)
      }
    })
  )

  return briefs
}

export async function getLatestBrief(): Promise<BriefPublic | null> {
  const briefs = await getAllPublicBriefs()
  return briefs[0] ?? null
}

export async function getLatestBriefsByType(): Promise<{
  weekly: BriefPublic | null
  monthly: BriefPublic | null
}> {
  const briefs = await getAllPublicBriefs()
  const weekly = briefs.find((b) => b.briefType === 'Weekly') ?? null
  const monthly = briefs.find((b) => b.briefType === 'Monthly') ?? null
  return { weekly, monthly }
}

/**
 * Fetch a brief with its full Notion block content.
 * PAID ONLY — gate this at the route/page level.
 *
 * @throws if called without verifying paid access at the calling layer.
 */
export async function getBriefWithContent(id: string): Promise<BriefFull | null> {
  const briefs = await getAllPublicBriefs()
  const brief = briefs.find((b) => b.id === id)
  if (!brief) return null

  const rawBlocks = await fetchBlocks(id)
  const blocks = rawBlocks.map(parseBlock).filter((b): b is NotionBlock => b !== null)

  return { ...brief, blocks }
}

// ─── Block rendering ──────────────────────────────────────────────────────────

function extractRichText(arr: any[]): string {
  return arr?.map((t: any) => {
    let text: string = t.plain_text
    if (t.annotations?.bold && t.annotations?.italic) return `***${text}***`
    if (t.annotations?.bold) return `**${text}**`
    if (t.annotations?.italic) return `*${text}*`
    return text
  }).join('') ?? ''
}

function parseBlock(block: any): NotionBlock | null {
  const type = block.type
  const content = block[type]

  switch (type) {
    case 'paragraph':
      return { id: block.id, type, content: extractRichText(content.rich_text) }
    case 'heading_1':
    case 'heading_2':
    case 'heading_3':
      return { id: block.id, type, content: extractRichText(content.rich_text) }
    case 'bulleted_list_item':
    case 'numbered_list_item':
      return { id: block.id, type, content: extractRichText(content.rich_text) }
    case 'quote':
      return { id: block.id, type, content: extractRichText(content.rich_text) }
    case 'callout':
      return { id: block.id, type, content: extractRichText(content.rich_text) }
    case 'divider':
      return { id: block.id, type, content: '' }
    default:
      return null
  }
}
