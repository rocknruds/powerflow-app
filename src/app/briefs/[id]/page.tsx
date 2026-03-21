import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getAllPublicBriefs, getBriefWithContent } from "@/lib/briefs";
import { parseBriefContent } from "@/lib/parseBriefContent";
import BriefRenderer, { ScoreLedgerSidebar } from "@/components/briefs/BriefRenderer";
import type { NotionBlock } from "@/lib/types";

export const revalidate = 300;

export async function generateStaticParams() {
  const briefs = await getAllPublicBriefs();
  return briefs.map((b) => ({ id: b.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const result = await getBriefWithContent(id);
  return { title: result?.title ?? "Brief" };
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
]

/** Parse ISO date string (YYYY-MM-DD) without timezone offset. */
function parseDateParts(iso: string): { year: number; month: number; day: number } | null {
  const parts = iso.split("-")
  if (parts.length < 3) return null
  return { year: +parts[0], month: +parts[1], day: +parts[2] }
}

/**
 * For monthly briefs: returns "March 2026" + optional "through March 18".
 * For weekly/other: returns the raw title split on " — ".
 */
function parseBriefHeading(brief: { title: string; briefType: string | null; dateRangeStart: string | null; dateRangeEnd: string | null }): { name: string; sub: string | null } {
  if (brief.briefType === "Monthly" && brief.dateRangeStart) {
    const s = parseDateParts(brief.dateRangeStart)
    if (s) {
      const name = `${MONTH_NAMES[s.month - 1]} ${s.year}`
      let sub: string | null = null
      if (brief.dateRangeEnd) {
        const e = parseDateParts(brief.dateRangeEnd)
        if (e) {
          const lastDay = new Date(e.year, e.month, 0).getDate()
          if (e.day < lastDay) {
            sub = `through ${MONTH_NAMES[e.month - 1]} ${e.day}`
          }
        }
      }
      return { name, sub }
    }
  }

  const parts = (brief.title || "Untitled Brief").split(" — ")
  return { name: parts[0], sub: parts.length > 1 ? parts.slice(1).join(" — ") : null }
}

/** Convert NotionBlock[] back to a markdown body string for parseBriefContent. */
function blocksToBody(blocks: NotionBlock[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case "heading_1":
          return `# ${block.content}`;
        case "heading_2":
          return `## ${block.content}`;
        case "heading_3":
          return `### ${block.content}`;
        case "bulleted_list_item":
          return `- ${block.content}`;
        case "numbered_list_item":
          return `- ${block.content}`;
        case "quote":
          return `> ${block.content}`;
        case "divider":
          return "---";
        default:
          return block.content;
      }
    })
    .join("\n\n");
}

export default async function BriefPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // getBriefWithContent returns BriefFull | null — BriefFull extends BriefPublic and has .blocks
  const brief = await getBriefWithContent(id);
  if (!brief) notFound();

  const statusColor = brief.status === "Final" ? "var(--delta-up)" : "var(--score-mid)";

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      <div className="py-10" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <Link
            href="/briefs"
            className="text-xs transition-colors mb-4 inline-flex items-center gap-1"
            style={{ color: "var(--muted)" }}
          >
            ← Intelligence Briefs
          </Link>


          {(() => {
            const { name, sub } = parseBriefHeading(brief);
            return (
              <>
                <h1 className="text-3xl font-bold leading-tight" style={{ color: "var(--foreground)" }}>
                  {name}
                </h1>
                {sub && (
                  <p className="text-lg mt-1" style={{ color: "var(--muted)" }}>
                    {sub}
                  </p>
                )}
              </>
            );
          })()}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {(() => {
          const briefContent = parseBriefContent(blocksToBody(brief.blocks))
          const scoreLedger = briefContent.sections.find((s) => s.type === "score-ledger")
          return (
            <div className="grid lg:grid-cols-[minmax(0,62%)_minmax(0,35%)] lg:gap-14">
              <div>
                <BriefRenderer content={briefContent} />
              </div>
              <div className="mt-10 lg:mt-0">
                {scoreLedger && scoreLedger.raw.trim() && <ScoreLedgerSidebar raw={scoreLedger.raw} />}
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  );
}
