import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getAllPublicBriefs, getBriefWithContent } from "@/lib/briefs";
import { parseBriefContent } from "@/lib/parseBriefContent";
import BriefRenderer from "@/components/briefs/BriefRenderer";
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
        <div className="max-w-3xl mx-auto px-6">
          <Link
            href="/briefs"
            className="text-xs transition-colors mb-4 inline-flex items-center gap-1"
            style={{ color: "var(--muted)" }}
          >
            ← Intelligence Briefs
          </Link>

          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {brief.briefType && (
              <span
                className="text-xs px-2 py-0.5 rounded font-medium"
                style={{ color: "var(--accent)", border: "1px solid color-mix(in srgb, var(--accent) 40%, transparent)", backgroundColor: "color-mix(in srgb, var(--accent) 10%, transparent)" }}
              >
                {brief.briefType}
              </span>
            )}
            {brief.status && (
              <span
                className="text-xs px-2 py-0.5 rounded font-medium"
                style={{ color: statusColor, backgroundColor: `color-mix(in srgb, ${statusColor} 10%, transparent)` }}
              >
                {brief.status}
              </span>
            )}
            {(brief.dateRangeStart || brief.dateRangeEnd) && (
              <span className="text-xs" style={{ color: "var(--muted)" }}>
                {formatDate(brief.dateRangeStart)}
                {brief.dateRangeEnd && ` – ${formatDate(brief.dateRangeEnd)}`}
              </span>
            )}
          </div>

          {(() => {
            const parts = (brief.title || "Untitled Brief").split(" — ");
            const name = parts[0];
            const datePart = parts.length > 1 ? parts.slice(1).join(" — ") : null;
            return (
              <>
                <h1 className="text-3xl font-bold leading-tight" style={{ color: "var(--foreground)" }}>
                  {name}
                </h1>
                {datePart && (
                  <p className="text-lg mt-1" style={{ color: "var(--muted)" }}>
                    {datePart}
                  </p>
                )}
              </>
            );
          })()}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <BriefRenderer content={parseBriefContent(blocksToBody(brief.blocks))} />
      </div>
    </div>
  );
}