"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

interface ModalShellProps {
  children: React.ReactNode;
  onClose: () => void;
  /** Override max-width of the panel. Defaults to 720. */
  maxWidth?: number;
  /** Whether clicking the backdrop closes the modal. Defaults to true. */
  closeOnBackdrop?: boolean;
}

/**
 * Centered modal shell with proper viewport handling.
 *
 * - Backdrop covers the viewport with `position: fixed; inset: 0`
 * - Flex-centers the panel both axes
 * - Panel is `max-height: min(86vh, 900px)` with internal scroll, so the
 *   modal never overflows the viewport regardless of content size
 * - Locks body scroll while open so background doesn't drift
 * - Closes on Escape and on backdrop click
 */
export function ModalShell({
  children,
  onClose,
  maxWidth = 720,
  closeOnBackdrop = true,
}: ModalShellProps) {
  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Escape to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        // Safe-area padding keeps the modal clear of the iPhone notch and
        // home indicator. `max(16px, env(…))` guarantees a comfortable
        // gutter on devices that don't expose safe-area insets at all.
        padding: "max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left))",
        // overscroll-behavior: contain prevents iOS pull-to-refresh from
        // firing when a scrollable modal panel reaches the top/bottom.
        overscrollBehavior: "contain",
      }}
      onMouseDown={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
        }}
      />
      {/* Panel */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth,
          // 86dvh tracks the visual viewport on iOS (shrinks when the URL
          // bar is visible, expands when it collapses) so the panel never
          // overflows the actually-visible area — 86vh was including the
          // URL bar and clipping the bottom on initial render.
          maxHeight: "min(86dvh, 900px)",
          overflowY: "auto",
          overscrollBehavior: "contain",
          background: "var(--bg-1)",
          border: "1px solid var(--border-mid)",
          borderRadius: 16,
          boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
          padding: 24,
        }}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
