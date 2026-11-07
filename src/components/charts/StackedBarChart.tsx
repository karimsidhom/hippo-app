"use client";

import { useState, useRef, useEffect } from "react";

interface StackedBarChartProps {
  data: Record<string, number | string>[];
  keys: string[];
  colors: string[];
  labels: string[];
  height?: number;
}

export function StackedBarChart({
  data,
  keys,
  colors,
  labels,
  height = 280,
}: StackedBarChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(500);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; value: Record<string, number> } | null>(null);

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

  const margin = { top: 16, right: 16, bottom: 40, left: 24 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const totals = data.map((d) => keys.reduce((sum, k) => sum + ((d[k] as number) || 0), 0));
  const maxTotal = Math.max(...totals, 1);

  const barStep = chartWidth / data.length;
  const barWidth = Math.max(8, barStep * 0.7);

  const yGridCount = 4;
  const yGridLines = Array.from({ length: yGridCount + 1 }, (_, i) => ({
    y: chartHeight - (chartHeight / yGridCount) * i,
    value: Math.round((maxTotal / yGridCount) * i),
  }));

  return (
    <div ref={containerRef} className="relative w-full">
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {/* Grid lines */}
          {yGridLines.map(({ y, value }) => (
            <g key={value}>
              <line x1={0} x2={chartWidth} y1={y} y2={y} stroke="#1e2130" strokeWidth={1} />
              <text x={-6} y={y} textAnchor="end" dominantBaseline="middle" fill="#64748b" fontSize={9}>
                {value}
              </text>
            </g>
          ))}

          {/* Stacked bars */}
          {data.map((d, barIndex) => {
            const x = barIndex * barStep + (barStep - barWidth) / 2;
            const total = totals[barIndex];
            let currentY = chartHeight;
            const segments: { y: number; height: number; color: string; key: string; value: number }[] = [];

            for (let ki = 0; ki < keys.length; ki++) {
              const value = (d[keys[ki]] as number) || 0;
              if (value === 0) continue;
              const segHeight = (value / maxTotal) * chartHeight;
              currentY -= segHeight;
              segments.push({ y: currentY, height: segHeight, color: colors[ki], key: keys[ki], value });
            }

            const tooltipValues: Record<string, number> = {};
            keys.forEach((k) => { tooltipValues[k] = (d[k] as number) || 0; });

            return (
              <g key={barIndex}>
                {segments.map((seg) => (
                  <rect
                    key={seg.key}
                    x={x}
                    y={seg.y}
                    width={barWidth}
                    height={Math.max(1, seg.height)}
                    fill={seg.color}
                    opacity={0.85}
                    className="cursor-pointer hover:opacity-100 transition-opacity"
                    onMouseEnter={() =>
                      setTooltip({
                        x: x + barWidth / 2 + margin.left,
                        y: seg.y + margin.top,
                        label: d.month as string,
                        value: tooltipValues,
                      })
                    }
                    onMouseLeave={() => setTooltip(null)}
                  />
                ))}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight + 14}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize={9}
                >
                  {(d.month as string)?.slice(0, 3) || barIndex + 1}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-2">
        {keys.map((key, i) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: colors[i] }} />
            <span className="text-xs text-[#64748b]">{labels[i]}</span>
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute pointer-events-none bg-[#1a1a26] border border-[#252838] rounded-lg px-3 py-2 text-xs z-10 shadow-card-hover"
          style={{ left: Math.min(tooltip.x + 8, width - 160), top: Math.max(0, tooltip.y - 80) }}
        >
          <p className="font-semibold text-[#f1f5f9] mb-1">{tooltip.label}</p>
          {keys.map((key, i) => (
            tooltip.value[key] > 0 && (
              <div key={key} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[i] }} />
                <span className="text-[#94a3b8]">{labels[i]}:</span>
                <span className="text-[#f1f5f9] font-medium">{tooltip.value[key]}</span>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
}
