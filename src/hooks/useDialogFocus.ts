"use client";

import { useEffect, useRef } from "react";

// Client effects only. A shared count makes nested dialogs safe even when
// their parent unmounts before the child releases its lock.
let bodyLocks = 0;
let previousOverflow = "";

/** Focus the dialog without opening a mobile keyboard; contain Tab and
 * return focus to the invoking control when it closes. Nested dialogs get
 * the event first and prevent the parent from handling it again. */
export function useDialogFocus<T extends HTMLElement>(open = true) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!open || !ref.current) return;
    if (bodyLocks++ === 0) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    return () => {
      if (--bodyLocks === 0) document.body.style.overflow = previousOverflow;
    };
  }, [open]);
  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const previous = document.activeElement as HTMLElement | null;
    dialog.focus({ preventScroll: true });
    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || event.defaultPrevented) return;
      const controls = Array.from(dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]',
      )).filter(el => el.getClientRects().length > 0);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog)) {
        event.preventDefault(); first.focus();
      }
    };
    dialog.addEventListener("keydown", handleKey);
    return () => {
      dialog.removeEventListener("keydown", handleKey);
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [open]);
  return ref;
}
