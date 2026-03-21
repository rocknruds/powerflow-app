import Link from "next/link";
import type { ScenarioWithActors } from "@/lib/scenarios";

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
}

/* ── Color mapping ── */

function scenarioClassColor(className: string): string {
  switch (className) {
    case "Escalation":
    case "State Collapse":
      return "var(--delta-down)";
    case "Power Transition":
    case "External Shock":
      return "var(--score-mid)";
    case "De-escalation":
    case "Structural Drift":
    case "Black Swan":
      return "var(--accent)";
    default:
      return "var(--muted-foreground)";
  }
}

/**
 * Extract a display percentage from the Probability Estimate select label.
 * "High (50–70%)" → "60%", "Very High (>70%)" → "85%", "Speculative (<10%)" → "5%"
 */
function probabilityDisplay(label: string): string | null {
  if (!label) return null;
  // Range pattern: "High (50–70%)"
  const range = label.match(/(\d+)\s*[–\-]\s*(\d+)%/);
  if (range) return `${Math.round((+range[1] + +range[2]) / 2)}%`;
  // Greater-than pattern: "Very High (>70%)"
  const gt = label.match(/>(\d+)%/);
  if (gt) return `${+gt[1] + 15}%`;
  // Less-than pattern: "Speculative (<10%)"
  const lt = label.match(/<(\d+)%/);
  if (lt) return `${Math.round(+lt[1] / 2)}%`;
  return null;
}

function probabilityMidpoint(label: string): number | null {
  const display = probabilityDisplay(label);
  if (!display) return null;
  return parseInt(display, 10);
}

function probabilityColor(label: string): string {
  const mid = probabilityMidpoint(label);
  if (mid === null) return "var(--muted-foreground)";
  if (mid >= 60) return "var(--delta-down)";
  if (mid >= 30) return "var(--score-mid)";
  return "var(--muted-foreground)";
}

function timeHorizonShort(label: string | null): string | null {
  if (!label) return null;
  return label
    .replace(/months/g, "mo")
    .replace(/month/g, "mo")
    .replace(/years/g, "yr")
    .replace(/year/g, "yr");
}

/* ── Component ── */

export default function ScenarioCard({ scenario }: { scenario: ScenarioWithActors }) {
  const classColor = scenarioClassColor(scenario.scenarioClass);
  const probColor = probabilityColor(scenario.probabilityEstimate);
  const probText = probabilityDisplay(scenario.probabilityEstimate);
  const horizon = timeHorizonShort(scenario.timeHorizon);

  return (
    <>
    <style>{`
      .scenario-card:hover {
        border-color: color-mix(in srgb, var(--accent) 30%, var(--border)) !important;
        box-shadow: 0 2px 12px color-mix(in srgb, var(--accent) 6%, transparent);
      }
    `}</style>
    <div
      className="scenario-card rounded-[10px] overflow-hidden flex flex-col transition-[border-color,box-shadow] duration-200"
      style={{
        border: "1px solid var(--border)",
        backgroundColor: "var(--surface)",
      }}
    >
      {/* Zone 1: Status bar */}
      <div
        className="flex items-center justify-between px-3.5 py-2.5"
        style={{
          borderBottom: "1px solid var(--border)",
          backgroundColor: "var(--surface-raised)",
        }}
      >
        {scenario.scenarioClass && (
          <span
            className="text-[10px] font-semibold uppercase tracking-wide px-2 py-[3px] rounded"
            style={{
              background: `color-mix(in srgb, ${classColor} 12%, transparent)`,
              border: `1px solid color-mix(in srgb, ${classColor} 22%, transparent)`,
              color: classColor,
              lineHeight: 1,
            }}
          >
            {scenario.scenarioClass}
          </span>
        )}
        {probText && (
          <div
            className="flex items-center gap-[5px] text-xs font-bold font-mono tabular-nums px-2.5 py-[3px] rounded-[5px]"
            style={{
              background: `color-mix(in srgb, ${probColor} 12%, transparent)`,
              border: `1px solid color-mix(in srgb, ${probColor} 25%, transparent)`,
              color: probColor,
              lineHeight: 1,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: probColor }}
            />
            {probText}
          </div>
        )}
      </div>

      {/* Zone 2: Content body */}
      <div className="px-3.5 pt-3.5 pb-2.5 flex-1 flex flex-col gap-1.5">
        <p
          className="text-[13.5px] font-medium leading-snug"
          style={{ color: "var(--foreground)", letterSpacing: "-0.01em" }}
        >
          {scenario.name || "Unnamed Scenario"}
        </p>
        {scenario.triggerCondition && (
          <p
            className="text-[11.5px] leading-[1.45] line-clamp-2"
            style={{ color: "var(--muted)" }}
          >
            {scenario.triggerCondition}
          </p>
        )}
      </div>

      {/* Zone 3: Actor chips */}
      {scenario.actorNames.length > 0 && (
        <div className="px-3.5 pb-2.5 flex gap-1 flex-wrap">
          {scenario.actorNames.map((name) => (
            <Link
              key={name}
              href={`/actors/${toSlug(name)}`}
              className="text-[10px] px-[7px] py-0.5 rounded transition-opacity hover:opacity-70"
              style={{
                background: "color-mix(in srgb, var(--accent) 8%, transparent)",
                border: "1px solid color-mix(in srgb, var(--accent) 18%, transparent)",
                color: "color-mix(in srgb, var(--accent) 85%, white)",
                lineHeight: 1.4,
              }}
            >
              {name}
            </Link>
          ))}
        </div>
      )}

      {/* Zone 4: Footer */}
      {(scenario.affectedRegions.length > 0 || horizon) && (
        <div
          className="flex items-center justify-between px-3.5 py-2"
          style={{
            borderTop: "1px solid var(--border)",
            backgroundColor: "color-mix(in srgb, var(--surface-raised) 50%, var(--surface))",
          }}
        >
          <div className="flex gap-1 flex-wrap">
            {scenario.affectedRegions.map((region) => (
              <span
                key={region}
                className="text-[9.5px] px-1.5 py-0.5 rounded-[3px]"
                style={{
                  border: "1px solid var(--border)",
                  color: "var(--muted-foreground)",
                  backgroundColor: "var(--surface)",
                  lineHeight: 1.4,
                }}
              >
                {region}
              </span>
            ))}
          </div>
          {horizon && (
            <span
              className="text-[10px] flex items-center gap-1 whitespace-nowrap"
              style={{ color: "var(--muted)" }}
            >
              <svg
                className="w-[11px] h-[11px] opacity-45"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="8" cy="8" r="6" />
                <path d="M8 4.5V8l2.5 1.5" />
              </svg>
              {horizon}
            </span>
          )}
        </div>
      )}
    </div>
    </>
  );
}
