import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { getMembership } from '@/lib/program-auth';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { DOCUMENTS_BUCKET } from '@/lib/program-documents-server';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; docId: string }> },
) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    const { id, docId } = await params;
    if (!(await getMembership(user.id, id))) {
      return NextResponse.json({ error: 'Access denied. Program members only.' }, { status: 403 });
    }

    const document = await db.programDocument.findFirst({
      where: { id: docId, programId: id },
      select: { storagePath: true },
    });
    if (!document) {
      return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
    }

    const supabase = createServiceRoleClient();
    const { data, error: storageError } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .createSignedUrl(document.storagePath, 60);
    if (storageError || !data?.signedUrl) {
      console.error('[program documents] Download failed:', storageError);
      return NextResponse.json({ error: 'Unable to download this document. Please try again.' }, { status: 500 });
    }

    return NextResponse.redirect(data.signedUrl, { status: 302 });
  } catch (error) {
    console.error('[program documents] Download failed:', error);
    return NextResponse.json({ error: 'Unable to download this document. Please try again.' }, { status: 500 });
  }
}
