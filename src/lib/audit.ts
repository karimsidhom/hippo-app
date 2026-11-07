/**
 * Audit log — append-only record of sensitive actions.
 *
 * Design goals:
 * - NEVER throws. Audit failures must not break the parent request.
 * - Fire-and-forget on the hot path; use `void logAudit(...)` to avoid awaiting.
 * - Captures actor, IP, user-agent, before/after snapshots.
 * - Corrections are NEW rows (action = "audit.correction"), never UPDATEs.
 */

import { db } from './db';

export type AuditAction =
  // Cases
  | 'case.create'
  | 'case.update'
  | 'case.delete'
  // EPAs
  | 'epa.create'
  | 'epa.update'
  | 'epa.sign'
  | 'epa.delete'
  | 'epa.export'
  // Account
  | 'profile.update'
  | 'role.change'
  | 'consent.shadowRecord'
  // Data portability
  | 'export.download'
  | 'account.delete'
  // Auth
  | 'auth.login'
  | 'auth.logout'
  // System / corrections
  | 'audit.correction';

export type AuditEntityType =
  | 'CaseLog'
  | 'EpaObservation'
  | 'Profile'
  | 'User'
  | 'Export'
  | 'Auth';

export interface AuditInput {
  userId: string | null;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown>;
  /** Pass the NextRequest / Request to capture IP + user-agent. */
  req?: Request;
}

function extractRequestMeta(req?: Request): { ipAddress: string | null; userAgent: string | null } {
  if (!req) return { ipAddress: null, userAgent: null };
  const fwd = req.headers.get('x-forwarded-for');
  const ip = fwd?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? null;
  const ua = req.headers.get('user-agent');
  return { ipAddress: ip, userAgent: ua };
}

/** Strip long free-text fields from snapshots to reduce PHI exposure. */
function redact<T>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;
  const REDACT_FIELDS = ['notes', 'reflection', 'observationNotes', 'strengthsNotes', 'improvementNotes', 'concernDetails'];
  const copy: Record<string, unknown> = { ...(obj as Record<string, unknown>) };
  for (const k of REDACT_FIELDS) {
    if (typeof copy[k] === 'string') {
      const s = copy[k] as string;
      copy[k] = s.length > 0 ? `[redacted:${s.length}c]` : null;
    }
  }
  return copy as T;
}

/**
 * Log an audit event. Safe to fire-and-forget — never throws.
 */
export async function logAudit(input: AuditInput): Promise<void> {
  try {
    const { ipAddress, userAgent } = extractRequestMeta(input.req);
    await db.auditLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        before: input.before !== undefined ? (redact(input.before) as never) : undefined,
        after: input.after !== undefined ? (redact(input.after) as never) : undefined,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ? userAgent.slice(0, 500) : null,
        metadata: input.metadata ? (input.metadata as never) : undefined,
      },
    });
  } catch (err) {
    // Audit logging must never break the parent request. Log + swallow.
    console.error('[audit] failed to write audit log', err);
  }
}
