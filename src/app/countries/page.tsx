import Link from "next/link";
import { loadAllActors } from "@/lib/actors/load";
import type { ActorType } from "@/lib/actors/types";

const TYPE_ORDER: Record<ActorType, number> = {
  state: 0,
  org: 1,
  nonstate: 2,
};

function sortActorsStatesFirst(actors: ReturnType<typeof loadAllActors>) {
  return [...actors].sort(
    (a, b) => TYPE_ORDER[a.type] - TYPE_ORDER[b.type] || a.name.localeCompare(b.name)
  );
}

export default function CountriesIndexPage() {
  const actors = sortActorsStatesFirst(loadAllActors());

  return (
    <div className="min-h-dvh bg-neutral-100 text-neutral-900">
      <main className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-medium text-neutral-800 mb-2">
          Actors
        </h1>
        <p className="text-neutral-600 text-sm mb-6">
          Select an actor to view its event timeline.
        </p>

        <ul className="space-y-2">
          {actors.map((a) => (
            <li key={a.id}>
              <Link
                href={`/countries/${encodeURIComponent(a.id)}`}
                className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-4 py-3 shadow-sm hover:border-sky-300 hover:bg-sky-50/50 transition-colors"
              >
                <span className="font-medium text-neutral-900">{a.name}</span>
                <span className="text-xs font-medium text-sky-600 uppercase tracking-wider">
                  {a.type}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
