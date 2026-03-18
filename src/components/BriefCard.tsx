import Link from "next/link";
import type { BriefPublic } from "@/lib/types";

interface BriefCardProps {
  brief: BriefPublic;
}

function formatDate(date: string | null): string {
  if (!date) return "";
  try {
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return date;
  }
}

function BriefTypeBadge({ type }: { type: string | null }) {
  if (!type) return null;
  return (
    <span
      className="text-xs px-2 py-0.5 rounded font-medium"
      style={{ color: "var(--accent)", border: "1px solid color-mix(in srgb, var(--accent) 40%, transparent)", backgroundColor: "color-mix(in srgb, var(--accent) 10%, transparent)" }}
    >
      {type}
    </span>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return null;
  const isFinal = status === "Final";
  return (
    <span
      className="text-xs px-2 py-0.5 rounded font-medium"
      style={{
        color: isFinal ? "var(--delta-up)" : "var(--score-mid)",
        backgroundColor: isFinal ? "color-mix(in srgb, var(--delta-up) 12%, transparent)" : "color-mix(in srgb, var(--score-mid) 12%, transparent)",
      }}
    >
      {status}
    </span>
  );
}

export default function BriefCard({ brief }: BriefCardProps) {
  return (
    <Link href={`/briefs/${brief.id}`} className="block h-full">
      <div
        className="rounded-lg p-5 transition-colors h-full flex flex-col"
        style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <BriefTypeBadge type={brief.briefType} />
          <StatusBadge status={brief.status} />
        </div>
        <h3 className="font-semibold mb-2 line-clamp-2 flex-1" style={{ color: "var(--foreground)" }}>
          {brief.title || "Untitled Brief"}
        </h3>
        {(brief.dateRangeStart || brief.dateRangeEnd) && (
          <p className="text-xs mb-2" style={{ color: "var(--muted)" }}>
            {formatDate(brief.dateRangeStart)}
            {brief.dateRangeEnd && ` – ${formatDate(brief.dateRangeEnd)}`}
          </p>
        )}
        {(brief.summaryDek || brief.leadThesis || brief.bodyPreview) && (
          <p className="text-sm mt-auto pt-2" style={{ color: "var(--muted-foreground)" }}>
            {brief.summaryDek || brief.leadThesis || brief.bodyPreview}
          </p>
        )}
      </div>
    </Link>
  );
}