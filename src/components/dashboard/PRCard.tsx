import type { PersonalRecord } from "@/lib/types";
import { Zap } from "lucide-react";

interface PRCardProps {
  pr: PersonalRecord;
}

export function PRCard({ pr }: PRCardProps) {
  const dateStr = new Date(pr.achievedAt).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
  });

  const improvement =
    pr.previousValue && pr.recordType === "FASTEST_TIME"
      ? Math.round(pr.previousValue - pr.value)
      : null;

  return (
    <div className="flex items-center gap-3 p-3 bg-[#1a1a2e] border border-[#2563eb]/25 rounded-lg hover:border-[#2563eb]/40 transition-all">
      <div className="w-9 h-9 rounded-xl bg-[#2563eb]/20 flex items-center justify-center flex-shrink-0">
        <Zap className="w-4 h-4 text-[#3b82f6]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#f1f5f9] truncate">
          PR: {pr.procedureName.split(" ").slice(0, 3).join(" ")}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs text-[#3b82f6] font-medium">{Math.round(pr.value)} min</p>
          {improvement && improvement > 0 && (
            <span className="text-xs text-[#10b981]">↓ {improvement}min faster</span>
          )}
        </div>
      </div>
      <div className="flex-shrink-0">
        <p className="text-xs text-[#64748b]">{dateStr}</p>
      </div>
    </div>
  );
}
