"use client";

import { useState, useRef, useEffect } from "react";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(400);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    label: string;
    value: number;
  } | null>(null);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const activeData = data.filter((d) => d.value > 0 || d.value === 0);
  if (!activeData.length) {
    return <div style={{ height }} className="flex items-center justify-center text-[#64748b] text-sm">No data</div>;
  }

  const margin = { top: 16, right: 16, bottom: 36, left: 48 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const values = data.map((d) => d.value);
  const dataMin = yMin ?? Math.max(0, Math.min(...values) - 5);
  const dataMax = yMax ?? Math.max(...values) + 5;
  const range = dataMax - dataMin || 1;

  const xScale = (i: number) => (i / Math.max(data.length - 1, 1)) * chartWidth;
  const yScale = (v: number) => chartHeight - ((v - dataMin) / range) * chartHeight;

  const linePath = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${xScale(i).toFixed(1)} ${yScale(d.value).toFixed(1)}`)
    .join(" ");

  const areaPath = `${linePath} L ${xScale(data.length - 1).toFixed(1)} ${chartHeight} L 0 ${chartHeight} Z`;

  const yGridLines = Array.from({ length: 5 }, (_, i) => {
    const value = dataMin + (range / 4) * i;
    return { y: yScale(value), value };
  });

  const fmt = formatY || ((v: number) => Math.round(v).toString());

  return (
    <div ref={containerRef} className="relative w-full">
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {/* Grid lines */}
          {yGridLines.map(({ y, value }) => (
            <g key={value}>
              <line x1={0} x2={chartWidth} y1={y} y2={y} stroke="#1e2130" strokeWidth={1} />
              <text x={-8} y={y} textAnchor="end" dominantBaseline="middle" fill="#64748b" fontSize={10}>
                {fmt(value)}
              </text>
            </g>
          ))}

          {/* X axis labels */}
          {data.map((d, i) => {
            const showEvery = Math.ceil(data.length / 6);
            if (i % showEvery !== 0 && i !== data.length - 1) return null;
            return (
              <text
                key={i}
                x={xScale(i)}
                y={chartHeight + 16}
                textAnchor="middle"
                fill="#64748b"
                fontSize={10}
              >
                {d.label}
              </text>
            );
          })}

          {/* Area fill */}
          {showArea && (
            <defs>
              <linearGradient id={`lineGrad-${color.replace("#", "")}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
          )}
          {showArea && (
            <path
              d={areaPath}
              fill={`url(#lineGrad-${color.replace("#", "")})`}
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
                r={d.value > 0 ? 4 : 0}
                fill={color}
                stroke="#111118"
                strokeWidth={1.5}
                className="cursor-pointer"
                onMouseEnter={() =>
                  setTooltip({ x: xScale(i) + margin.left, y: yScale(d.value) + margin.top, label: d.label, value: d.value })
                }
                onMouseLeave={() => setTooltip(null)}
              />
            ))}
        </g>
      </svg>

      {tooltip && (
        <div
          className="absolute pointer-events-none bg-[#1a1a26] border border-[#252838] rounded-lg px-2.5 py-1.5 text-xs z-10 shadow-card-hover whitespace-nowrap"
          style={{ left: Math.min(tooltip.x + 8, width - 120), top: Math.max(0, tooltip.y - 36) }}
        >
          <p className="font-semibold text-[#f1f5f9]">{tooltip.label}</p>
          <p className="text-[#94a3b8]">{fmt(tooltip.value)}</p>
        </div>
      )}
    </div>
  );
}
