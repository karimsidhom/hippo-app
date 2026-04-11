"use client";

import { useState } from "react";

interface DonutDataPoint {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutDataPoint[];
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  showLegend?: boolean;
}

export function DonutChart({
  data,
  height = 200,
  innerRadius = 45,
  outerRadius = 80,
  showLegend = true,
}: DonutChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const validData = data.filter((d) => d.value > 0);
  if (validData.length === 0) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-[#64748b] text-sm">
        No data available
      </div>
    );
  }

  const total = validData.reduce((sum, d) => sum + d.value, 0);
  const cx = height / 2;
  const cy = height / 2;

  // Calculate SVG arc paths
  let currentAngle = -Math.PI / 2; // Start from top

  const segments = validData.map((d, i) => {
    const angle = (d.value / total) * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const r = hoveredIndex === i ? outerRadius + 5 : outerRadius;

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const ix1 = cx + innerRadius * Math.cos(startAngle);
    const iy1 = cy + innerRadius * Math.sin(startAngle);
    const ix2 = cx + innerRadius * Math.cos(endAngle);
    const iy2 = cy + innerRadius * Math.sin(endAngle);

    const largeArc = angle > Math.PI ? 1 : 0;

    const path = `
      M ${ix1.toFixed(2)} ${iy1.toFixed(2)}
      L ${x1.toFixed(2)} ${y1.toFixed(2)}
      A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}
      L ${ix2.toFixed(2)} ${iy2.toFixed(2)}
      A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1.toFixed(2)} ${iy1.toFixed(2)}
      Z
    `.trim();

    return { ...d, path, angle, percentage: Math.round((d.value / total) * 100) };
  });

  const hoveredSegment = hoveredIndex !== null ? segments[hoveredIndex] : null;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex items-center justify-center">
        <svg width={height} height={height}>
          {segments.map((seg, i) => (
            <path
              key={seg.label}
              d={seg.path}
              fill={seg.color}
              opacity={hoveredIndex === null || hoveredIndex === i ? 0.9 : 0.4}
              className="cursor-pointer transition-all duration-150"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          ))}

          {/* Center text */}
          <text
            x={cx}
            y={cy - 6}
            textAnchor="middle"
            fill="#f1f5f9"
            fontSize={hoveredSegment ? 20 : 22}
            fontWeight="bold"
          >
            {hoveredSegment ? `${hoveredSegment.percentage}%` : total}
          </text>
          <text
            x={cx}
            y={cy + 10}
            textAnchor="middle"
            fill="#64748b"
            fontSize={10}
          >
            {hoveredSegment ? hoveredSegment.label.split(" ")[0] : "total"}
          </text>
        </svg>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
          {segments.map((seg, i) => (
            <div
              key={seg.label}
              className={`flex items-center gap-1.5 cursor-pointer transition-opacity ${
                hoveredIndex === null || hoveredIndex === i ? "opacity-100" : "opacity-40"
              }`}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
              <span className="text-xs text-[#94a3b8]">{seg.label}</span>
              <span className="text-xs text-[#64748b]">({seg.percentage}%)</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
