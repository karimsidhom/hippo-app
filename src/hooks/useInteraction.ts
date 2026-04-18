"use client";

import { useCallback, useMemo } from "react";
import * as sfx from "@/lib/interactions/sfx";
import * as haptics from "@/lib/interactions/haptics";

// ---------------------------------------------------------------------------
// useInteraction — one hook that owns "what does pressing this feel like."
//
// Each intent (`tap`, `nav`, `log`, `save`, `error`, `toggle`) bundles the
// right sound + the right haptic, so callers don't have to remember which
// pair goes with which. If we later decide "save" should feel different,
// one edit here updates every Save button in the app.
//
// Usage:
//
//   const fx = useInteraction();
//   <button onClick={() => { fx.log(); submitCase(); }}>Log case</button>
//
// For buttons that should always play the "tap" feel, spread the handlers:
//
//   <button {...fx.tapHandlers}>Click me</button>
//
// The handlers bind to onPointerDown so the feedback fires on the physical
// press — not on the logical click — which makes the app feel snappier.
// ---------------------------------------------------------------------------

interface InteractionHandlers {
  onPointerDown: () => void;
}

export interface Interaction {
  /** Generic button press: soft click + 8ms haptic tick. */
  tap: () => void;
  /** Navigation/route change: even quieter than tap. */
  nav: () => void;
  /** Case logged / positive completion: two-note chime + success buzz. */
  log: () => void;
  /** Save confirmation: mid-tone tick + medium buzz. */
  save: () => void;
  /** Error: soft downward sweep + error pattern. */
  error: () => void;
  /** Toggle / switch / chip: tiny high tick + micro-buzz. */
  toggle: () => void;

  /** Spread directly onto any element — fires `tap` on pointerdown. */
  tapHandlers: InteractionHandlers;
  /** Same, for nav taps. */
  navHandlers: InteractionHandlers;
  /** Same, for toggles. */
  toggleHandlers: InteractionHandlers;
}

export function useInteraction(): Interaction {
  const tap = useCallback(() => { sfx.playTap(); haptics.tapLight(); }, []);
  const nav = useCallback(() => { sfx.playNav(); haptics.tapLight(); }, []);
  const log = useCallback(() => { sfx.playLog(); haptics.tapSuccess(); }, []);
  const save = useCallback(() => { sfx.playSave(); haptics.tapMedium(); }, []);
  const error = useCallback(() => { sfx.playError(); haptics.tapError(); }, []);
  const toggle = useCallback(() => { sfx.playToggle(); haptics.tapToggle(); }, []);

  // Memoise the spread-ready handler objects so consumers using them as
  // props don't cause unnecessary re-renders.
  const tapHandlers = useMemo(() => ({ onPointerDown: tap }), [tap]);
  const navHandlers = useMemo(() => ({ onPointerDown: nav }), [nav]);
  const toggleHandlers = useMemo(() => ({ onPointerDown: toggle }), [toggle]);

  return { tap, nav, log, save, error, toggle, tapHandlers, navHandlers, toggleHandlers };
}
