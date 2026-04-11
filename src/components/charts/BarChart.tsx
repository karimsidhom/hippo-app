"use client";

import { useState, useRef, useEffect } from "react";

interface BarChartDataPoint {
  label: string;
  value: number;
  color?: string;
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
  color = "#2563eb",
  height = 200,
  showValues = false,
  horizontal = false,
  formatValue,
}: BarChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(400);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; value: number } | null>(null);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  if (!data || data.length === 0) {
    return <div style={{ height }} className="flex items-center justify-center text-[#64748b] text-sm">No data</div>;
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const displayFmt = formatValue || ((v: number) => v.toString());

  if (horizontal) {
    const itemHeight = Math.min(32, (height - 16) / data.length);
    const labelWidth = 140;
    const chartWidth = width - labelWidth - 60;

    return (
      <div ref={containerRef} className="w-full" style={{ height }}>
        <svg width="100%" height={height} className="overflow-visible">
          {data.map((d, i) => {
            const barWidth = (d.value / maxValue) * chartWidth;
            const y = i * (itemHeight + 4);
            return (
              <g key={d.label}>
                <text
                  x={labelWidth - 8}
                  y={y + itemHeight / 2}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fill="#94a3b8"
                  fontSize={11}
                >
                  {d.label}
                </text>
                <rect
                  x={labelWidth}
                  y={y}
                  width={barWidth}
                  height={itemHeight - 2}
                  rx={3}
                  fill={d.color || color}
                  opacity={0.9}
                  className="cursor-pointer"
                  onMouseEnter={() => setTooltip({ x: labelWidth + barWidth, y, label: d.label, value: d.value })}
                  onMouseLeave={() => setTooltip(null)}
                />
                <text
                  x={labelWidth + barWidth + 6}
                  y={y + itemHeight / 2}
                  dominantBaseline="middle"
                  fill="#64748b"
                  fontSize={10}
                >
                  {d.value}
                </text>
              </g>
            );
          })}
        </svg>
        {tooltip && (
          <div
            className="absolute pointer-events-none bg-[#1a1a26] border border-[#252838] rounded-lg px-2.5 py-1.5 text-xs z-10 shadow-card-hover"
            style={{ left: tooltip.x + 4, top: tooltip.y }}
          >
            <span className="font-semibold text-[#f1f5f9]">{tooltip.label}:</span>
            <span className="text-[#94a3b8] ml-1">{tooltip.value}</span>
          </div>
        )}
      </div>
    );
  }

  // Vertical bar chart
  const margin = { top: 24, right: 8, bottom: 40, left: 32 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  const barWidth = Math.max(4, chartWidth / data.length - 4);
  const barGap = chartWidth / data.length;

  const yGridCount = 4;
  const yGridLines = Array.from({ length: yGridCount + 1 }, (_, i) => ({
    y: chartHeight - (chartHeight / yGridCount) * i,
    value: Math.round((maxValue / yGridCount) * i),
  }));

  return (
    <div ref={containerRef} className="relative w-full">
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {/* Grid lines */}
          {yGridLines.map(({ y, value }, i) => (
            <g key={i}>
              <line x1={0} x2={chartWidth} y1={y} y2={y} stroke="#1e2130" strokeWidth={1} />
              <text x={-6} y={y} textAnchor="end" dominantBaseline="middle" fill="#64748b" fontSize={10}>
                {value}
              </text>
            </g>
          ))}

          {/* Bars */}
          {data.map((d, i) => {
            const barH = Math.max(2, (d.value / maxValue) * chartHeight);
            const x = i * barGap + (barGap - barWidth) / 2;
            const y = chartHeight - barH;
            return (
              <g key={d.label}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barH}
                  rx={3}
                  fill={d.color || color}
                  opacity={0.85}
                  className="cursor-pointer hover:opacity-100 transition-opacity"
                  onMouseEnter={() => setTooltip({ x: x + barWidth / 2 + margin.left, y: y + margin.top, label: d.label, value: d.value })}
                  onMouseLeave={() => setTooltip(null)}
                />
                {showValues && d.value > 0 && (
                  <text
                    x={x + barWidth / 2}
                    y={y - 4}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize={9}
                  >
                    {d.value}
                  </text>
                )}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight + 14}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize={10}
                >
                  {d.label.length > 4 ? d.label.slice(0, 3) : d.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {tooltip && (
        <div
          className="absolute pointer-events-none bg-[#1a1a26] border border-[#252838] rounded-lg px-2.5 py-1.5 text-xs z-10 shadow-card-hover whitespace-nowrap"
          style={{ left: tooltip.x + 8, top: Math.max(0, tooltip.y - 32) }}
        >
          <span className="font-semibold text-[#f1f5f9]">{tooltip.label}:</span>
          <span className="text-[#94a3b8] ml-1">{displayFmt(tooltip.value)}</span>
        </div>
      )}
    </div>
  );
}
