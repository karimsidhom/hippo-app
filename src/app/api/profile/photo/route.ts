import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { db } from "@/lib/db";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const BUCKET = "avatars";

/**
 * Sniff the first bytes of a file for JPEG/PNG/WebP magic numbers. Some
 * mobile browsers hand us a File with an empty or unrecognised `type`
 * (e.g. after client-side canvas re-encoding, or certain WebView upload
 * paths) even though the bytes themselves are a perfectly normal image.
 * Rejecting those outright is why some users reported "I can't add a
 * photo" — the bytes were fine, only the reported MIME type was missing.
 */
function sniffImageType(bytes: Buffer): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

// Cache the "bucket has been ensured" state in the server-runtime memory so
// we don't re-check on every upload. Survives as long as the Lambda warm.
let bucketEnsured = false;

/**
 * Ensure the avatars bucket exists. Supabase Storage buckets aren't
 * auto-created by the Dashboard when a new project spins up — each new
 * environment would otherwise need a manual "create bucket" click. This
 * makes the first upload self-provision the bucket with public read, so
 * the feature just works in dev / preview / prod without a separate
 * setup step.
 *
 * Idempotent: if the bucket exists, listBuckets() returns it and we
 * short-circuit. If not, createBucket() creates it with `public: true`
 * which matches our getPublicUrl() usage below.
 */
async function ensureAvatarsBucket(
  supabase: ReturnType<typeof createServiceRoleClient>,
): Promise<void> {
  if (bucketEnsured) return;
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some(b => b.name === BUCKET);
    if (exists) {
      bucketEnsured = true;
      return;
    }
    const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: `${MAX_SIZE}`,
      allowedMimeTypes: ALLOWED_TYPES,
    });
    if (createErr) {
      // Another request might have created it between our list + create.
      // "already exists" is benign; anything else is worth logging.
      if (!/already exists|duplicate/i.test(createErr.message)) {
        console.warn("[avatars] createBucket failed:", createErr.message);
      }
    }
    bucketEnsured = true;
  } catch (err) {
    // Don't throw — let the actual upload attempt fail with a cleaner
    // error than "bucket setup crashed."
    console.warn("[avatars] ensureBucket failed:", err);
  }
}

/**
 * POST /api/profile/photo
 * Upload a profile photo. Accepts multipart/form-data with a "file" field.
 * Stores in Supabase Storage `avatars` bucket, updates User.image.
 */
export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Validate size
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File too large. Maximum 5 MB." },
      { status: 400 },
    );
  }

  // Read file to buffer once, up front — the type sniff below needs the
  // bytes, and re-reading the same File twice isn't reliable everywhere.
  const buffer = Buffer.from(await file.arrayBuffer());

  // Validate type. Trust the browser-reported MIME type when it's one of
  // the three we support; otherwise sniff the file's magic numbers before
  // rejecting, since an empty/unrecognised `type` doesn't necessarily mean
  // an unsupported file (see sniffImageType above).
  let effectiveType = file.type;
  if (!ALLOWED_TYPES.includes(effectiveType)) {
    const sniffed = sniffImageType(buffer);
    if (sniffed) {
      effectiveType = sniffed;
    } else {
      const looksLikeHeic =
        /hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name || "");
      return NextResponse.json(
        {
          error: looksLikeHeic
            ? "HEIC photos aren't supported. On iPhone, open the photo, tap Share, then Save as JPEG, or take a screenshot of it."
            : "Invalid file type. Use JPEG, PNG, or WebP.",
        },
        { status: 400 },
      );
    }
  }

  const supabase = createServiceRoleClient();
  await ensureAvatarsBucket(supabase);

  // Generate a unique path: avatars/{userId}/{timestamp}.{ext}
  const ext = effectiveType.split("/")[1] === "jpeg" ? "jpg" : effectiveType.split("/")[1];
  const path = `${user.id}/${Date.now()}.${ext}`;

  // Upload to Supabase Storage (upsert to overwrite old photos in same slot)
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: effectiveType,
      upsert: true,
    });

  if (uploadError) {
    console.error("[photo upload] Storage error:", uploadError);
    return NextResponse.json(
      { error: "Failed to upload photo. Please try again." },
      { status: 500 },
    );
  }

  // Get public URL
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const imageUrl = urlData.publicUrl;

  // Update user record
  await db.user.update({
    where: { id: user.id },
    data: { image: imageUrl },
  });

  return NextResponse.json({ image: imageUrl });
}

/**
 * DELETE /api/profile/photo
 * Remove the current profile photo.
 */
export async function DELETE() {
  const { user, error } = await requireAuth();
  if (error) return error;

  // Get current image URL to delete from storage
  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { image: true },
  });

  if (dbUser?.image) {
    const supabase = createServiceRoleClient();

    // Extract path from URL (everything after /avatars/)
    const match = dbUser.image.match(/\/avatars\/(.+)$/);
    if (match) {
      await supabase.storage.from(BUCKET).remove([match[1]]);
    }
  }

  // Clear image in DB
  await db.user.update({
    where: { id: user.id },
    data: { image: null },
  });

  return NextResponse.json({ image: null });
}
