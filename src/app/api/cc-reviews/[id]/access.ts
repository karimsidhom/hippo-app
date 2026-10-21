import type { ProgramMemberRole } from '@prisma/client';
import { db } from '@/lib/db';
import { getMembership, getProgramResidentProgressAccess } from '@/lib/program-auth';

export async function reviewAccess(reviewId: string, userId: string) {
  const review = await db.cCReview.findUnique({
    where: { id: reviewId }, select: { id: true, programId: true, residentId: true, status: true },
  });
  if (!review) return { error: 'not_found' as const };
  if (review.residentId === userId) {
    const member = await getMembership(userId, review.programId);
    return member ? { review, role: 'resident' as const } : { error: 'forbidden' as const };
  }
  const scope = await getProgramResidentProgressAccess(userId, review.programId, review.residentId);
  return scope ? { review, role: scope.role } : { error: 'forbidden' as const };
}

export function canWriteReview(role: ProgramMemberRole | 'resident') {
  return ['OWNER', 'PD', 'CHAIR', 'CC_MEMBER'].includes(role);
}
