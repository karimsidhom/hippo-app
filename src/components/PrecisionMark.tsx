"use client";

/**
 * PrecisionMark — the abstract brand sigil for the opening experience.
 *
 * A refined geometric composition of concentric partial arcs surrounding
 * an abstract H letterform, with cardinal tick marks suggesting a surgical
 * precision instrument. Three visual layers create depth hierarchy:
 *
 *   Layer 1 (outer) — faintest arc, widest radius, traces first
 *   Layer 2 (mid)   — mid opacity, mid radius
 *   Layer 3 (inner) — brightest arc, tightest radius
 *   H letterform    — two posts + crossbar, the focal point
 *   Tick marks      — four cardinal indicators, precision calibration
 *   Center dot      — the point of convergence
 *
 * When `animate` is true, each element draws itself via stroke-dashoffset
 * with staggered delays, creating a formation/emergence sequence.
 *
 * Tunable values are marked with comments for future refinement.
 */

import type { CSSProperties } from "react";

const TEAL = "#0EA5E9";
const EASE = "cubic-bezier(.16,1,.3,1)";

// ── Geometry ──────────────────────────────────────────────────────────────

const R_OUTER = 88;
const R_MID = 64;
const R_INNER = 42;

const C_OUTER = 2 * Math.PI * R_OUTER; // 552.92
const C_MID = 2 * Math.PI * R_MID; // 402.12
const C_INNER = 2 * Math.PI * R_INNER; // 263.89

// Visible arc lengths (degrees / 360 * circumference)
const V_OUTER = C_OUTER * (270 / 360); // 414.69 — 270° arc
const V_MID = C_MID * (200 / 360); // 223.40 — 200° arc
const V_INNER = C_INNER * (130 / 360); // 95.26  — 130° arc

// ── H letterform geometry ─────────────────────────────────────────────────

const H_LEFT_X = 82;
const H_RIGHT_X = 118;
const H_TOP = 70;
const H_BOTTOM = 130;
const H_MID = 100;
const H_POST_LEN = H_BOTTOM - H_TOP; // 60
const H_CROSS_LEN = H_RIGHT_X - H_LEFT_X; // 36

// ── Tick marks at cardinal points ─────────────────────────────────────────

const TICKS = [
  { x1: 100, y1: 8, x2: 100, y2: 16 }, // N
  { x1: 192, y1: 100, x2: 184, y2: 100 }, // E
  { x1: 100, y1: 192, x2: 100, y2: 184 }, // S
  { x1: 8, y1: 100, x2: 16, y2: 100 }, // W
];

// ── Animation helpers ─────────────────────────────────────────────────────

function drawStyle(
  offset: number,
  dur: number,
  delay: number,
  animate: boolean,
): CSSProperties {
  if (!animate) return { strokeDashoffset: 0 };
  return {
    strokeDashoffset: offset,
    animation: `oe-draw ${dur}s ${EASE} ${delay}s forwards`,
  };
}

function fadeStyle(
  delay: number,
  dur: number,
  animate: boolean,
): CSSProperties {
  if (!animate) return {};
  return {
    opacity: 0,
    animation: `oe-fadeIn ${dur}s ${EASE} ${delay}s forwards`,
  };
}

// ── Component ─────────────────────────────────────────────────────────────

interface PrecisionMarkProps {
  /** Rendered pixel size. */
  size?: number;
  /** When true, strokes draw themselves with staggered delays. */
  animate?: boolean;
}

