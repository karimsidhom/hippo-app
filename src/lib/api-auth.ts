import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { requireSafety, SafetyError, type SafetyAppId } from './safety';
import { createServerSupabaseClient } from './supabase-server';
import { db } from './db';

export type AuthedUser = {
  id: string;
  email: string;
};

/**
 * Extract and verify the authenticated user.
 *
 * Two transports are accepted:
 *   1. Supabase session cookie (used by the Next.js web app).
 *   2. `Authorization: Bearer <jwt>` header (used by the native iOS/
 *      Android apps, which store the access token in SecureStore
 *      rather than a cookie — see mobile/src/lib/supabase.ts).
 *
 * Cookie is checked first because it's the common case and costs
 * nothing. If that fails we fall through to the header. Either path
 * produces the same `AuthedUser` so downstream code is transport-
 * agnostic.
 *
 * Usage in API routes:
 *   const { user, error } = await requireAuth();
 *   if (error) return error;
 */
type VerifiedIdentity = { user: AuthedUser; error: null; client: SupabaseClient } | { user: null; error: NextResponse; client: null };
export async function requireIdentityClient(): Promise<VerifiedIdentity> {
  try {
    const client = await createServerSupabaseClient();
    const {data,error} = await client.auth.getUser();
    if(!error && data.user) return {user:{id:data.user.id,email:data.user.email??''},error:null,client};
  } catch { /* Try the independently verified native bearer transport. */ }
  try {
    const token=(await headers()).get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
    if(token && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const client=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false,autoRefreshToken:false}});
      const {data,error}=await client.auth.getUser(token);
      if(!error && data.user) return {user:{id:data.user.id,email:data.user.email??''},error:null,client};
    }
  } catch { /* Return a sanitized identity failure. */ }
  return {user:null,error:NextResponse.json({error:'Unauthorized'},{status:401}),client:null};
}
export async function requireIdentity(): Promise<{user:AuthedUser;error:null}|{user:null;error:NextResponse}> {
  const result=await requireIdentityClient();return result.error?{user:null,error:result.error}:{user:result.user,error:null};
}
export async function requireAuth(app:SafetyAppId='cases'):Promise<{user:AuthedUser;error:null}|{user:null;error:NextResponse}> {
  const result=await requireIdentityClient();if(result.error)return {user:null,error:result.error};
  try {await requireSafety(result.client,app);return {user:result.user,error:null};}
  catch(error){const e=error instanceof SafetyError?error:new SafetyError(app,503);return {user:null,error:NextResponse.json({error:e.message,code:e.code,onboardingUrl:e.onboardingUrl},{status:e.status,headers:{'Cache-Control':'no-store'}})};}
}

/**
 * Ensure the user has a corresponding row in our `users` table.
 * Creates one (with a default profile) if missing — idempotent.
 */
export async function ensureDbUser(authUser: AuthedUser, name?: string) {
  const existing = await db.user.findUnique({ where: { id: authUser.id } });
  if (existing) return existing;

  return db.user.create({
    data: {
      id: authUser.id,
      email: authUser.email,
      name: name ?? authUser.email.split('@')[0],
      profile: { create: { onboardingCompleted: false, theme: "light" } },
    },
    include: { profile: true },
  });
}
