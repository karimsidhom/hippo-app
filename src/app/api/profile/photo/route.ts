import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { db } from "@/lib/db";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const BUCKET = "avatars";

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

  // Validate type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Invalid file type. Use JPEG, PNG, or WebP." },
      { status: 400 },
    );
  }

  // Validate size
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File too large. Maximum 5 MB." },
      { status: 400 },
    );
  }

  const supabase = createServiceRoleClient();
  await ensureAvatarsBucket(supabase);

  // Generate a unique path: avatars/{userId}/{timestamp}.{ext}
  const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
  const path = `${user.id}/${Date.now()}.${ext}`;

  // Read file to buffer
  const buffer = Buffer.from(await file.arrayBuffer());

  // Upload to Supabase Storage (upsert to overwrite old photos in same slot)
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: file.type,
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
