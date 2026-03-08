import {
  queryDatabase,
  getTitle,
  getText,
  getSelect,
  getRelationIds,
  getNumber,
} from "./notion";

const SCENARIOS_DB_ID = process.env.NOTION_SCENARIOS_DB_ID ?? '430eb13962d44154b9761785faf01300';

export interface Scenario {
  id: string;
  name: string;
  scenarioClass: string;
  probabilityEstimate: number | string;
  triggerCondition: string;
  status: string;
  actorIds: string[];
}

function parseScenario(page: Record<string, any>): Scenario {
  const p = page.properties ?? {};
  const probNum = getNumber(p, "Probability Estimate");
  const probStr = getSelect(p, "Probability Estimate");
  return {
    id: page.id as string,
    name: getTitle(p, "Name"),
    scenarioClass: getSelect(p, "Scenario Class"),
    probabilityEstimate: probNum ?? probStr ?? "",
    triggerCondition: getText(p, "Trigger Condition"),
    status: getSelect(p, "Status"),
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