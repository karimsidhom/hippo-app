"use client";

/**
 * HippoIntro: the entry animation every Hippo Suite app plays, taken from
 * the walkthrough video's title card (glow bloom, contour rings drawing on
 * a slow counter-spin, the mark rising with an ear pop and a blink, the
 * name with a light sweep). About 2.5 s, once per browser session, on
 * whatever page the visitor lands on.
 *
 * - Tap, click or any key skips straight to the exit.
 * - Reduced-motion users never see it.
 * - The decision is made by an inline script before first paint, so a
 *   returning visitor never sees the overlay flash.
 *
 * Self-contained (React only) so Handover, Pulse, Research and Clinic can
 * copy this file unchanged and pass their own name and line.
 */
import { useEffect, useState } from "react";

const SEEN_KEY = "hippo-intro-session";
const SKIP_ATTR = "data-hippo-intro-skip";

// Runs inline, before the overlay below it is parsed: hide it for this
// session's later visits and for reduced motion.
const DECIDE_SCRIPT = `(function(){try{var d=document.documentElement;if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches){d.setAttribute('${SKIP_ATTR}','');return;}if(sessionStorage.getItem('${SEEN_KEY}')==='1'){d.setAttribute('${SKIP_ATTR}','');return;}sessionStorage.setItem('${SEEN_KEY}','1');}catch(e){}})();`;

const RINGS = [
  { r: 150, w: 1.2, o: 0.32, frac: 0.62, rot: -90, dur: 0.9, delay: 0.1, spin: 46, dir: 1 },
  { r: 205, w: 1.0, o: 0.2, frac: 0.48, rot: 30, dur: 1.05, delay: 0.2, spin: 60, dir: -1 },
  { r: 268, w: 0.8, o: 0.13, frac: 0.4, rot: 150, dur: 1.2, delay: 0.3, spin: 75, dir: 1 },
  { r: 340, w: 0.7, o: 0.08, frac: 0.33, rot: 250, dur: 1.3, delay: 0.42, spin: 90, dir: -1 },
];

const EXIT_AT_MS = 2300;
const EXIT_MS = 520;

