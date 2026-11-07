'use client';

import { useEffect, useState } from 'react';

export interface PickedProgram {
  id: string;
  name: string;
}

interface DiscoveredProgram extends PickedProgram {
  institution: string | null;
  specialty: string | null;
  memberCount: number;
  myStatus: string | null;
}

/**
 * Type-ahead over discoverable programs, used during onboarding so a
 * resident can attach themselves instead of waiting for an invite.
 * Choosing is optional: the caller may submit with value still null.
 */
export function ProgramPicker({
  value,
  onChange,
}: {
  value: PickedProgram | null;
  onChange: (p: PickedProgram | null) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DiscoveredProgram[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (value) return;
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/programs/discover?q=${encodeURIComponent(q)}`,
        );
        const data = await res.json();
        if (!cancelled) setResults(data.programs ?? []);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setSearched(true);
        }
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, value]);

  if (value) {
    return (
      <div className="flex items-center justify-between gap-3 p-4 bg-[#2563eb]/10 border border-[#2563eb] rounded-xl">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#f1f5f9] truncate">{value.name}</p>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            Your program director will be asked to approve you.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            onChange(null);
            setQuery('');
          }}
          className="text-xs text-[#94a3b8] hover:text-[#f1f5f9] underline flex-shrink-0 transition-colors"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by program or institution"
        aria-label="Search for your program"
        className="w-full px-4 py-3 bg-[#111118] border border-[#1e2130] rounded-xl text-[#f1f5f9] placeholder:text-[#64748b] focus:outline-none focus:border-[#2563eb] transition-colors"
      />

      {loading && <p className="text-xs text-[#64748b] px-1">Searching...</p>}

      {!loading && searched && results.length === 0 && (
        <p className="text-xs text-[#64748b] px-1">
          No programs match that. You can skip this and join later from Programs.
        </p>
      )}

      <div className="space-y-2">
        {results.map((p) => {
          const taken = p.myStatus === 'MEMBER' || p.myStatus === 'PENDING';
          const detail = [p.institution, p.specialty].filter(Boolean).join(' · ');
          return (
            <button
              key={p.id}
              type="button"
              disabled={taken}
              onClick={() => onChange({ id: p.id, name: p.name })}
              className="w-full text-left p-4 bg-[#111118] border border-[#1e2130] rounded-xl transition-all hover:border-[#2563eb] active:scale-[0.99] disabled:opacity-50 disabled:hover:border-[#1e2130]"
            >
              <p className="text-sm font-medium text-[#f1f5f9]">{p.name}</p>
              <p className="text-xs text-[#64748b] mt-0.5">
                {detail}
                {taken
                  ? `${detail ? ' · ' : ''}${p.myStatus === 'MEMBER' ? 'Already a member' : 'Request pending'}`
                  : ''}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
