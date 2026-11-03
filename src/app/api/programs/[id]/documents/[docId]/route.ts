import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { getMembership, roleCanManageProgram } from '@/lib/program-auth';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { DOCUMENTS_BUCKET } from '@/lib/program-documents-server';

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; docId: string }> },
) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    const { id, docId } = await params;
    const membership = await getMembership(user.id, id);
    if (!membership) {
      return NextResponse.json({ error: 'Access denied. Program members only.' }, { status: 403 });
    }

    const document = await db.programDocument.findFirst({
      where: { id: docId, programId: id },
      select: { id: true, storagePath: true, uploadedById: true },
    });
    if (!document) {
      return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
    }
    if (document.uploadedById !== user.id && !roleCanManageProgram(membership.role)) {
      return NextResponse.json({ error: 'Only the uploader or a program director can delete this document.' }, { status: 403 });
    }

    const supabase = createServiceRoleClient();
    const { error: storageError } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .remove([document.storagePath]);
    if (storageError) {
      console.error('[program documents] Storage delete failed:', storageError);
      return NextResponse.json({ error: 'Unable to delete this document. Please try again.' }, { status: 500 });
    }

    await db.programDocument.delete({ where: { id: document.id, programId: id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[program documents] Delete failed:', error);
    return NextResponse.json({ error: 'Unable to delete this document. Please try again.' }, { status: 500 });
  }
}
