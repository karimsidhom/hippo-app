import { HTMLAttributes } from "react";
import { clsx } from "clsx";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "purple" | "outline";
  size?: "sm" | "md";
}

function Badge({ className, variant = "default", size = "sm", children, ...props }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full font-medium",
        {
          "px-2 py-0.5 text-xs": size === "sm",
          "px-2.5 py-1 text-sm": size === "md",
        },
        {
          "bg-[#1e2130] text-[#94a3b8]": variant === "default",
          "bg-[#10b981]/15 text-[#10b981]": variant === "success",
          "bg-[#f59e0b]/15 text-[#f59e0b]": variant === "warning",
          "bg-[#ef4444]/15 text-[#ef4444]": variant === "danger",
          "bg-[#2563eb]/15 text-[#3b82f6]": variant === "info",
          "bg-[#6366f1]/15 text-[#818cf8]": variant === "purple",
          "border border-[#1e2130] text-[#94a3b8] bg-transparent": variant === "outline",
        },
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export { Badge };
