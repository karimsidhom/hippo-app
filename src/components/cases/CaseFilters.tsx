"use client";

import { SPECIALTIES, AUTONOMY_LEVELS, SURGICAL_APPROACHES, OUTCOME_CATEGORIES } from "@/lib/constants";
import { X } from "lucide-react";

interface Filters {
  specialty: string;
  procedure: string;
  role: string;
  autonomyLevel: string;
  approach: string;
  dateFrom: string;
  dateTo: string;
  outcome: string;
}

interface CaseFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onClear: () => void;
}

export function CaseFilters({ filters, onChange, onClear }: CaseFiltersProps) {
  const update = (key: keyof Filters, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="bg-[#111118] border border-[#1e2130] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[#f1f5f9]">Filters</h3>
        {hasFilters && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-[#64748b] hover:text-[#94a3b8] transition-colors"
          >
            <X className="w-3 h-3" />
            Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {/* Specialty */}
        <div>
          <label className="block text-xs text-[#64748b] mb-1.5">Specialty</label>
          <select
            value={filters.specialty}
            onChange={(e) => update("specialty", e.target.value)}
            className="w-full bg-[#16161f] border border-[#1e2130] text-[#f1f5f9] rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
          >
            <option value="">All specialties</option>
            {SPECIALTIES.map((s) => (
              <option key={s.slug} value={s.slug}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Role */}
        <div>
          <label className="block text-xs text-[#64748b] mb-1.5">Role</label>
          <select
            value={filters.role}
            onChange={(e) => update("role", e.target.value)}
            className="w-full bg-[#16161f] border border-[#1e2130] text-[#f1f5f9] rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
          >
            <option value="">All roles</option>
            <option value="First Surgeon">First Surgeon</option>
            <option value="Assist">Assistant</option>
            <option value="Observer">Observer</option>
          </select>
        </div>

        {/* Autonomy */}
        <div>
          <label className="block text-xs text-[#64748b] mb-1.5">Autonomy</label>
          <select
            value={filters.autonomyLevel}
            onChange={(e) => update("autonomyLevel", e.target.value)}
            className="w-full bg-[#16161f] border border-[#1e2130] text-[#f1f5f9] rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
          >
            <option value="">All levels</option>
            {AUTONOMY_LEVELS.map((al) => (
              <option key={al.value} value={al.value}>{al.label}</option>
            ))}
          </select>
        </div>

        {/* Approach */}
        <div>
          <label className="block text-xs text-[#64748b] mb-1.5">Approach</label>
          <select
            value={filters.approach}
            onChange={(e) => update("approach", e.target.value)}
            className="w-full bg-[#16161f] border border-[#1e2130] text-[#f1f5f9] rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
          >
            <option value="">All approaches</option>
            {SURGICAL_APPROACHES.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </div>

        {/* Outcome */}
        <div>
          <label className="block text-xs text-[#64748b] mb-1.5">Outcome</label>
          <select
            value={filters.outcome}
            onChange={(e) => update("outcome", e.target.value)}
            className="w-full bg-[#16161f] border border-[#1e2130] text-[#f1f5f9] rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
          >
            <option value="">All outcomes</option>
            {OUTCOME_CATEGORIES.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Date From */}
        <div>
          <label className="block text-xs text-[#64748b] mb-1.5">From Date</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => update("dateFrom", e.target.value)}
            className="w-full bg-[#16161f] border border-[#1e2130] text-[#f1f5f9] rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
          />
        </div>

        {/* Date To */}
        <div>
          <label className="block text-xs text-[#64748b] mb-1.5">To Date</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => update("dateTo", e.target.value)}
            className="w-full bg-[#16161f] border border-[#1e2130] text-[#f1f5f9] rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
          />
        </div>

        {/* Procedure search */}
        <div>
          <label className="block text-xs text-[#64748b] mb-1.5">Procedure</label>
          <input
            type="text"
            placeholder="Filter by procedure..."
            value={filters.procedure}
            onChange={(e) => update("procedure", e.target.value)}
            className="w-full bg-[#16161f] border border-[#1e2130] text-[#f1f5f9] placeholder-[#64748b] rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
          />
        </div>
      </div>
    </div>
  );
}
