"use client";

import { useState } from "react";
import { CHART, ChartEmpty, ChartTooltip, niceTicks, useContainerWidth } from "./chartKit";

interface LineChartDataPoint {
  label: string;
  value: number;
  secondary?: number;
}

interface LineChartProps {
  data: LineChartDataPoint[];
  color?: string;
  height?: number;
  yMin?: number;
  yMax?: number;
  formatY?: (v: number) => string;
  showArea?: boolean;
  showPoints?: boolean;
}

export function LineChart({
  data,
  color = "#2563eb",
  height = 200,
  yMin,
  yMax,
  formatY,
  showArea = true,
  showPoints = true,
}: LineChartProps) {
  const { ref: containerRef, width } = useContainerWidth();
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    label: string;
    value: number;
    secondary?: number;
  } | null>(null);

  const activeData = data.filter((d) => d.value > 0 || d.value === 0);
  if (!activeData.length) {
    return <div ref={containerRef}><ChartEmpty height={height}>No data yet</ChartEmpty></div>;
  }

  const fmt = formatY || ((v: number) => Math.round(v).toString());

  const values = data.map((d) => d.value);
  const nice = niceTicks(
    yMin ?? Math.max(0, Math.min(...values)),
    yMax ?? Math.max(...values),
    yMin !== undefined && yMax !== undefined ? 5 : 4,
  );
  const dataMin = yMin ?? nice.min;
  const dataMax = yMax ?? nice.max;
  const range = dataMax - dataMin || 1;
  const ticks = nice.ticks.filter((t) => t >= dataMin && t <= dataMax);

  const tickLabelWidth = Math.max(...ticks.map((t) => fmt(t).length)) * 7 + 12;
  const margin = { top: 16, right: 16, bottom: 32, left: tickLabelWidth };
  const chartWidth = Math.max(40, width - margin.left - margin.right);
  const chartHeight = height - margin.top - margin.bottom;

  const xScale = (i: number) => (i / Math.max(data.length - 1, 1)) * chartWidth;
  const yScale = (v: number) => chartHeight - ((v - dataMin) / range) * chartHeight;

  const linePath = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${xScale(i).toFixed(1)} ${yScale(d.value).toFixed(1)}`)
    .join(" ");

  const areaPath = `${linePath} L ${xScale(data.length - 1).toFixed(1)} ${chartHeight} L 0 ${chartHeight} Z`;

  const yGridLines = ticks.map((value) => ({ y: yScale(value), value }));
  const showEvery = Math.max(1, Math.ceil(data.length / Math.max(2, Math.floor(chartWidth / 56))));
  const gradId = `lineGrad-${color.replace(/[^a-z0-9]/gi, "")}`;

  return (
    <div ref={containerRef} className="relative w-full">
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block", fontFamily: CHART.font }}>
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {/* Grid lines */}
          {yGridLines.map(({ y, value }) => (
            <g key={value}>
              <line x1={0} x2={chartWidth} y1={y} y2={y} stroke={CHART.grid} strokeWidth={1} />
              <text x={-8} y={y} textAnchor="end" dominantBaseline="middle" fill={CHART.axis} fontSize={11}>
                {fmt(value)}
              </text>
            </g>
          ))}

          {/* X axis labels */}
          {data.map((d, i) => {
            if (i % showEvery !== 0 && i !== data.length - 1) return null;
            return (
              <text
                key={i}
                x={xScale(i)}
                y={chartHeight + 20}
                textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"}
                fill={CHART.axis}
                fontSize={11}
              >
                {d.label}
              </text>
            );
          })}

          {/* Area fill */}
          {showArea && (
            <defs>
              <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
          )}
          {showArea && (
            <path
              d={areaPath}
              fill={`url(#${gradId})`}
            />
          )}

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points */}
          {showPoints &&
            data.map((d, i) => (
              <circle
                key={i}
                cx={xScale(i)}
                cy={yScale(d.value)}
                r={d.value > 0 ? (tooltip?.label === d.label ? 5.5 : 4) : 0}
                fill={color}
                stroke="var(--bg)"
                strokeWidth={1.5}
                className="cursor-pointer"
                onMouseEnter={() =>
                  setTooltip({ x: xScale(i) + margin.left, y: yScale(d.value) + margin.top, label: d.label, value: d.value, secondary: d.secondary })
                }
                onMouseLeave={() => setTooltip(null)}
              />
            ))}
        </g>
      </svg>

      {tooltip && (
        <ChartTooltip x={tooltip.x} y={tooltip.y} containerWidth={width}>
          <div style={{ fontWeight: 600 }}>{tooltip.label}</div>
          <div style={{ color: "var(--text-2)", fontFamily: CHART.mono }}>
            {fmt(tooltip.value)}
            {tooltip.secondary !== undefined ? ` · ${tooltip.secondary} ${tooltip.secondary === 1 ? "case" : "cases"}` : ""}
          </div>
        </ChartTooltip>
      )}
    </div>
  );
}
