// Hippo Link, Cases side: the shape the inbox API returns. Client safe.
import { sanitizeCaseDraft, type CaseDraft } from '@/lib/hub-link';

export type HandoffStatus = 'pending' | 'consumed' | 'dismissed';

export interface InboxItem {
  id: string;
  kind: 'case_draft';
  fromApp: string;
  status: HandoffStatus;
  createdAt: string;
  consumedAt: string | null;
  expired: boolean;
  payload: CaseDraft;
}

export interface HandoffRow {
  id: string;
  from_app: string;
  kind: string;
  status: string;
  payload: unknown;
  created_at: string;
  consumed_at: string | null;
  expires_at: string;
}

export const HANDOFF_COLUMNS = 'id, from_app, kind, status, payload, created_at, consumed_at, expires_at';

/** Every payload passes the shared whitelist again on its way to the browser. */
export function toInboxItem(row: HandoffRow, now = Date.now()): InboxItem | null {
  if (row.kind !== 'case_draft') return null;
  const status = (['pending', 'consumed', 'dismissed'] as const).find((s) => s === row.status);
  if (!status) return null;
  return {
    id: row.id,
    kind: 'case_draft',
    fromApp: row.from_app,
    status,
    createdAt: row.created_at,
    consumedAt: row.consumed_at,
    expired: new Date(row.expires_at).getTime() <= now,
    payload: sanitizeCaseDraft(row.payload),
  };
}
