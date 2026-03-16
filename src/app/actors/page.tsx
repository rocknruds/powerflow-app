import { getAllPublicActors } from "@/lib/actors";
import { getLatestDeltaByActor } from "@/lib/scores";
import ActorTable from "@/components/ActorTable";

export const revalidate = 300;
export const metadata = { title: "Actor Leaderboard" };

export default async function ActorsPage() {
  const [actors, deltaMap] = await Promise.all([getAllPublicActors(), getLatestDeltaByActor()]);

  const snapshotDeltaMap: Record<string, number> = {};
  for (const [id, delta] of deltaMap.entries()) {
    if (delta !== null) snapshotDeltaMap[id] = delta;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      <div className="py-10" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
              PowerFlow Lab
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--foreground)" }}>Actor Leaderboard</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {actors.length} tracked actor{actors.length !== 1 ? "s" : ""} — ranked by PF Score
          </p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-10">
        {actors.length === 0 ? (
          <div className="rounded-lg px-6 py-16 text-center text-sm" style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--muted)" }}>
            No public actors in the database yet.
          </div>
        ) : (
          <ActorTable actors={actors} snapshotDeltaMap={snapshotDeltaMap} />
        )}
      </div>
    </div>
  );
}