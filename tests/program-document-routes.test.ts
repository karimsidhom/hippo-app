import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const mocks = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  getMembership: vi.fn(),
  findMany: vi.fn(),
  findFirst: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
  delete: vi.fn(),
  listBuckets: vi.fn(),
  createBucket: vi.fn(),
  getBucket: vi.fn(),
  from: vi.fn(),
  remove: vi.fn(),
  createSignedUrl: vi.fn(),
  createSignedUploadUrl: vi.fn(),
  info: vi.fn(),
}));

vi.mock('@/lib/api-auth', () => ({ requireAuth: mocks.requireAuth }));
vi.mock('@/lib/program-auth', () => ({
  getMembership: mocks.getMembership,
  roleCanManageProgram: (role: string) => role === 'OWNER' || role === 'PD',
}));
vi.mock('@/lib/db', () => ({
  db: { programDocument: {
    findMany: mocks.findMany,
    findFirst: mocks.findFirst,
    findUnique: mocks.findUnique,
    create: mocks.create,
    delete: mocks.delete,
  } },
}));
vi.mock('@/lib/supabase-server', () => ({
  createServiceRoleClient: () => ({
    storage: {
      listBuckets: mocks.listBuckets,
      createBucket: mocks.createBucket,
      getBucket: mocks.getBucket,
      from: mocks.from,
    },
  }),
}));

import { GET, POST } from '@/app/api/programs/[id]/documents/route';
import { POST as SIGN } from '@/app/api/programs/[id]/documents/upload-url/route';
import { DELETE } from '@/app/api/programs/[id]/documents/[docId]/route';
import { GET as DOWNLOAD } from '@/app/api/programs/[id]/documents/[docId]/download/route';

const summary = {
  id: 'doc-1',
  programId: 'program-1',
  uploadedById: 'uploader-1',
  title: 'Teaching guide',
  fileName: 'guide.pdf',
  mimeType: 'application/pdf',
  sizeBytes: 5,
  createdAt: new Date('2026-11-02T12:00:00Z'),
  uploadedBy: { name: 'Dr Example' },
};
const storedDocument = { ...summary, storagePath: 'program-1/private-guide.pdf' };
const collectionContext = () => ({ params: Promise.resolve({ id: 'program-1' }) });
const documentContext = (id = 'program-1') => ({ params: Promise.resolve({ id, docId: 'doc-1' }) });
const request = () => new Request('http://localhost/api/programs/program-1/documents');

const issuedPath = 'program-1/caaaaaaaa0123456789abcdef-guide.pdf';

function signRequest(fileName = 'guide.pdf', type = 'application/pdf', size = 5) {
  return new NextRequest('http://localhost/api/programs/program-1/documents/upload-url', {
    method: 'POST', body: JSON.stringify({ fileName, type, size }),
  });
}

