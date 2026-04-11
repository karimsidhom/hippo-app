import { ButtonHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
  size?: "xs" | "sm" | "md" | "lg";
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0f]",
          "disabled:opacity-50 disabled:cursor-not-allowed active:scale-95",
          // Variants
          {
            "bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-glow-blue": variant === "primary",
            "bg-[#16161f] hover:bg-[#1a1a26] text-[#f1f5f9] border border-[#1e2130] hover:border-[#252838]":
              variant === "secondary",
            "bg-transparent hover:bg-[#16161f] text-[#f1f5f9] border border-[#1e2130] hover:border-[#252838]":
              variant === "outline",
            "bg-transparent hover:bg-[#16161f] text-[#94a3b8] hover:text-[#f1f5f9]":
              variant === "ghost",
            "bg-[#ef4444] hover:bg-[#dc2626] text-white": variant === "danger",
            "bg-[#10b981] hover:bg-[#059669] text-white": variant === "success",
          },
          // Sizes
          {
            "text-xs px-2.5 py-1.5": size === "xs",
            "text-sm px-3 py-2": size === "sm",
            "text-sm px-4 py-2.5": size === "md",
            "text-base px-6 py-3": size === "lg",
          },
          className
        )}
        {...props}
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {!loading && rightIcon}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };
