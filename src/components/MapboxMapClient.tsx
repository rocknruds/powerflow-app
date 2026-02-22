"use client";

import dynamic from "next/dynamic";

const MapboxMap = dynamic(
  () => import("@/components/MapboxMap").then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[400px] w-full items-center justify-center rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900">
        <span className="text-zinc-500">Loading map…</span>
      </div>
    ),
  }
);

export default function MapboxMapClient({
  className = "",
}: {
  className?: string;
}) {
  return <MapboxMap className={className} />;
}
