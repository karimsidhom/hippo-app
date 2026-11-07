"use client";

import { useEffect, useRef, useState } from "react";
import type { LearningCurvePoint } from "@/lib/types";
import { getLearningCurveTrendLine } from "@/lib/stats";

interface LearningCurveChartProps {
  data: LearningCurvePoint[];
  procedureName: string;
  height?: number;
}

const AUTONOMY_COLORS: Record<string, string> = {
  OBSERVER: "#64748b",
  ASSISTANT: "#94a3b8",
  SUPERVISOR_PRESENT: "#f59e0b",
  INDEPENDENT: "#10b981",
  TEACHING: "#6366f1",
};

export function LearningCurveChart({ data, procedureName, height = 240 }: LearningCurveChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; point: LearningCurvePoint } | null>(null);
  const [animated, setAnimated] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 500 });

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({ width: entry.contentRect.width });
      }
    });
    if (svgRef.current?.parentElement) {
      observer.observe(svgRef.current.parentElement);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, [data]);

  if (!data || data.length < 2) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-[#64748b] text-sm">Need at least 2 cases to show learning curve</p>
      </div>
    );
  }

  const margin = { top: 16, right: 16, bottom: 40, left: 50 };
  const width = dimensions.width || 500;
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const xMin = 1;
  const xMax = data.length;
  const durations = data.map((d) => d.duration);
  const yMin = Math.max(0, Math.min(...durations) - 20);
  const yMax = Math.max(...durations) + 20;

  const xScale = (x: number) => ((x - xMin) / (xMax - xMin)) * chartWidth;
  const yScale = (y: number) => chartHeight - ((y - yMin) / (yMax - yMin)) * chartHeight;

  // Build path from data
  const linePath = data
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(p.caseNumber).toFixed(1)} ${yScale(p.duration).toFixed(1)}`)
    .join(" ");

  // Trend line
  const trendPoints = getLearningCurveTrendLine(data);
  const trendPath = trendPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(p.x).toFixed(1)} ${yScale(p.y).toFixed(1)}`)
    .join(" ");

  // Grid lines
  const yGridCount = 5;
  const yGridLines = Array.from({ length: yGridCount }, (_, i) => {
    const value = yMin + ((yMax - yMin) / (yGridCount - 1)) * i;
    return { y: yScale(value), value: Math.round(value) };
  });

  const xGridCount = Math.min(data.length, 6);
  const xGridLines = Array.from({ length: xGridCount }, (_, i) => {
    const value = Math.round(1 + ((data.length - 1) / (xGridCount - 1)) * i);
    return { x: xScale(value), value };
  });

  const pathLength = 2000; // estimate

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
      >
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {/* Grid lines */}
          {yGridLines.map(({ y, value }) => (
            <g key={value}>
              <line
                x1={0}
                x2={chartWidth}
                y1={y}
                y2={y}
                stroke="#1e2130"
                strokeWidth={1}
              />
              <text
                x={-8}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                fill="#64748b"
                fontSize={11}
              >
                {value}m
              </text>
            </g>
          ))}

          {xGridLines.map(({ x, value }) => (
            <g key={value}>
              <line
                x1={x}
                x2={x}
                y1={0}
                y2={chartHeight}
                stroke="#1e2130"
                strokeWidth={1}
                strokeDasharray="3,3"
              />
              <text
                x={x}
                y={chartHeight + 16}
                textAnchor="middle"
                fill="#64748b"
                fontSize={11}
              >
                {value}
              </text>
            </g>
          ))}

          {/* Axis labels */}
          <text
            x={chartWidth / 2}
            y={chartHeight + 34}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize={11}
          >
            Case Number
          </text>
          <text
            x={-28}
            y={chartHeight / 2}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize={11}
            transform={`rotate(-90, -28, ${chartHeight / 2})`}
          >
            OR Time (min)
          </text>

          {/* Trend line */}
          <path
            d={trendPath}
            fill="none"
            stroke="#2563eb"
            strokeWidth={2}
            strokeDasharray="6,4"
            opacity={0.6}
          />

          {/* Main line */}
          <path
            d={linePath}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={animated ? "none" : pathLength}
            strokeDashoffset={animated ? 0 : pathLength}
            style={!animated ? {} : { transition: "stroke-dashoffset 1.5s ease-out" }}
          />

          {/* Data points */}
          {data.map((point) => {
            const cx = xScale(point.caseNumber);
            const cy = yScale(point.duration);
            const color = AUTONOMY_COLORS[point.autonomyLevel] || "#3b82f6";
            return (
              <circle
                key={point.caseNumber}
                cx={cx}
                cy={cy}
                r={5}
                fill={color}
                stroke="#111118"
                strokeWidth={1.5}
                className="cursor-pointer hover:r-7 transition-all"
                onMouseEnter={(e) => {
                  const rect = svgRef.current?.getBoundingClientRect();
                  if (rect) {
                    setTooltip({
                      x: cx + margin.left,
                      y: cy + margin.top,
                      point,
                    });
                  }
                }}
                onMouseLeave={() => setTooltip(null)}
              />
            );
          })}
        </g>
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute pointer-events-none z-10 bg-[#1a1a26] border border-[#252838] rounded-lg px-3 py-2 text-xs shadow-card-hover"
          style={{
            left: Math.min(tooltip.x + 12, (dimensions.width || 500) - 160),
            top: tooltip.y - 40,
          }}
        >
          <p className="font-semibold text-[#f1f5f9]">Case #{tooltip.point.caseNumber}</p>
          <p className="text-[#94a3b8]">Duration: {tooltip.point.duration} min</p>
          <p className="text-[#94a3b8]">
            Date: {new Date(tooltip.point.date).toLocaleDateString("en-CA")}
          </p>
          <p style={{ color: AUTONOMY_COLORS[tooltip.point.autonomyLevel] }}>
            {tooltip.point.autonomyLevel.replace(/_/g, " ")}
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-2">
        {Object.entries(AUTONOMY_COLORS).map(([key, color]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs text-[#64748b]">{key.replace(/_/g, " ").toLowerCase()}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-[#2563eb] opacity-60" style={{ borderTop: "2px dashed #2563eb" }} />
          <span className="text-xs text-[#64748b]">trend</span>
        </div>
      </div>
    </div>
  );
}
