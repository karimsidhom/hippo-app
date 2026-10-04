"use client";

/**
 * Shared chart primitives: theme colours (CSS variables, so light mode and
 * the clinic module re-skin charts for free), "nice" axis ticks, a
 * container-width hook and a themed tooltip.
 */

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

export const CHART = {
  grid: "var(--border-mid)",
  // Axis text sits between --text and --text-2 so it stays readable on the
  // dark canvas (plain --text-2 is too dim at 11px) and in light mode.
  axis: "color-mix(in oklab, var(--text) 58%, var(--bg))",
  label: "color-mix(in oklab, var(--text) 72%, var(--bg))",
  value: "var(--text)",
  font: "'Geist', sans-serif",
  mono: "'Geist Mono', monospace",
} as const;

/**
 * Round axis ticks: 0, 5, 10, 15 or 0, 20, 40, 60 instead of 0, 16, 31, 47.
 * Returns the ticks (ascending, starting at `min`) and the axis maximum.
 */
export function niceTicks(min: number, max: number, target = 4): { ticks: number[]; max: number; min: number } {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { ticks: [0, 1], min: 0, max: 1 };
  if (max <= min) max = min + 1;
  const rough = (max - min) / target;
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const steps = [1, 2, 2.5, 5, 10];
  let step = pow;
  for (const s of steps) {
    if (s * pow >= rough) { step = s * pow; break; }
  }
  // Integer data never needs fractional ticks below 1.
  if (step < 1 && Number.isInteger(min) && Number.isInteger(max)) step = 1;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Math.round(v * 1000) / 1000);
  return { ticks, min: lo, max: hi };
}

/** Width of the element the returned ref is attached to (ResizeObserver). */
export function useContainerWidth<T extends HTMLElement = HTMLDivElement>(initial = 480) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(initial);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.getBoundingClientRect().width || initial);
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) setWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [initial]);
  return { ref, width };
}

export function ChartTooltip({
  x, y, containerWidth, children,
}: {
  x: number;
  y: number;
  containerWidth: number;
  children: ReactNode;
}) {
  // Flip to the left of the pointer near the right edge so it never clips.
  const flip = x > containerWidth - 160;
  const style: CSSProperties = {
    position: "absolute",
    pointerEvents: "none",
    zIndex: 10,
    top: Math.max(0, y - 40),
    left: flip ? undefined : x + 10,
    right: flip ? Math.max(0, containerWidth - x + 10) : undefined,
    background: "var(--bg-elevated)",
    border: "1px solid var(--border-mid)",
    borderRadius: 6,
    padding: "6px 10px",
    fontSize: 12,
    lineHeight: 1.35,
    whiteSpace: "nowrap",
    color: "var(--text)",
    boxShadow: "0 6px 18px rgba(0,0,0,.25)",
    fontFamily: CHART.font,
  };
  return <div style={style}>{children}</div>;
}

export function ChartEmpty({ height, children }: { height: number; children: ReactNode }) {
  return (
    <div style={{
      height, display: "flex", alignItems: "center", justifyContent: "center",
      color: "var(--text-2)", fontSize: 13, textAlign: "center", padding: "0 16px",
    }}>
      {children}
    </div>
  );
}
