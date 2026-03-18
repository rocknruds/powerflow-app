import { parseKeyDrivers, type DriverType, type KeyDriver } from "@/lib/parseKeyDrivers";

/* ── Driver type → color mapping ──────────────────────────────────────────── */

const DRIVER_COLORS: Record<DriverType, string> = {
  Authority: "var(--score-authority)",
  Reach: "var(--score-reach)",
  Dependency: "var(--accent)",
  Constraint: "var(--delta-down)",
  External: "var(--muted-foreground)",
};

function driverColor(type: DriverType | null): string {
  return type ? DRIVER_COLORS[type] : "var(--muted)";
}

/* ── Type badge ───────────────────────────────────────────────────────────── */

function DriverTypeBadge({ type }: { type: DriverType }) {
  const color = DRIVER_COLORS[type];
  return (
    <span
      className="text-[10px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded shrink-0"
      style={{
        color,
        backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
      }}
    >
      {type}
    </span>
  );
}

/* ── Single driver row ────────────────────────────────────────────────────── */

function DriverItem({ driver }: { driver: KeyDriver }) {
  const accentColor = driverColor(driver.type);
  const hasLabel = driver.label.length > 0;

  return (
    <div
      className="py-3 pl-4"
      style={{
        borderLeft: `2px solid ${accentColor}`,
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        {driver.type && <DriverTypeBadge type={driver.type} />}
        {hasLabel && (
          <span
            className="text-sm font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            {driver.label}
          </span>
        )}
      </div>
      <p
        className="text-sm leading-relaxed"
        style={{ color: "var(--muted-foreground)" }}
      >
        {driver.detail}
      </p>
    </div>
  );
}

/* ── Exported section ─────────────────────────────────────────────────────── */

export default function KeyDrivers({ reasoning }: { reasoning: string }) {
  const drivers = parseKeyDrivers(reasoning);

  if (drivers.length === 0) {
    // Edge case: very short text that didn't parse into anything useful
    return (
      <p
        className="text-sm leading-relaxed"
        style={{ color: "var(--muted-foreground)" }}
      >
        {reasoning}
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {drivers.map((driver, i) => (
        <DriverItem key={i} driver={driver} />
      ))}
    </div>
  );
}