const CSS = `
.hi{position:fixed;inset:0;z-index:2147483000;display:flex;flex-direction:column;align-items:center;justify-content:center;
  background:var(--hi-bg);overflow:hidden;cursor:pointer;-webkit-tap-highlight-color:transparent;
  font-family:'Geist',-apple-system,'Helvetica Neue',sans-serif;-webkit-font-smoothing:antialiased;
  --hi-ease:cubic-bezier(.16,1,.3,1);--hi-bg:#060d13;--hi-text:#E2E8F0;--hi-text-hi:#ffffff;--hi-sub:#7c8ea3;
  --hi-accent:#0EA5E9;--hi-accent-hi:#7dd3fc;--hi-glow:rgba(14,165,233,.20);--hi-glow-2:rgba(14,165,233,.06)}
[data-theme="light"] .hi{--hi-bg:#f8fafc;--hi-text:#0f172a;--hi-text-hi:#475569;--hi-sub:#64748b;
  --hi-accent:#0284C7;--hi-accent-hi:#38bdf8;--hi-glow:rgba(14,165,233,.16);--hi-glow-2:rgba(14,165,233,.05)}
[${SKIP_ATTR}] .hi{display:none}
.hi-glow{position:absolute;left:50%;top:50%;width:min(1000px,160vmax);height:min(1000px,160vmax);transform:translate(-50%,-56%) scale(.6);
  border-radius:50%;background:radial-gradient(circle,var(--hi-glow) 0%,var(--hi-glow-2) 34%,transparent 64%);opacity:0;
  animation:hi-bloom 1.25s var(--hi-ease) 0s both}
.hi-rings{position:absolute;left:50%;top:50%;width:min(800px,150vmin);height:min(800px,150vmin);transform:translate(-50%,-57.5%)}
.hi-spin{transform-origin:400px 400px;animation:hi-spin linear infinite}
.hi-ring{animation:hi-draw ease-out forwards}
.hi-ripple{position:absolute;left:50%;top:50%;width:min(150px,28vmin);height:min(150px,28vmin);transform:translate(-50%,-90%);
  border-radius:50%;border:2px solid color-mix(in srgb,var(--hi-accent) 55%,transparent);opacity:0;animation:hi-ripple 1s var(--hi-ease) .63s both}
.hi-mark{position:relative;margin-top:calc(-1 * min(120px,16vmin));opacity:0;transform:translateY(22px) scale(.82);
  filter:drop-shadow(0 10px 40px rgba(14,165,233,.35));animation:hi-mark-in .75s var(--hi-ease) .25s both}
.hi-mark svg{width:min(140px,30vmin);height:auto;display:block}
.hi-mark .hi-ears{transform-box:fill-box;transform-origin:50% 100%;transform:scaleY(.25);animation:hi-ear-pop .5s var(--hi-ease) .43s both}
.hi-mark .hi-eyes{transform-box:fill-box;transform-origin:50% 50%;animation:hi-blink .2s ease-in-out 1.8s both}
.hi-title{margin-top:min(30px,5vmin);font-size:clamp(40px,9vmin,80px);font-weight:700;letter-spacing:-.03em;line-height:1;opacity:0;transform:translateY(18px);
  background:linear-gradient(100deg,var(--hi-text) 0%,var(--hi-text) 42%,var(--hi-text-hi) 50%,var(--hi-text) 58%,var(--hi-text) 100%);
  background-size:300% 100%;background-position:100% 0;-webkit-background-clip:text;background-clip:text;color:transparent;
  animation:hi-up .63s var(--hi-ease) .84s both,hi-shine 1s ease-in-out 1.5s both}
.hi-title b{font-weight:700;background:linear-gradient(100deg,var(--hi-accent) 0%,var(--hi-accent) 42%,var(--hi-accent-hi) 50%,var(--hi-accent) 58%,var(--hi-accent) 100%);
  background-size:300% 100%;background-position:100% 0;-webkit-background-clip:text;background-clip:text;color:transparent;
  animation:hi-shine 1s ease-in-out 1.5s both}
.hi-sub{margin-top:min(16px,3vmin);padding:0 24px;text-align:center;font-size:clamp(15px,3.2vmin,24px);font-weight:500;color:var(--hi-sub);
  letter-spacing:-.01em;opacity:0;transform:translateY(14px);animation:hi-up .63s var(--hi-ease) 1.08s both}
.hi[data-out] {animation:hi-exit ${EXIT_MS}ms var(--hi-ease) both;pointer-events:none}
@keyframes hi-bloom{to{opacity:1;transform:translate(-50%,-56%) scale(1)}}
@keyframes hi-draw{to{stroke-dashoffset:0}}
@keyframes hi-spin{to{transform:rotate(360deg)}}
@keyframes hi-mark-in{to{opacity:1;transform:none}}
@keyframes hi-ear-pop{to{transform:scaleY(1)}}
@keyframes hi-blink{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.08)}}
@keyframes hi-ripple{from{opacity:.9;transform:translate(-50%,-90%) scale(1)}to{opacity:0;transform:translate(-50%,-90%) scale(2.6)}}
@keyframes hi-up{to{opacity:1;transform:none}}
@keyframes hi-shine{from{background-position:100% 0}to{background-position:0% 0}}
@keyframes hi-exit{to{opacity:0;transform:scale(1.035)}}
`;

function Rings() {
  return (
    <svg className="hi-rings" viewBox="0 0 800 800" aria-hidden>
      {RINGS.map((g, i) => {
        const c = 2 * Math.PI * g.r;
        const v = c * g.frac;
        return (
          <g key={i} className="hi-spin" style={{ animationDuration: `${g.spin}s`, animationDirection: g.dir > 0 ? "normal" : "reverse" }}>
            <circle
              className="hi-ring"
              cx="400" cy="400" r={g.r}
              stroke="var(--hi-accent)" strokeOpacity={g.o} strokeWidth={g.w} fill="none" strokeLinecap="round"
              strokeDasharray={`${v} ${c - v}`} strokeDashoffset={v}
              transform={`rotate(${g.rot} 400 400)`}
              style={{ animationDuration: `${g.dur}s`, animationDelay: `${g.delay}s` }}
            />
          </g>
        );
      })}
    </svg>
  );
}

