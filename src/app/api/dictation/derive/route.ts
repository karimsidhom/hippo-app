import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { deriveCaseFromNote, toCasePrefill } from '@/lib/dictation/derive-case';

// ---------------------------------------------------------------------------
// POST /api/dictation/derive
//
// Dictate once, derive everything. Body: { text: string, specialty?: string }.
// Returns the derived case with per-field evidence, a case-form prefill, and
// a suggested EPA entrustment score. Nothing is saved; the client shows the
// draft and the resident confirms it. Pure parser, no LLM, so the note text
// never leaves the server and no vendor gate applies.
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;
  try {
    const body = await req.json().catch(() => ({}));
    const text = typeof body.text === 'string' ? body.text : '';
    if (text.trim().length < 20) {
      return NextResponse.json({ error: 'Paste or dictate the operative note first' }, { status: 400 });
    }
    if (text.length > 60_000) {
      return NextResponse.json({ error: 'Note too long' }, { status: 413 });
    }
    let specialty: string | null = typeof body.specialty === 'string' ? body.specialty : null;
    if (!specialty) {
      const profile = await db.profile.findUnique({ where: { userId: user.id }, select: { specialty: true } });
      specialty = profile?.specialty ?? null;
    }
    const derived = deriveCaseFromNote(text, specialty);
    return NextResponse.json({ derived, prefill: toCasePrefill(derived) });
  } catch (err) {
    console.error('[dictation/derive]', err);
    return NextResponse.json({ error: 'Could not derive a case from this note' }, { status: 500 });
  }
}
