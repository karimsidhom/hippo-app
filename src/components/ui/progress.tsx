import { HTMLAttributes } from "react";
import { clsx } from "clsx";

interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  color?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
}

function Progress({
  className,
  value,
  max = 100,
  color = "#2563eb",
  size = "md",
  showLabel = false,
  label,
  animated = true,
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={clsx("space-y-1", className)}>
      {(label || showLabel) && (
        <div className="flex items-center justify-between text-xs">
          {label && <span className="text-[#94a3b8]">{label}</span>}
          {showLabel && (
            <span className="text-[#f1f5f9] font-medium">
              {value}/{max}
            </span>
          )}
        </div>
      )}
      <div
        className={clsx("w-full bg-[#1e2130] rounded-full overflow-hidden", {
          "h-1": size === "sm",
          "h-2": size === "md",
          "h-3": size === "lg",
        })}
      >
        <div
          className={clsx("h-full rounded-full", animated && "transition-all duration-700 ease-out")}
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export { Progress };
