'use client';

import { useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { ArrowRight, ClipboardList } from 'lucide-react';
import { HUB_LINK_APP_LABELS } from '@/lib/hub-link';
import { useLinkInbox } from '@/hooks/useLinkInbox';
import type { InboxItem } from '@/lib/link/types';

const EASE = 'cubic-bezier(.16,1,.3,1)';

/** "just now", "12m ago", "2h ago", "3d ago", then the date. */
export function timeAgo(iso: string, now = Date.now()): string {
  const s = Math.max(0, (now - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
}

export function caseDateLabel(iso: string): string {
  if (!iso) return '';
  const d = new Date(`${iso}T12:00:00`);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' });
}

/**
 * The "From Handover" section of /inbox: pending Hippo Link handoffs as
 * cards with Log (opens the prefilled log form) and Dismiss. `showEmpty`
 * renders a teaching empty state; otherwise the section hides when empty.
 */
export function HandoffInbox({ showEmpty }: { showEmpty: boolean }) {
  const { items, loaded, remove } = useLinkInbox({ pollMs: 60_000 });

  if (!loaded) {
    return showEmpty ? <section style={styles.section}><style>{LINK_INBOX_CSS}</style><SkeletonCard /></section> : null;
  }
  if (!items.length && !showEmpty) return null;

  return (
    <section aria-labelledby="link-inbox-title" style={styles.section}>
      <style>{LINK_INBOX_CSS}</style>
      <div style={styles.headRow}>
        <h2 id="link-inbox-title" style={styles.eyebrow}>From Handover</h2>
        {items.length > 0 && <span style={styles.count}>{items.length}</span>}
      </div>

      {items.length === 0 ? (
        <div style={styles.empty}>
          <ClipboardList size={20} strokeWidth={1.5} style={{ color: 'var(--text-3)' }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginTop: 10 }}>Nothing waiting</div>
          <p style={styles.emptyText}>
            On a Handover patient, tap Log this case. The procedure, date, attending and site land here,
            with no patient identifiers, ready to review and save.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map((it, i) => <HandoffCard key={it.id} item={it} index={i} onGone={() => remove(it.id)} />)}
        </div>
      )}
    </section>
  );
}

function HandoffCard({ item, index, onGone }: { item: InboxItem; index: number; onGone: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const p = item.payload;
  const meta = [caseDateLabel(p.caseDate), p.attendingLabel, p.institutionSite].filter(Boolean);

  const dismiss = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/link/handoffs/${item.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'dismissed' }),
      });
      if (res.ok || res.status === 409 || res.status === 404) { onGone(); return; }
      setError('Could not dismiss. Try again.');
    } catch {
      setError('Could not dismiss. Check your connection.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="link-card" style={{ ...styles.card, animationDelay: `${Math.min(index, 6) * 50}ms` }}>
      <div style={{ minWidth: 0 }}>
        <div style={styles.title}>{p.procedureName || 'Procedure not named'}</div>
        {meta.length > 0 && <div style={styles.meta}>{meta.join(' · ')}</div>}
        {p.diagnosisCategory && <div style={styles.dx}>{p.diagnosisCategory}</div>}
        <div style={styles.source}>
          From {HUB_LINK_APP_LABELS[item.fromApp] ?? item.fromApp}, {timeAgo(item.createdAt)}
          {p.roleGuess ? ` · ${p.roleGuess}` : ''}
        </div>
      </div>

      {error && <div role="alert" style={styles.error}>{error}</div>}

      <div style={styles.actions}>
        {confirming ? (
          <>
            <span style={{ fontSize: 13, color: 'var(--text-2)', marginRight: 'auto' }}>Dismiss without logging?</span>
            <button type="button" onClick={() => setConfirming(false)} style={styles.ghost} disabled={busy}>Keep</button>
            <button type="button" onClick={() => void dismiss()} style={{ ...styles.ghost, color: 'var(--danger)' }} disabled={busy}>
              {busy ? 'Dismissing' : 'Dismiss'}
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => setConfirming(true)} style={styles.ghost}>Dismiss</button>
            <Link href={`/log?handoff=${item.id}`} style={styles.primary}>
              Log <ArrowRight size={14} />
            </Link>
          </>
        )}
      </div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div aria-hidden style={{ ...styles.card, animation: 'none' }}>
      <div className="link-shimmer" style={{ height: 16, width: '60%', borderRadius: 4 }} />
      <div className="link-shimmer" style={{ height: 12, width: '45%', borderRadius: 4, marginTop: 10 }} />
      <div className="link-shimmer" style={{ height: 36, borderRadius: 6, marginTop: 16 }} />
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  section: { marginBottom: 28 },
  headRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 },
  eyebrow: {
    margin: 0, fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
    color: 'var(--text-2)',
  },
  count: {
    minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9, fontSize: 11, fontWeight: 700,
    lineHeight: '18px', textAlign: 'center', background: 'var(--primary)', color: '#fff',
  },
  card: {
    padding: 16, borderRadius: 'var(--rl, 10px)', border: '1px solid var(--border-mid)',
    background: 'var(--surface)', animation: `link-card-in .5s ${EASE} both`,
  },
  title: { fontSize: 16, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em', overflowWrap: 'anywhere' },
  meta: { fontSize: 13, color: 'var(--text-2)', marginTop: 4 },
  dx: { fontSize: 13, color: 'var(--text)', marginTop: 8, opacity: 0.85 },
  source: { fontSize: 12, color: 'var(--text-3)', marginTop: 10 },
  actions: {
    display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 14,
    paddingTop: 12, borderTop: '1px solid var(--border)',
  },
  ghost: {
    minHeight: 44, padding: '0 14px', borderRadius: 'var(--r, 6px)', border: '1px solid var(--border-mid)',
    background: 'transparent', color: 'var(--text-2)', fontSize: 14, fontWeight: 500, cursor: 'pointer',
    fontFamily: 'inherit',
  },
  primary: {
    minHeight: 44, padding: '0 18px', borderRadius: 'var(--r, 6px)', background: 'var(--primary)',
    color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none',
    display: 'inline-flex', alignItems: 'center', gap: 6,
  },
  error: { fontSize: 12, color: 'var(--danger)', marginTop: 10 },
  empty: {
    padding: '28px 20px', borderRadius: 'var(--rl, 10px)', border: '1px dashed var(--border-mid)',
    textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center',
  },
  emptyText: { fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55, maxWidth: 340, margin: '6px 0 0' },
};

// Card motion and the skeleton shimmer.
const LINK_INBOX_CSS = `
@keyframes link-card-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
.link-shimmer {
  background: linear-gradient(90deg, var(--surface2) 0%, var(--border-mid) 50%, var(--surface2) 100%);
  background-size: 200% 100%; animation: link-shimmer 1.4s linear infinite;
}
@keyframes link-shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
@media (prefers-reduced-motion: reduce) { .link-card, .link-shimmer { animation: none !important; } }
`;
