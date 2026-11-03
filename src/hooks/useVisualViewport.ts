"use client";

import { useEffect, useState, type CSSProperties } from "react";

/** Keep fixed sheets inside the visible area when a mobile keyboard opens. */
export function useVisualViewport(open: boolean): CSSProperties {
  const [viewport, setViewport] = useState<{ height: number; top: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const visualViewport = window.visualViewport;
    const update = () => {
      setViewport({
        height: visualViewport?.height ?? window.innerHeight,
        top: visualViewport?.offsetTop ?? 0,
      });
    };
    update();
    visualViewport?.addEventListener("resize", update);
    visualViewport?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      visualViewport?.removeEventListener("resize", update);
      visualViewport?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  return viewport ? {
    "--overlay-height": `${viewport.height}px`,
    "--overlay-top": `${viewport.top}px`,
  } as CSSProperties : {};
}
