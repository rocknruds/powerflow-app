import { queryDatabase, getTitle, getText, getSelect, getDate } from "./notion";

const ASSESSMENTS_DB_ID = process.env.NOTION_ASSESSMENTS_DB_ID ?? "e6a475420b96467ab43e77632f7a7032";

export interface Assessment {
  title: string;
  currentPosition: string;
  analystCommentary: string;
  pfSignal: string;
  confidenceLevel: string;
  timePeriod: string | null;
  notionUrl: string;
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
    title: getTitle(p, "Name") || getTitle(p, "Title"),
    currentPosition: getText(p, "Current Position"),
    analystCommentary: getText(p, "Analyst Commentary"),
    pfSignal: getSelect(p, "PF Signal") ?? "",
    confidenceLevel: getSelect(p, "Confidence Level") ?? "",
    timePeriod: getDate(p, "Time Period"),
    notionUrl: (page.url as string) ?? "",
  };
}
