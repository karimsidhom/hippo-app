"use client";

import { InputHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  showMarks?: boolean;
  color?: string;
}

const Slider = forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      className,
      label,
      min = 0,
      max = 100,
      step = 1,
      value,
      onChange,
      formatValue,
      showMarks,
      color = "#2563eb",
      ...props
    },
    ref
  ) => {
    const percentage = ((value - min) / (max - min)) * 100;
    const displayValue = formatValue ? formatValue(value) : value.toString();

    return (
      <div className={clsx("space-y-2", className)}>
        {(label || formatValue) && (
          <div className="flex items-center justify-between">
            {label && <label className="text-sm font-medium text-[#94a3b8]">{label}</label>}
            <span className="text-sm font-semibold text-[#f1f5f9]">{displayValue}</span>
          </div>
        )}
        <div className="relative py-1">
          <div className="h-1.5 w-full bg-[#1e2130] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-150"
              style={{ width: `${percentage}%`, backgroundColor: color }}
            />
          </div>
          <input
            ref={ref}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
            {...props}
          />
          {/* Thumb indicator */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-md transition-all duration-150"
            style={{
              left: `calc(${percentage}% - 8px)`,
              backgroundColor: color,
            }}
          />
        </div>
        {showMarks && (
          <div className="flex justify-between">
            <span className="text-xs text-[#64748b]">{formatValue ? formatValue(min) : min}</span>
            <span className="text-xs text-[#64748b]">{formatValue ? formatValue(max) : max}</span>
          </div>
        )}
      </div>
    );
  }
);
Slider.displayName = "Slider";

export { Slider };
