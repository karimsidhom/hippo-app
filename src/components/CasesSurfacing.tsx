"use client";

import { useEffect, useRef } from "react";
import { HippoMark } from "./HippoMark";

export const CASES_SURFACING_HOLD_MS = 2100;

const EXIT_MS = 600;

const CSS = `
.hi.hi-cases-surfacing{background:none;isolation:isolate;
  animation:hi-cases-failsafe 1ms linear ${CASES_SURFACING_HOLD_MS + EXIT_MS + 400}ms forwards}
.hi-cases-backdrop{position:absolute;inset:0;background:var(--hi-bg);opacity:1;
  animation:hi-cases-fade ${EXIT_MS}ms var(--hi-ease) ${CASES_SURFACING_HOLD_MS + 70}ms both}
.hi-cases-stage{position:absolute;left:50%;top:50%;width:min(86vw,68dvh,480px);
  aspect-ratio:1;transform:translate(-50%,-50%)}
.hi-cases-contour{position:absolute;left:50%;top:59%;width:57%;height:9%;
  border:1.5px solid var(--hi-accent);border-radius:50%;opacity:0;
  animation:hi-cases-contour 1.55s var(--hi-ease) 80ms both}
.hi-cases-contour + .hi-cases-contour{width:73%;height:13%;animation-delay:230ms}
.hi-cases-mark{position:absolute;left:34%;bottom:41%;width:32%;transform-origin:0 0}
.hi-cases-mark svg{width:100%;height:auto;display:block;clip-path:inset(0 0 0);
  animation:hi-cases-rise .95s var(--hi-ease) .17s both}
.hi-cases-name{position:absolute;inset:64% 0 auto;text-align:center;color:var(--hi-text);
  font-size:clamp(24px,5vmin,38px);font-weight:650;letter-spacing:-.04em;
  animation:hi-up .55s var(--hi-ease) .68s both}
.hi-cases-surfacing .hi-surfacing-skip{background:var(--hi-bg);color:var(--hi-text);
  border-color:color-mix(in srgb,var(--hi-text) 30%,transparent)}
.hi-cases-surfacing[data-out] .hi-cases-backdrop{animation:hi-cases-fade ${EXIT_MS}ms var(--hi-ease) both}
.hi-cases-surfacing[data-out] .hi-cases-contour,
.hi-cases-surfacing[data-out] .hi-cases-name,
.hi-cases-surfacing[data-out] .hi-surfacing-skip{opacity:0;animation:none;transition:opacity 160ms}
.hi-cases-surfacing[data-out] .hi-cases-mark svg{animation:none}
html:not([data-hippo-intro-skip]):has(.hi-cases-surfacing[data-docking]) [data-cases-surfacing-target]{visibility:hidden}
@keyframes hi-cases-failsafe{to{visibility:hidden;pointer-events:none}}
@keyframes hi-cases-fade{to{opacity:0;visibility:hidden}}
@keyframes hi-cases-rise{from{clip-path:inset(100% 0 0);transform:translateY(62%)}}
@keyframes hi-cases-contour{
  0%{opacity:0;transform:translate(-50%,-50%) scale(.25)}
  18%{opacity:.54}
  100%{opacity:0;transform:translate(-50%,-50%) scale(1.17)}
}
@media(prefers-reduced-motion:reduce){
  .hi.hi-cases-surfacing{display:none}
  html:has(.hi-cases-surfacing[data-docking]) [data-cases-surfacing-target]{visibility:visible!important}
}
`;

export function CasesSurfacing({ exiting, onSkip }: {
  exiting: boolean;
  onSkip: () => void;
}) {
  const overlay = useRef<HTMLDivElement>(null);
  const mark = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!exiting || !overlay.current || !mark.current) return;
    const target = document.querySelector<HTMLElement>("[data-cases-surfacing-target]");
    const start = mark.current.getBoundingClientRect();
    const end = target?.getBoundingClientRect();
    if (!end?.width || !start.width) return;

    const layer = overlay.current;
    layer.setAttribute("data-docking", "");
    const glide = mark.current.animate([
      { transform: "none" },
      { transform: `translate(${end.left - start.left}px,${end.top - start.top}px) scale(${end.width / start.width})` },
    ], { duration: EXIT_MS, easing: "cubic-bezier(.16,1,.3,1)", fill: "forwards" });

    // When layout changes during the glide, return ownership to the live header.
    const release = () => {
      glide.cancel();
      layer.removeAttribute("data-docking");
      if (mark.current) mark.current.style.visibility = "hidden";
    };
    window.addEventListener("resize", release, { once: true });
    return () => {
      window.removeEventListener("resize", release);
      glide.cancel();
      layer.removeAttribute("data-docking");
    };
  }, [exiting]);

  return (
    <div ref={overlay} className="hi hi-cases-surfacing" data-out={exiting ? "" : undefined}>
      <style>{CSS}</style>
      <div className="hi-cases-backdrop" aria-hidden />
      <div className="hi-cases-stage" aria-hidden>
        <div className="hi-cases-contour" />
        <div className="hi-cases-contour" />
        <div className="hi-cases-mark" ref={mark}><HippoMark size={144} /></div>
        <div className="hi-cases-name">Hippo Cases</div>
      </div>
      {!exiting && <button type="button" className="hi-surfacing-skip" onClick={onSkip}>Skip intro</button>}
    </div>
  );
}
