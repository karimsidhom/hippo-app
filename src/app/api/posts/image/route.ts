import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { createServiceRoleClient } from "@/lib/supabase-server";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const BUCKET = "post-images";

/**
 * POST /api/posts/image
 * Upload an image for a post. Accepts multipart/form-data with a "file" field.
 * Stores in Supabase Storage `post-images` bucket.
 * Returns { imageUrl: publicUrl }
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

  // Ensure the bucket exists. After migrating Supabase projects (e.g. to
  // Canada for PHIA compliance) the Storage buckets don't come across with
  // `pg_dump` — so the first upload on a fresh project would fail with
  // "Bucket not found" until an admin manually created it. Auto-creating
  // here keeps the user-visible behaviour identical across projects.
  {
    const { data: existing } = await supabase.storage.getBucket(BUCKET);
    if (!existing) {
      const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
        public: true,
        fileSizeLimit: MAX_SIZE,
        allowedMimeTypes: ALLOWED_TYPES,
      });
      if (createErr && !/already exists/i.test(createErr.message ?? "")) {
        console.error("[post image upload] createBucket error:", createErr);
        return NextResponse.json(
          { error: `Storage bucket unavailable: ${createErr.message}` },
          { status: 500 },
        );
      }
    }
  }

  // Generate a unique path: posts/{userId}/{timestamp}.{ext}
  const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
  const path = `posts/${user.id}/${Date.now()}.${ext}`;

  // Read file to buffer
  const buffer = Buffer.from(await file.arrayBuffer());

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("[post image upload] Storage error:", uploadError);
    // Surface the real message so we can tell (bucket missing vs RLS vs size).
    return NextResponse.json(
      { error: `Upload failed: ${uploadError.message ?? "unknown"}` },
      { status: 500 },
    );
  }

  // Get public URL
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const imageUrl = urlData.publicUrl;

  return NextResponse.json({ imageUrl });
}
