"use client";

import type { CaseLog } from "@/lib/types";
import { AUTONOMY_LEVELS, OUTCOME_CATEGORIES } from "@/lib/constants";
import { Clock, Trash2, Copy, Edit, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useState } from "react";

interface CaseCardProps {
  caseLog: CaseLog;
  compact?: boolean;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
}

const APPROACH_LABELS: Record<string, string> = {
  OPEN: "Open",
  LAPAROSCOPIC: "Lap",
  ROBOTIC: "Robot",
  ENDOSCOPIC: "Endo",
  PERCUTANEOUS: "PCNL",
  HYBRID: "Hybrid",
  OTHER: "Other",
};

export function CaseCard({ caseLog, compact = false, onDelete, onDuplicate }: CaseCardProps) {
  const [expanded, setExpanded] = useState(false);

  const autonomyDef = AUTONOMY_LEVELS.find((a) => a.value === caseLog.autonomyLevel);
  const outcomeDef = OUTCOME_CATEGORIES.find((o) => o.value === caseLog.outcomeCategory);

  const caseDate = new Date(caseLog.caseDate);
  const dateStr = caseDate.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-[#16161f] border border-[#1e2130] rounded-lg hover:border-[#252838] transition-colors">
        <div className="w-8 h-8 rounded-lg bg-[#1a1a2e] flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-[#2563eb]">
            {APPROACH_LABELS[caseLog.surgicalApproach]?.slice(0, 2) || "S"}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#f1f5f9] truncate">{caseLog.procedureName}</p>
          <p className="text-xs text-[#64748b] mt-0.5">{dateStr}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {caseLog.operativeDurationMinutes && (
            <span className="text-xs text-[#94a3b8] flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {caseLog.operativeDurationMinutes}m
            </span>
          )}
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              color: autonomyDef?.color || "#64748b",
              backgroundColor: `${autonomyDef?.color || "#64748b"}15`,
            }}
          >
            {caseLog.autonomyLevel === "SUPERVISOR_PRESENT" ? "Sup." :
             caseLog.autonomyLevel === "INDEPENDENT" ? "Indep." :
             caseLog.autonomyLevel === "TEACHING" ? "Teach." :
             caseLog.autonomyLevel.charAt(0)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#111118] border border-[#1e2130] rounded-xl overflow-hidden hover:border-[#252838] transition-all duration-200">
      {/* Header */}
      <div
        className="flex items-start justify-between p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#1a1a2e] border border-[#2563eb]/20 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-[#2563eb]">
              {APPROACH_LABELS[caseLog.surgicalApproach] || "S"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[#f1f5f9] truncate pr-4">{caseLog.procedureName}</p>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <span className="text-xs text-[#64748b]">{dateStr}</span>
              <span className="text-[#252838]">·</span>
              <span className="text-xs text-[#94a3b8]">{caseLog.role}</span>
              {caseLog.operativeDurationMinutes && (
                <>
                  <span className="text-[#252838]">·</span>
                  <span className="text-xs text-[#94a3b8] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {caseLog.operativeDurationMinutes}m
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge
            variant={
              caseLog.autonomyLevel === "INDEPENDENT" || caseLog.autonomyLevel === "TEACHING"
                ? "success"
                : caseLog.autonomyLevel === "SUPERVISOR_PRESENT"
                ? "warning"
                : "default"
            }
          >
            {autonomyDef?.label.split(" ")[0] || caseLog.autonomyLevel}
          </Badge>
          {expanded ? <ChevronUp className="w-4 h-4 text-[#64748b]" /> : <ChevronDown className="w-4 h-4 text-[#64748b]" />}
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-[#1e2130] animate-slide-down">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3 text-xs">
            <div>
              <p className="text-[#64748b]">Specialty</p>
              <p className="text-[#f1f5f9] mt-0.5">{caseLog.specialtyName || "—"}</p>
            </div>
            <div>
              <p className="text-[#64748b]">Approach</p>
              <p className="text-[#f1f5f9] mt-0.5">{caseLog.surgicalApproach}</p>
            </div>
            <div>
              <p className="text-[#64748b]">Difficulty</p>
              <p className="text-[#f1f5f9] mt-0.5">{caseLog.difficultyScore}/5</p>
            </div>
            {caseLog.consoleTimeMinutes && (
              <div>
                <p className="text-[#64748b]">Console Time</p>
                <p className="text-[#f1f5f9] mt-0.5">{caseLog.consoleTimeMinutes}m</p>
              </div>
            )}
            <div>
              <p className="text-[#64748b]">Outcome</p>
              <p className="mt-0.5" style={{ color: outcomeDef?.color || "#94a3b8" }}>
                {outcomeDef?.label || caseLog.outcomeCategory}
              </p>
            </div>
            <div>
              <p className="text-[#64748b]">Patient Age</p>
              <p className="text-[#f1f5f9] mt-0.5">
                {caseLog.patientAgeBin.replace("AGE_", "").replace("_", "–")}
              </p>
            </div>
          </div>

          {caseLog.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {caseLog.tags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 bg-[#1a1a2e] text-[#3b82f6] border border-[#2563eb]/30 rounded-full text-xs">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {caseLog.notes && (
            <div className="mt-3 p-2.5 bg-[#16161f] rounded-lg">
              <p className="text-xs text-[#64748b] mb-1">Notes</p>
              <p className="text-xs text-[#94a3b8] leading-relaxed line-clamp-3">{caseLog.notes}</p>
            </div>
          )}

          {/* Actions */}
          {(onDelete || onDuplicate) && (
            <div className="flex gap-2 mt-3 pt-3 border-t border-[#1e2130]">
              {onDuplicate && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDuplicate(caseLog.id); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#16161f] border border-[#1e2130] text-[#94a3b8] hover:text-[#f1f5f9] rounded-lg text-xs transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  Duplicate
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(caseLog.id); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#16161f] border border-[#ef4444]/30 text-[#ef4444] hover:bg-[#ef4444] hover:text-white rounded-lg text-xs transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
