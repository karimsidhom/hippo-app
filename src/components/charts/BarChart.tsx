"use client";

import { useState } from "react";
import { CHART, ChartEmpty, ChartTooltip, niceTicks, useContainerWidth } from "./chartKit";

interface BarChartDataPoint {
  label: string;
  value: number;
  color?: string;
  /** Longer label for the tooltip (e.g. "Oct 2026" when the axis shows "Oct"). */
  tooltipLabel?: string;
}

interface BarChartProps {
  data: BarChartDataPoint[];
  color?: string;
  height?: number;
  showValues?: boolean;
  horizontal?: boolean;
  formatValue?: (v: number) => string;
}

export function BarChart({
  data,
  color = "var(--primary)",
  height = 200,
  showValues = false,
  horizontal = false,
  formatValue,
}: BarChartProps) {
  const { ref, width } = useContainerWidth();
  const [hover, setHover] = useState<number | null>(null);

  if (!data || data.length === 0 || data.every((d) => d.value === 0)) {
    return <div ref={ref}><ChartEmpty height={height}>No cases in this period</ChartEmpty></div>;
  }

  const fmt = formatValue || ((v: number) => v.toLocaleString());
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  // ── Horizontal (ranked list) ──────────────────────────────────────────
  if (horizontal) {
    // Rendered as HTML rows instead of SVG so long procedure names wrap
    // cleanly and stay readable at any width.
    return (
      <div ref={ref} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {data.map((d, i) => {
          const pct = (d.value / maxValue) * 100;
          return (
            <div
              key={`${d.label}-${i}`}
              title={`${d.tooltipLabel ?? d.label}: ${fmt(d.value)}`}
              style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: "4px 12px", alignItems: "center" }}
            >
              <div style={{
                fontSize: 12.5, color: CHART.label, fontWeight: 500, minWidth: 0,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {d.label}
              </div>
              <div style={{ fontSize: 12, color: CHART.value, fontFamily: CHART.mono, fontWeight: 600 }}>
                {fmt(d.value)}
              </div>
              <div style={{
                gridColumn: "1 / -1", height: 6, borderRadius: 3,
                background: "var(--surface2)", overflow: "hidden",
              }}>
                <div style={{
                  width: `${Math.max(2, pct)}%`, height: "100%", borderRadius: 3,
                  background: d.color || color,
                  transition: "width .6s cubic-bezier(.16,1,.3,1)",
                }} />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ── Vertical ──────────────────────────────────────────────────────────
  const { ticks, max: axisMax } = niceTicks(0, maxValue, 4);
  const tickLabelWidth = Math.max(...ticks.map((t) => fmt(t).length)) * 7 + 10;
  const margin = { top: showValues ? 20 : 12, right: 4, bottom: 28, left: tickLabelWidth };
  const chartWidth = Math.max(40, width - margin.left - margin.right);
  const chartHeight = height - margin.top - margin.bottom;
  const slot = chartWidth / data.length;
  const barWidth = Math.max(4, Math.min(36, slot * 0.62));
  // Thin the x labels when slots get narrow (phones) so they never collide.
  const labelEvery = slot < 22 ? 3 : slot < 30 ? 2 : 1;
  const y = (v: number) => chartHeight - (v / axisMax) * chartHeight;

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} role="img"
        aria-label={data.map((d) => `${d.tooltipLabel ?? d.label} ${fmt(d.value)}`).join(", ")}
        style={{ display: "block", fontFamily: CHART.font }}>
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={0} x2={chartWidth} y1={y(t)} y2={y(t)} stroke={CHART.grid} strokeWidth={1} />
              <text x={-8} y={y(t)} textAnchor="end" dominantBaseline="middle" fill={CHART.axis} fontSize={11}>
                {fmt(t)}
              </text>
            </g>
          ))}

          {data.map((d, i) => {
            const barH = d.value > 0 ? Math.max(2, (d.value / axisMax) * chartHeight) : 0;
            const x = i * slot + (slot - barWidth) / 2;
            const isLast = i === data.length - 1;
            const showLabel = i % labelEvery === 0 || isLast;
            return (
              <g key={`${d.label}-${i}`}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                style={{ cursor: "default" }}>
                {/* Full-height hit area so short bars are easy to hover */}
                <rect x={i * slot} y={0} width={slot} height={chartHeight} fill="transparent" />
                <rect
                  x={x}
                  y={chartHeight - barH}
                  width={barWidth}
                  height={barH}
                  rx={3}
                  fill={d.color || color}
                  opacity={hover === null || hover === i ? 0.95 : 0.45}
                  style={{ transition: "opacity .15s cubic-bezier(.16,1,.3,1)" }}
                />
                {showValues && d.value > 0 && (
                  <text x={x + barWidth / 2} y={chartHeight - barH - 6} textAnchor="middle"
                    fill={CHART.label} fontSize={10.5} fontFamily={CHART.mono}>
                    {fmt(d.value)}
                  </text>
                )}
                {showLabel && (
                  <text x={i * slot + slot / 2} y={chartHeight + 18} textAnchor="middle"
                    fill={CHART.axis} fontSize={11}>
                    {d.label}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {hover !== null && data[hover] && (
        <ChartTooltip
          x={margin.left + hover * slot + slot / 2}
          y={margin.top + y(data[hover].value)}
          containerWidth={width}
        >
          <div style={{ fontWeight: 600 }}>{data[hover].tooltipLabel ?? data[hover].label}</div>
          <div style={{ color: "var(--text-2)", fontFamily: CHART.mono }}>
            {fmt(data[hover].value)} {data[hover].value === 1 ? "case" : "cases"}
          </div>
        </ChartTooltip>
      )}
    </div>
  );
}
