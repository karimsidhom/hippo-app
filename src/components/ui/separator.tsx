import { HTMLAttributes } from "react";
import { clsx } from "clsx";

interface SeparatorProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
}

function Separator({ className, orientation = "horizontal", ...props }: SeparatorProps) {
  return (
    <div
      className={clsx(
        "bg-[#1e2130] flex-shrink-0",
        {
          "h-px w-full": orientation === "horizontal",
          "w-px h-full": orientation === "vertical",
        },
        className
      )}
      {...props}
    />
  );
}

export { Separator };
