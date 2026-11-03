'use client';

/* ═══════════════════════════════════════════════════════════════════════════
   PROCEDURE PICKER — one sheet, filters in place
   ───────────────────────────────────────────────────────────────────────────
   What was wrong: tapping the field opened a full-screen grid of emoji
   category tiles, and tapping a tile opened ANOTHER screen listing that
   category. Two takeovers and a back button to log one case. That is
   drill-down list navigation, which Android's own navigation guidance calls
   out as inefficient and cumbersome precisely because the tap count to reach
   content keeps climbing.

   What it is now: ONE overlay. eBay's design system and Material both say a
   large selection group with no real hierarchy should open directly into a
   single modal rather than a nested flow. So the sheet opens straight onto
   the procedures, and every control narrows that same list in place:

     · Most logged  — the procedures this user actually repeats, pinned top.
                      One tap from open to done, which is the common case.
     · Category chips — horizontally scrollable, "All" first. Tapping one
                      FILTERS the list below. It does not navigate, so there
                      is nothing to come back from. (eBay: filter chips give
                      quick access to the values that refine a list.)
     · Search       — optional, never required. Narrows the same list.

   Browsing is a first-class path: you can open the sheet and pick with your
   thumb without ever typing. Rows are 52px so they are comfortable one-handed
   (Apple HIG floor is 44). Arrow keys and Enter also work on a desktop, but
   they are a bonus on top of tapping, not the way through.

   Public API unchanged — QuickAddModal and the full log page need no edits.

   Sources consulted: eBay Playbook (bottom sheet, filter chip), Material 3
   bottom sheets, Android descendant/lateral navigation guidance, SAP Fiori
   chips (cap chips before they overwhelm — hence "All" + scroll, not a grid).
   ═══════════════════════════════════════════════════════════════════════════ */

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Search, X, Check, Plus } from 'lucide-react';
import type { Procedure } from '@/lib/procedureLibrary';
import { useDialogFocus } from '@/hooks/useDialogFocus';

interface ProcedurePickerProps {
  /** Procedures already filtered to the current specialty */
  procedures: Procedure[];
  value: string;
  onChange: (name: string, procedure: Procedure) => void;
}

const RECENTS_KEY = 'hippo.procedure.recents';
const MAX_RECENTS = 6;

function makeCustomProc(name: string, specialty = 'other'): Procedure {
  return {
    id: 'custom',
    name: name.trim(),
    specialty,
    category: 'Other',
    subcategory: 'Custom',
    approaches: [],
    aliases: [],
    complexityTier: 2,
    active: true,
  };
}

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

/** Higher is better; 0 means no match. Name beats alias beats category. */
function score(p: Procedure, q: string): number {
  const name = norm(p.name);
  if (name === q) return 1000;
  if (name.startsWith(q)) return 800 - name.length;
  if (name.includes(` ${q}`)) return 600 - name.length;
  if (name.includes(q)) return 400 - name.length;
  for (const a of p.aliases) {
    const al = norm(a);
    if (al.startsWith(q)) return 350;
    if (al.includes(q)) return 250;
  }
  if (norm(p.category).includes(q)) return 150;
  if (norm(p.subcategory).includes(q)) return 120;
  return 0;
}

function readRecents(): string[] {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter(x => typeof x === 'string').slice(0, MAX_RECENTS) : [];
  } catch {
    return [];
  }
}

function pushRecent(name: string) {
  if (!name) return;
  try {
    const next = [name, ...readRecents().filter(n => n !== name)].slice(0, MAX_RECENTS);
    localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
  } catch {
    /* private mode / blocked storage — recents are a convenience, not state */
  }
}

