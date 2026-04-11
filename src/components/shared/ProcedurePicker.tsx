'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, X, Check, Pencil } from 'lucide-react';
import type { Procedure } from '@/lib/procedureLibrary';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProcedurePickerProps {
  /** Procedures already filtered to the current specialty */
  procedures: Procedure[];
  value: string;
  onChange: (name: string, procedure: Procedure) => void;
}

type PickerView = 'subcategory' | 'procedure' | 'custom';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_COLORS = [
  '#6c7fff', '#3ecf8e', '#a78bfa', '#f97316', '#e05c5c',
  '#06b6d4', '#ec4899', '#84cc16', '#d946ef', '#14b8a6',
  '#f59e0b', '#0ea5e9', '#a16207', '#059669', '#dc2626',
];

function categoryColor(cat: string): string {
  let hash = 0;
  for (let i = 0; i < cat.length; i++) hash = (hash * 31 + cat.charCodeAt(i)) & 0xffff;
  return CATEGORY_COLORS[hash % CATEGORY_COLORS.length]!;
}

const CATEGORY_ICONS: Record<string, string> = {
  // Urology
  'Endourology': '🔭', 'Bladder': '🫧', 'Prostate': '🔵', 'Kidney': '🟠',
  'Oncology': '🎗️', 'Andrology': '⚡', 'Scrotum': '🔘', 'Incontinence': '💧',
  'Urethra': '〰️', 'Ureter': '🔗', 'Pediatric': '🧒',
  // General Surgery
  'Biliary': '🟡', 'Hernia': '🩹', 'Foregut': '🔺', 'Bariatric': '⚖️',
  'Colorectal': '🟤', 'Breast': '🌸', 'Endocrine': '⚗️', 'HPB': '🫀',
  'Trauma': '🚨', 'Vascular Access': '💉',
  // Neurosurgery
  'Cranial': '🧠', 'Vascular': '🩸', 'Cranial Nerve': '⚡', 'CSF': '💧',
  'Spine': '🦴', 'Functional': '🧬', 'Epilepsy': '⚡', 'Sellar': '🔬',
  // Ortho
  'Arthroplasty': '🦿', 'Sports': '⚽', 'Hand': '🖐️',
  // Cardiac
  'Coronary': '🫀', 'Valve': '❤️', 'Aorta': '🔴', 'Congenital': '🧒',
  // Vascular
  'Cerebrovascular': '🧠', 'Aortic': '🔴', 'Peripheral': '🦵', 'Dialysis': '💊', 'Venous': '💙',
  // Plastic
  'Reconstructive': '🔧', 'Aesthetic': '✨', 'Burns': '🔥', 'Microsurgery': '🔬',
  // ENT
  'Ear': '👂', 'Nose & Sinus': '👃', 'Throat': '🗣️', 'Salivary': '💦',
  'Head & Neck': '🦷', 'Larynx': '🎙️',
  // OB-GYN
  'Uterus': '🌸', 'Ovary & Fallopian': '🌺', 'Pelvic Floor': '🔵', 'Obstetrics': '👶',
  'Vulva & Vagina': '🌷',
  // Ophthalmology
  'Cataract': '👁️', 'Retina': '🔬', 'Glaucoma': '👓', 'Cornea': '🔵', 'Oculoplastics': '🪞',
  // Pediatric Surgery
  'Neonatal': '🍼', 'GI Pediatric': '🔵', 'Thoracic Pediatric': '🫁', 'Urology Pediatric': '💧',
  'Tumor': '🎗️',
  // Thoracic
  'Lung': '🫁', 'Esophagus': '🔺', 'Mediastinum': '🔵', 'Pleura': '💧',
  // Colorectal
  'Colon': '🟤', 'Rectal': '🔴', 'Anorectal': '🔘', 'IBD': '🩺',
  // Transplant
  'Liver Tx': '🟤', 'Kidney Tx': '🟠', 'Pancreas Tx': '🟡', 'Heart Tx': '❤️', 'Procurement': '🔄',
  // Surg Onc
  'Soft Tissue': '🟣', 'Skin': '🔴', 'Abdominal Wall': '🔵',
  // OMFS
  'Jaw': '🦷', 'Salivary Gland': '💦', 'Facial Trauma': '🚨', 'Facial Reconstruction': '🔧',
};

