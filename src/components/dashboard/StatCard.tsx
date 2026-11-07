import { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    label: string;
    positive: boolean;
  };
  color?: "blue" | "green" | "yellow" | "purple" | "red";
}

const COLOR_MAP = {
  blue: { bg: "#2563eb15", border: "#2563eb30", badge: "#2563eb" },
  green: { bg: "#10b98115", border: "#10b98130", badge: "#10b981" },
  yellow: { bg: "#f59e0b15", border: "#f59e0b30", badge: "#f59e0b" },
  purple: { bg: "#6366f115", border: "#6366f130", badge: "#6366f1" },
  red: { bg: "#ef444415", border: "#ef444430", badge: "#ef4444" },
};

export function StatCard({ title, value, subtitle, icon, trend, color = "blue" }: StatCardProps) {
  const colors = COLOR_MAP[color];

  return (
    <div
      className="bg-[#111118] border rounded-xl p-4 transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5"
      style={{ borderColor: colors.border }}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-[#94a3b8]">{title}</p>
        {icon && (
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: colors.bg }}
          >
            {icon}
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-[#f1f5f9] animate-count-up">{value}</p>
        {subtitle && <p className="text-xs text-[#64748b] mt-0.5">{subtitle}</p>}
      </div>
      {trend && (
        <div className="flex items-center gap-1 mt-2">
          {trend.positive ? (
            <TrendingUp className="w-3 h-3 text-[#10b981]" />
          ) : (
            <TrendingDown className="w-3 h-3 text-[#ef4444]" />
          )}
          <span className={`text-xs font-medium ${trend.positive ? "text-[#10b981]" : "text-[#ef4444]"}`}>
            +{trend.value}
          </span>
          <span className="text-xs text-[#64748b]">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