export function PrecisionMark({
  size = 160,
  animate = false,
}: PrecisionMarkProps) {
  const id = `pm${size}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`${id}-g`} cx="50%" cy="50%" r="40%">
          <stop offset="0%" stopColor={TEAL} stopOpacity="0.07" />
          <stop offset="100%" stopColor={TEAL} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ── Ambient glow ────────────────────────────────────────── */}
      <circle
        cx="100"
        cy="100"
        r="80"
        fill={`url(#${id}-g)`}
        style={fadeStyle(0.5, 0.8, animate)}
      />

      {/* ── Outer arc — 270° ────────────────────────────────────── */}
      {/* TUNABLE: rotate(30) controls gap position; duration 1.2s; delay 0.1s */}
      <circle
        cx="100"
        cy="100"
        r={R_OUTER}
        stroke={TEAL}
        strokeOpacity="0.1"
        strokeWidth="0.75"
        strokeLinecap="round"
        strokeDasharray={`${V_OUTER} ${C_OUTER - V_OUTER}`}
        transform="rotate(30 100 100)"
        style={drawStyle(V_OUTER, 1.2, 0.1, animate)}
      />

      {/* ── Mid arc — 200° ──────────────────────────────────────── */}
      {/* TUNABLE: rotate(-70) offsets gap from outer; duration 0.85s; delay 0.3s */}
      <circle
        cx="100"
        cy="100"
        r={R_MID}
        stroke={TEAL}
        strokeOpacity="0.18"
        strokeWidth="1"
        strokeLinecap="round"
        strokeDasharray={`${V_MID} ${C_MID - V_MID}`}
        transform="rotate(-70 100 100)"
        style={drawStyle(V_MID, 0.85, 0.3, animate)}
      />

      {/* ── Inner arc — 130° ────────────────────────────────────── */}
      {/* TUNABLE: rotate(160); duration 0.6s; delay 0.5s */}
      <circle
        cx="100"
        cy="100"
        r={R_INNER}
        stroke={TEAL}
        strokeOpacity="0.28"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeDasharray={`${V_INNER} ${C_INNER - V_INNER}`}
        transform="rotate(160 100 100)"
        style={drawStyle(V_INNER, 0.6, 0.5, animate)}
      />

      {/* ── Cardinal tick marks ─────────────────────────────────── */}
      {/* TUNABLE: delays 0.85–0.97s stagger; opacity 0.12 */}
      {TICKS.map((t, i) => (
        <line
          key={i}
          x1={t.x1}
          y1={t.y1}
          x2={t.x2}
          y2={t.y2}
          stroke={TEAL}
          strokeOpacity="0.12"
          strokeWidth="0.75"
          strokeLinecap="round"
          style={fadeStyle(0.85 + i * 0.04, 0.3, animate)}
        />
      ))}

      {/* ── H letterform — left post (draws bottom → top) ──────── */}
      {/* TUNABLE: strokeOpacity 0.5; strokeWidth 2.5; delay 0.45s */}
      <line
        x1={H_LEFT_X}
        y1={H_BOTTOM}
        x2={H_LEFT_X}
        y2={H_TOP}
        stroke={TEAL}
        strokeOpacity="0.5"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={H_POST_LEN}
        style={drawStyle(H_POST_LEN, 0.5, 0.45, animate)}
      />

      {/* ── H letterform — right post ──────────────────────────── */}
      {/* TUNABLE: delay 0.55s */}
      <line
        x1={H_RIGHT_X}
        y1={H_BOTTOM}
        x2={H_RIGHT_X}
        y2={H_TOP}
        stroke={TEAL}
        strokeOpacity="0.5"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={H_POST_LEN}
        style={drawStyle(H_POST_LEN, 0.5, 0.55, animate)}
      />

      {/* ── H letterform — crossbar ────────────────────────────── */}
      {/* TUNABLE: delay 0.7s; duration 0.3s */}
      <line
        x1={H_LEFT_X}
        y1={H_MID}
        x2={H_RIGHT_X}
        y2={H_MID}
        stroke={TEAL}
        strokeOpacity="0.5"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={H_CROSS_LEN}
        style={drawStyle(H_CROSS_LEN, 0.3, 0.7, animate)}
      />

      {/* ── Center convergence point ───────────────────────────── */}
      {/* TUNABLE: delay 0.9s; r 1.5; opacity 0.35 */}
      <circle
        cx="100"
        cy="100"
        r="1.5"
        fill={TEAL}
        fillOpacity="0.35"
        style={fadeStyle(0.9, 0.3, animate)}
      />
    </svg>
  );
}
