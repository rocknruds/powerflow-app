export type DriverType =
  | "Authority"
  | "Reach"
  | "Dependency"
  | "Constraint"
  | "External";

export interface KeyDriver {
  type: DriverType | null;
  label: string;
  detail: string;
}

const VALID_TYPES = new Set<string>([
  "Authority",
  "Reach",
  "Dependency",
  "Constraint",
  "External",
]);

/**
 * Parse a scoreReasoning string into structured key driver blocks.
 *
 * Supports two formats:
 * 1. Tagged: "[Type — Label] Detail sentence." (new structured format)
 * 2. Plain text fallback: splits by sentence into untagged drivers
 */
export function parseKeyDrivers(text: string): KeyDriver[] {
  if (!text) return [];

  // Try tagged format: [Type — Label] Detail
  // Supports both em-dash (—) and en-dash (–)
  const taggedPattern =
    /\[(\w+)\s*[—–-]\s*([^\]]+)\]\s*((?:(?!\[(?:\w+)\s*[—–-]).)*)/g;
  const drivers: KeyDriver[] = [];
  let match;

  while ((match = taggedPattern.exec(text)) !== null) {
    const rawType = match[1].trim();
    const label = match[2].trim();
    const detail = match[3].trim().replace(/\s+/g, " ");

    drivers.push({
      type: VALID_TYPES.has(rawType) ? (rawType as DriverType) : null,
      label,
      detail: detail.replace(/\.?$/, ""), // trim trailing period for consistency
    });
  }

  if (drivers.length > 0) return drivers;

  // Fallback: split plain text into sentences
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);

  return sentences.map((sentence) => ({
    type: null,
    label: "",
    detail: sentence.replace(/\.?$/, ""),
  }));
}
