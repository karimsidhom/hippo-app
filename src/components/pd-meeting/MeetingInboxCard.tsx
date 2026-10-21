'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText } from 'lucide-react';

interface MyMeeting {
  id: string;
  meetingDate: string;
  acknowledgedAt: string | null;
  directorName: string;
}

/**
 * Tells a resident on their dashboard that a 1:1 record is waiting.
 *
 * Shows only while something is unconfirmed, so it is a task rather than a
 * permanent fixture. The confirming itself happens on /profile/meetings,
 * next to the letter, because nobody should confirm having read something
 * without opening it.
 */
export function MeetingInboxCard() {
  const router = useRouter();
  const [pending, setPending] = useState<MyMeeting[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/me/meetings', { credentials: 'include' });
      const d = res.ok ? await res.json() : { meetings: [] };
      setPending((d.meetings ?? []).filter((m: MyMeeting) => !m.acknowledgedAt));
    } catch {
      setPending([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading || pending.length === 0) return null;
  const one = pending.length === 1;
  const latest = pending[0];

  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 14px',
          background: '#0EA5E910',
          border: '1px solid #0EA5E930',
          borderRadius: 10,
        }}
      >
        <div
          style={{
            width: 32, height: 32, borderRadius: 8, background: '#0EA5E920',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#0EA5E9', flexShrink: 0,
          }}
        >
          <FileText size={16} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>
            {one
              ? 'Your 1:1 record is ready to read'
              : `${pending.length} 1:1 records are ready to read`}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
            {one
              ? `${latest.directorName} published it on ${new Date(latest.meetingDate).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}.`
              : 'Open them to read and confirm.'}
          </div>
        </div>
        <button
          type="button"
          onClick={() => router.push('/profile/meetings')}
          style={{
            padding: '8px 14px', background: 'var(--primary)', border: 'none',
            borderRadius: 7, color: '#fff', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
          }}
        >
          Open
        </button>
      </div>
    </div>
  );
}
