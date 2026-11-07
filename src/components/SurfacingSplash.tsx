"use client";

/* ═══════════════════════════════════════════════════════════════════════════
   SurfacingSplash — the "Surfacing" opening (v3, approved 2026-11-03).

   Full-screen, once per browser session, about 3.5 s, then the sign-in form:

     1. Fade up from the canvas onto a still night lake (real water clip).
     2. The mark rises in ONE continuous move out of the water, starting
        exactly where the clip's ripple starts. Below the waterline it is
        clipped; a faint wavy reflection sits under it.
     3. A soft glow blooms; the three contour rings draw in, then turn slowly.
     4. The app name and tagline fade up beneath.
     5. The mark glides into the sign-in header's own mark (measured live),
        the lake blurs and dims, and the form fades up underneath.

   Self-contained and colour-parameterised so every suite app can reuse it
   with its own accent, mark, tagline and water clip. The water clip plays
   full-screen with cover fit; the waterline is computed from the clip's
   intrinsic size and the viewport so the mark always rises out of the
   ripple, on every screen.

   Tap, click or Escape skips straight to the form. If the video fails or
   is slow, the poster still carries the same timeline. The host page gates
   on first-visit + prefers-reduced-motion; this component assumes it should
   play when mounted.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";

const EASE = "cubic-bezier(.16,1,.3,1)";

export type SurfacingSplashProps = {
  /** The water clip (H.264, silent, start frame = end frame). */
  waterSrc: string;
  /** First frame of the clip; shown while loading and if the video fails. */
  posterSrc: string;
  /** Intrinsic clip size, for the cover math. */
  videoWidth: number;
  videoHeight: number;
  /** Where the ripple starts, as a fraction of the clip frame's height. */
  waterlineFrac: number;
  /** When the ripple begins in the clip, in ms — the rise starts just after. */
  rippleStartMs: number;
  /** The brand mark, rendered at markSize (it is rendered twice: rise + reflection). */
  mark: ReactNode;
  markSize?: number;
  /** Accent pair: line/ring colour and the deeper glow colour. */
  accent?: string;
  accentDeep?: string;
  appName?: string;
  tagline?: string;
  /** CSS selector for the sign-in header's mark; the splash mark glides onto it. */
  targetSelector?: string;
  /** Fired when the exit begins — the host reveals and staggers the form. */
  onExitStart?: () => void;
  /** Fired when the overlay has fully faded and unmounted itself. */
  onDone?: () => void;
};

