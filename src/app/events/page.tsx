"use client";

import { useEffect, useState } from "react";

interface EventRow {
  id: string;
  date: string;
  type: string;
  title: string;
  actors: string[];
  significance: number;
}

interface ApiResponse {
  count: number;
  events: EventRow[];
}

export default function EventsPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/events?limit=50")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch events");
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Unknown error"));
  }, []);

  if (error) {
    return (
      <div className="min-h-dvh bg-neutral-100 text-neutral-900 flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-dvh bg-neutral-100 text-neutral-900 flex items-center justify-center">
        <p className="text-neutral-500">Loading events…</p>
      </div>
    );
  }

  const events = data.events;

  return (
    <div className="min-h-dvh bg-neutral-100 text-neutral-900">
      <main className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-medium text-neutral-800 mb-2">
          Event Spine (debug)
        </h1>
        <p className="text-neutral-600 text-sm mb-6">
          {data.count} events from /api/events?limit=50, newest first.
        </p>

        <ul className="space-y-4">
          {events.map((e) => (
            <li
              key={e.id}
              className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-baseline gap-2 text-sm text-neutral-500">
                <span>{e.date}</span>
                <span className="font-medium text-sky-600">{e.type}</span>
                <span>Sig: {e.significance}</span>
                <span>{e.actors.join(", ")}</span>
              </div>
              <h2 className="mt-1 font-medium text-neutral-900">{e.title}</h2>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