export function ProcedurePicker({ procedures, value, onChange }: ProcedurePickerProps) {
  const [open, setOpen]         = useState(false);
  const [query, setQuery]       = useState('');
  const [category, setCategory] = useState<string>('All');
  const [active, setActive]     = useState(-1);
  const [recents, setRecents]   = useState<string[]>([]);

  const listRef  = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const q = norm(query);
  const live = useMemo(() => procedures.filter(p => p.active !== false), [procedures]);

  // Recents are read on open so a log in another tab is picked up.
  useEffect(() => {
    if (open) setRecents(readRecents());
  }, [open]);

  const categories = useMemo(() => {
    const set = new Map<string, number>();
    for (const p of live) set.set(p.category, (set.get(p.category) ?? 0) + 1);
    return [...set.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));
  }, [live]);

  /**
   * One list, three narrowing inputs. Sections exist only to label the
   * scroll — they are never a screen you have to go into or come back from.
   */
  const sections = useMemo(() => {
    let pool = live;
    if (category !== 'All') pool = pool.filter(p => p.category === category);

    if (q) {
      const ranked = pool
        .map(p => ({ p, s: score(p, q) }))
        .filter(x => x.s > 0)
        .sort((a, b) => b.s - a.s || a.p.name.localeCompare(b.p.name))
        .slice(0, 80)
        .map(x => x.p);
      return [{ label: `${ranked.length} match${ranked.length === 1 ? '' : 'es'}`, items: ranked }];
    }

    const out: { label: string; items: Procedure[] }[] = [];

    // Most logged first — for a resident who repeats the same ten procedures,
    // this turns logging into a single tap.
    if (category === 'All') {
      const byName = new Map(live.map(p => [p.name, p]));
      const recent = recents.map(n => byName.get(n)).filter((p): p is Procedure => !!p);
      if (recent.length) out.push({ label: 'Most logged', items: recent });

      const recentNames = new Set(recent.map(p => p.name));
      const common = live.filter(p => p.isCommon && !recentNames.has(p.name));
      if (common.length) out.push({ label: 'Common', items: common });

      const seen = new Set([...recentNames, ...common.map(p => p.name)]);
      const byCategory = new Map<string, Procedure[]>();
      for (const p of live) {
        if (seen.has(p.name)) continue;
        const b = byCategory.get(p.category);
        if (b) b.push(p); else byCategory.set(p.category, [p]);
      }
      for (const [cat, items] of [...byCategory.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
        out.push({ label: cat, items: items.sort((a, b) => a.name.localeCompare(b.name)) });
      }
      return out;
    }

    return [{ label: category, items: [...pool].sort((a, b) => a.name.localeCompare(b.name)) }];
  }, [live, category, q, recents]);

  // Flat view for keyboard traversal (desktop convenience only).
  const flat = useMemo(() => sections.flatMap(s => s.items), [sections]);
  const showCustom = q.length > 0 && !live.some(p => norm(p.name) === q);

  useEffect(() => { setActive(-1); }, [q, category]);

  const commit = useCallback((p: Procedure) => {
    pushRecent(p.name);
    onChange(p.name, p);
    setOpen(false);
    setQuery('');
    setCategory('All');
  }, [onChange]);

  const commitCustom = useCallback(() => {
    const name = query.trim();
    if (!name) return;
    const proc = makeCustomProc(name, procedures[0]?.specialty);
    pushRecent(name);
    onChange(name, proc);
    setOpen(false);
    setQuery('');
    setCategory('All');
  }, [query, onChange, procedures]);

  // Escape closes the picker only — never the Log a Case sheet behind it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open]);

  useEffect(() => {
    if (active < 0) return;
    listRef.current?.querySelector<HTMLElement>('[data-active="true"]')
      ?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    // Native buttons must keep their own Enter/Space behaviour. Only the
    // search input and the initially focused dialog use list traversal.
    if (e.target !== inputRef.current && e.target !== dialogRef.current) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault(); setActive(i => Math.min(i + 1, flat.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault(); setActive(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (active >= 0 && flat[active]) commit(flat[active]);
      else if (showCustom) commitCustom();
      else if (flat[0]) commit(flat[0]);
    }
  };

  const dialogRef = useDialogFocus<HTMLDivElement>(open);
  let runningIndex = -1;

  return (
    <>
      {/* ── Trigger ────────────────────────────────────────────────────── */}
      <div className="pp-field">
      <button
        type="button"
        className="pp-trigger"
        data-filled={!!value}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <span className="pp-trigger__text">{value || 'Choose a procedure'}</span>
        {!value && <Search size={14} strokeWidth={1.8} className="pp-trigger__icon" />}
      </button>
        {value && (
          <button
            type="button"
            aria-label="Clear procedure"
            className="pp-trigger__clear"
            onClick={e => { e.stopPropagation(); onChange('', makeCustomProc('')); }}
          >
            <X size={13} strokeWidth={2} />
          </button>
        )}
      </div>

      {/* ── The one overlay ────────────────────────────────────────────── */}
      {open && (
        <div className="pp-scrim" onClick={() => setOpen(false)}>
          <div
            className="pp-sheet"
            ref={dialogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="Choose a procedure"
            onClick={e => e.stopPropagation()}
            onKeyDown={onKeyDown}
          >
            <div className="pp-sheet__grab" aria-hidden />

            <header className="pp-sheet__head">
              <h2 className="pp-sheet__title">Procedure</h2>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <X size={16} strokeWidth={1.8} />
              </button>
            </header>

            {/* Search is optional. Not autofocused — opening the sheet on a
                phone should show the list, not throw up a keyboard. */}
            <div className="pp-search">
              <Search size={14} strokeWidth={1.8} />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search, or just scroll"
                aria-label="Search procedures"
                autoComplete="off"
              />
              {query && (
                <button
                  type="button"
                  className="pp-search__clear"
                  onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                  aria-label="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Chips filter the list below. They never navigate. */}
            <div className="pp-chips" role="group" aria-label="Filter by category">
              <button
                type="button"
                aria-pressed={category === 'All'}
                className="pp-chip"
                onClick={() => setCategory('All')}
              >
                All
              </button>
              {categories.map(c => (
                <button
                  key={c.name}
                  type="button"
                  aria-pressed={category === c.name}
                  className="pp-chip"
                  onClick={() => setCategory(category === c.name ? 'All' : c.name)}
                >
                  {c.name}
                  <i>{c.count}</i>
                </button>
              ))}
            </div>

            <div className="pp-list" ref={listRef}>
              {flat.length === 0 && !showCustom && (
                <div className="pp-empty">
                  Nothing matches that. Clear the search or pick another category.
                </div>
              )}

              {sections.map(sec => (
                <section className="pp-section" key={sec.label}>
                  <h3 className="pp-section__label">{sec.label}</h3>
                  {sec.items.map(p => {
                    runningIndex += 1;
                    const idx = runningIndex;
                    const selected = p.name === value;
                    return (
                      <button
                        key={`${sec.label}-${p.id}`}
                        type="button"
                        className="pp-row"
                        data-active={idx === active}
                        data-selected={selected}
                        onMouseEnter={() => setActive(idx)}
                        onClick={() => commit(p)}
                      >
                        <span className="pp-row__name">{p.name}</span>
                        <span className="pp-row__meta">
                          {sec.label !== p.category && <span className="pp-row__cat">{p.category}</span>}
                          {selected && <Check size={14} strokeWidth={2.2} className="pp-row__check" />}
                        </span>
                      </button>
                    );
                  })}
                </section>
              ))}

              {showCustom && (
                <section className="pp-section">
                  <h3 className="pp-section__label">Not in the library</h3>
                  <button type="button" className="pp-row pp-row--custom" onClick={commitCustom}>
                    <Plus size={14} strokeWidth={2.2} />
                    <span className="pp-row__name">Log &ldquo;{query.trim()}&rdquo; as written</span>
                  </button>
                </section>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
