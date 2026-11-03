import { randomBytes } from 'node:crypto';
import { MAX_DOCUMENT_SIZE, safeFileName } from '@/lib/program-documents';
import { createServiceRoleClient } from '@/lib/supabase-server';

export const DOCUMENTS_BUCKET = 'program-documents';

type ServiceClient = ReturnType<typeof createServiceRoleClient>;

let bucketEnsured = false;

/** Create the private bucket on first use; refuse to run if it is public. */
export async function ensureDocumentsBucket(supabase: ServiceClient) {
  if (bucketEnsured) return;

  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) throw error;
  const existing = buckets?.find((bucket) => bucket.name === DOCUMENTS_BUCKET);
  if (existing) {
    if (existing.public) throw new Error('Program documents storage must be private.');
    bucketEnsured = true;
    return;
  }

  const { error: createError } = await supabase.storage.createBucket(DOCUMENTS_BUCKET, {
    public: false,
    fileSizeLimit: MAX_DOCUMENT_SIZE,
  });
  if (createError) {
    // Another upload can create the bucket between the lookup and creation.
    if (!/already exists|duplicate/i.test(createError.message)) throw createError;
    const { data: bucket, error: bucketError } = await supabase.storage.getBucket(DOCUMENTS_BUCKET);
    if (bucketError) throw bucketError;
    if (!bucket || bucket.public) throw new Error('Program documents storage must be private.');
  }
  bucketEnsured = true;
}

/**
 * `<programId>/<id>-<safe name>`. The id is a timestamp plus cryptographic
 * randomness, so the path is unguessable and never reused.
 */
export function newStoragePath(programId: string, fileName: string): string {
  const uploadId = `c${Date.now().toString(36).padStart(8, '0')}${randomBytes(8).toString('hex')}`;
  return `${programId}/${uploadId}-${safeFileName(fileName)}`;
}

/** True only for a path this server would have issued for that program and file. */
export function isIssuedStoragePath(path: string, programId: string, fileName: string): boolean {
  const prefix = `${programId}/`;
  if (!path.startsWith(prefix)) return false;
  const rest = path.slice(prefix.length);
  const suffix = `-${safeFileName(fileName)}`;
  return rest.endsWith(suffix) && /^c[0-9a-z]{8,}[0-9a-f]{16}$/.test(rest.slice(0, -suffix.length));
}
