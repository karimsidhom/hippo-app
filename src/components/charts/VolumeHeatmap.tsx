"use client";

import { useState } from "react";
import type { WeeklyHeatmapDay } from "@/lib/types";

interface VolumeHeatmapProps {
  data: WeeklyHeatmapDay[];
  large?: boolean;
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

function getCellColor(count: number): string {
  if (count === 0) return "#16161f";
  if (count === 1) return "#1e3a5f";
  if (count === 2) return "#1d4ed8";
  if (count === 3) return "#2563eb";
  return "#3b82f6";
}

export function VolumeHeatmap({ data, large = false }: VolumeHeatmapProps) {
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    date: string;
    count: number;
  } | null>(null);

  if (!data || data.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 96 }}>
        <p style={{ color: "var(--muted)", fontSize: 13 }}>No data available</p>
      </div>
    );
  }

  const cellSize = large ? 14 : 11;
  const cellGap = 2;
  const cellStep = cellSize + cellGap;

  // Group into weeks (columns), each column = 7 days
  const weeks: WeeklyHeatmapDay[][] = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }

  // Find month label positions
  const monthPositions: { label: string; col: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, colIndex) => {
    const firstDay = week[0];
    if (firstDay) {
      const month = new Date(firstDay.date).getMonth();
      if (month !== lastMonth) {
        monthPositions.push({ label: MONTH_LABELS[month], col: colIndex });
        lastMonth = month;
      }
    }
  });

  const svgWidth = weeks.length * cellStep + 28;
  const svgHeight = 7 * cellStep + 28;

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ position: "relative", display: "inline-block", minWidth: "100%" }}>
        <svg
          width={svgWidth}
          height={svgHeight}
          className="overflow-visible"
          onMouseLeave={() => setTooltip(null)}
        >
          {/* Month labels */}
          {monthPositions.map(({ label, col }) => (
            <text
              key={`${label}-${col}`}
              x={28 + col * cellStep}
              y={10}
              fill="#64748b"
              fontSize={10}
            >
              {label}
            </text>
          ))}

          {/* Day labels */}
          {DAY_LABELS.map((label, row) => (
            <text
              key={row}
              x={0}
              y={20 + row * cellStep + cellSize / 2}
              fill="#64748b"
              fontSize={9}
              dominantBaseline="middle"
            >
              {label}
            </text>
          ))}

          {/* Cells */}
          {weeks.map((week, colIndex) =>
            week.map((day, rowIndex) => {
              const x = 28 + colIndex * cellStep;
              const y = 18 + rowIndex * cellStep;
              const color = getCellColor(day.count);
              return (
                <rect
                  key={day.dateString}
                  x={x}
                  y={y}
                  width={cellSize}
                  height={cellSize}
                  rx={2}
                  fill={color}
                  className="heatmap-cell transition-opacity duration-150"
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const svgRect = e.currentTarget.closest("svg")?.getBoundingClientRect();
                    setTooltip({
                      x: x + cellSize / 2,
                      y: y,
                      date: day.dateString,
                      count: day.count,
                    });
                  }}
                />
              );
            })
          )}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            style={{
              position: "absolute", pointerEvents: "none", zIndex: 10,
              background: "var(--surface2)", border: "1px solid var(--border)",
              borderRadius: 8, padding: "4px 10px", fontSize: 12,
              whiteSpace: "nowrap", left: tooltip.x + 32, top: tooltip.y + 18,
            }}
          >
            <span style={{ fontWeight: 600, color: "var(--text)" }}>{tooltip.count} case{tooltip.count !== 1 ? "s" : ""}</span>
            <span style={{ color: "var(--muted)", marginLeft: 4 }}>on {tooltip.date}</span>
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8 }}>
        <span style={{ fontSize: 11, color: "var(--muted)" }}>Less</span>
        {[0, 1, 2, 3, 4].map(count => (
          <div key={count} style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: getCellColor(count) }} />
        ))}
        <span style={{ fontSize: 11, color: "var(--muted)" }}>More</span>
      </div>
    </div>
  );
}
