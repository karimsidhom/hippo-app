// Hippo Clinic — Billing code seed script.
//
// USAGE
//   npx ts-node --compiler-options '{"module":"CommonJS"}' \
//     scripts/clinic/seed-billing.ts <province> <csv-path>
//
// CSV FORMAT (header required):
//   code,shortLabel,description,modifier,feeCents,noteTypes,specialties,source
//
// Example row (use the official manual's wording):
//   8533,"Office consultation","",,12345,"NEW_CONSULT","Urology","MB-MMC-2024-04"
//
// SAFETY
//   - The script loads codes as global rows (ownerUserId = null) so every
//     clinician in the same province sees them.
//   - We refuse to overwrite an existing global row unless --force is set —
//     that prevents accidental fee mutations after a manual update without
//     an audit trail.
//   - The `source` column is REQUIRED and should cite the manual + version.
//
// Add the province's verified manual citation to /docs/billing/<province>.md
// alongside this seed so anyone auditing your codes can trace them.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import Papa from "papaparse";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

interface Row {
  code: string;
  shortLabel: string;
  description?: string;
  modifier?: string;
  feeCents?: string;
  noteTypes?: string;
  specialties?: string;
  source: string;
}

async function main() {
  const [province, csvPath, ...flags] = process.argv.slice(2);
  if (!province || !csvPath) {
    console.error("usage: seed-billing.ts <province> <csv-path> [--force]");
    process.exit(2);
  }
  const force = flags.includes("--force");
  const text = readFileSync(resolve(csvPath), "utf8");
  const parsed = Papa.parse<Row>(text, { header: true, skipEmptyLines: true });
  if (parsed.errors.length > 0) {
    console.error("CSV parse errors:", parsed.errors);
    process.exit(2);
  }

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  for (const row of parsed.data) {
    if (!row.code || !row.shortLabel || !row.source) {
      console.warn("skipping row with missing required fields:", row);
      skipped++;
      continue;
    }
    const noteTypes  = (row.noteTypes  ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    const specialties = (row.specialties ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    const feeCents = row.feeCents ? Number(row.feeCents) : null;

    const existing = await db.clinicBillingCode.findFirst({
      where: { province, code: row.code, ownerUserId: null },
    });
    if (existing && !force) {
      skipped++;
      continue;
    }
    if (existing) {
      await db.clinicBillingCode.update({
        where: { id: existing.id },
        data: {
          shortLabel: row.shortLabel,
          description: row.description ?? null,
          modifier: row.modifier ?? null,
          feeCents,
          noteTypes,
          specialties,
          source: row.source,
        },
      });
      updated++;
    } else {
      await db.clinicBillingCode.create({
        data: {
          province,
          code: row.code,
          shortLabel: row.shortLabel,
          description: row.description ?? null,
          modifier: row.modifier ?? null,
          feeCents,
          noteTypes,
          specialties,
          source: row.source,
        },
      });
      inserted++;
    }
  }
  console.log(`✔ ${inserted} inserted · ${updated} updated · ${skipped} skipped (province=${province})`);
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
