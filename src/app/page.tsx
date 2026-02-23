import MapboxMapClient from "@/components/MapboxMapClient";

const KEY_DEVELOPMENTS = [
  {
    date: "2025-02-20",
    category: "Conflict" as const,
    title: "Cross-strait patrols intensify after disputed airspace incident",
    summary:
      "PLA Navy and ROC vessels maintained parallel patrol lines in the Taiwan Strait. No direct contact reported; both sides issued standard warnings. Regional partners monitoring for escalation.",
  },
  {
    date: "2025-02-19",
    category: "Legal" as const,
    title: "ICJ ruling on maritime boundary dispute delayed to Q2",
    summary:
      "The Court indicated additional pleadings may be required before a final judgment. Parties have until late March to file supplementary submissions on the new evidence admitted in January.",
  },
  {
    date: "2025-02-18",
    category: "Sanctions" as const,
    title: "EU adopts twelfth package targeting circumvention networks",
    summary:
      "New designations focus on entities facilitating technology transfers and financial channels. Member states agreed to tighten enforcement of existing oil price cap measures.",
  },
  {
    date: "2025-02-17",
    category: "Treaty" as const,
    title: "Regional security pact signing postponed; consultations ongoing",
    summary:
      "Several signatory states requested minor amendments to the ratification annex. Organizers expect a new date within two weeks; the core text remains unchanged.",
  },
  {
    date: "2025-02-16",
    category: "Conflict" as const,
    title: "Ceasefire talks resume with third-party mediation",
    summary:
      "Indirect negotiations continued in a neutral venue. No breakthrough announced; humanitarian corridors and prisoner exchange were discussed. Next round tentatively set for early March.",
  },
];

const WATCHLIST = [
  "Taiwan Strait",
  "Red Sea",
  "Sahel",
  "South China Sea",
  "Ukraine Front",
  "Balkans",
  "Arctic",
  "Gulf",
  "Korea",
  "Horn of Africa",
];

const BRIEFING_QUEUE = [
  {
    title: "Weekly sovereignty digest",
    lastUpdated: "2025-02-19",
    description: "Summary of territorial and jurisdictional developments across monitored regions.",
  },
  {
    title: "Sanctions and enforcement tracker",
    lastUpdated: "2025-02-18",
    description: "Designations, delistings, and enforcement actions by major sanctioning bodies.",
  },
  {
    title: "Treaty and agreement monitor",
    lastUpdated: "2025-02-15",
    description: "Ratifications, withdrawals, and implementation status for key instruments.",
  },
];

const CARD_STYLE =
  "rounded-xl border border-neutral-300/60 bg-white shadow-sm";

