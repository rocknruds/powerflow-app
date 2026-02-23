import { loadAllActors, getActorById } from "@/lib/actors/load";
import CountryTimeline from "./CountryTimeline";

interface Props {
  params: Promise<{ iso3: string }>;
}

export default async function CountryPage({ params }: Props) {
  const { iso3: raw } = await params;
  const iso3 = raw.toUpperCase();
  const actor = getActorById(iso3);
  const actors = loadAllActors();
  const actorNames: Record<string, string> = {};
  for (const a of actors) {
    actorNames[a.id.toUpperCase()] = a.name;
    if (a.aliases) for (const al of a.aliases) actorNames[al.toUpperCase()] = a.name;
  }

  return (
    <CountryTimeline
      iso3={iso3}
      actorName={actor?.name ?? null}
      actorNames={actorNames}
    />
  );
}
