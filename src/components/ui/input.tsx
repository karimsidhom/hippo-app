import { InputHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftAddon, rightAddon, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-[#94a3b8]">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftAddon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-[#64748b]">
              {leftAddon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={clsx(
              "w-full bg-[#16161f] border text-[#f1f5f9] placeholder-[#64748b] rounded-lg py-2.5",
              "focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent",
              "transition-all duration-150 text-sm",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              error ? "border-[#ef4444]" : "border-[#1e2130]",
              leftAddon ? "pl-10" : "pl-3",
              rightAddon ? "pr-10" : "pr-3",
              className
            )}
            {...props}
          />
          {rightAddon && (
            <div className="absolute right-3 flex items-center pointer-events-none text-[#64748b]">
              {rightAddon}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-[#ef4444]">{error}</p>}
        {hint && !error && <p className="text-xs text-[#64748b]">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
