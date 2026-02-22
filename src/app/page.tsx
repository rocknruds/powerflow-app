import MapboxMapClient from "@/components/MapboxMapClient";

export default function Home() {
  return (
    <div className="min-h-dvh bg-neutral-100 text-neutral-900">

      {/* Masthead */}
      <div className="border-b border-neutral-200">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="uppercase text-[11px] tracking-[0.28em] text-neutral-600">
            World Analysis
          </span>
          <nav className="flex items-center gap-6 text-sm text-neutral-600">
            <a href="#" className="hover:text-neutral-900">Briefings</a>
            <a href="#" className="hover:text-neutral-900">Map</a>
            <a href="#" className="hover:text-neutral-900">Regions</a>
            <a href="#" className="hover:text-neutral-900">About</a>
          </nav>
        </div>
      </div>

      {/* Header */}
      <header className="max-w-3xl mx-auto px-6 py-12 border-b border-neutral-200">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="font-sans text-5xl md:text-6xl leading-tight tracking-tight text-neutral-800">
            Global Briefing
          </h1>
          <p className="mt-3 text-lg leading-snug text-neutral-600">
            Sovereignty, conflict, and legal authority tracking.
          </p>
        </div>
      </header>

      {/* Briefing Section */}
      <section className="py-8 border-b border-neutral-200">
        <div className="max-w-3xl mx-auto px-6 space-y-6 text-[16px] leading-relaxed text-neutral-700">
          <div>
            <div className="uppercase text-[11px] tracking-[0.22em] text-sky-600/90 mb-2">
              Active Layers
            </div>
            <p>Conflicts • Borders • Legal Events</p>
          </div>

          <div>
            <div className="uppercase text-[11px] tracking-[0.22em] text-sky-600/90 mb-2">
              Daily Brief
            </div>
            <p className="text-neutral-600">Coming soon</p>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between text-xs text-neutral-600 mb-2">
          <span className="uppercase tracking-[0.22em]">Map Module</span>
          <span>Updated: —</span>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white/70 overflow-hidden shadow-[0_0_0_1px_rgba(148,163,184,0.10)]">
          <MapboxMapClient className="h-[320px] md:h-[420px] w-full" />
        </div>
      </section>

    </div>
  );
}

/* Dark theme (for later restore):
 * Page/body bg: dark:bg-[#1f2124], dark:text-neutral-200
 * Borders: dark:border-neutral-800/60
 * Muted text: dark:text-neutral-400, nav dark:hover:text-neutral-100
 * Briefing body: dark:text-neutral-300
 * Map card: dark:bg-neutral-900/40 dark:border-neutral-800/60
 * Label accent: dark:text-sky-400/80
 */