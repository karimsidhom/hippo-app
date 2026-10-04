"use client";

import { useState } from "react";
import type { WeeklyHeatmapDay } from "@/lib/types";
import { CHART, ChartEmpty, ChartTooltip, useContainerWidth } from "./chartKit";

interface VolumeHeatmapProps {
  data: WeeklyHeatmapDay[];
  large?: boolean;
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];
const DAY_COL = 30;   // width reserved for Mon / Wed / Fri
const MONTH_ROW = 18; // height reserved for month labels
const GAP = 3;

/** Accent-tinted scale; empty days use the surface colour so both themes work. */
function cellFill(count: number): { fill: string; opacity: number } {
  if (count <= 0) return { fill: "var(--surface2)", opacity: 1 };
  if (count === 1) return { fill: "var(--primary)", opacity: 0.35 };
  if (count === 2) return { fill: "var(--primary)", opacity: 0.6 };
  if (count === 3) return { fill: "var(--primary)", opacity: 0.8 };
  return { fill: "var(--primary)", opacity: 1 };
}

export function VolumeHeatmap({ data, large = false }: VolumeHeatmapProps) {
  const { ref, width } = useContainerWidth(600);
  const [hover, setHover] = useState<{ x: number; y: number; date: string; count: number } | null>(null);

  if (!data || data.length === 0) {
    return <div ref={ref}><ChartEmpty height={96}>No activity yet</ChartEmpty></div>;
  }

  // Group into week columns (7 days each).
  const allWeeks: WeeklyHeatmapDay[][] = [];
  for (let i = 0; i < data.length; i += 7) allWeeks.push(data.slice(i, i + 7));

  // Scale cells to the container. If a full year would make cells smaller
  // than the minimum (phones), show only the most recent weeks that fit
  // instead of forcing a horizontal scroll.
  const maxStep = large ? 20 : 17;
  const minStep = width >= 480 ? 10 : 12;
  const available = Math.max(120, width - DAY_COL);
  const fitWeeks = Math.max(8, Math.floor(available / minStep));
  const weeks = allWeeks.slice(-Math.min(allWeeks.length, fitWeeks));
  const step = Math.min(maxStep, available / weeks.length);
  const cell = Math.max(6, step - GAP);

  const monthPositions: { label: string; col: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, col) => {
    const first = week[0];
    if (!first) return;
    const m = new Date(first.date).getMonth();
    if (m !== lastMonth) {
      // Skip a label that would collide with the previous one.
      const prev = monthPositions[monthPositions.length - 1];
      // ...or would run past the right edge.
      const fitsRight = (weeks.length - col) * step >= 24;
      if ((!prev || (col - prev.col) * step >= 26) && fitsRight) monthPositions.push({ label: MONTH_LABELS[m], col });
      lastMonth = m;
    }
  });

  const svgWidth = DAY_COL + weeks.length * step;
  const svgHeight = MONTH_ROW + 7 * step;
  const totalShown = weeks.flat().reduce((s, d) => s + d.count, 0);
  const activeDays = weeks.flat().filter((d) => d.count > 0).length;

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        role="img"
        aria-label={`${totalShown} cases on ${activeDays} days in the last ${weeks.length} weeks`}
        style={{ display: "block", maxWidth: "100%", fontFamily: CHART.font }}
        onMouseLeave={() => setHover(null)}
      >
        {monthPositions.map(({ label, col }) => (
          <text key={`${label}-${col}`} x={DAY_COL + col * step} y={11} fill={CHART.axis} fontSize={11}>
            {label}
          </text>
        ))}
        {DAY_LABELS.map((label, row) => (
          <text key={row} x={0} y={MONTH_ROW + row * step + cell / 2} fill={CHART.axis} fontSize={10.5}
            dominantBaseline="middle">
            {label}
          </text>
        ))}
        {weeks.map((week, col) =>
          week.map((day, row) => {
            const x = DAY_COL + col * step;
            const y = MONTH_ROW + row * step;
            const { fill, opacity } = cellFill(day.count);
            return (
              <rect
                key={day.dateString}
                x={x}
                y={y}
                width={cell}
                height={cell}
                rx={Math.min(3, cell / 4)}
                fill={fill}
                fillOpacity={opacity}
                stroke={hover?.date === day.dateString ? "var(--text)" : "none"}
                strokeWidth={1}
                onMouseEnter={() => setHover({ x: x + cell / 2, y, date: day.dateString, count: day.count })}
              />
            );
          }),
        )}
      </svg>

      {hover && (
        <ChartTooltip x={hover.x} y={hover.y} containerWidth={width}>
          <span style={{ fontWeight: 600 }}>{hover.count} case{hover.count !== 1 ? "s" : ""}</span>
          <span style={{ color: "var(--text-2)", marginLeft: 6 }}>
            {new Date(`${hover.date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
          </span>
        </ChartTooltip>
      )}

      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 12, marginTop: 10, flexWrap: "wrap",
      }}>
        <span style={{ fontSize: 12, color: CHART.axis }}>
          {totalShown} case{totalShown !== 1 ? "s" : ""} on {activeDays} day{activeDays !== 1 ? "s" : ""}
          {weeks.length < allWeeks.length ? `, last ${weeks.length} weeks` : ", last 12 months"}
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 11, color: CHART.axis, marginRight: 2 }}>Less</span>
          {[0, 1, 2, 3, 4].map((c) => {
            const { fill, opacity } = cellFill(c);
            return (
              <svg key={c} width={11} height={11} aria-hidden>
                <rect width={11} height={11} rx={2.5} fill={fill} fillOpacity={opacity} />
              </svg>
            );
          })}
          <span style={{ fontSize: 11, color: CHART.axis, marginLeft: 2 }}>More</span>
        </span>
      </div>
    </div>
  );
}
