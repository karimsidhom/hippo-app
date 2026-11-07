import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { getMembership, roleCanManageProgram } from '@/lib/program-auth';
import { MAX_DOCUMENT_SIZE, validateUpload } from '@/lib/program-documents';
import { DOCUMENTS_BUCKET, isIssuedStoragePath } from '@/lib/program-documents-server';
import { createServiceRoleClient } from '@/lib/supabase-server';

const documentSelect = {
  id: true,
  programId: true,
  uploadedById: true,
  title: true,
  fileName: true,
  mimeType: true,
  sizeBytes: true,
  createdAt: true,
  uploadedBy: { select: { name: true } },
} as const;

export async function GET(
  _req: Request,
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

    const documents = await db.programDocument.findMany({
      where: { programId: id },
      orderBy: { createdAt: 'desc' },
      select: documentSelect,
    });
    return NextResponse.json({
      documents: documents.map((document) => ({
        ...document,
        createdAt: document.createdAt.toISOString(),
        canDelete: document.uploadedById === user.id || roleCanManageProgram(membership.role),
      })),
    });
  } catch (error) {
    console.error('[program documents] List failed:', error);
    return NextResponse.json({ error: 'Unable to load documents. Please try again.' }, { status: 500 });
  }
}

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

    // The browser has already sent the file to storage with a signed upload
    // from ./upload-url; this records it once the object is confirmed there.
    let body: { path?: unknown; fileName?: unknown; type?: unknown; title?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }
    const storagePath = typeof body.path === 'string' ? body.path : '';
    const fileName = typeof body.fileName === 'string' ? body.fileName.slice(0, 255) : '';
    const type = typeof body.type === 'string' ? body.type : '';
    if (body.title != null && typeof body.title !== 'string') {
      return NextResponse.json({ error: 'The document title must be text.' }, { status: 400 });
    }
    if (!fileName || !isIssuedStoragePath(storagePath, id, fileName)) {
      return NextResponse.json({ error: 'Upload not recognised. Please try again.' }, { status: 400 });
    }

    // A path is recorded once; a repeat (a double tap) must not touch the file.
    if (await db.programDocument.findUnique({ where: { storagePath }, select: { id: true } })) {
      return NextResponse.json({ error: 'This document is already saved.' }, { status: 409 });
    }

    const supabase = createServiceRoleClient();
    const { data: stored, error: infoError } = await supabase.storage.from(DOCUMENTS_BUCKET).info(storagePath);
    if (infoError || !stored) {
      return NextResponse.json({ error: 'The upload did not finish. Please try again.' }, { status: 400 });
    }
    const size = stored.size ?? 0;
    const validation = validateUpload(fileName, type, size);
    if (!validation.valid || !validation.mimeType || size > MAX_DOCUMENT_SIZE) {
      await supabase.storage.from(DOCUMENTS_BUCKET).remove([storagePath]);
      return NextResponse.json({ error: validation.error ?? 'This file cannot be uploaded.' }, { status: 400 });
    }
    const title = (typeof body.title === 'string' ? body.title.trim() : '').slice(0, 200) || fileName;

    try {
      const document = await db.programDocument.create({
        data: {
          programId: id,
          uploadedById: user.id,
          title,
          fileName,
          mimeType: validation.mimeType,
          sizeBytes: size,
          storagePath,
        },
        select: documentSelect,
      });
      return NextResponse.json({
        document: { ...document, createdAt: document.createdAt.toISOString(), canDelete: true },
      }, { status: 201 });
    } catch (createError) {
      if ((createError as { code?: string }).code === 'P2002') {
        return NextResponse.json({ error: 'This document is already saved.' }, { status: 409 });
      }
      try {
        const { error: cleanupError } = await supabase.storage.from(DOCUMENTS_BUCKET).remove([storagePath]);
        if (cleanupError) console.error('[program documents] Upload cleanup failed:', cleanupError);
      } catch (cleanupError) {
        console.error('[program documents] Upload cleanup failed:', cleanupError);
      }
      throw createError;
    }
  } catch (error) {
    console.error('[program documents] Save failed:', error);
    return NextResponse.json({ error: 'Unable to save this document. Please try again.' }, { status: 500 });
  }
}