function registerRequest(path = issuedPath, fileName = 'guide.pdf', type = 'application/pdf') {
  return new NextRequest('http://localhost/api/programs/program-1/documents', {
    method: 'POST', body: JSON.stringify({ path, fileName, type, title: '  Teaching guide  ' }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAuth.mockResolvedValue({ user: { id: 'uploader-1', email: 'member@example.com' }, error: null });
  mocks.getMembership.mockResolvedValue({ role: 'RESIDENT' });
  mocks.findMany.mockResolvedValue([summary]);
  mocks.findFirst.mockImplementation(async ({ where }: { where: { programId: string; id: string } }) => (
    where.programId === storedDocument.programId && where.id === storedDocument.id ? storedDocument : null
  ));
  mocks.findUnique.mockResolvedValue(null);
  mocks.create.mockResolvedValue(summary);
  mocks.delete.mockResolvedValue(storedDocument);
  mocks.listBuckets.mockResolvedValue({ data: [{ name: 'program-documents', public: false }], error: null });
  mocks.createBucket.mockResolvedValue({ data: { name: 'program-documents' }, error: null });
  mocks.getBucket.mockResolvedValue({ data: { name: 'program-documents', public: false }, error: null });
  mocks.from.mockReturnValue({
    remove: mocks.remove,
    createSignedUrl: mocks.createSignedUrl,
    createSignedUploadUrl: mocks.createSignedUploadUrl,
    info: mocks.info,
  });
  mocks.createSignedUploadUrl.mockImplementation(async (path: string) => ({ data: { path, token: 'signed-token' }, error: null }));
  mocks.info.mockResolvedValue({ data: { size: 5 }, error: null });
  mocks.remove.mockResolvedValue({ data: [], error: null });
  mocks.createSignedUrl.mockResolvedValue({ data: { signedUrl: 'https://storage.example.com/signed-guide' }, error: null });
});

describe('program document access', () => {
  it('returns the authentication failure before any program or storage access', async () => {
    mocks.requireAuth.mockResolvedValue({ user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) });
    expect((await GET(request(), collectionContext())).status).toBe(401);
    expect((await SIGN(signRequest(), collectionContext())).status).toBe(401);
    expect((await POST(registerRequest(), collectionContext())).status).toBe(401);
    expect((await DOWNLOAD(request(), documentContext())).status).toBe(401);
    expect((await DELETE(request(), documentContext())).status).toBe(401);
    expect(mocks.getMembership).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('denies nonmembers for every endpoint before accessing document metadata or storage', async () => {
    mocks.getMembership.mockResolvedValue(null);
    expect((await GET(request(), collectionContext())).status).toBe(403);
    expect((await SIGN(signRequest(), collectionContext())).status).toBe(403);
    expect((await POST(registerRequest(), collectionContext())).status).toBe(403);
    expect((await DOWNLOAD(request(), documentContext())).status).toBe(403);
    expect((await DELETE(request(), documentContext())).status).toBe(403);
    expect(mocks.findMany).not.toHaveBeenCalled();
    expect(mocks.findFirst).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('lists member documents with the uploader, without selecting storage paths', async () => {
    const response = await GET(request(), collectionContext());
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.documents[0]).toMatchObject({ uploadedBy: { name: 'Dr Example' }, canDelete: true });
    expect(body.documents[0].storagePath).toBeUndefined();
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { programId: 'program-1' },
      select: expect.not.objectContaining({ storagePath: true }),
    }));
  });

  it('marks other members documents as nondeletable for residents', async () => {
    mocks.requireAuth.mockResolvedValue({ user: { id: 'resident-2' }, error: null });
    const body = await (await GET(request(), collectionContext())).json();
    expect(body.documents[0].canDelete).toBe(false);
  });

  it('marks other members documents as deletable for directors', async () => {
    mocks.requireAuth.mockResolvedValue({ user: { id: 'director-1' }, error: null });
    mocks.getMembership.mockResolvedValue({ role: 'PD' });
    const body = await (await GET(request(), collectionContext())).json();
    expect(body.documents[0].canDelete).toBe(true);
  });

  it('cannot download a document through a different program membership', async () => {
    const response = await DOWNLOAD(request(), documentContext('program-2'));
    expect(response.status).toBe(404);
    expect(mocks.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'doc-1', programId: 'program-2' } }));
    expect(mocks.createSignedUrl).not.toHaveBeenCalled();
  });

  it('cannot delete a document through a different program membership', async () => {
    const response = await DELETE(request(), documentContext('program-2'));
    expect(response.status).toBe(404);
    expect(mocks.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'doc-1', programId: 'program-2' } }));
    expect(mocks.remove).not.toHaveBeenCalled();
  });
});

