"use client";

import { useState } from "react";
import { CHART, ChartEmpty } from "./chartKit";

interface DonutDataPoint {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutDataPoint[];
  /** Diameter of the ring in px. */
  height?: number;
  /** Ring thickness as a fraction of the radius (0-1). */
  thickness?: number;
  showLegend?: boolean;
  /** Word under the centre number ("cases"). */
  unit?: string;
}

function arcPath(cx: number, cy: number, r: number, inner: number, a0: number, a1: number): string {
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const p = (rad: number, a: number) => `${(cx + rad * Math.cos(a)).toFixed(2)} ${(cy + rad * Math.sin(a)).toFixed(2)}`;
  return [
    `M ${p(r, a0)}`,
    `A ${r} ${r} 0 ${large} 1 ${p(r, a1)}`,
    `L ${p(inner, a1)}`,
    `A ${inner} ${inner} 0 ${large} 0 ${p(inner, a0)}`,
    "Z",
  ].join(" ");
}

export function DonutChart({
  data,
  height = 168,
  thickness = 0.28,
  showLegend = true,
  unit = "total",
}: DonutChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const valid = data.filter((d) => d.value > 0);
  if (valid.length === 0) return <ChartEmpty height={height}>No data yet</ChartEmpty>;

  const total = valid.reduce((s, d) => s + d.value, 0);
  const size = height;
  const cx = size / 2;
  const cy = size / 2;
  const outer = size / 2 - 4;
  const inner = outer * (1 - thickness);
  const gap = valid.length > 1 ? 0.012 : 0; // hairline gap between segments

  let angle = -Math.PI / 2;
  const segments = valid.map((d) => {
    const sweep = (d.value / total) * Math.PI * 2;
    const a0 = angle + gap;
    const a1 = angle + sweep - gap;
    angle += sweep;
    return { ...d, a0, a1, pct: Math.round((d.value / total) * 100) };
  });

  const active = hovered !== null ? segments[hovered] : null;

  return (
    <div style={{
      display: "flex", flexWrap: "wrap", alignItems: "center",
      justifyContent: "center", gap: "16px 24px",
    }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img"
        aria-label={segments.map((s) => `${s.label} ${s.value}`).join(", ")}
        style={{ flexShrink: 0, fontFamily: CHART.font }}>
        {segments.length === 1 ? (
          // A single 100% arc is degenerate in SVG (start == end), which
          // used to render an empty ring. Draw a stroked circle instead.
          <circle cx={cx} cy={cy} r={(outer + inner) / 2} fill="none"
            stroke={segments[0].color} strokeWidth={outer - inner} opacity={0.9}
            onMouseEnter={() => setHovered(0)} onMouseLeave={() => setHovered(null)} />
        ) : (
          segments.map((s, i) => (
            <path
              key={s.label}
              d={arcPath(cx, cy, hovered === i ? outer + 2 : outer, inner, s.a0, s.a1)}
              fill={s.color}
              opacity={hovered === null || hovered === i ? 0.92 : 0.35}
              style={{ transition: "opacity .15s cubic-bezier(.16,1,.3,1)", cursor: "default" }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          ))
        )}
        <text x={cx} y={cy - 2} textAnchor="middle" fill={CHART.value}
          fontSize={22} fontWeight={700} fontFamily={CHART.mono}>
          {active ? `${active.pct}%` : total.toLocaleString()}
        </text>
        <text x={cx} y={cy + 16} textAnchor="middle" fill={CHART.axis} fontSize={11}>
          {active ? (active.label.length > 16 ? active.label.slice(0, 15) + "…" : active.label) : unit}
        </text>
      </svg>

      {showLegend && (
        <ul style={{
          listStyle: "none", margin: 0, padding: 0,
          display: "flex", flexDirection: "column", gap: 7,
          minWidth: 160, flex: "1 1 160px", maxWidth: 280,
        }}>
          {segments.map((s, i) => (
            <li
              key={s.label}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{
                display: "grid", gridTemplateColumns: "10px minmax(0,1fr) auto auto",
                alignItems: "center", gap: 8, fontSize: 12.5,
                opacity: hovered === null || hovered === i ? 1 : 0.45,
                transition: "opacity .15s cubic-bezier(.16,1,.3,1)",
              }}
            >
              <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color }} />
              <span style={{ color: CHART.label, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {s.label}
              </span>
              <span style={{ color: CHART.value, fontFamily: CHART.mono, fontWeight: 600 }}>{s.value}</span>
              <span style={{ color: CHART.axis, fontFamily: CHART.mono, minWidth: 34, textAlign: "right" }}>{s.pct}%</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
