"use client";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: "sm" | "md";
}

function Switch({ checked, onChange, label, description, disabled = false, size = "md" }: SwitchProps) {
  return (
    <label className={`flex items-center gap-3 ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
      {(label || description) && (
        <div className="flex-1">
          {label && <p className="text-sm font-medium text-[#f1f5f9]">{label}</p>}
          {description && <p className="text-xs text-[#64748b] mt-0.5">{description}</p>}
        </div>
      )}
      <div
        onClick={() => !disabled && onChange(!checked)}
        className={`relative flex-shrink-0 rounded-full transition-colors duration-200 ${
          size === "sm" ? "w-9 h-5" : "w-11 h-6"
        } ${checked ? "bg-[#2563eb]" : "bg-[#1e2130]"}`}
      >
        <span
          className={`absolute top-0.5 rounded-full bg-white shadow transition-transform duration-200 ${
            size === "sm" ? "w-4 h-4" : "w-5 h-5"
          } ${
            checked
              ? size === "sm" ? "translate-x-4" : "translate-x-5"
              : "translate-x-0.5"
          }`}
        />
      </div>
    </label>
  );
}

export { Switch };