function getIcon(category: string): string {
  return CATEGORY_ICONS[category] ?? '🔹';
}

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

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProcedurePicker({ procedures, value, onChange }: ProcedurePickerProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<PickerView>('subcategory');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [customText, setCustomText] = useState('');

  const searchRef = useRef<HTMLInputElement>(null);
  const customRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Derived data ────────────────────────────────────────────────────────────

  // Categories sorted: most procedures first, then alphabetical
  const categories = useMemo(() => {
    const map = new Map<string, Procedure[]>();
    for (const proc of procedures) {
      if (!map.has(proc.category)) map.set(proc.category, []);
      map.get(proc.category)!.push(proc);
    }
    return Array.from(map.entries())
      .map(([name, procs]) => ({
        name,
        procs,
        color: categoryColor(name),
        icon: getIcon(name),
        commonCount: procs.filter(p => p.isCommon).length,
      }))
      .sort((a, b) => b.procs.length - a.procs.length);
  }, [procedures]);

  // Procedures within selected category, sorted
  const categoryProcedures = useMemo(() => {
    if (!selectedCategory) return [];
    return procedures
      .filter(p => p.category === selectedCategory)
      .sort((a, b) => {
        if (a.isCommon && !b.isCommon) return -1;
        if (!a.isCommon && b.isCommon) return 1;
        return a.complexityTier - b.complexityTier || a.name.localeCompare(b.name);
      });
  }, [procedures, selectedCategory]);

  // Global search (across all specialty procedures)
  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return procedures
      .filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.aliases.some(a => a.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q) ||
        p.subcategory.toLowerCase().includes(q)
      )
      .sort((a, b) => {
        const aExact = a.name.toLowerCase().startsWith(q);
        const bExact = b.name.toLowerCase().startsWith(q);
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        if (a.isCommon && !b.isCommon) return -1;
        if (!a.isCommon && b.isCommon) return 1;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 30);
  }, [search, procedures]);

  // Category-local search
  const localSearchResults = useMemo(() => {
    if (!search.trim() || view !== 'procedure') return categoryProcedures;
    const q = search.toLowerCase();
    return categoryProcedures.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.aliases.some(a => a.toLowerCase().includes(q))
    );
  }, [search, categoryProcedures, view]);

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 80);
    } else {
      setView('subcategory');
      setSelectedCategory(null);
      setSearch('');
      setCustomText('');
    }
  }, [open]);

  useEffect(() => {
    if (view === 'custom') {
      setTimeout(() => customRef.current?.focus(), 80);
    }
    // Scroll to top on view change
    scrollRef.current?.scrollTo({ top: 0 });
  }, [view]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const openCategory = (cat: string) => {
    setSelectedCategory(cat);
    setView('procedure');
    setSearch('');
  };

  const selectProc = (proc: Procedure) => {
    onChange(proc.name, proc);
    setOpen(false);
  };

  const confirmCustom = () => {
    const name = customText.trim();
    if (!name) return;
    onChange(name, makeCustomProc(name, procedures[0]?.specialty));
    setOpen(false);
  };

  const goBack = () => {
    if (view === 'procedure') {
      setView('subcategory');
      setSelectedCategory(null);
      setSearch('');
    } else if (view === 'custom') {
      if (selectedCategory) {
        setView('procedure');
      } else {
        setView('subcategory');
        setSelectedCategory(null);
      }
      setSearch('');
    }
  };

  const openCustomFromSearch = () => {
    setCustomText(search.trim());
    setView('custom');
  };

  // ── Header title ──────────────────────────────────────────────────────────

  const headerTitle =
    view === 'subcategory' ? 'Select Category' :
    view === 'procedure' ? (selectedCategory ?? 'Procedures') :
    'Custom Procedure';

  const headerColor =
    view === 'procedure' && selectedCategory
      ? categoryColor(selectedCategory)
      : '#f1f5f9';

  // ── Styles (inline for portability) ───────────────────────────────────────

  const S = {
    overlay: {
      position: 'fixed' as const,
      inset: 0,
      zIndex: 500,
      background: 'rgba(0,0,0,0.78)',
      display: 'flex',
      alignItems: 'flex-end' as const,
      justifyContent: 'center',
    },
    sheet: {
      width: '100%',
      maxWidth: 540,
      background: '#0e0e16',
      borderRadius: '20px 20px 0 0',
      maxHeight: '90vh',
      display: 'flex',
      flexDirection: 'column' as const,
      overflow: 'hidden',
      boxShadow: '0 -8px 60px rgba(0,0,0,0.7)',
    },
    handle: {
      width: 36, height: 4,
      background: '#252838',
      borderRadius: 2,
      margin: '14px auto 0',
      flexShrink: 0,
    } as React.CSSProperties,
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '14px 16px 0',
      flexShrink: 0,
    } as React.CSSProperties,
    backBtn: {
      background: '#16161f',
      border: '1px solid #1e2130',
      borderRadius: 8,
      width: 32, height: 32,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer',
      flexShrink: 0,
      color: '#94a3b8',
    } as React.CSSProperties,
    closeBtn: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: '#64748b',
      display: 'flex',
      padding: 6,
      borderRadius: 8,
    } as React.CSSProperties,
    searchWrap: {
      padding: '12px 16px',
      flexShrink: 0,
    } as React.CSSProperties,
    searchInner: {
      position: 'relative' as const,
    },
    searchInput: {
      width: '100%',
      padding: '10px 36px 10px 36px',
      background: '#16161f',
      border: '1px solid #252838',
      borderRadius: 10,
      color: '#f1f5f9',
      fontSize: 14,
      outline: 'none',
      fontFamily: 'inherit',
      boxSizing: 'border-box' as const,
    },
    scroll: {
      overflowY: 'auto' as const,
      flex: 1,
    },
  };

  const tierLabel = (tier: 1 | 2 | 3) =>
    tier === 1 ? 'Basic' : tier === 2 ? 'Intermediate' : 'Advanced';
  const tierColor = (tier: 1 | 2 | 3) =>
    tier === 1 ? '#3ecf8e' : tier === 2 ? '#f59e0b' : '#e05c5c';

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ position: 'relative' }}>

      {/* ── Trigger ──────────────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          width: '100%',
          padding: '11px 14px',
          background: '#16161f',
          border: `1px solid ${value ? '#2563eb40' : '#1e2130'}`,
          borderRadius: 10,
          color: value ? '#f1f5f9' : '#64748b',
          fontSize: 14,
          textAlign: 'left',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          fontFamily: 'inherit',
          transition: 'border-color 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = '#2563eb')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = value ? '#2563eb40' : '#1e2130')}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {value || 'Select procedure…'}
        </span>
        <ChevronRight size={14} style={{ color: '#64748b', flexShrink: 0 }} />
      </button>

      {/* ── Bottom Sheet Modal ───────────────────────────────────────────────── */}
      {open && (
        <div style={S.overlay} onClick={() => setOpen(false)}>
          <div style={S.sheet} onClick={e => e.stopPropagation()}>

            {/* Handle */}
            <div style={S.handle} />

            {/* Header */}
            <div style={S.header}>
              {view !== 'subcategory' && (
                <button style={S.backBtn} onClick={goBack}>
                  <ChevronLeft size={16} />
                </button>
              )}
              <span style={{
                flex: 1,
                fontSize: 16,
                fontWeight: 700,
                color: headerColor,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {view === 'procedure' && selectedCategory && (
                  <span style={{ fontSize: 14, marginRight: 8 }}>{getIcon(selectedCategory)}</span>
                )}
                {headerTitle}
              </span>
              <button style={S.closeBtn} onClick={() => setOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Search (not shown in custom view) */}
            {view !== 'custom' && (
              <div style={S.searchWrap}>
                <div style={S.searchInner}>
                  <Search size={15} style={{
                    position: 'absolute', left: 12, top: '50%',
                    transform: 'translateY(-50%)', color: '#64748b',
                  }} />
                  <input
                    ref={searchRef}
                    type="text"
                    placeholder={
                      view === 'subcategory'
                        ? 'Search all procedures…'
                        : `Search in ${selectedCategory}…`
                    }
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={S.searchInput}
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      style={{
                        position: 'absolute', right: 10, top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none', border: 'none',
                        cursor: 'pointer', color: '#64748b',
                      }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── Scrollable body ──────────────────────────────────────────────── */}
            <div ref={scrollRef} style={S.scroll}>

              {/* ── VIEW: SUBCATEGORY (no search) ────────────────────────────── */}
              {view === 'subcategory' && !search.trim() && (
                <SubcategoryGrid
                  categories={categories}
                  selectedValue={value}
                  onSelect={openCategory}
                  onCustom={() => { setSelectedCategory(null); setView('custom'); }}
                />
              )}

              {/* ── VIEW: SUBCATEGORY (search results) ───────────────────────── */}
              {view === 'subcategory' && search.trim() && (
                <SearchResults
                  results={searchResults}
                  query={search}
                  selectedValue={value}
                  onSelect={selectProc}
                  onCustom={openCustomFromSearch}
                  tierLabel={tierLabel}
                  tierColor={tierColor}
                  showCategory
                />
              )}

              {/* ── VIEW: PROCEDURE LIST ─────────────────────────────────────── */}
              {view === 'procedure' && (
                <ProcedureList
                  procedures={localSearchResults}
                  query={search}
                  selectedValue={value}
                  categoryName={selectedCategory ?? ''}
                  categoryColor={selectedCategory ? categoryColor(selectedCategory) : '#6c7fff'}
                  onSelect={selectProc}
                  onCustom={() => setView('custom')}
                  tierLabel={tierLabel}
                  tierColor={tierColor}
                />
              )}

              {/* ── VIEW: CUSTOM ENTRY ───────────────────────────────────────── */}
              {view === 'custom' && (
                <CustomEntry
                  ref={customRef}
                  value={customText}
                  onChange={setCustomText}
                  onConfirm={confirmCustom}
                  category={selectedCategory}
                />
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface CategoryInfo {
  name: string;
  procs: Procedure[];
  color: string;
  icon: string;
  commonCount: number;
}

function SubcategoryGrid({
  categories,
  selectedValue,
  onSelect,
  onCustom,
}: {
  categories: CategoryInfo[];
  selectedValue: string;
  onSelect: (cat: string) => void;
  onCustom: () => void;
}) {
  return (
    <div style={{ padding: '4px 16px 24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {categories.map(({ name, procs, color, icon }) => {
          const hasSelected = procs.some(p => p.name === selectedValue);
          return (
            <button
              key={name}
              onClick={() => onSelect(name)}
              style={{
                padding: '14px 14px 12px',
                background: hasSelected ? `${color}12` : '#16161f',
                border: `1px solid ${hasSelected ? color : '#1e2130'}`,
                borderRadius: 12,
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'left',
                transition: 'border-color 0.15s, background 0.15s',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = color;
                e.currentTarget.style.background = `${color}10`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = hasSelected ? color : '#1e2130';
                e.currentTarget.style.background = hasSelected ? `${color}12` : '#16161f';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 18, lineHeight: 1 }}>{icon}</span>
                {hasSelected && (
                  <span style={{
                    width: 16, height: 16, borderRadius: '50%',
                    background: color, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Check size={10} color="#fff" />
                  </span>
                )}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: hasSelected ? color : '#f1f5f9', lineHeight: 1.3 }}>
                {name}
              </div>
              <div style={{ fontSize: 11, color: '#64748b' }}>
                {procs.length} procedure{procs.length !== 1 ? 's' : ''}
              </div>
            </button>
          );
        })}

        {/* Other / Custom card */}
        <button
          onClick={onCustom}
          style={{
            padding: '14px 14px 12px',
            background: 'transparent',
            border: '1px dashed #252838',
            borderRadius: 12,
            cursor: 'pointer',
            fontFamily: 'inherit',
            textAlign: 'left',
            transition: 'border-color 0.15s',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = '#64748b')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = '#252838')}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>✏️</span>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>Other</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>Custom entry</div>
        </button>
      </div>
    </div>
  );
}

function SearchResults({
  results,
  query,
  selectedValue,
  onSelect,
  onCustom,
  tierLabel,
  tierColor,
  showCategory,
}: {
  results: Procedure[];
  query: string;
  selectedValue: string;
  onSelect: (p: Procedure) => void;
  onCustom: () => void;
  tierLabel: (t: 1 | 2 | 3) => string;
  tierColor: (t: 1 | 2 | 3) => string;
  showCategory?: boolean;
}) {
  if (results.length === 0) {
    return (
      <div>
        <div style={{ textAlign: 'center', padding: '28px 16px 12px', color: '#64748b', fontSize: 14 }}>
          No procedures found for "<strong style={{ color: '#94a3b8' }}>{query}</strong>"
        </div>
        <div style={{ padding: '0 16px 24px' }}>
          <button
            onClick={onCustom}
            style={{
              width: '100%',
              padding: '13px 16px',
              background: 'rgba(37,99,235,0.07)',
              border: '1px dashed #2563eb',
              borderRadius: 10,
              color: '#3b82f6',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Pencil size={14} />
            Add &ldquo;{query}&rdquo; as custom procedure
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {results.map(proc => (
        <ProcedureRow
          key={proc.id}
          proc={proc}
          selected={selectedValue === proc.name}
          onSelect={onSelect}
          tierLabel={tierLabel}
          tierColor={tierColor}
          showCategory={showCategory}
        />
      ))}
      <div style={{ padding: '10px 16px 20px', borderTop: '1px solid #1a1a24' }}>
        <button
          onClick={onCustom}
          style={{
            width: '100%',
            padding: '11px 14px',
            background: 'transparent',
            border: '1px dashed #252838',
            borderRadius: 10,
            color: '#64748b',
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: 'inherit',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Pencil size={13} />
          Not listed? Add &ldquo;{query}&rdquo; as custom
        </button>
      </div>
    </div>
  );
}

function ProcedureList({
  procedures,
  query,
  selectedValue,
  categoryName,
  categoryColor: catColor,
  onSelect,
  onCustom,
  tierLabel,
  tierColor,
}: {
  procedures: Procedure[];
  query: string;
  selectedValue: string;
  categoryName: string;
  categoryColor: string;
  onSelect: (p: Procedure) => void;
  onCustom: () => void;
  tierLabel: (t: 1 | 2 | 3) => string;
  tierColor: (t: 1 | 2 | 3) => string;
}) {
  const noResults = query.trim() && procedures.length === 0;

  return (
    <div>
      {noResults ? (
        <div style={{ textAlign: 'center', padding: '28px 16px', color: '#64748b', fontSize: 14 }}>
          No results for &ldquo;<strong style={{ color: '#94a3b8' }}>{query}</strong>&rdquo; in {categoryName}
        </div>
      ) : (
        procedures.map(proc => (
          <ProcedureRow
            key={proc.id}
            proc={proc}
            selected={selectedValue === proc.name}
            onSelect={onSelect}
            tierLabel={tierLabel}
            tierColor={tierColor}
            accentColor={catColor}
          />
        ))
      )}

      {/* Always-visible Other option */}
      <div style={{ padding: '10px 16px 24px', borderTop: '1px solid #1a1a24', marginTop: 4 }}>
        <button
          onClick={onCustom}
          style={{
            width: '100%',
            padding: '13px 16px',
            background: 'transparent',
            border: '1px dashed #252838',
            borderRadius: 10,
            color: '#64748b',
            fontSize: 14,
            cursor: 'pointer',
            fontFamily: 'inherit',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#64748b';
            e.currentTarget.style.color = '#94a3b8';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = '#252838';
            e.currentTarget.style.color = '#64748b';
          }}
        >
          <Pencil size={14} />
          Other — enter custom procedure name
        </button>
      </div>
    </div>
  );
}

const CustomEntry = React.forwardRef<
  HTMLInputElement,
  {
    value: string;
    onChange: (v: string) => void;
    onConfirm: () => void;
    category: string | null;
  }
>(function CustomEntry({ value, onChange, onConfirm, category }, ref) {
  return (
    <div style={{ padding: '8px 16px 32px' }}>
      {category && (
        <div style={{
          fontSize: 12, color: '#64748b',
          marginBottom: 12,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: categoryColor(category), flexShrink: 0,
          }} />
          In {category} → Other
        </div>
      )}

      <p style={{ fontSize: 13, color: '#64748b', marginBottom: 14, lineHeight: 1.5 }}>
        Enter the procedure name as you&apos;d like it recorded. Be specific — this will
        appear in your case log and exports.
      </p>

      <input
        ref={ref}
        type="text"
        placeholder="e.g. Modified posterior urethroplasty"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') onConfirm(); }}
        style={{
          width: '100%',
          padding: '13px 14px',
          background: '#16161f',
          border: '1px solid #252838',
          borderRadius: 10,
          color: '#f1f5f9',
          fontSize: 14,
          outline: 'none',
          fontFamily: 'inherit',
          boxSizing: 'border-box',
          marginBottom: 12,
          transition: 'border-color 0.15s',
        }}
        onFocus={e => (e.target.style.borderColor = '#2563eb')}
        onBlur={e => (e.target.style.borderColor = '#252838')}
      />

      <button
        onClick={onConfirm}
        disabled={!value.trim()}
        style={{
          width: '100%',
          padding: '14px',
          background: value.trim() ? '#2563eb' : '#16161f',
          color: value.trim() ? '#fff' : '#64748b',
          border: 'none',
          borderRadius: 10,
          fontSize: 14,
          fontWeight: 600,
          cursor: value.trim() ? 'pointer' : 'not-allowed',
          fontFamily: 'inherit',
          transition: 'background 0.15s, color 0.15s',
        }}
      >
        {value.trim() ? `Use "${value.trim()}"` : 'Enter a procedure name'}
      </button>
    </div>
  );
});

// ─── Procedure Row ────────────────────────────────────────────────────────────

function ProcedureRow({
  proc,
  selected,
  onSelect,
  tierLabel,
  tierColor,
  indent,
  showCategory,
  accentColor,
}: {
  proc: Procedure;
  selected: boolean;
  onSelect: (p: Procedure) => void;
  tierLabel: (t: 1 | 2 | 3) => string;
  tierColor: (t: 1 | 2 | 3) => string;
  indent?: boolean;
  showCategory?: boolean;
  accentColor?: string;
}) {
  const accent = accentColor ?? '#6c7fff';

  return (
    <button
      type="button"
      onClick={() => onSelect(proc)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: indent ? '12px 16px 12px 36px' : '12px 16px',
        background: selected ? `${accent}12` : 'transparent',
        border: 'none',
        borderBottom: '1px solid #1a1a24',
        cursor: 'pointer',
        fontFamily: 'inherit',
        textAlign: 'left',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => {
        if (!selected) e.currentTarget.style.background = '#16161f';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = selected ? `${accent}12` : 'transparent';
      }}
    >
      {/* Selection indicator */}
      <div style={{
        width: 18, height: 18, borderRadius: 9, flexShrink: 0,
        background: selected ? accent : 'transparent',
        border: `2px solid ${selected ? accent : '#252838'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'border-color 0.15s',
      }}>
        {selected && <Check size={10} color="#fff" />}
      </div>

      {/* Name + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: 500,
          color: selected ? '#c7d2fe' : '#f1f5f9',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {proc.name}
          {proc.isCommon && (
            <span style={{ marginLeft: 6, fontSize: 10, color: '#3ecf8e', fontWeight: 700 }}>★</span>
          )}
          {proc.isMilestone && (
            <span style={{ marginLeft: 3, fontSize: 10 }}>🏆</span>
          )}
        </div>
        {showCategory && (
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
            {proc.category}
            {proc.subcategory && proc.subcategory !== proc.category && (
              <span> · {proc.subcategory}</span>
            )}
          </div>
        )}
        {proc.avgDurationMinutes && (
          <div style={{ fontSize: 11, color: '#475569', marginTop: 1 }}>
            ~{proc.avgDurationMinutes} min
          </div>
        )}
      </div>

      {/* Complexity badge */}
      <span style={{
        fontSize: 10, fontWeight: 700,
        color: tierColor(proc.complexityTier),
        background: `${tierColor(proc.complexityTier)}18`,
        padding: '2px 7px',
        borderRadius: 20,
        flexShrink: 0,
        textTransform: 'uppercase',
        letterSpacing: '0.4px',
      }}>
        {tierLabel(proc.complexityTier)}
      </span>
    </button>
  );
}
