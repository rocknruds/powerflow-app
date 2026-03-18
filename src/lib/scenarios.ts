import {
  queryDatabase,
  getTitle,
  getText,
  getSelect,
  getMultiSelect,
  getRelationIds,
  getNumber,
} from "./notion";

const SCENARIOS_DB_ID = process.env.NOTION_SCENARIOS_DB_ID ?? '430eb13962d44154b9761785faf01300';

export interface Scenario {
  id: string;
  name: string;
  scenarioClass: string;
  probabilityEstimate: string;
  affectedRegions: string[];
  riskLevel: number | null;
  timeHorizon: string | null;
  triggerCondition: string;
  status: string;
  actorIds: string[];
}

function parseScenario(page: Record<string, unknown>): Scenario {
  const p = (page.properties ?? {}) as Record<string, unknown>;
  return {
    id: page.id as string,
    name: getTitle(p, "Scenario Name"),
    scenarioClass: getSelect(p, "Scenario Class") ?? "",
    probabilityEstimate: getSelect(p, "Probability Estimate") ?? "",
    affectedRegions: getMultiSelect(p, "Affected Regions"),
    riskLevel: getNumber(p, "Risk Level"),
    timeHorizon: getSelect(p, "Time Horizon") ?? null,
    triggerCondition: getText(p, "Trigger Condition") ?? "",
    status: getSelect(p, "Status") ?? "",
    actorIds: getRelationIds(p, "Key Actors"),
  };
}

export async function getActiveScenarios(): Promise<Scenario[]> {
  const pages = await queryDatabase(SCENARIOS_DB_ID, {
    and: [
      { property: "Visibility", select: { equals: "Public" } },
      { property: "Status", select: { equals: "Active" } },
    ],
  });
  return pages.map(parseScenario);
}

export async function getActorScenarios(actorId: string): Promise<Scenario[]> {
  const pages = await queryDatabase(SCENARIOS_DB_ID, {
    and: [
      { property: "Visibility", select: { equals: "Public" } },
      { property: "Key Actors", relation: { contains: actorId } },
    ],
  });
  return pages.map(parseScenario);
}