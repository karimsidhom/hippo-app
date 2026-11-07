import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { getMembership } from '@/lib/program-auth';
import { validateUpload } from '@/lib/program-documents';
import { DOCUMENTS_BUCKET, ensureDocumentsBucket, newStoragePath } from '@/lib/program-documents-server';
import { createServiceRoleClient } from '@/lib/supabase-server';

/**
 * Issue a one-time signed upload for a program document. The browser sends
 * the file straight to private storage, so files larger than the 4.5 MB
 * serverless request limit never pass through this app.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    const { id } = await params;
    const membership = await getMembership(user.id, id);
    if (!membership) {
      return NextResponse.json({ error: 'Access denied. Program members only.' }, { status: 403 });
    }

    let body: { fileName?: unknown; type?: unknown; size?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }
    const fileName = typeof body.fileName === 'string' ? body.fileName : '';
    const type = typeof body.type === 'string' ? body.type : '';
    const size = typeof body.size === 'number' ? body.size : NaN;
    const validation = validateUpload(fileName, type, size);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    await ensureDocumentsBucket(supabase);
    const storagePath = newStoragePath(id, fileName);
    const { data, error: signError } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .createSignedUploadUrl(storagePath);
    if (signError || !data) {
      console.error('[program documents] Signed upload failed:', signError);
      return NextResponse.json({ error: 'Unable to start this upload. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ path: data.path, token: data.token, mimeType: validation.mimeType });
  } catch (error) {
    console.error('[program documents] Signed upload failed:', error);
    return NextResponse.json({ error: 'Unable to start this upload. Please try again.' }, { status: 500 });
  }
}
