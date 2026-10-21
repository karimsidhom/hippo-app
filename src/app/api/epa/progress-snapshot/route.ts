import { NextResponse } from "next/server";
import type { EpaProgressSnapshot, Prisma } from "@prisma/client";
import { requireAuth, ensureDbUser } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { progressContentHash } from '@/lib/epa/progress-hash';
import {
  HISTORICAL_EPA_SCHEMA_VERSION,
  HistoricalProgressInputError,
  historicalSpecialtySchema,
  readHistoricalProgressImport,
} from "@/lib/epa/historical-progress";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function reply(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: {
    "Cache-Control": "private, no-store",
    "Vary": "Cookie, Authorization",
  } });
}

function result(row: EpaProgressSnapshot | null) {
  if (!row) return { snapshot: null, metadata: null };
  return {
    snapshot: row.payload,
    metadata: {
      id: row.id,
      specialty: row.specialtySlug,
      sourceFilename: row.sourceFilename,
      reviewDate: row.sourceReviewDate.toISOString().slice(0, 10),
      provenance: row.provenance,
      importedAt: row.importedAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      schemaVersion: row.schemaVersion,
      contentHash: progressContentHash(row.payload),
    },
  };
}

/** A caller can read only their own snapshot; there is no viewer/userId input. */
export async function GET(req: Request) {
  const { user, error } = await requireAuth();
  if (error) { error.headers.set("Cache-Control", "private, no-store"); return error; }
  const specialty = historicalSpecialtySchema.safeParse(new URL(req.url).searchParams.get("specialty") ?? "urology");
  if (!specialty.success) return reply({ error: "Use a valid specialty slug." }, 400);
  try {
    const row = await db.epaProgressSnapshot.findUnique({
      where: { userId_specialtySlug: { userId: user.id, specialtySlug: specialty.data } },
    });
    return reply(result(row));
  } catch {
    return reply({ error: "Progress is temporarily unavailable. Please try again." }, 503);
  }
}

/** An upsert replaces the user's summary without creating duplicate progress. */
export async function PUT(req: Request) {
  const { user, error } = await requireAuth();
  if (error) { error.headers.set("Cache-Control", "private, no-store"); return error; }
  try {
    const { specialty, snapshot } = await readHistoricalProgressImport(req);
    await ensureDbUser(user);
    const data = {
      schemaVersion: HISTORICAL_EPA_SCHEMA_VERSION,
      sourceFilename: snapshot.source.filename,
      sourceReviewDate: new Date(`${snapshot.source.review_date}T00:00:00.000Z`),
      provenance: "user_imported_summary",
      payload: snapshot as Prisma.InputJsonValue,
    };
    const row = await db.$transaction(async (tx) => {
      const key = { userId: user.id, specialtySlug: specialty };
      // Preserve the previous version too, including imports made before revisions existed.
      const previous = await tx.epaProgressSnapshot.findUnique({ where: { userId_specialtySlug: key } });
      for (const version of [previous, { ...data, ...key }]) {
        if (!version) continue;
        const contentHash = progressContentHash(version.payload);
        await tx.epaProgressRevision.upsert({
          where: { userId_specialtySlug_contentHash: { ...key, contentHash } },
          create: { ...key, contentHash, sourceReviewDate: version.sourceReviewDate, payload: version.payload as Prisma.InputJsonValue },
          update: {},
        });
      }
      return tx.epaProgressSnapshot.upsert({
        where: { userId_specialtySlug: key },
        create: { ...key, ...data },
        update: data,
      });
    });
    return reply(result(row));
  } catch (error) {
    if (error instanceof HistoricalProgressInputError) return reply({ error: error.message }, error.status);
    return reply({ error: "Progress could not be saved. Please try again." }, 503);
  }
}
