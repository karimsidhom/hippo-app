"use client";

import { ReactNode, useState, useRef } from "react";
import { clsx } from "clsx";

interface TooltipProps {
  content: string | ReactNode;
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  delay?: number;
}

function Tooltip({ content, children, side = "top", delay = 200 }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const show = () => {
    timerRef.current = setTimeout(() => setVisible(true), delay);
  };

  const hide = () => {
    clearTimeout(timerRef.current);
    setVisible(false);
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && (
        <div
          className={clsx(
            "absolute z-50 px-2.5 py-1.5 bg-[#1a1a26] border border-[#252838] text-[#f1f5f9] text-xs rounded-lg whitespace-nowrap shadow-card pointer-events-none animate-fade-in",
            {
              "bottom-full left-1/2 -translate-x-1/2 mb-2": side === "top",
              "top-full left-1/2 -translate-x-1/2 mt-2": side === "bottom",
              "right-full top-1/2 -translate-y-1/2 mr-2": side === "left",
              "left-full top-1/2 -translate-y-1/2 ml-2": side === "right",
            }
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}

export { Tooltip };
