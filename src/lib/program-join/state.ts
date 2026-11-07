// ---------------------------------------------------------------------------
// Join-request state machine.
//
// One table carries both directions of the handshake:
//
//   invitedById == null  the resident asked to join. The director
//                        approves or declines; the resident may withdraw.
//   invitedById != null  the director invited the resident. The resident
//                        accepts or declines; the director may withdraw.
//
// Keeping the rules here, as pure functions over a plain object, means
// they are tested without a database and the route handlers stay thin.
// Routes load the row, call decideJoinAction(), and write nextStatus.
// ---------------------------------------------------------------------------

export type JoinRequestStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'WITHDRAWN';

/** Who is trying to act. Resolved by the route from the session. */
export type JoinActor = 'director' | 'subject';

export type JoinAction = 'approve' | 'decline' | 'withdraw' | 'accept';

/** The subset of ProgramJoinRequest the rules actually depend on. */
export interface JoinRequestLike {
  status: JoinRequestStatus;
  invitedById: string | null;
}

/**
 * A discriminated union rather than one object with optional fields,
 * so that a caller writing
 *
 *   if (!decision.ok) return NextResponse.json({ error: decision.reason });
 *   await db.x.update({ data: { status: decision.nextStatus } });
 *
 * gets a defined JoinRequestStatus on the second line. With optional
 * fields TypeScript cannot narrow one from the other and that update
 * fails to compile.
 */
export type JoinDecision =
  | { ok: true; nextStatus: JoinRequestStatus; reason?: undefined }
  | { ok: false; nextStatus?: undefined; reason: string };

const deny = (reason: string): JoinDecision => ({ ok: false, reason });
const allow = (nextStatus: JoinRequestStatus): JoinDecision => ({
  ok: true,
  nextStatus,
});

/**
 * True when the request was opened by the director inviting someone,
 * rather than by the resident asking to join.
 */
function isInvitation(req: JoinRequestLike): boolean {
  return req.invitedById !== null;
}

export function decideJoinAction(
  req: JoinRequestLike,
  actor: JoinActor,
  action: JoinAction,
): JoinDecision {
  if (req.status !== 'PENDING') {
    return deny(`This request is already ${req.status.toLowerCase()}.`);
  }

  if (isInvitation(req)) {
    // The director asked. Only the resident can settle it.
    if (actor === 'subject') {
      if (action === 'accept') return allow('APPROVED');
      if (action === 'decline') return allow('DECLINED');
      return deny('Accept or decline this invitation.');
    }
    if (action === 'withdraw') return allow('WITHDRAWN');
    return deny('Only the resident can accept or decline an invitation.');
  }

  // The resident asked. Only the director can settle it.
  if (actor === 'director') {
    if (action === 'approve') return allow('APPROVED');
    if (action === 'decline') return allow('DECLINED');
    return deny('Approve or decline this request.');
  }
  if (action === 'withdraw') return allow('WITHDRAWN');
  return deny('This is a request, not an invitation. The director decides it.');
}

/**
 * Whether a new request may be opened, given whatever row already exists
 * for this (program, user) pair. A settled row is reused rather than
 * duplicated, because (programId, userId) is unique.
 */
export function canCreateJoinRequest(
  existing: JoinRequestLike | null,
): JoinDecision {
  if (!existing) return allow('PENDING');
  if (existing.status === 'PENDING') {
    return deny('There is already a pending request for this program.');
  }
  if (existing.status === 'APPROVED') {
    return deny('You are already a member of this program.');
  }
  // DECLINED or WITHDRAWN. Let them try again.
  return allow('PENDING');
}
