import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";

/**
 * GET /api/account/audit-log/export?format=csv
 *
 * Streams the current user's full audit log as a CSV download. Hospitals and
 * program directors ask for this during due-diligence ("show me every write
 * operation this user made against resident X's data over the last 6 months").
 *
 * Scope is per-user only — institutional scoping will be added when we ship
 * the PD dashboard. Do NOT widen the where clause until institutional access
 * controls (RLS + role-based auth) are in place.
 */

const HEADERS = [
  "created_at",
  "action",
  "entity_type",
  "entity_id",
  "ip_address",
  "user_agent",
  "metadata",
] as const;

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = typeof v === "string" ? v : JSON.stringify(v);
  // RFC 4180: quote if contains comma, quote, or newline; double any embedded quotes.
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const since = searchParams.get("since"); // ISO date, optional
  const until = searchParams.get("until"); // ISO date, optional

  const where = {
    userId: user.id,
    ...(since || until
      ? {
          createdAt: {
            ...(since ? { gte: new Date(since) } : {}),
            ...(until ? { lte: new Date(until) } : {}),
          },
        }
      : {}),
  };

  // Cap at 10k rows per export to keep the response bounded. If a user needs
  // more they should narrow the date range.
  const logs = await db.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 10_000,
    select: {
      createdAt: true,
      action: true,
      entityType: true,
      entityId: true,
      ipAddress: true,
      userAgent: true,
      metadata: true,
    },
  });

  const lines = [HEADERS.join(",")];
  for (const log of logs) {
    lines.push(
      [
        log.createdAt.toISOString(),
        log.action,
        log.entityType,
        log.entityId,
        log.ipAddress ?? "",
        log.userAgent ?? "",
        log.metadata,
      ]
        .map(csvEscape)
        .join(","),
    );
  }

  const csv = lines.join("\n");
  const filename = `hippo-audit-log-${user.id.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "x-total-rows": String(logs.length),
    },
  });
}
