import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getAllPublicBriefs, getBriefWithContent } from "@/lib/briefs";
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

function renderBlock(block: NotionBlock): React.ReactNode {
  // NotionBlock.content is the text field — not block.text
  const text = block.content;
  if (!text && block.type !== "divider") return null;

  switch (block.type) {
    case "heading_1":
      return (
        <h1 key={block.id} className="text-2xl font-bold mt-8 mb-3" style={{ color: "var(--foreground)" }}>
          {text}
        </h1>
      );
    case "heading_2":
      return (
        <h2 key={block.id} className="text-xl font-semibold mt-7 mb-2.5" style={{ color: "var(--foreground)" }}>
          {text}
        </h2>
      );
    case "heading_3":
      return (
        <h3 key={block.id} className="text-lg font-semibold mt-5 mb-2" style={{ color: "var(--foreground)" }}>
          {text}
        </h3>
      );
    case "paragraph":
      return (
        <p key={block.id} className="leading-relaxed mb-4" style={{ color: "var(--muted-foreground)" }}>
          {text}
        </p>
      );
    case "bulleted_list_item":
      return (
        <li key={block.id} className="leading-relaxed mb-1 ml-4" style={{ color: "var(--muted-foreground)" }}>
          {text}
        </li>
      );
    case "numbered_list_item":
      return (
        <li key={block.id} className="leading-relaxed mb-1 ml-4 list-decimal" style={{ color: "var(--muted-foreground)" }}>
          {text}
        </li>
      );
    case "quote":
      return (
        <blockquote
          key={block.id}
          className="pl-4 my-4 italic"
          style={{ color: "var(--muted)", borderLeft: "2px solid var(--accent)" }}
        >
          {text}
        </blockquote>
      );
    case "callout":
      return (
        <div
          key={block.id}
          className="rounded-lg px-4 py-3 my-4 text-sm leading-relaxed"
          style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}
        >
          {text}
        </div>
      );
    case "divider":
      return <hr key={block.id} className="my-6" style={{ borderColor: "var(--border)" }} />;
    default:
      return text ? (
        <p key={block.id} className="leading-relaxed mb-3" style={{ color: "var(--muted)" }}>
          {text}
        </p>
      ) : null;
  }
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

          <h1 className="text-3xl font-bold leading-tight" style={{ color: "var(--foreground)" }}>
            {brief.title || "Untitled Brief"}
          </h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {brief.blocks.length === 0 ? (
          <div className="rounded-lg px-6 py-12 text-center text-sm" style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--muted)" }}>
            No content available for this brief.
          </div>
        ) : (
          <div>{brief.blocks.map(renderBlock)}</div>
        )}
      </div>
    </div>
  );
}