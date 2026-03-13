import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getAllPublicBriefs, getBriefWithContent } from "@/lib/briefs";

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
  const brief = await getBriefById(id);
  return { title: brief?.title ?? "Brief" };
}

function formatDate(date: string): string {
  if (!date) return "";
  try {
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return date;
  }
}

function renderBlock(block: BriefBlock): React.ReactNode {
  if (!block.text && block.type !== "divider") return null;

  switch (block.type) {
    case "heading_1":
      return (
        <h1 key={block.id} className="text-2xl font-bold text-white mt-8 mb-3">
          {block.text}
        </h1>
      );
    case "heading_2":
      return (
        <h2 key={block.id} className="text-xl font-semibold text-white mt-7 mb-2.5">
          {block.text}
        </h2>
      );
    case "heading_3":
      return (
        <h3 key={block.id} className="text-lg font-semibold text-gray-200 mt-5 mb-2">
          {block.text}
        </h3>
      );
    case "paragraph":
      return (
        <p key={block.id} className="text-gray-300 leading-relaxed mb-4">
          {block.text}
        </p>
      );
    case "bulleted_list_item":
      return (
        <li key={block.id} className="text-gray-300 leading-relaxed mb-1 ml-4">
          {block.text}
        </li>
      );
    case "numbered_list_item":
      return (
        <li key={block.id} className="text-gray-300 leading-relaxed mb-1 ml-4 list-decimal">
          {block.text}
        </li>
      );
    case "quote":
      return (
        <blockquote
          key={block.id}
          className="border-l-2 border-[#3b82f6] pl-4 my-4 text-gray-400 italic"
        >
          {block.text}
        </blockquote>
      );
    case "divider":
      return <hr key={block.id} className="border-[#1f2937] my-6" />;
    default:
      return block.text ? (
        <p key={block.id} className="text-gray-400 leading-relaxed mb-3">
          {block.text}
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

  const result = await getBriefWithContent(id);
  if (!result) notFound();
  const { brief, blocks } = result;

  if (!brief) notFound();

  const statusColor = brief.status === "Final" ? "#22c55e" : "#eab308";

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Page header */}
      <div className="border-b border-[#1f2937] py-10">
        <div className="max-w-3xl mx-auto px-6">
          <Link
            href="/briefs"
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors mb-4 inline-flex items-center gap-1"
          >
            ← Intelligence Briefs
          </Link>

          {/* Metadata */}
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
            {(brief.periodStart || brief.periodEnd) && (
              <span className="text-xs text-gray-500">
                {formatDate(brief.periodStart)}
                {brief.periodEnd && ` – ${formatDate(brief.periodEnd)}`}
              </span>
            )}
            {brief.generatedBy && (
              <span className="text-xs text-gray-600">by {brief.generatedBy}</span>
            )}
          </div>

          <h1 className="text-3xl font-bold text-white leading-tight">
            {brief.title || "Untitled Brief"}
          </h1>
        </div>
      </div>

      {/* Brief content */}
      <div className="max-w-3xl mx-auto px-6 py-10">
        {blocks.length === 0 ? (
          <div className="rounded-lg border border-[#1f2937] bg-[#111111] px-6 py-12 text-center text-sm text-gray-600">
            No content available for this brief.
          </div>
        ) : (
          <div className="prose-custom">{blocks.map(renderBlock)}</div>
        )}
      </div>
    </div>
  );
}
