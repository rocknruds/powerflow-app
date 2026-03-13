import Link from "next/link";
import type { BriefPublic } from "@/lib/types";

interface BriefCardProps {
  brief: BriefPublic;
}

function formatDate(date: string | null): string {
  if (!date) return "";
  try {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return date;
  }
}

function BriefTypeBadge({ type }: { type: string | null }) {
  if (!type) return null;
  return (
    <span className="text-xs px-2 py-0.5 rounded border border-[#3b82f6]/40 text-[#3b82f6] bg-[#3b82f6]/10 font-medium">
      {type}
    </span>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return null;
  const color = status === "Final" ? "#22c55e" : "#eab308";
  return (
    <span
      className="text-xs px-2 py-0.5 rounded font-medium"
      style={{ color, backgroundColor: `${color}18` }}
    >
      {status}
    </span>
  );
}

export default function BriefCard({ brief }: BriefCardProps) {
  return (
    <Link href={`/briefs/${brief.id}`} className="block h-full">
      <div className="bg-[#111111] border border-[#1f2937] rounded-lg p-5 hover:border-[#3b82f6]/50 transition-colors h-full flex flex-col">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <BriefTypeBadge type={brief.briefType} />
          <StatusBadge status={brief.status} />
        </div>
        <h3 className="text-white font-semibold mb-2 line-clamp-2 flex-1">
          {brief.title || "Untitled Brief"}
        </h3>
        {(brief.dateRangeStart || brief.dateRangeEnd) && (
          <p className="text-xs text-gray-500 mb-2">
            {formatDate(brief.dateRangeStart)}
            {brief.dateRangeEnd && ` – ${formatDate(brief.dateRangeEnd)}`}
          </p>
        )}
        {brief.editorialPriority && (
          <p className="text-sm text-gray-400 line-clamp-2 mt-auto pt-2">
            {brief.editorialPriority}
          </p>
        )}
      </div>
    </Link>
  );
}