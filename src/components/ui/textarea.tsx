import { TextareaHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-[#94a3b8]">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={clsx(
            "w-full bg-[#16161f] border text-[#f1f5f9] placeholder-[#64748b] rounded-lg px-3 py-2.5 text-sm",
            "focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent",
            "transition-all duration-150 resize-none",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error ? "border-[#ef4444]" : "border-[#1e2130]",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-[#ef4444]">{error}</p>}
        {hint && !error && <p className="text-xs text-[#64748b]">{hint}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
