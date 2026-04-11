"use client";

import type { CaseLog } from "@/lib/types";
import { AUTONOMY_LEVELS, OUTCOME_CATEGORIES } from "@/lib/constants";
import { Trash2, Copy, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CaseTableProps {
  cases: CaseLog[];
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
}

const APPROACH_SHORT: Record<string, string> = {
  OPEN: "Open",
  LAPAROSCOPIC: "Lap",
  ROBOTIC: "Robot",
  ENDOSCOPIC: "Endo",
  PERCUTANEOUS: "PCNL",
  HYBRID: "Hybrid",
  OTHER: "Other",
};

export function CaseTable({ cases, onDelete, onDuplicate }: CaseTableProps) {
  return (
    <div className="bg-[#111118] border border-[#1e2130] rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1e2130] bg-[#0d0d14]">
              <th className="text-left text-[#64748b] font-medium px-4 py-3 text-xs">Date</th>
              <th className="text-left text-[#64748b] font-medium px-4 py-3 text-xs">Procedure</th>
              <th className="text-left text-[#64748b] font-medium px-4 py-3 text-xs">Approach</th>
              <th className="text-left text-[#64748b] font-medium px-4 py-3 text-xs">Role</th>
              <th className="text-left text-[#64748b] font-medium px-4 py-3 text-xs">Autonomy</th>
              <th className="text-right text-[#64748b] font-medium px-4 py-3 text-xs">OR Time</th>
              <th className="text-left text-[#64748b] font-medium px-4 py-3 text-xs">Outcome</th>
              <th className="text-left text-[#64748b] font-medium px-4 py-3 text-xs">Diff.</th>
              <th className="px-4 py-3 text-xs"></th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c, index) => {
              const autonomyDef = AUTONOMY_LEVELS.find((a) => a.value === c.autonomyLevel);
              const outcomeDef = OUTCOME_CATEGORIES.find((o) => o.value === c.outcomeCategory);
              const caseDate = new Date(c.caseDate);

              return (
                <tr
                  key={c.id}
                  className={`border-b border-[#1e2130]/50 hover:bg-[#16161f] transition-colors group ${
                    index % 2 === 0 ? "" : "bg-[#0d0d14]/30"
                  }`}
                >
                  <td className="px-4 py-3 text-[#94a3b8] whitespace-nowrap">
                    {caseDate.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "2-digit" })}
                  </td>
                  <td className="px-4 py-3 max-w-[240px]">
                    <p className="text-[#f1f5f9] font-medium truncate">{c.procedureName}</p>
                    {c.specialtyName && (
                      <p className="text-xs text-[#64748b] mt-0.5">{c.specialtyName}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 bg-[#1a1a26] text-[#94a3b8] rounded-md">
                      {APPROACH_SHORT[c.surgicalApproach] || c.surgicalApproach}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-[#94a3b8]">{c.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
                      style={{
                        color: autonomyDef?.color || "#64748b",
                        backgroundColor: `${autonomyDef?.color || "#64748b"}15`,
                      }}
                    >
                      {autonomyDef?.label?.split(" ")[0] || c.autonomyLevel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {c.operativeDurationMinutes ? (
                      <span className="text-[#94a3b8] text-xs flex items-center justify-end gap-1">
                        <Clock className="w-3 h-3" />
                        {c.operativeDurationMinutes}m
                      </span>
                    ) : (
                      <span className="text-[#64748b] text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs font-medium"
                      style={{ color: outcomeDef?.color || "#94a3b8" }}
                    >
                      {c.outcomeCategory === "UNCOMPLICATED"
                        ? "✓"
                        : outcomeDef?.label?.split(" ")[0] || c.outcomeCategory}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }, (_, i) => (
                        <div
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full ${
                            i < c.difficultyScore ? "bg-[#f59e0b]" : "bg-[#1e2130]"
                          }`}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onDuplicate && (
                        <button
                          onClick={() => onDuplicate(c.id)}
                          className="p-1.5 rounded text-[#64748b] hover:text-[#94a3b8] hover:bg-[#1a1a26] transition-colors"
                          title="Duplicate"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(c.id)}
                          className="p-1.5 rounded text-[#64748b] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
