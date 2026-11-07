import type { SupabaseClient } from "@supabase/supabase-js";

export const SAFETY_APPS = [
  "cases",
  "clinic",
  "pulse",
  "research",
  "handover",
  "study",
  "relay",
] as const;
export type SafetyAppId = (typeof SAFETY_APPS)[number];
export interface SafetyPolicy {
  policyKey: string;
  version: string;
  digest: string;
  title: string;
  body: string;
  accepted: boolean;
  acceptedAt: string | null;
}
export interface SafetyStatus {
  appId: SafetyAppId;
  complete: boolean;
  policies: SafetyPolicy[];
}
export interface SafetyAcceptance {
  policyKey: string;
  version: string;
  digest: string;
  accepted: true;
}
export const SAFETY_RETURNS: Record<SafetyAppId, string> = {
  cases: "https://hippomedicine.com/dashboard",
  clinic: "https://clinic.hippomedicine.com/clinic",
  pulse: "https://pulse.hippomedicine.com/",
  research: "https://research.hippomedicine.com/",
  handover: "https://handover.hippomedicine.com/teams",
  study: "https://study.hippomedicine.com/",
  relay: "https://relay.hippomedicine.com/app",
};
export function safetyApp(value: unknown): SafetyAppId | null {
  return typeof value === "string" && SAFETY_APPS.includes(value as SafetyAppId)
    ? (value as SafetyAppId)
    : null;
}
export function safetyUrl(app: SafetyAppId): string {
  return `https://hippomedicine.com/safety?app=${app}`;
}
export class SafetyError extends Error {
  readonly code: string;
  constructor(
    public appId: SafetyAppId,
    public status: 403 | 503,
  ) {
    super(
      status === 403
        ? "Complete the current Hippo safety requirements to continue."
        : "Safety verification is unavailable. Please retry.",
    );
    this.code =
      status === 403 ? "SAFETY_ONBOARDING_REQUIRED" : "SAFETY_UNAVAILABLE";
  }
  get onboardingUrl() {
    return safetyUrl(this.appId);
  }
}
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid safety response");
  return value as Record<string, unknown>;
}
export function parseSafetyStatus(
  value: unknown,
  app: SafetyAppId,
): SafetyStatus {
  const v = record(value);
  if (
    v.appId !== app ||
    typeof v.complete !== "boolean" ||
    !Array.isArray(v.policies) ||
    v.policies.length < 1 ||
    v.policies.length > 8
  )
    throw new Error("Invalid safety response");
  const policies = v.policies.map((item: unknown): SafetyPolicy => {
    const p = record(item);
    for (const key of ["policyKey", "version", "digest", "title", "body"])
      if (typeof p[key] !== "string" || (p[key] as string).length > 8000)
        throw new Error("Invalid safety policy");
    if (
      !/^[a-f0-9]{64}$/.test(p.digest as string) ||
      typeof p.accepted !== "boolean" ||
      !(p.acceptedAt === null || typeof p.acceptedAt === "string")
    )
      throw new Error("Invalid safety policy");
    return p as unknown as SafetyPolicy;
  });
  if (v.complete !== policies.every((p) => p.accepted))
    throw new Error("Inconsistent safety status");
  return { appId: app, complete: v.complete, policies };
}
export async function loadSafetyStatus(
  client: Pick<SupabaseClient, "rpc">,
  app: SafetyAppId,
): Promise<SafetyStatus> {
  try {
    const r = await client.rpc("hippo_safety_status", { p_app: app });
    if (r.error) throw new Error("Safety unavailable");
    return parseSafetyStatus(r.data, app);
  } catch {
    throw new SafetyError(app, 503);
  }
}
export async function requireSafety(
  client: Pick<SupabaseClient, "rpc">,
  app: SafetyAppId,
): Promise<SafetyStatus> {
  const status = await loadSafetyStatus(client, app);
  if (!status.complete) throw new SafetyError(app, 403);
  return status;
}
export async function acceptSafety(
  client: Pick<SupabaseClient, "rpc">,
  app: SafetyAppId,
  acceptances: SafetyAcceptance[],
): Promise<SafetyStatus> {
  try {
    if (
      !Array.isArray(acceptances) ||
      acceptances.length < 1 ||
      acceptances.length > 8
    )
      throw new Error("Invalid acceptances");
    const r = await client.rpc("hippo_safety_accept", {
      p_app: app,
      p_acceptances: acceptances,
    });
    if (r.error) throw new Error("Safety unavailable");
    return parseSafetyStatus(r.data, app);
  } catch {
    throw new SafetyError(app, 503);
  }
}
