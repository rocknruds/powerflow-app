interface ScoreDeltaProps {
  delta: number;
  className?: string;
}

export default function ScoreDelta({ delta, className }: ScoreDeltaProps) {
  if (!delta || delta === 0) return null;
  const positive = delta > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded tabular-nums ${className ?? ""}`}
      style={{
        color: positive ? "var(--delta-up)" : "var(--delta-down)",
        backgroundColor: positive ? "color-mix(in srgb, var(--delta-up) 12%, transparent)" : "color-mix(in srgb, var(--delta-down) 12%, transparent)",
      }}
    >
      {positive ? "▲" : "▼"}
      {Math.abs(delta) % 1 === 0 ? Math.abs(delta) : Math.abs(delta).toFixed(1)}
    </span>
  );
}