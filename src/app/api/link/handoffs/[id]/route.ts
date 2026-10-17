import { NextRequest, NextResponse } from 'next/server';
import { isUuid } from '@/lib/hub-link';
import { linkClient } from '@/lib/link/server';
import { HANDOFF_COLUMNS, toInboxItem, type HandoffRow } from '@/lib/link/types';

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/link/handoffs/:id: one handoff (any status) for the signed-in
 * user, for the /log?handoff= prefill. Another user's id reads as 404.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const ctx = await linkClient();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data, error } = await ctx.supabase
    .from('hub_handoffs')
    .select(HANDOFF_COLUMNS)
    .eq('id', id)
    .eq('user_id', ctx.userId)
    .eq('to_app', 'cases')
    .maybeSingle();
  if (error) {
    console.error('[GET /api/link/handoffs/:id]', error.code);
    return NextResponse.json({ error: 'Could not load the handoff' }, { status: 500 });
  }
  const item = data ? toInboxItem(data as HandoffRow) : null;
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(item, { headers: { 'Cache-Control': 'no-store' } });
}

/**
 * PATCH /api/link/handoffs/:id: { status: "consumed" | "dismissed" }.
 * Only a pending row moves, once; the database sets consumed_at.
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  const ctx = await linkClient();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = (await req.json().catch(() => null)) as { status?: unknown } | null;
  const status = body?.status;
  if (status !== 'consumed' && status !== 'dismissed') {
    return NextResponse.json({ error: 'status must be consumed or dismissed' }, { status: 400 });
  }

  const { data, error } = await ctx.supabase
    .from('hub_handoffs')
    .update({ status })
    .eq('id', id)
    .eq('user_id', ctx.userId)
    .eq('status', 'pending')
    .select('id, status, consumed_at');
  if (error) {
    console.error('[PATCH /api/link/handoffs/:id]', error.code);
    return NextResponse.json({ error: 'Could not update the handoff' }, { status: 500 });
  }
  const row = data?.[0];
  if (row) return NextResponse.json({ id: row.id, status: row.status, consumedAt: row.consumed_at });

  // Nothing moved: either it is already closed, or it is not this user's.
  const { data: existing } = await ctx.supabase
    .from('hub_handoffs')
    .select('status')
    .eq('id', id)
    .eq('user_id', ctx.userId)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ error: 'Already closed', status: existing.status }, { status: 409 });
  }
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
