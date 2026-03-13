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
        <h1 key={block.id} className="text-2xl font-bold text-white mt-8 mb-3">
          {text}
        </h1>
      );
    case "heading_2":
      return (
        <h2 key={block.id} className="text-xl font-semibold text-white mt-7 mb-2.5">
          {text}
        </h2>
      );
    case "heading_3":
      return (
        <h3 key={block.id} className="text-lg font-semibold text-gray-200 mt-5 mb-2">
          {text}
        </h3>
      );
    case "paragraph":
      return (
        <p key={block.id} className="text-gray-300 leading-relaxed mb-4">
          {text}
        </p>
      );
    case "bulleted_list_item":
      return (
        <li key={block.id} className="text-gray-300 leading-relaxed mb-1 ml-4">
          {text}
        </li>
      );
    case "numbered_list_item":
      return (
        <li key={block.id} className="text-gray-300 leading-relaxed mb-1 ml-4 list-decimal">
          {text}
        </li>
      );
    case "quote":
      return (
        <blockquote
          key={block.id}
          className="border-l-2 border-[#3b82f6] pl-4 my-4 text-gray-400 italic"
        >
          {text}
        </blockquote>
      );
    case "callout":
      return (
        <div
          key={block.id}
          className="border border-[#1f2937] bg-[#111111] rounded-lg px-4 py-3 my-4 text-gray-300 text-sm leading-relaxed"
        >
          {text}
        </div>
      );
    case "divider":
      return <hr key={block.id} className="border-[#1f2937] my-6" />;
    default:
      return text ? (
        <p key={block.id} className="text-gray-400 leading-relaxed mb-3">
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

  const statusColor = brief.status === "Final" ? "#22c55e" : "#eab308";

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="border-b border-[#1f2937] py-10">
        <div className="max-w-3xl mx-auto px-6">
          <Link
            href="/briefs"
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors mb-4 inline-flex items-center gap-1"
          >
            ← Intelligence Briefs
          </Link>

          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {brief.briefType && (
              <span className="text-xs px-2 py-0.5 rounded border border-[#3b82f6]/40 text-[#3b82f6] bg-[#3b82f6]/10 font-medium">
                {brief.briefType}
              </span>
            )}
            {brief.status && (
              <span
                className="text-xs px-2 py-0.5 rounded font-medium"
                style={{ color: statusColor, backgroundColor: `${statusColor}18` }}
              >
                {brief.status}
              </span>
            )}
            {(brief.dateRangeStart || brief.dateRangeEnd) && (
              <span className="text-xs text-gray-500">
                {formatDate(brief.dateRangeStart)}
                {brief.dateRangeEnd && ` – ${formatDate(brief.dateRangeEnd)}`}
              </span>
            )}
          </div>

          <h1 className="text-3xl font-bold text-white leading-tight">
            {brief.title || "Untitled Brief"}
          </h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {brief.blocks.length === 0 ? (
          <div className="rounded-lg border border-[#1f2937] bg-[#111111] px-6 py-12 text-center text-sm text-gray-600">
            No content available for this brief.
          </div>
        ) : (
          <div>{brief.blocks.map(renderBlock)}</div>
        )}
      </div>
    </div>
  );
}