function Mark() {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden>
      <defs>
        <linearGradient id="hi-g" x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22D3EE" />
          <stop offset="1" stopColor="#0EA5E9" />
        </linearGradient>
      </defs>
      <g className="hi-ears">
        <ellipse cx="17" cy="12" rx="7" ry="10" fill="url(#hi-g)" opacity="0.85" transform="rotate(-6 17 12)" />
        <ellipse cx="47" cy="12" rx="7" ry="10" fill="url(#hi-g)" opacity="0.85" transform="rotate(6 47 12)" />
        <ellipse cx="17" cy="13" rx="4" ry="6" fill="#0B1120" opacity="0.25" transform="rotate(-6 17 13)" />
        <ellipse cx="47" cy="13" rx="4" ry="6" fill="#0B1120" opacity="0.25" transform="rotate(6 47 13)" />
      </g>
      <path d="M12 28C12 18 20 10 32 10C44 10 52 18 52 28V35C55 35 59 39 59 44C59 49 55 52 52 52V54C52 62 44 64 32 64C20 64 12 62 12 54V52C9 52 5 49 5 44C5 39 9 35 12 35Z" fill="url(#hi-g)" />
      <g className="hi-eyes">
        <ellipse cx="24" cy="31" rx="4" ry="4.5" fill="#0B1120" />
        <ellipse cx="40" cy="31" rx="4" ry="4.5" fill="#0B1120" />
      </g>
      <circle cx="25.5" cy="29.5" r="1.8" fill="white" opacity="0.65" />
      <circle cx="41.5" cy="29.5" r="1.8" fill="white" opacity="0.65" />
      <ellipse cx="32" cy="46" rx="11" ry="7" fill="url(#hi-g)" opacity="0.12" />
      <ellipse cx="27" cy="45" rx="2.8" ry="2.2" fill="#0B1120" opacity="0.3" />
      <ellipse cx="37" cy="45" rx="2.8" ry="2.2" fill="#0B1120" opacity="0.3" />
    </svg>
  );
}

export function HippoIntro({ app, line }: { app: string; line: string }) {
  const [phase, setPhase] = useState<"on" | "out" | "gone">("on");

  useEffect(() => {
    if (document.documentElement.hasAttribute(SKIP_ATTR)) { setPhase("gone"); return; }
    const exit = window.setTimeout(() => setPhase("out"), EXIT_AT_MS);
    const skip = () => setPhase((p) => (p === "on" ? "out" : p));
    window.addEventListener("keydown", skip, { once: true });
    return () => { window.clearTimeout(exit); window.removeEventListener("keydown", skip); };
  }, []);

  useEffect(() => {
    if (phase !== "out") return;
    const done = window.setTimeout(() => {
      setPhase("gone");
      // Later client navigations re-render nothing; mark it seen for CSS too.
      document.documentElement.setAttribute(SKIP_ATTR, "");
    }, EXIT_MS);
    return () => window.clearTimeout(done);
  }, [phase]);

  if (phase === "gone") return null;

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: DECIDE_SCRIPT }} />
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div
        className="hi"
        data-out={phase === "out" ? "" : undefined}
        role="presentation"
        aria-hidden
        onClick={() => setPhase((p) => (p === "on" ? "out" : p))}
      >
        <div className="hi-glow" />
        <Rings />
        <div className="hi-ripple" />
        <div className="hi-mark"><Mark /></div>
        <div className="hi-title">Hippo <b>{app}</b></div>
        <div className="hi-sub">{line}</div>
      </div>
    </>
  );
}
