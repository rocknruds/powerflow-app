import MapboxMapClient from "@/components/MapboxMapClient";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-zinc-950">
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Global briefing & geospatial analysis
          </h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Briefing content and map-driven analysis.
          </p>
        </header>
        <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <MapboxMapClient className="min-h-[400px]" />
        </section>
      </main>
    </div>
  );
}