describe('program document uploads', () => {
  it('gives ordinary members a signed upload with a safe CUID-format storage key', async () => {
    const response = await SIGN(signRequest('../../guide.pdf'), collectionContext());
    expect(response.status).toBe(200);
    const [path] = mocks.createSignedUploadUrl.mock.calls[0];
    expect(path).toMatch(/^program-1\/c[a-z0-9]{24}-guide\.pdf$/);
    expect(await response.json()).toEqual({ path, token: 'signed-token', mimeType: 'application/pdf' });
  });

  it('creates a missing bucket as private with the 20 MB limit', async () => {
    vi.resetModules();
    mocks.listBuckets.mockResolvedValue({ data: [], error: null });
    const { POST: freshSign } = await import('@/app/api/programs/[id]/documents/upload-url/route');
    expect((await freshSign(signRequest(), collectionContext())).status).toBe(200);
    expect(mocks.createBucket).toHaveBeenCalledWith('program-documents', { public: false, fileSizeLimit: 20 * 1024 * 1024 });
  });

  it('rejects a public existing bucket instead of storing private program material in it', async () => {
    vi.resetModules();
    mocks.listBuckets.mockResolvedValue({ data: [{ name: 'program-documents', public: true }], error: null });
    const { POST: freshSign } = await import('@/app/api/programs/[id]/documents/upload-url/route');
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect((await freshSign(signRequest(), collectionContext())).status).toBe(500);
      expect(mocks.createSignedUploadUrl).not.toHaveBeenCalled();
    } finally {
      log.mockRestore();
    }
  });

  it('rejects an unsupported or oversized file before touching storage', async () => {
    expect((await SIGN(signRequest('script.html', 'text/html'), collectionContext())).status).toBe(400);
    expect((await SIGN(signRequest('guide.pdf', 'application/pdf', 21 * 1024 * 1024), collectionContext())).status).toBe(400);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('records an issued upload with the size storage reports', async () => {
    mocks.info.mockResolvedValue({ data: { size: 4321 }, error: null });
    const response = await POST(registerRequest(), collectionContext());
    expect(response.status).toBe(201);
    expect(mocks.info).toHaveBeenCalledWith(issuedPath);
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        title: 'Teaching guide', fileName: 'guide.pdf', uploadedById: 'uploader-1',
        storagePath: issuedPath, sizeBytes: 4321, mimeType: 'application/pdf',
      }),
    }));
    const body = await response.json();
    expect(body.document.canDelete).toBe(true);
    expect(body.document.storagePath).toBeUndefined();
  });

  it.each([
    ['another program', 'program-2/caaaaaaaa0123456789abcdef-guide.pdf'],
    ['a different file name', 'program-1/caaaaaaaa0123456789abcdef-other.pdf'],
    ['a traversal', 'program-1/../program-2/caaaaaaaa0123456789abcdef-guide.pdf'],
  ])('refuses a path for %s without touching storage', async (_label, path) => {
    expect((await POST(registerRequest(path), collectionContext())).status).toBe(400);
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('refuses a path whose upload never reached storage', async () => {
    mocks.info.mockResolvedValue({ data: null, error: { message: 'Object not found' } });
    expect((await POST(registerRequest(), collectionContext())).status).toBe(400);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('removes a stored file that is larger than the limit', async () => {
    mocks.info.mockResolvedValue({ data: { size: 21 * 1024 * 1024 }, error: null });
    expect((await POST(registerRequest(), collectionContext())).status).toBe(400);
    expect(mocks.remove).toHaveBeenCalledWith([issuedPath]);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('answers a repeat registration without deleting the saved file', async () => {
    mocks.findUnique.mockResolvedValue({ id: 'doc-1' });
    expect((await POST(registerRequest(), collectionContext())).status).toBe(409);
    mocks.findUnique.mockResolvedValue(null);
    mocks.create.mockRejectedValue(Object.assign(new Error('Unique constraint'), { code: 'P2002' }));
    expect((await POST(registerRequest(), collectionContext())).status).toBe(409);
    expect(mocks.remove).not.toHaveBeenCalled();
  });

  it('removes the uploaded object when creating its database row fails', async () => {
    mocks.create.mockRejectedValue(new Error('Database unavailable'));
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect((await POST(registerRequest(), collectionContext())).status).toBe(500);
      expect(mocks.remove).toHaveBeenCalledWith([issuedPath]);
    } finally {
      log.mockRestore();
    }
  });
});

describe('program document download and delete', () => {
  it('redirects with 302 to a private signed URL valid for 60 seconds', async () => {
    const response = await DOWNLOAD(request(), documentContext());
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('https://storage.example.com/signed-guide');
    expect(mocks.from).toHaveBeenCalledWith('program-documents');
    expect(mocks.createSignedUrl).toHaveBeenCalledWith(storedDocument.storagePath, 60);
  });

  it('allows uploaders to delete their own documents', async () => {
    const response = await DELETE(request(), documentContext());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(mocks.remove).toHaveBeenCalledWith([storedDocument.storagePath]);
    expect(mocks.delete).toHaveBeenCalledWith({ where: { id: 'doc-1', programId: 'program-1' } });
    expect(mocks.remove.mock.invocationCallOrder[0]).toBeLessThan(mocks.delete.mock.invocationCallOrder[0]);
  });

  it.each(['OWNER', 'PD'])('allows %s to delete another uploader document', async (role) => {
    mocks.requireAuth.mockResolvedValue({ user: { id: 'director-1' }, error: null });
    mocks.getMembership.mockResolvedValue({ role });
    expect((await DELETE(request(), documentContext())).status).toBe(200);
    expect(mocks.delete).toHaveBeenCalled();
  });

  it('denies another resident the delete operation', async () => {
    mocks.requireAuth.mockResolvedValue({ user: { id: 'resident-2' }, error: null });
    expect((await DELETE(request(), documentContext())).status).toBe(403);
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(mocks.delete).not.toHaveBeenCalled();
  });

  it('keeps the database row if storage deletion fails', async () => {
    mocks.remove.mockResolvedValue({ data: null, error: { message: 'Storage unavailable' } });
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect((await DELETE(request(), documentContext())).status).toBe(500);
      expect(mocks.delete).not.toHaveBeenCalled();
    } finally {
      log.mockRestore();
    }
  });
});
