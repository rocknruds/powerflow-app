import { getAllPublicBriefs } from "@/lib/briefs";
import BriefCard from "@/components/BriefCard";
import LogoMark from "@/components/LogoMark";

export const revalidate = 300;

export const metadata = {
  title: "Intelligence Briefs",
};

export default async function BriefsPage() {
  const briefs = await getAllPublicBriefs();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      {/* Page header */}
      <div className="border-b border-[#1f2937] py-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-2 mb-2">
            <LogoMark size={10} />
            <span className="text-xs font-semibold uppercase tracking-widest text-[#3b82f6]">
              PowerFlow Lab
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">
            Intelligence Briefs
          </h1>
          <p className="text-gray-500 text-sm">
            {briefs.length} brief{briefs.length !== 1 ? "s" : ""} published
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        {briefs.length === 0 ? (
          <div className="rounded-lg border border-[#1f2937] bg-[#111111] px-6 py-16 text-center text-sm text-gray-600">
            No briefs published yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {briefs.map((brief) => (
              <BriefCard key={brief.id} brief={brief} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
