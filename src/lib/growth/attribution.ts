export const ATTRIBUTION_COOKIE = "hippo_attribution";
export const REFERRAL_COOKIE = "hippo_ref";

export type Attribution = {
  source?: string | null;
  medium?: string | null;
  campaign?: string | null;
  content?: string | null;
};

export function encodeAttribution(value: Attribution): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

export function decodeAttribution(value?: string): Attribution {
  if (!value) return {};
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (!parsed || typeof parsed !== "object") return {};
    return {
      source: typeof parsed.source === "string" ? parsed.source.slice(0, 120) : null,
      medium: typeof parsed.medium === "string" ? parsed.medium.slice(0, 120) : null,
      campaign: typeof parsed.campaign === "string" ? parsed.campaign.slice(0, 160) : null,
      content: typeof parsed.content === "string" ? parsed.content.slice(0, 160) : null,
    };
  } catch {
    return {};
  }
}
