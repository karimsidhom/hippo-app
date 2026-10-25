'use client';

import { useCallback, useEffect, useState } from 'react';

interface QueuedRequest {
  id: string;
  programId: string;
  programName: string;
  claimedPgy: number | null;
  message: string | null;
  invitedById: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    roleType: string | null;
    trainingYearLabel: string | null;
    institution: string | null;
  };
}

/**
 * The director's approval queue, shown above the roster.
 *
 * Renders nothing at all when there is nothing waiting, so it can sit
 * permanently on the dashboard without costing space on the common day.
 * Styling follows the dashboard's inline-style + CSS-variable idiom
 * rather than Tailwind hex, so it does not read as a bolted-on panel.
 */
export function JoinRequestQueue({ onChanged }: { onChanged?: () => void }) {
  const [requests, setRequests] = useState<QueuedRequest[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/pd/join-requests', { credentials: 'include' });
      if (!res.ok) {
        setRequests([]);
        return;
      }
      const data = await res.json();
      setRequests(data.requests ?? []);
    } catch {
      setRequests([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function decide(r: QueuedRequest, action: 'approve' | 'decline') {
    setBusy(r.id);
    try {
      await fetch(`/api/programs/${r.programId}/join-requests/${r.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      await load();
      onChanged?.();
    } finally {
      setBusy(null);
    }
  }

  // Only requests the resident opened need a decision from the director.
  // Ones the director sent are waiting on the resident, so they are not
  // an action for this queue.
  const awaitingMe = requests.filter((r) => r.invitedById === null);
  const sentByMe = requests.length - awaitingMe.length;

  if (awaitingMe.length === 0 && sentByMe === 0) return null;

  return (
    <section
      style={{
        marginBottom: 24,
        padding: 16,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderLeft: awaitingMe.length > 0 ? '3px solid var(--warning)' : '1px solid var(--border)',
        borderRadius: 12,
      }}
    >
      <h2
        style={{
          fontSize: 13,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-3)',
          margin: '0 0 12px',
        }}
      >
        {awaitingMe.length > 0
          ? `${awaitingMe.length} waiting to join`
          : `${sentByMe} invitation${sentByMe === 1 ? '' : 's'} sent`}
      </h2>

      {awaitingMe.length === 0 && (
        <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>
          Waiting on {sentByMe === 1 ? 'them' : 'them'} to accept. Nothing for you to do.
        </p>
      )}

      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
        {awaitingMe.map((r) => {
          const detail = [
            r.claimedPgy ? `PGY-${r.claimedPgy}` : r.user.trainingYearLabel,
            r.user.institution,
            r.user.email,
          ]
            .filter(Boolean)
            .join(' · ');
          return (
            <li
              key={r.id}
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '12px 14px',
                background: 'var(--surface2)',
                borderRadius: 10,
              }}
            >
              <div style={{ minWidth: 0, flex: '1 1 220px' }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--text)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {r.user.name ?? r.user.email}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-3)' }}>
                  {detail}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-3)' }}>
                  {r.programName}
                </p>
                {r.message && (
                  <p
                    style={{
                      margin: '6px 0 0',
                      fontSize: 12,
                      fontStyle: 'italic',
                      color: 'var(--text-2)',
                    }}
                  >
                    {r.message}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                  type="button"
                  disabled={busy === r.id}
                  onClick={() => decide(r, 'decline')}
                  style={{
                    padding: '8px 14px',
                    fontSize: 13,
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    color: 'var(--text-2)',
                    cursor: busy === r.id ? 'default' : 'pointer',
                    opacity: busy === r.id ? 0.5 : 1,
                  }}
                >
                  Decline
                </button>
                <button
                  type="button"
                  disabled={busy === r.id}
                  onClick={() => decide(r, 'approve')}
                  style={{
                    padding: '8px 14px',
                    fontSize: 13,
                    fontWeight: 600,
                    borderRadius: 8,
                    border: '1px solid var(--primary)',
                    background: 'var(--primary)',
                    color: '#fff',
                    cursor: busy === r.id ? 'default' : 'pointer',
                    opacity: busy === r.id ? 0.5 : 1,
                  }}
                >
                  Approve
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