export default function Home() {
  return (
    <div className="min-h-dvh bg-neutral-100 text-neutral-900 pb-20">

      {/* Hero banner */}
      <header className="bg-neutral-50 border-b border-neutral-300/70 py-12 md:py-16">
        <div className="max-w-3xl mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="font-sans font-medium text-5xl md:text-6xl leading-tight tracking-tight text-neutral-800">
              Atlas Report
            </h1>
            <p className="mt-5 text-lg leading-snug text-neutral-600">
              Tracking sovereignty, conflict, and shifts in international authority.
            </p>
          </div>
        </div>
      </header>

      {/* Daily Brief + Active Layers (two-card module) */}
      <section className="max-w-3xl mx-auto px-6 py-10 md:py-12 border-t border-neutral-300/80">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`${CARD_STYLE} p-6`}>
            <h2 className="font-medium text-neutral-900 text-[15px] uppercase tracking-[0.12em] mb-3">
              Daily Brief
            </h2>
            <p className="text-[15px] leading-relaxed text-neutral-600">
              Today’s summary of sovereignty shifts, conflict updates, and legal developments across monitored regions. Key headlines and analyst notes in one place.
            </p>
            <p className="mt-3 text-xs text-neutral-500">
              Updated: 2025-02-22
            </p>
            <a
              href="#"
              className="mt-4 inline-block text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors"
            >
              Read today’s brief
            </a>
          </div>
          <div className={`${CARD_STYLE} p-6`}>
            <h2 className="font-medium text-neutral-900 text-[15px] uppercase tracking-[0.12em] mb-3">
              Active Layers
            </h2>
            <p className="text-[15px] leading-relaxed text-neutral-600">
              Toggle conflicts, borders, legal events, and sanctions on the map for context.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Conflicts", "Borders", "Legal Events", "Sanctions"].map((label) => (
                <span
                  key={label}
                  className="rounded-lg border border-neutral-300/60 bg-neutral-50 px-3 py-1.5 text-sm text-neutral-700"
                >
                  {label}
                </span>
              ))}
            </div>
            <a
              href="#"
              className="mt-4 inline-block text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors"
            >
              View map layers
            </a>
          </div>
        </div>
      </section>

      {/* Briefing Queue */}
      <section className="max-w-3xl mx-auto px-6 py-16 border-t border-neutral-300/80">
        <h2 className="uppercase text-[15px] tracking-[0.18em] text-sky-600 font-medium mb-6">
          Briefing Queue
        </h2>
        <div className={`${CARD_STYLE} overflow-hidden`}>
          <ul className="divide-y divide-neutral-200">
            {BRIEFING_QUEUE.map((b) => (
              <li key={b.title} className="p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-medium text-neutral-900">{b.title}</h3>
                  <span className="text-xs text-neutral-500">
                    Last updated: {b.lastUpdated}
                  </span>
                </div>
                <p className="mt-1 text-sm text-neutral-600">
                  {b.description}
                </p>
              </li>
            ))}
          </ul>
          <div className="border-t border-neutral-200 px-6 pb-6 pt-4">
            <a
              href="#"
              className="text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors"
            >
              View all briefings
            </a>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="max-w-3xl mx-auto px-6 py-16 border-t border-neutral-300/80">
        <div className="flex items-center justify-between mb-6">
          <span className="uppercase text-[15px] tracking-[0.18em] text-sky-600 font-medium">
            Map Module
          </span>
          <span className="text-xs text-neutral-600">Updated: —</span>
        </div>
        <div className={`${CARD_STYLE} overflow-hidden`}>
          <MapboxMapClient className="h-[320px] md:h-[420px] w-full" />
        </div>
      </section>

      {/* Watchlist */}
      <section className="max-w-3xl mx-auto px-6 py-16 border-t border-neutral-300/80">
        <h2 className="uppercase text-[15px] tracking-[0.18em] text-sky-600 font-medium mb-6">
          Watchlist
        </h2>
        <div className={`${CARD_STYLE} p-6`}>
          <div className="flex flex-wrap gap-2">
            {WATCHLIST.map((label) => (
              <span
                key={label}
                className="rounded-lg border border-neutral-300/60 bg-neutral-50 px-3 py-1.5 text-sm text-neutral-700"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Key Developments */}
      <section className="max-w-3xl mx-auto px-6 py-16 border-t border-neutral-300/80">
        <h2 className="uppercase text-[15px] tracking-[0.18em] text-sky-600 font-medium mb-6">
          Key Developments
        </h2>
        <div className="space-y-4">
          {KEY_DEVELOPMENTS.map((item) => (
            <article
              key={item.date + item.title.slice(0, 20)}
              className={`${CARD_STYLE} p-6`}
            >
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs text-neutral-500">
                <time dateTime={item.date}>{item.date}</time>
                <span className="font-medium uppercase tracking-wider text-sky-600">
                  {item.category}
                </span>
              </div>
              <h3 className="mt-2 font-medium text-neutral-900">
                {item.title}
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-neutral-600">
                {item.summary}
              </p>
              <a
                href="#"
                className="mt-3 inline-block text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors"
              >
                Read more
              </a>
            </article>
          ))}
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
