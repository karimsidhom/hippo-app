"use client";

import { SelectHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";
import { ChevronDown } from "lucide-react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string; disabled?: boolean }[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, options, placeholder, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-[#94a3b8]">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={clsx(
              "w-full bg-[#16161f] border text-[#f1f5f9] rounded-lg pl-3 pr-10 py-2.5 text-sm",
              "focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent",
              "transition-all duration-150 cursor-pointer appearance-none",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              error ? "border-[#ef4444]" : "border-[#1e2130]",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b] pointer-events-none" />
        </div>
        {error && <p className="text-xs text-[#ef4444]">{error}</p>}
        {hint && !error && <p className="text-xs text-[#64748b]">{hint}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
