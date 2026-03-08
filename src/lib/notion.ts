const NOTION_VERSION = '2022-06-28'
const BASE_URL = 'https://api.notion.com/v1'

function headers() {
  return {
    Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json',
  }
}

/**
 * Query a Notion database, handling pagination automatically.
 * Uses Next.js ISR: revalidates every 5 minutes by default.
 */
export async function queryDatabase(
  databaseId: string,
  filter?: object,
  sorts?: object[],
  revalidate = 300
): Promise<any[]> {
  const results: any[] = []
  let cursor: string | undefined

  do {
    const body: Record<string, unknown> = { page_size: 100 }
    if (filter) body.filter = filter
    if (sorts) body.sorts = sorts
    if (cursor) body.start_cursor = cursor

    const res = await fetch(`${BASE_URL}/databases/${databaseId}/query`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
      next: { revalidate },
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Notion query error [${res.status}]: ${text}`)
    }

    const data = await res.json()
    results.push(...data.results)
    cursor = data.has_more ? data.next_cursor : undefined
  } while (cursor)

  return results
}

/**
 * Fetch a single Notion page by ID.
 */
export async function fetchPage(pageId: string, revalidate = 300): Promise<any | null> {
  const res = await fetch(`${BASE_URL}/pages/${pageId}`, {
    headers: headers(),
    next: { revalidate },
  })
  if (!res.ok) return null
  return res.json()
}

/**
 * Fetch the block children of a page (for rendering brief content).
 */
export async function fetchBlocks(blockId: string, revalidate = 300): Promise<any[]> {
  const results: any[] = []
  let cursor: string | undefined

  do {
    const url = new URL(`${BASE_URL}/blocks/${blockId}/children`)
    url.searchParams.set('page_size', '100')
    if (cursor) url.searchParams.set('start_cursor', cursor)

    const res = await fetch(url.toString(), {
      headers: headers(),
      next: { revalidate },
    })

    if (!res.ok) break

    const data = await res.json()
    results.push(...data.results)
    cursor = data.has_more ? data.next_cursor : undefined
  } while (cursor)

  return results
}

// ─── Property extractors ────────────────────────────────────────────────────

export function getTitle(props: any, key: string): string {
  return props[key]?.title?.map((t: any) => t.plain_text).join('') ?? ''
}

export function getText(props: any, key: string): string {
  return props[key]?.rich_text?.map((t: any) => t.plain_text).join('') ?? ''
}

export function getNumber(props: any, key: string): number | null {
  return props[key]?.number ?? null
}

export function getSelect(props: any, key: string): string | null {
  return props[key]?.select?.name ?? null
}

export function getMultiSelect(props: any, key: string): string[] {
  return props[key]?.multi_select?.map((o: any) => o.name) ?? []
}

export function getDate(props: any, key: string): string | null {
  return props[key]?.date?.start ?? null
}

export function getRelationIds(props: any, key: string): string[] {
  return props[key]?.relation?.map((r: any) => r.id) ?? []
}

export function getCheckbox(props: any, key: string): boolean {
  return props[key]?.checkbox ?? false
}

export function getFormula(props: any, key: string): number | null {
  const f = props[key]?.formula
  if (!f) return null
  if (f.type === 'number') return f.number
  return null
}

export function getUrl(props: any, key: string): string | null {
  return props[key]?.url ?? null
}
