import { NextResponse } from 'next/server';
import { linkClient } from '@/lib/link/server';
import { HANDOFF_COLUMNS, toInboxItem, type HandoffRow, type InboxItem } from '@/lib/link/types';

/**
 * GET /api/link/inbox: Hippo Link handoffs waiting for this user in Cases:
 * pending, not expired, newest first. Read as the user (RLS applies).
 */
export async function GET() {
  const ctx = await linkClient();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await ctx.supabase
    .from('hub_handoffs')
    .select(HANDOFF_COLUMNS)
    .eq('user_id', ctx.userId)
    .eq('to_app', 'cases')
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[GET /api/link/inbox]', error.code);
    return NextResponse.json({ error: 'Could not load the inbox' }, { status: 500 });
  }

  const items = ((data ?? []) as HandoffRow[])
    .map((r) => toInboxItem(r))
    .filter((x): x is InboxItem => x !== null);
  return NextResponse.json(
    { items, count: items.length },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
