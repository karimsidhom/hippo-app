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
      <div className="flex items-center gap-3 p-3 bg-[var(--surface2)] border border-[var(--border)] rounded-lg hover:border-[var(--border-mid)] transition-colors">
        <div className="w-8 h-8 rounded-lg bg-[var(--surface2)] flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-[var(--primary)]">
            {APPROACH_LABELS[caseLog.surgicalApproach]?.slice(0, 2) || "S"}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--text)] truncate">{caseLog.procedureName}</p>
          <p className="text-xs text-[var(--text-3)] mt-0.5">{dateStr}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {caseLog.operativeDurationMinutes && (
            <span className="text-xs text-[var(--text-2)] flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {caseLog.operativeDurationMinutes}m
            </span>
          )}
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              color: autonomyDef?.color || "var(--text-3)",
              backgroundColor: `${autonomyDef?.color || "var(--text-3)"}15`,
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
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden hover:border-[var(--border-mid)] transition-all duration-200">
      {/* Header */}
      <div
        className="flex items-start justify-between p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[var(--surface2)] border border-[var(--primary)]/20 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-[var(--primary)]">
              {APPROACH_LABELS[caseLog.surgicalApproach] || "S"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[var(--text)] truncate pr-4">{caseLog.procedureName}</p>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <span className="text-xs text-[var(--text-3)]">{dateStr}</span>
              <span className="text-[var(--border-mid)]">·</span>
              <span className="text-xs text-[var(--text-2)]">{caseLog.role}</span>
              {caseLog.operativeDurationMinutes && (
                <>
                  <span className="text-[var(--border-mid)]">·</span>
                  <span className="text-xs text-[var(--text-2)] flex items-center gap-1">
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
          {expanded ? <ChevronUp className="w-4 h-4 text-[var(--text-3)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-3)]" />}
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-[var(--border)] animate-slide-down">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3 text-xs">
            <div>
              <p className="text-[var(--text-3)]">Specialty</p>
              <p className="text-[var(--text)] mt-0.5">{caseLog.specialtyName || "—"}</p>
            </div>
            <div>
              <p className="text-[var(--text-3)]">Approach</p>
              <p className="text-[var(--text)] mt-0.5">{caseLog.surgicalApproach}</p>
            </div>
            <div>
              <p className="text-[var(--text-3)]">Difficulty</p>
              <p className="text-[var(--text)] mt-0.5">{caseLog.difficultyScore}/5</p>
            </div>
            {caseLog.consoleTimeMinutes && (
              <div>
                <p className="text-[var(--text-3)]">Console Time</p>
                <p className="text-[var(--text)] mt-0.5">{caseLog.consoleTimeMinutes}m</p>
              </div>
            )}
            <div>
              <p className="text-[var(--text-3)]">Outcome</p>
              <p className="mt-0.5" style={{ color: outcomeDef?.color || "var(--text-2)" }}>
                {outcomeDef?.label || caseLog.outcomeCategory}
              </p>
            </div>
            <div>
              <p className="text-[var(--text-3)]">Patient Age</p>
              <p className="text-[var(--text)] mt-0.5">
                {caseLog.patientAgeBin.replace("AGE_", "").replace("_", "–")}
              </p>
            </div>
          </div>

          {caseLog.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {caseLog.tags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 bg-[var(--surface2)] text-[#3b82f6] border border-[var(--primary)]/30 rounded-full text-xs">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {caseLog.notes && (
            <div className="mt-3 p-2.5 bg-[var(--surface2)] rounded-lg">
              <p className="text-xs text-[var(--text-3)] mb-1">Notes</p>
              <p className="text-xs text-[var(--text-2)] leading-relaxed line-clamp-3">{caseLog.notes}</p>
            </div>
          )}

          {/* Actions */}
          {(onDelete || onDuplicate) && (
            <div className="flex gap-2 mt-3 pt-3 border-t border-[var(--border)]">
              {onDuplicate && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDuplicate(caseLog.id); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--surface2)] border border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text)] rounded-lg text-xs transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  Duplicate
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(caseLog.id); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--surface2)] border border-[#ef4444]/30 text-[#ef4444] hover:bg-[#ef4444] hover:text-white rounded-lg text-xs transition-colors"
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
