// Hippo Clinic — Version snapshot helper.
//
// Why this exists: every mutation to a clinic_note (AI generate, AI regen,
// clinician edit, finalize, transform) writes a row to clinic_note_versions
// with a monotonically increasing versionIdx. The naive read-then-write
// pattern races: two requests arriving in the same millisecond both read
// the same `lastVersion.versionIdx` and try to insert the same value.
//
// We have a UNIQUE index on (noteId, versionIdx), so a duplicate insert
// fails with Prisma error P2002 — but the second writer needs to recover
// gracefully. This helper retries up to N times on P2002, recomputing the
// next index inside a serializable transaction so writers serialise on
// the underlying row.
//
// Audit-log integrity is the reason this matters: a missing version
// snapshot breaks the tamper-evidence chain we rely on for PHIA review.

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

interface SnapshotInput {
  noteId: string;
  encounterId: string;
  source: string;            // "ai-initial" | "ai-regen-section" | "clinician-edit" | "finalize"
  section?: string | null;
  paragraphs: Prisma.InputJsonValue;
  letter?: string | null;
  patientInstructions?: string | null;
  shortSummary?: string | null;
  authorId?: string | null;
  authorKind: "clinician" | "ai";
}

const MAX_RETRIES = 5;

/**
 * Append a version snapshot, racing-safely. Returns the created row.
 * Throws after MAX_RETRIES if the database is genuinely contended.
 */
export async function appendNoteVersion(input: SnapshotInput) {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await db.$transaction(async (tx) => {
        const last = await tx.clinicNoteVersion.findFirst({
          where: { noteId: input.noteId },
          orderBy: { versionIdx: "desc" },
          select: { versionIdx: true },
        });
        const nextIdx = (last?.versionIdx ?? -1) + 1;
        return tx.clinicNoteVersion.create({
          data: {
            noteId: input.noteId,
            encounterId: input.encounterId,
            versionIdx: nextIdx,
            source: input.source,
            section: input.section ?? null,
            paragraphs: input.paragraphs,
            letter: input.letter ?? null,
            patientInstructions: input.patientInstructions ?? null,
            shortSummary: input.shortSummary ?? null,
            authorId: input.authorId ?? null,
            authorKind: input.authorKind,
          },
        });
      }, {
        // Serializable so concurrent appenders queue cleanly.
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 4_000,
        timeout: 8_000,
      });
    } catch (err) {
      // P2002 = unique constraint violation on (noteId, versionIdx).
      // P2034 = transaction conflict (Postgres serialization failure).
      const code = (err as { code?: string }).code;
      if ((code === "P2002" || code === "P2034") && attempt < MAX_RETRIES - 1) {
        // Tiny exponential backoff with jitter to break ties.
        await new Promise((r) => setTimeout(r, 25 + Math.random() * 50 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
  throw new Error("appendNoteVersion: exceeded retry budget");
}
