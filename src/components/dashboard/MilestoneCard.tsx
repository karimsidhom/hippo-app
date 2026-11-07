import type { Milestone } from "@/lib/types";
import { formatMilestone } from "@/lib/milestones";

interface MilestoneCardProps {
  milestone: Milestone;
}

export function MilestoneCard({ milestone }: MilestoneCardProps) {
  const formatted = formatMilestone(milestone);
  const dateStr = new Date(milestone.achievedAt).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg border transition-all hover:border-[#252838]"
      style={{
        backgroundColor: `${formatted.color}08`,
        borderColor: `${formatted.color}25`,
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl animate-bounce-in"
        style={{ backgroundColor: `${formatted.color}20` }}
      >
        {formatted.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#f1f5f9] truncate">{formatted.title}</p>
        <p className="text-xs text-[#64748b] mt-0.5 truncate">{formatted.description}</p>
      </div>
      <div className="flex-shrink-0 text-right">
        <p className="text-xs text-[#64748b]">{dateStr}</p>
      </div>
    </div>
  );
}
