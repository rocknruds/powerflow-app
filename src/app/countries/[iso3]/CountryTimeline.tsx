"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";

interface EventRow {
  id: string;
  date: string;
  type: string;
  title: string;
  summary: string;
  actors: string[];
  significance: number;
}

interface ApiResponse {
  count: number;
  events: EventRow[];
}

const EVENT_TYPES = ["conflict", "border_change", "legal_action", "sanction", "treaty"] as const;

type Props = {
  iso3: string;
  actorName: string | null;
  actorNames: Record<string, string>;
};

export default function CountryTimeline({ iso3, actorName, actorNames }: Props) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [minSig, setMinSig] = useState<number>(1);
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set(EVENT_TYPES));

  useEffect(() => {
    const params = new URLSearchParams({ actors: iso3, limit: "200" });
    fetch(`/api/events?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch events");
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Unknown error"));
  }, [iso3]);

  const filteredEvents = useMemo(() => {
    if (!data?.events) return [];
    return data.events.filter(
      (e) =>
        e.significance >= minSig && (selectedTypes.size === 0 || selectedTypes.has(e.type))
    );
  }, [data, minSig, selectedTypes]);

  const toggleType = (type: string) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  if (error) {
    return (
      <div className="min-h-dvh bg-neutral-100 text-neutral-900 flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const displayName = actorName ?? iso3;

  return (
    <div className="min-h-dvh bg-neutral-100 text-neutral-900">
      <div className="border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="uppercase text-[11px] tracking-[0.28em] text-neutral-600 font-bold">
            World Analysis
          </span>
          <nav className="flex items-center gap-6 text-sm text-neutral-600">
            <Link href="/" className="hover:text-neutral-900">
              Home
            </Link>
            <Link href="/events" className="hover:text-neutral-900">
              Events
            </Link>
            <Link href="/countries" className="hover:text-neutral-900">
              Countries
            </Link>
          </nav>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-medium text-neutral-800 mb-2">
          Timeline: {displayName}
        </h1>
        <p className="text-neutral-600 text-sm mb-6">
          {data
            ? `${filteredEvents.length} of ${data.count} events (min significance ${minSig})`
            : "Loading events…"}
        </p>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-6 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <label htmlFor="minSig" className="text-sm text-neutral-600">
              Min significance
            </label>
            <select
              id="minSig"
              value={minSig}
              onChange={(e) => setMinSig(Number(e.target.value))}
              className="rounded border border-neutral-200 bg-neutral-50 px-2 py-1 text-sm text-neutral-800"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-neutral-600">Type</span>
            <div className="flex flex-wrap gap-3">
              {EVENT_TYPES.map((type) => (
                <label key={type} className="flex items-center gap-1.5 text-sm text-neutral-700">
                  <input
                    type="checkbox"
                    checked={selectedTypes.has(type)}
                    onChange={() => toggleType(type)}
                    className="rounded border-neutral-300 text-sky-600"
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>
        </div>

        <ul className="space-y-4">
          {filteredEvents.map((e) => (
            <li
              key={e.id}
              className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-baseline gap-2 text-sm text-neutral-500">
                <span>{e.date}</span>
                <span className="font-medium text-sky-600">{e.type}</span>
                <span>Sig: {e.significance}</span>
                <span>
                  {e.actors.map((id) => actorNames[id] ?? id).join(", ")}
                </span>
              </div>
              <h2 className="mt-1 font-medium text-neutral-900">{e.title}</h2>
              {e.summary && (
                <p className="mt-1 text-sm text-neutral-600 line-clamp-2">{e.summary}</p>
              )}
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
