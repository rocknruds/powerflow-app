import { queryDatabase, fetchPage, getTitle, getText, getSelect, getMultiSelect, getDate, getNumber, getRelationIds } from "./notion";

const ASSESSMENTS_DB_ID = process.env.NOTION_ASSESSMENTS_DB_ID ?? "e6a475420b96467ab43e77632f7a7032";

export interface Assessment {
  id: string;
  title: string;
  currentPosition: string;
  analystCommentary: string;
  pfSignal: string;
  confidenceLevel: string;
  timePeriod: string | null;
  notionUrl: string;
  outlook: string;
  periodReview: string;
  primaryDrivers: string[];
  riskProfile: string[];
  region: string | null;
  pfScore: number | null;
  generatedOn: string | null;
}

export interface AssessmentSummary {
  id: string;
  title: string;
  region: string | null;
  pfSignal: string | null;
  pfScore: number | null;
  confidenceLevel: string | null;
  timePeriod: string | null;
  generatedOn: string | null;
  analystCommentary: string;
  currentPosition: string;
  notionUrl: string;
  actorIds: string[];
}

export async function getLatestAssessment(actorId: string): Promise<Assessment | null> {
  const pages = await queryDatabase(
    ASSESSMENTS_DB_ID,
    {
      and: [
        { property: "Actor", relation: { contains: actorId } },
        { property: "Visibility", select: { equals: "Public" } },
      ],
    },
    [{ property: "Generated On", direction: "descending" }],
    300
  );

  if (pages.length === 0) return null;

  const page = pages[0];
  const p = page.properties ?? {};

  return {
    id: page.id as string,
    title: getTitle(p, "Title") || getTitle(p, "Name"),
    currentPosition: getText(p, "Current Position"),
    analystCommentary: getText(p, "Analyst Commentary"),
    pfSignal: getSelect(p, "PF Signal") ?? "",
    confidenceLevel: getSelect(p, "Confidence Level") ?? "",
    timePeriod: getDate(p, "Time Period"),
    notionUrl: (page.url as string) ?? "",
    outlook: getText(p, "Outlook"),
    periodReview: getText(p, "Period Review"),
    primaryDrivers: getMultiSelect(p, "Primary Drivers"),
    riskProfile: getMultiSelect(p, "Risk Profile"),
    region: getSelect(p, "Region"),
    pfScore: getNumber(p, "PF Score (0-100)"),
    generatedOn: getDate(p, "Generated On"),
  };
}

export async function getAssessmentById(id: string): Promise<Assessment | null> {
  const page = await fetchPage(id);
  if (!page) return null;
  const p = page.properties ?? {};
  return {
    id: page.id as string,
    title: getTitle(p, "Title") || getTitle(p, "Name"),
    currentPosition: getText(p, "Current Position"),
    analystCommentary: getText(p, "Analyst Commentary"),
    pfSignal: getSelect(p, "PF Signal") ?? "",
    confidenceLevel: getSelect(p, "Confidence Level") ?? "",
    timePeriod: getDate(p, "Time Period"),
    notionUrl: (page.url as string) ?? "",
    outlook: getText(p, "Outlook"),
    periodReview: getText(p, "Period Review"),
    primaryDrivers: getMultiSelect(p, "Primary Drivers"),
    riskProfile: getMultiSelect(p, "Risk Profile"),
    region: getSelect(p, "Region"),
    pfScore: getNumber(p, "PF Score (0-100)"),
    generatedOn: getDate(p, "Generated On"),
  };
}

export async function getLatestPublicAssessment(): Promise<(AssessmentSummary & { actorSlug: string | null }) | null> {
  const pages = await queryDatabase(
    ASSESSMENTS_DB_ID,
    { property: "Visibility", select: { equals: "Public" } },
    [{ timestamp: "created_time", direction: "descending" }],
    300
  );

  if (pages.length === 0) return null;

  const page = pages[0];
  const p = page.properties ?? {};

  const actorIds = getRelationIds(p, "Actor");
  let actorSlug: string | null = null;
  if (actorIds.length > 0) {
    const { getActorById } = await import("./actors");
    const actor = await getActorById(actorIds[0]);
    if (actor) actorSlug = actor.slug;
  }

  return {
    id: page.id as string,
    title: getTitle(p, "Name") || getTitle(p, "Title"),
    region: getSelect(p, "Region"),
    pfSignal: getSelect(p, "PF Signal"),
    pfScore: getNumber(p, "PF Score (0-100)"),
    confidenceLevel: getSelect(p, "Confidence Level"),
    timePeriod: getDate(p, "Time Period"),
    generatedOn: getDate(p, "Generated On") ?? page.created_time?.slice(0, 10) ?? null,
    analystCommentary: getText(p, "Analyst Commentary"),
    currentPosition: getText(p, "Current Position"),
    notionUrl: (page.url as string) ?? "",
    actorIds,
    actorSlug,
  };
}

export async function getAllAssessments(): Promise<AssessmentSummary[]> {
  const pages = await queryDatabase(
    ASSESSMENTS_DB_ID,
    { property: "Visibility", select: { equals: "Public" } },
    [{ property: "Generated On", direction: "descending" }],
    300
  );

  return pages.map((page) => {
    const p = page.properties ?? {};
    return {
      id: page.id as string,
      title: getTitle(p, "Name") || getTitle(p, "Title"),
      region: getSelect(p, "Region"),
      pfSignal: getSelect(p, "PF Signal"),
      pfScore: getNumber(p, "PF Score (0-100)"),
      confidenceLevel: getSelect(p, "Confidence Level"),
      timePeriod: getDate(p, "Time Period"),
      generatedOn: getDate(p, "Generated On"),
      analystCommentary: getText(p, "Analyst Commentary"),
      currentPosition: getText(p, "Current Position"),
      notionUrl: (page.url as string) ?? "",
      actorIds: getRelationIds(p, "Actor"),
    };
  });
}