export function SurfacingSplash({
  waterSrc,
  posterSrc,
  videoWidth,
  videoHeight,
  waterlineFrac,
  rippleStartMs,
  mark,
  markSize = 120,
  accent = "#22D3EE",
  accentDeep = "#0EA5E9",
  appName = "Hippo",
  tagline = "Track mastery. Share growth.",
  targetSelector = "[data-surfacing-mark-target]",
  onExitStart,
  onDone,
}: SurfacingSplashProps) {
  const root = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mounted, setMounted] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  // The waterline in viewport px, from the cover math. Recomputed on resize.
  const [W, setW] = useState<number | null>(null);

  const M = markSize;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const compute = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const scale = Math.max(vw / videoWidth, vh / videoHeight);
      const dispH = videoHeight * scale;
      const offsetY = (vh - dispH) / 2;
      setW(offsetY + waterlineFrac * dispH);
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [videoWidth, videoHeight, waterlineFrac]);

  // ── Timeline ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (W === null) return;
    const el = root.current;
    if (!el) return;

    const $ = (sel: string) => el.querySelector<HTMLElement>(sel);
    const $$ = (sel: string) => [...el.querySelectorAll<HTMLElement>(sel)];
    const anims: Animation[] = [];
    const timers: number[] = [];
    const a = (
      node: Element | null,
      kf: Keyframe[],
      o: KeyframeAnimationOptions,
    ) => {
      if (!node) return;
      anims.push(node.animate(kf, { fill: "both", easing: EASE, ...o }));
    };

    // The rise begins just after the clip's ripple does.
    const rise = Math.max(0, rippleStartMs) + 50;
    const T = {
      rise,
      rings: rise + 950,
      name: rise + 1300,
      tag: rise + 1550,
      exit: rise + 2900,
    };

    a($(".sf-shade"), [{ opacity: 1 }, { opacity: 0 }], {
      duration: 600,
      easing: "ease-out",
    });

    // One continuous rise that eases through the moment the eyes clear the water.
    $$(".sf-rise").forEach((r) =>
      a(
        r,
        [
          { transform: `translateY(${M + 8}px)` },
          {
            transform: `translateY(${M * 0.42}px)`,
            offset: 0.45,
            easing: "cubic-bezier(.4,0,.2,1)",
          },
          { transform: "translateY(0)" },
        ],
        { duration: 1400, delay: T.rise },
      ),
    );
    a($(".sf-flip"), [{ opacity: 0 }, { opacity: 0.22 }], {
      duration: 1200,
      delay: T.rise + 300,
    });
    a(
      $(".sf-glow"),
      [
        { opacity: 0, transform: "scale(.6)" },
        { opacity: 1, transform: "scale(1)" },
      ],
      { duration: 1600, delay: T.rise + 200 },
    );

    $$(".sf-ring").forEach((c, i) => {
      a(c, [{ opacity: 0 }, { opacity: 1 }], {
        duration: 600,
        delay: T.rings + i * 120,
      });
      a(c, [{ strokeDashoffset: 260 }, { strokeDashoffset: 0 }], {
        duration: 1200,
        delay: T.rings + i * 120,
      });
    });
    a(
      $(".sf-name"),
      [
        { opacity: 0, transform: "translateY(12px)", filter: "blur(4px)" },
        { opacity: 1, transform: "translateY(0)", filter: "blur(0)" },
      ],
      { duration: 700, delay: T.name },
    );
    a(
      $(".sf-tag"),
      [
        { opacity: 0, transform: "translateY(8px)" },
        { opacity: 0.75, transform: "translateY(0)" },
      ],
      { duration: 600, delay: T.tag },
    );

    // ── Exit: glide into the sign-in header's mark ──────────────────────
    let exited = false;
    const exit = (fast: boolean) => {
      if (exited) return;
      exited = true;
      el.style.pointerEvents = "none";
      onExitStart?.();

      if (fast) {
        anims.forEach((x) => x.cancel());
        const fade = el.animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: 220,
          easing: "ease-out",
          fill: "forwards",
        });
        fade.onfinish = () => onDone?.();
        return;
      }

      // Measure the real header mark; fall back to a plain upward glide.
      const target = document.querySelector(targetSelector);
      const glide = $(".sf-glide");
      const win = $(".sf-win-up");
      if (win) win.style.overflow = "visible"; // the mark is fully surfaced now
      let transform = `translateY(${-(W - M / 2) * 0.62}px) scale(.37)`;
      if (target) {
        const t = target.getBoundingClientRect();
        if (t.width > 0) {
          const dx = t.left + t.width / 2 - window.innerWidth / 2;
          const dy = t.top + t.height / 2 - (W - M / 2);
          transform = `translate(${dx}px, ${dy}px) scale(${t.width / M})`;
        }
      }
      a(glide, [{ transform: "translate(0,0) scale(1)" }, { transform }], {
        duration: 850,
        fill: "forwards",
      });

      [".sf-flip", ".sf-name", ".sf-tag", ".sf-glow"].forEach((s) =>
        a($(s), [{ opacity: getComputedStyle($(s)!).opacity }, { opacity: 0 }], {
          duration: 450,
          easing: "ease-out",
          fill: "forwards",
        }),
      );
      const rings = $(".sf-rings");
      a(rings, [{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(1.15)" }], {
        duration: 800,
        easing: "ease-out",
        fill: "forwards",
      });
      a(
        $(".sf-water"),
        [
          { filter: "blur(0px) brightness(1)", transform: "scale(1)" },
          { filter: "blur(9px) brightness(.42)", transform: "scale(1.08)" },
        ],
        { duration: 1000, fill: "forwards" },
      );
      a($(".sf-floor"), [{ height: "40%" }, { height: "100%" }], {
        duration: 900,
        fill: "forwards",
      });

      // Hand the frame to the page: the overlay crossfades out over either
      // the light canvas or the page's own static dimmed-lake backdrop.
      const fade = el.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 500,
        delay: 700,
        easing: "ease-out",
        fill: "forwards",
      });
      fade.onfinish = () => onDone?.();
    };

    timers.push(window.setTimeout(() => exit(false), T.exit));
    // Hard stop: whatever happens, the form is usable.
    timers.push(window.setTimeout(() => exit(true), T.exit + 2600));

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") exit(true);
    };
    const onTap = () => exit(true);
    window.addEventListener("keydown", onKey);
    el.addEventListener("pointerdown", onTap);

    // The reflection's slow water wobble.
    const turb = el.querySelector("#sf-turb");
    let raf = 0;
    const wob = (t: number) => {
      turb?.setAttribute(
        "baseFrequency",
        `0.015 ${(0.085 + 0.012 * Math.sin(t / 700)).toFixed(4)}`,
      );
      raf = requestAnimationFrame(wob);
    };
    raf = requestAnimationFrame(wob);

    videoRef.current?.play().catch(() => {});

    return () => {
      anims.forEach((x) => x.cancel());
      timers.forEach(clearTimeout);
      window.removeEventListener("keydown", onKey);
      el.removeEventListener("pointerdown", onTap);
      cancelAnimationFrame(raf);
    };
    // The timeline runs once for the first measured waterline; resizes mid-play
    // reposition the static layers via React but do not restart the animations.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [W === null]);

  if (!mounted || W === null) {
    // Pre-paint cover (the page sets data-surfacing-splash on <html> before
    // first paint, which holds the dark canvas until this overlay mounts).
    return null;
  }

  const markLeft = `calc(50vw - ${M / 2}px)`;

  return createPortal(
    <div
      ref={root}
      className="sf"
      role="presentation"
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147482900,
        overflow: "hidden",
        background: "#060d13",
        fontFamily: "'Geist', -apple-system, 'Helvetica Neue', sans-serif",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {/* SVG filter for the reflection wobble */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
        <filter id="sf-wobble" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            id="sf-turb"
            type="fractalNoise"
            baseFrequency="0.015 0.09"
            numOctaves={2}
            seed={3}
          />
          <feDisplacementMap in="SourceGraphic" scale={6} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      {/* Water */}
      {videoFailed ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          className="sf-water"
          src={posterSrc}
          alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <video
          ref={videoRef}
          className="sf-water"
          src={waterSrc}
          poster={posterSrc}
          muted
          playsInline
          autoPlay
          preload="auto"
          onError={() => setVideoFailed(true)}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      )}

      {/* Depth floor */}
      <div
        className="sf-floor"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "40%",
          background: "linear-gradient(to bottom, transparent, rgba(6,13,19,.7))",
        }}
      />

      {/* Glow behind the mark */}
      <div
        className="sf-glow"
        style={{
          position: "absolute",
          left: `calc(50vw - 170px)`,
          top: W - M / 2 - 170,
          width: 340,
          height: 340,
          borderRadius: "50%",
          opacity: 0,
          background: `radial-gradient(circle, color-mix(in srgb, ${accentDeep} 28%, transparent) 0%, color-mix(in srgb, ${accentDeep} 9%, transparent) 36%, transparent 66%)`,
        }}
      />

      {/* Contour rings */}
      <svg
        className="sf-rings"
        viewBox="0 0 280 280"
        fill="none"
        stroke={accent}
        strokeLinecap="round"
        style={{
          position: "absolute",
          left: `calc(50vw - 140px)`,
          top: W - M / 2 - 140,
          width: 280,
          height: 280,
          overflow: "visible",
        }}
      >
        {[
          { r: 84, o: 0.34, w: 1, dash: "370 158", rot: 0, spin: 60, dir: 1 },
          { r: 106, o: 0.18, w: 0.8, dash: "333 333", rot: 45, spin: 90, dir: -1 },
          { r: 128, o: 0.1, w: 0.6, dash: "281 523", rot: 160, spin: 75, dir: 1 },
        ].map((g, i) => (
          <g
            key={i}
            style={{
              transformOrigin: "140px 140px",
              animation: `sf-spin ${g.spin}s linear infinite ${g.dir > 0 ? "normal" : "reverse"}`,
            }}
          >
            <circle
              className="sf-ring"
              cx="140"
              cy="140"
              r={g.r}
              strokeOpacity={g.o}
              strokeWidth={g.w}
              strokeDasharray={g.dash}
              transform={`rotate(${g.rot} 140 140)`}
              opacity={0}
            />
          </g>
        ))}
      </svg>

      {/* Reflection: flipped mark in the below-water window */}
      <div
        className="sf-win-down"
        style={{ position: "absolute", left: 0, right: 0, top: W, bottom: 0, overflow: "hidden" }}
      >
        <div
          className="sf-flip"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: -W,
            height: "100vh",
            transformOrigin: `50% ${W}px`,
            transform: "scaleY(-1)",
            filter: "url(#sf-wobble)",
            opacity: 0,
            WebkitMaskImage: `linear-gradient(to top, transparent calc(100% - ${W}px - 90px), #000 calc(100% - ${W}px))`,
            maskImage: `linear-gradient(to top, transparent calc(100% - ${W}px - 90px), #000 calc(100% - ${W}px))`,
          }}
        >
          <div
            style={{ position: "absolute", left: markLeft, top: W - M, width: M, height: M }}
          >
            <div className="sf-rise">{mark}</div>
          </div>
        </div>
      </div>

      {/* The mark, clipped by the waterline while it rises */}
      <div
        className="sf-win-up"
        style={{ position: "absolute", left: 0, right: 0, top: 0, height: W, overflow: "hidden" }}
      >
        <div
          className="sf-glide"
          style={{ position: "absolute", left: markLeft, top: W - M, width: M, height: M }}
        >
          <div className="sf-rise">{mark}</div>
        </div>
      </div>

      {/* Name + tagline */}
      <div
        className="sf-name"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: W + 96,
          textAlign: "center",
          fontSize: 40,
          fontWeight: 700,
          letterSpacing: -1,
          color: "#E2E8F0",
          opacity: 0,
        }}
      >
        {appName}
      </div>
      <div
        className="sf-tag"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: W + 148,
          textAlign: "center",
          fontSize: 13,
          letterSpacing: "0.04em",
          color: accent,
          opacity: 0,
        }}
      >
        {tagline}
      </div>

      {/* Opening shade */}
      <div className="sf-shade" style={{ position: "absolute", inset: 0, background: "#060d13" }} />

      <style
        dangerouslySetInnerHTML={{
          __html: `@keyframes sf-spin { to { transform: rotate(360deg) } }
.sf .sf-rise svg { display: block; width: 100%; height: 100%; }`,
        }}
      />
    </div>,
    document.body,
  );
}
