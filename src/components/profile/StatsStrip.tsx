"use client";

interface StatItem {
  value: string;
  label: string;
}

interface Props {
  totalCases: number;
  streak: number;
  avgORMinutes: number;
  independentRate: number;
}

/** Dynamic stats strip — only shows stats that have meaningful values. */
export function StatsStrip({ totalCases, streak, avgORMinutes, independentRate }: Props) {
  const items: StatItem[] = [];

  // Always show total cases
  items.push({ value: String(totalCases), label: "Cases" });

  // Show streak if > 0
  if (streak > 0) {
    items.push({ value: `${streak}d`, label: "Streak" });
  }

  // Show avg OR if we have cases with durations
  if (avgORMinutes > 0) {
    items.push({ value: `${avgORMinutes}m`, label: "Avg OR" });
  }

  // Show independent rate if we have cases
  if (totalCases > 0) {
    items.push({ value: `${independentRate}%`, label: "Indep." });
  }

  // Cap at 4 stats
  const display = items.slice(0, 4);

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: `repeat(${display.length}, 1fr)`,
      gap: 0,
      padding: "14px 0",
      borderTop: "1px solid var(--border)",
      borderBottom: "1px solid var(--border)",
      marginBottom: 20,
    }}>
      {display.map((s, i) => (
        <div key={s.label} style={{
          paddingLeft: i > 0 ? 12 : 0,
          borderLeft: i > 0 ? "1px solid var(--border)" : "none",
          textAlign: "center",
        }}>
          <div style={{
            fontSize: 20, fontWeight: 600, color: "var(--text)",
            fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums", fontFeatureSettings: '"tnum" 1', letterSpacing: "-0.5px",
          }}>{s.value}</div>
          <div style={{
            fontSize: 11, color: "var(--text-3)", marginTop: 3,
            textTransform: "uppercase", letterSpacing: "0.06em",
            fontWeight: 600,
          }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}
