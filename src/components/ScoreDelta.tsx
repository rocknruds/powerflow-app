interface ScoreDeltaProps {
  delta?: number | null;
  className?: string;
}

export default function ScoreDelta({ delta, className }: ScoreDeltaProps) {
  if (delta === undefined || delta === null || delta === 0) {
    return (
      <span
        className={`inline-flex items-center justify-center text-xs tabular-nums min-w-[36px] ${className ?? ""}`}
        style={{ color: "var(--muted)" }}
      >
        —
      </span>
    );
  }
  const positive = delta > 0;
  return (
    <span
      className={`inline-flex items-center justify-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded tabular-nums min-w-[36px] ${className ?? ""}`}
      style={{
        color: positive ? "var(--delta-up)" : "var(--delta-down)",
        backgroundColor: positive
          ? "color-mix(in srgb, var(--delta-up) 12%, transparent)"
          : "color-mix(in srgb, var(--delta-down) 12%, transparent)",
      }}
    >
      {positive ? "▲" : "▼"}
      {Math.round(Math.abs(delta))}
    </span>
  );
}