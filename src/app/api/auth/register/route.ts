import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit, LIMITS } from "@/lib/rate-limit";
const schema = z
  .object({
    name: z.string().refine((value) => value.length >= 2, { message: "String must contain at least 2 character(s)" }).refine((value) => value.length <= 200, { message: "String must contain at most 200 character(s)" }),
    email: z.string().email().refine((value) => value.length <= 254, { message: "String must contain at most 254 character(s)" }),
    password: z.string().refine((value) => value.length >= 8, { message: "String must contain at least 8 character(s)" }).refine((value) => value.length <= 256, { message: "String must contain at most 256 character(s)" }),
  })
  .strict();
export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const limit = checkRateLimit(`auth:register:${ip}`, LIMITS.auth);
    if (!limit.allowed) return limit.response;
    const { name, email, password } = schema.parse(await req.json());
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key)
      return NextResponse.json(
        { error: "Registration is not configured." },
        { status: 503 },
      );
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const result = await client.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: "https://hippomedicine.com/login",
      },
    });
    if (result.error)
      return NextResponse.json(
        {
          error:
            "Account verification could not be started. Please retry or contact support.",
        },
        { status: 503 },
      );
    if (result.data.session) {
      await client.auth.signOut();
      return NextResponse.json(
        {
          error:
            "Email verification must be configured before new accounts can be activated.",
          code: "VERIFICATION_CONFIGURATION_REQUIRED",
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ verificationRequired: true }, { status: 202 });
  } catch {
    return NextResponse.json(
      { error: "Check the registration fields and try again." },
      { status: 400 },
    );
  }
}
