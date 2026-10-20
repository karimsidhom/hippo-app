# PD 1:1 Meeting Record Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a program director hold the semi-annual 1:1 inside Hippo on a record that mirrors Dr. Nayak's University of Manitoba letter, showing the previous meeting beside this one so the transition is visible.

**Architecture:** `PdMeeting` holds only this meeting's column for eight fixed sections; the previous column is read through a frozen `previousMeetingId` and never duplicated. Longitudinal data (exam scores, curriculum checklists) hangs off the resident, not the meeting, so it accumulates and is entered once. All carry-forward and publish rules are pure functions in `src/lib/pd-meeting/`, unit tested without a database; routes stay thin.

**Tech Stack:** Next.js 16 App Router, React, Prisma 5.10 against Supabase Postgres, Vitest 2.1.

## Scope

Phase 2 of `docs/superpowers/specs/2026-10-19-pd-program-dashboard-and-meeting-record-design.md`,
sections 6 through 9: the data model, the editor with two-column carry-forward, goal
outcomes, score tables, checklists, autosave and publish.

**Not in this plan.** The PDF render, email delivery, resident acknowledgment and
`/profile/meetings` are Phase 3. Dashboard polish, due dates and digest lines are Phase 4.
Phase 1 (program joining) is already shipped on this branch.

When this plan is done, Dr. Nayak can open a resident, start a meeting, see July 2025 on
the left and today on the right, carry bullets across, record whether last meeting's goals
happened, update the exam tables and curriculum ticks, and publish. The resident cannot see
any of it until Phase 3 gives them a copy.

## Global Constraints

- Same as the Phase 1 plan: npm, Prisma 5.10.2, real SQL migrations under
  `prisma/migrations/<UTC timestamp>_<snake_name>/`, `requireAuth()` from `@/lib/api-auth`,
  `params` is a Promise in Next 16, `@/` resolves to `src/`.
- **Every migration pins `SET search_path TO public;` as its first statement.** HippoVFinal is
  shared and multi-schema: `handover` owns its own types, and `users` exists in both `auth`
  and `public`. An unqualified `REFERENCES "users"` without this is a live bug.
- **Apply migrations through the Supabase MCP, not `prisma migrate deploy`.** A pre-existing
  `_prisma_migrations` row, `202604290001_init`, is marked failed since May 2026 and blocks
  `deploy`. After applying, insert the `_prisma_migrations` row by hand with the file's
  sha256 as `checksum`, exactly as the Phase 1 migration did, or Prisma will try to re-run it.
- Access to any meeting goes through `roleCanReadPdMeetings()` (OWNER and PD only) or being
  the subject resident. Everyone else gets 404, never 403.
- Prose, comments and UI copy use no em dashes and no en dashes.
- The PD dashboard is institution-scoped and resolves no `programId`. Cross-program reads
  live under `/api/pd/`.

## Two deliberate divergences from the spec

**Draft visibility.** Spec section 9 says a draft is visible only to the PD who created it.
This plan scopes it to `canDirectMeetings`, meaning any OWNER or PD of that programme. A
programme with two directors should not lock one out of a half-finished record, and the
resident still sees nothing until publish. Narrow it later if a programme asks.

**Task granularity.** Tasks 1 through 6 carry complete code. Tasks 7 through 10 are
specified at interface level (files, endpoints, props, behaviour, acceptance) rather than
line by line, because they are three React components whose full source in the plan would
roughly double this document to write the same code twice. This is a departure from the
writing-plans standard, which assumes a reader with no context. It is safe only because
this session executes the plan itself. Hand these tasks to a fresh agent and they need
filling in first.

---

### Task 1: Schema and migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20261020120000_pd_meeting_record/migration.sql`

**Interfaces:**
- Produces: models `PdMeeting`, `ResidentScoreEntry`, `ResidentChecklistItem`,
  `ProgramMeetingConfig`, and enum `PdMeetingStatus`.

- [ ] **Step 1: Add the models to the schema**

Copy the four models and the enum verbatim from spec sections 6.2 and 6.3. Then add the
back-relations, which the spec does not spell out and `prisma validate` will demand:

On `model Program`:

```prisma
  pdMeetings     PdMeeting[]
  scoreEntries   ResidentScoreEntry[]
  checklistItems ResidentChecklistItem[]
  meetingConfig  ProgramMeetingConfig?
```

On `model User`:

```prisma
  pdMeetingsAsResident PdMeeting[]             @relation("PdMeetingsAsResident")
  pdMeetingsAsDirector PdMeeting[]             @relation("PdMeetingsAsDirector")
  residentScores       ResidentScoreEntry[]    @relation("ResidentScores")
  residentChecklist    ResidentChecklistItem[] @relation("ResidentChecklist")
```

- [ ] **Step 2: Validate**

Run: `npx prisma validate`

Expected: `The schema at prisma/schema.prisma is valid`.

The self-relation on `PdMeeting` is the likely failure. `previousMeetingId` must be
`@unique` and both sides must name the same relation, `"PdMeetingChain"`.

- [ ] **Step 3: Write the migration**

Create `prisma/migrations/20261020120000_pd_meeting_record/migration.sql`:

```sql
-- ─────────────────────────────────────────────────────────────────────────────
-- PD 1:1 meeting record.
--
-- Pinned search_path: HippoVFinal is shared and multi-schema. "users" exists
-- in both auth and public, so the unqualified REFERENCES below would
-- otherwise be ambiguous. See 20261019120000_program_join_requests.
-- ─────────────────────────────────────────────────────────────────────────────
SET search_path TO public;

CREATE TYPE "PdMeetingStatus" AS ENUM ('DRAFT', 'PUBLISHED');

CREATE TABLE "pd_meetings" (
  "id"                TEXT NOT NULL,
  "programId"         TEXT NOT NULL,
  "residentId"        TEXT NOT NULL,
  "directorId"        TEXT NOT NULL,
  "meetingDate"       TIMESTAMP(3) NOT NULL,
  "cycleLabel"        TEXT,
  "pgyAtMeeting"      INTEGER,
  "status"            "PdMeetingStatus" NOT NULL DEFAULT 'DRAFT',
  "publishedAt"       TIMESTAMP(3),
  "previousMeetingId" TEXT,
  "sections"          JSONB NOT NULL,
  "snapshot"          JSONB,
  "acknowledgedAt"    TIMESTAMP(3),
  "acknowledgedName"  TEXT,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL,
  CONSTRAINT "pd_meetings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "pd_meetings_previousMeetingId_key" ON "pd_meetings"("previousMeetingId");
CREATE INDEX "pd_meetings_programId_meetingDate_idx" ON "pd_meetings"("programId", "meetingDate");
CREATE INDEX "pd_meetings_residentId_status_idx" ON "pd_meetings"("residentId", "status");

ALTER TABLE "pd_meetings"
  ADD CONSTRAINT "pd_meetings_programId_fkey" FOREIGN KEY ("programId")
  REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pd_meetings"
  ADD CONSTRAINT "pd_meetings_residentId_fkey" FOREIGN KEY ("residentId")
  REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pd_meetings"
  ADD CONSTRAINT "pd_meetings_directorId_fkey" FOREIGN KEY ("directorId")
  REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pd_meetings"
  ADD CONSTRAINT "pd_meetings_previousMeetingId_fkey" FOREIGN KEY ("previousMeetingId")
  REFERENCES "pd_meetings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "resident_score_entries" (
  "id"         TEXT NOT NULL,
  "programId"  TEXT NOT NULL,
  "residentId" TEXT NOT NULL,
  "tableId"    TEXT NOT NULL,
  "sittingAt"  TIMESTAMP(3) NOT NULL,
  "values"     JSONB NOT NULL,
  "note"       TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL,
  CONSTRAINT "resident_score_entries_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "resident_score_entries_lookup_idx"
  ON "resident_score_entries"("programId", "residentId", "tableId", "sittingAt");
ALTER TABLE "resident_score_entries"
  ADD CONSTRAINT "resident_score_entries_programId_fkey" FOREIGN KEY ("programId")
  REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "resident_score_entries"
  ADD CONSTRAINT "resident_score_entries_residentId_fkey" FOREIGN KEY ("residentId")
  REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "resident_checklist_items" (
  "id"          TEXT NOT NULL,
  "programId"   TEXT NOT NULL,
  "residentId"  TEXT NOT NULL,
  "itemId"      TEXT NOT NULL,
  "completed"   BOOLEAN NOT NULL DEFAULT false,
  "completedAt" TIMESTAMP(3),
  "note"        TEXT,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "resident_checklist_items_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "resident_checklist_items_residentId_programId_itemId_key"
  ON "resident_checklist_items"("residentId", "programId", "itemId");
CREATE INDEX "resident_checklist_items_programId_residentId_idx"
  ON "resident_checklist_items"("programId", "residentId");
ALTER TABLE "resident_checklist_items"
  ADD CONSTRAINT "resident_checklist_items_programId_fkey" FOREIGN KEY ("programId")
  REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "resident_checklist_items"
  ADD CONSTRAINT "resident_checklist_items_residentId_fkey" FOREIGN KEY ("residentId")
  REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "program_meeting_configs" (
  "id"             TEXT NOT NULL,
  "programId"      TEXT NOT NULL,
  "logoUrl"        TEXT,
  "letterhead"     JSONB,
  "sectionConfig"  JSONB,
  "checklists"     JSONB NOT NULL,
  "scoreTables"    JSONB NOT NULL,
  "certifications" JSONB NOT NULL,
  "introText"      TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "program_meeting_configs_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "program_meeting_configs_programId_key"
  ON "program_meeting_configs"("programId");
ALTER TABLE "program_meeting_configs"
  ADD CONSTRAINT "program_meeting_configs_programId_fkey" FOREIGN KEY ("programId")
  REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── RLS ──────────────────────────────────────────────────────────────────────
-- Narrower than the other tables on purpose. A 1:1 record is visible to the
-- subject and to PD-like members only, never to a CC member or coordinator
-- who merely has roster access. Mirrors roleCanReadPdMeetings().
ALTER TABLE "pd_meetings"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE "resident_score_entries"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "resident_checklist_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "program_meeting_configs"  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pd_meetings_subject_or_director" ON "pd_meetings" FOR SELECT
  USING (
    "residentId" = current_setting('request.jwt.claims', true)::json->>'sub'
    OR "programId" IN (
      SELECT "programId" FROM "program_members"
      WHERE "userId" = current_setting('request.jwt.claims', true)::json->>'sub'
        AND "role" IN ('OWNER', 'PD')
    )
  );

CREATE POLICY "resident_score_entries_subject_or_director" ON "resident_score_entries" FOR SELECT
  USING (
    "residentId" = current_setting('request.jwt.claims', true)::json->>'sub'
    OR "programId" IN (
      SELECT "programId" FROM "program_members"
      WHERE "userId" = current_setting('request.jwt.claims', true)::json->>'sub'
        AND "role" IN ('OWNER', 'PD')
    )
  );

CREATE POLICY "resident_checklist_items_subject_or_director" ON "resident_checklist_items" FOR SELECT
  USING (
    "residentId" = current_setting('request.jwt.claims', true)::json->>'sub'
    OR "programId" IN (
      SELECT "programId" FROM "program_members"
      WHERE "userId" = current_setting('request.jwt.claims', true)::json->>'sub'
        AND "role" IN ('OWNER', 'PD')
    )
  );

-- Config is not personal data, so any member of the program may read it.
CREATE POLICY "program_meeting_configs_members" ON "program_meeting_configs" FOR SELECT
  USING (
    "programId" IN (
      SELECT "programId" FROM "program_members"
      WHERE "userId" = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );
```

- [ ] **Step 4: Apply through the Supabase MCP**

Project id is `nitdinoerkzgoozpucgm` (HippoVFinal). Before applying, confirm none of the
four tables and neither type already exist, the way the Phase 1 migration did. Apply the
file's contents as one migration named `pd_meeting_record`.

Then record it so Prisma agrees it is done. Compute the checksum first:

```bash
shasum -a 256 prisma/migrations/20261020120000_pd_meeting_record/migration.sql
```

and insert, substituting that value:

```sql
INSERT INTO "_prisma_migrations"
  (id, checksum, migration_name, started_at, finished_at, applied_steps_count, logs)
VALUES (gen_random_uuid()::text, '<sha256>', '20261020120000_pd_meeting_record',
        now(), now(), 1, 'Applied via Supabase MCP.')
ON CONFLICT DO NOTHING;
```

- [ ] **Step 5: Verify, then regenerate**

Confirm the four tables exist with RLS enabled, and that every foreign key on `pd_meetings`
references `public.users` or `public.programs` rather than `auth.users`:

```sql
SELECT con.conname,
  (SELECT n.nspname||'.'||c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE c.oid = con.confrelid) AS references_table
FROM pg_constraint con JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname LIKE 'pd_meetings' AND con.contype='f';
```

Then: `npx prisma generate`

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20261020120000_pd_meeting_record/
git commit -m "feat(pd-meeting): meeting record, longitudinal scores and checklists, program config"
```

---

### Task 2: Types and the Manitoba defaults

The eight section IDs are fixed in code. The checklists, score tables and certifications are
per-program data, seeded with Manitoba's so Dr. Nayak's first meeting matches his paper.

**Files:**
- Create: `src/lib/pd-meeting/types.ts`
- Create: `src/lib/pd-meeting/defaults.ts`
- Create: `tests/pd-meeting-defaults.test.ts`

**Interfaces:**
- Produces:
  - `PD_SECTIONS: readonly PdSectionDef[]` with `id` and `label`
  - `type PdSectionId`
  - `interface PdBullet { id, text, outcome?, carriedFrom? }`
  - `interface PdSections { [sectionId: string]: { bullets: PdBullet[] } }`
  - `interface MeetingConfig { checklists, scoreTables, certifications, introText, letterhead }`
  - `MANITOBA_UROLOGY_CONFIG: MeetingConfig`

- [ ] **Step 1: Write the failing test**

Create `tests/pd-meeting-defaults.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { PD_SECTIONS, GOALS_SECTION_ID } from "@/lib/pd-meeting/types";
import { MANITOBA_UROLOGY_CONFIG } from "@/lib/pd-meeting/defaults";

describe("PD_SECTIONS", () => {
  it("has the eight sections of the letter, in order", () => {
    expect(PD_SECTIONS.map((s) => s.id)).toEqual([
      "progress",
      "goals",
      "career",
      "resident_concerns",
      "faculty_concerns",
      "tres",
      "cbd",
      "entrada",
    ]);
  });

  it("names the goals section, which is the only one carrying outcomes", () => {
    expect(GOALS_SECTION_ID).toBe("goals");
    expect(PD_SECTIONS.some((s) => s.id === GOALS_SECTION_ID)).toBe(true);
  });

  it("gives every section a human label", () => {
    for (const s of PD_SECTIONS) expect(s.label.length).toBeGreaterThan(3);
  });
});

describe("MANITOBA_UROLOGY_CONFIG", () => {
  it("carries the two checklists from the letter", () => {
    expect(MANITOBA_UROLOGY_CONFIG.checklists.map((c) => c.id)).toEqual([
      "core_curriculum",
      "qi_modules",
    ]);
  });

  it("has every core curriculum row with a target year", () => {
    const core = MANITOBA_UROLOGY_CONFIG.checklists.find((c) => c.id === "core_curriculum")!;
    expect(core.items.length).toBe(10);
    for (const i of core.items) expect(i.targetYear).toBeTruthy();
  });

  it("has no duplicate item ids anywhere, which the paper letter does have", () => {
    const ids = MANITOBA_UROLOGY_CONFIG.checklists.flatMap((c) => c.items.map((i) => i.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("carries the ten QI and patient-safety modules", () => {
    const qi = MANITOBA_UROLOGY_CONFIG.checklists.find((c) => c.id === "qi_modules")!;
    expect(qi.items.length).toBe(10);
  });

  it("defines the Mini-QUEST table with the letter's columns", () => {
    const t = MANITOBA_UROLOGY_CONFIG.scoreTables.find((t) => t.id === "mini_quest")!;
    expect(t.columns.map((c) => c.id)).toEqual(["overall", "mcq", "osce", "vr", "rank"]);
  });

  it("defines the AUA in-service table", () => {
    expect(MANITOBA_UROLOGY_CONFIG.scoreTables.some((t) => t.id === "aua")).toBe(true);
  });

  it("lists the four certifications", () => {
    expect(MANITOBA_UROLOGY_CONFIG.certifications.map((c) => c.id)).toEqual([
      "acls", "atls", "procedural_sedation", "principles_of_surgery",
    ]);
  });

  it("carries the letter's opening paragraph", () => {
    expect(MANITOBA_UROLOGY_CONFIG.introText).toContain("semi-annual");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- pd-meeting-defaults`

Expected: FAIL, `Failed to resolve import "@/lib/pd-meeting/types"`.

- [ ] **Step 3: Write the types**

Create `src/lib/pd-meeting/types.ts`:

```ts
// ---------------------------------------------------------------------------
// PD 1:1 meeting record types.
//
// The eight section IDs are fixed here rather than configured, because the
// PDF layout in Phase 3 depends on knowing them. A programme may relabel or
// hide a section through ProgramMeetingConfig.sectionConfig; it may not
// invent a ninth.
// ---------------------------------------------------------------------------

export interface PdSectionDef {
  id: string;
  /** Default heading. ProgramMeetingConfig.sectionConfig may override it. */
  label: string;
}

// `as const satisfies` rather than an annotation: an annotation would widen
// every id back to `string` and PdSectionId below would stop being a union.
export const PD_SECTIONS = [
  { id: 'progress',          label: 'Progress in training' },
  { id: 'goals',             label: 'Immediate goals' },
  { id: 'career',            label: 'Career planning' },
  { id: 'resident_concerns', label: 'Areas of concern on behalf of residents' },
  { id: 'faculty_concerns',  label: 'Areas for improvement / areas of concern on behalf of Faculty' },
  { id: 'tres',              label: 'T-RES' },
  { id: 'cbd',               label: 'Current CBD levels' },
  { id: 'entrada',           label: 'Entrada reminders' },
] as const satisfies readonly PdSectionDef[];

export type PdSectionId = (typeof PD_SECTIONS)[number]['id'];

/**
 * The one section whose previous-meeting bullets must be given an outcome
 * before this meeting can be published. It is the loop the paper letter
 * never closes: goals are restated, never resolved.
 */
export const GOALS_SECTION_ID = 'goals';

export type PdGoalOutcome = 'met' | 'partly' | 'not_met' | 'carried';

export interface PdBullet {
  id: string;
  text: string;
  /** Only meaningful inside the goals section. */
  outcome?: PdGoalOutcome;
  /** The previous-meeting bullet id this was carried forward from. */
  carriedFrom?: string;
}

/** Stored on PdMeeting.sections. This meeting's column only. */
export interface PdSections {
  [sectionId: string]: { bullets: PdBullet[] };
}

// ── Per-program configuration ──────────────────────────────────────────

export interface ChecklistItemDef {
  id: string;
  label: string;
  /** Free text, e.g. "PGY1" or "PGY 3-5". Printed in its own column. */
  targetYear?: string;
}

export interface ChecklistDef {
  id: string;
  title: string;
  items: ChecklistItemDef[];
}

export interface ScoreColumnDef {
  id: string;
  label: string;
}

export interface ScoreTableDef {
  id: string;
  title: string;
  /** The date column is implicit and always first. */
  columns: ScoreColumnDef[];
}

export interface CertificationDef {
  id: string;
  label: string;
}

export interface LetterheadDef {
  lines: string[];
}

export interface MeetingConfig {
  checklists: ChecklistDef[];
  scoreTables: ScoreTableDef[];
  certifications: CertificationDef[];
  introText: string;
  letterhead: LetterheadDef;
}

/** Empty sections for a brand new meeting. */
export function emptySections(): PdSections {
  const out: PdSections = {};
  for (const s of PD_SECTIONS) out[s.id] = { bullets: [] };
  return out;
}
```

- [ ] **Step 4: Write the Manitoba defaults**

Create `src/lib/pd-meeting/defaults.ts`. Content is taken from
`K-Sidhom _PD Meeting_16-Jul-2025 - JN.pdf`:

```ts
import type { MeetingConfig } from './types';

/**
 * University of Manitoba Urology, transcribed from the signed July 2025
 * letter. Seeded into ProgramMeetingConfig the first time a programme opens
 * a meeting, so Dr. Nayak's first record matches his paper without setup.
 *
 * One deliberate departure: the paper letter lists "Drug Prescribing Safety"
 * twice in the Core Curriculum table, which is a transcription error in the
 * original. It appears once here, because two identical checkboxes cannot be
 * told apart in the UI and cannot have distinct ids. Flagged for Karim.
 */
export const MANITOBA_UROLOGY_CONFIG: MeetingConfig = {
  introText:
    'This letter is to document the content of our semi-annual Program Director ' +
    'and Resident 1:1 meeting. We reviewed your progress in training, including ' +
    'your exam results. We discussed goals moving forward to optimize your ' +
    'training experience as well as areas for improvement. The opportunity to ' +
    'raise concerns of the program was provided. Career planning was reviewed. ' +
    'The following points summarize the main points of our discussion which we ' +
    'will revisit at our next meeting.',

  letterhead: {
    lines: [
      'Max Rady College of Medicine',
      'Department of Surgery',
      'Urology Residency Program',
      'University of Manitoba',
      'AE 105 - 671 William Ave',
      'Winnipeg, Manitoba, Canada',
      'Email: urology@umanitoba.ca',
    ],
  },

  checklists: [
    {
      id: 'core_curriculum',
      title: 'Core Curriculum',
      items: [
        { id: 'conflict_management',     label: 'Conflict Management in Medicine', targetYear: 'PGY1' },
        { id: 'professional_boundaries', label: 'Professional Boundaries in the Physician-Patient Relationship', targetYear: 'PGY1' },
        { id: 'foundations_prof',        label: 'Foundations of Professionalism (formerly RTLE)', targetYear: 'PGY1' },
        { id: 'diversity_care',          label: 'Diversity - Offering Culturally Proficient Care', targetYear: 'PGY1' },
        { id: 'drug_prescribing_safety', label: 'Drug Prescribing Safety', targetYear: 'PGY1' },
        { id: 'teaching_development',    label: 'Teaching Development Program', targetYear: 'PGY1' },
        { id: 'diversity_med_ed',        label: 'Diversity in Medical Education', targetYear: 'PGY1' },
        { id: 'resource_stewardship',    label: 'Resource Stewardship', targetYear: 'PGY1' },
        { id: 'cmpa_seminar',            label: 'CMPA Seminar', targetYear: 'PGY1' },
        { id: 'practice_management',     label: 'Practice Management', targetYear: 'PGY 3-5' },
      ],
    },
    {
      id: 'qi_modules',
      title: 'QI Modules',
      items: [
        { id: 'qi101', label: 'QI 101: Introduction to Health Care Improvement' },
        { id: 'qi102', label: 'QI 102: How to Improve with the Model for Improvement' },
        { id: 'qi103', label: 'QI 103: Testing and Measuring Changes with PDSA Cycles' },
        { id: 'qi104', label: 'QI 104: Interpreting Data: Run Charts, Control Charts, and other Measurement Tools' },
        { id: 'ps101', label: 'PS 101: Introduction to Patient Safety' },
        { id: 'ps102', label: 'PS 102: From Error to Harm' },
        { id: 'ps103', label: 'PS 103: Human Factors and Safety' },
        { id: 'ps104', label: 'PS 104: Teamwork and Communication' },
        { id: 'ps105', label: 'PS 105: Responding to Adverse Events' },
        { id: 'ps201', label: 'PS 201: Root Cause Analyses and Actions' },
      ],
    },
  ],

  scoreTables: [
    {
      id: 'mini_quest',
      title: 'Mini-QUEST Results',
      columns: [
        { id: 'overall', label: 'Overall' },
        { id: 'mcq',     label: 'MCQ' },
        { id: 'osce',    label: 'OSCE' },
        { id: 'vr',      label: 'VR' },
        { id: 'rank',    label: 'Rank' },
      ],
    },
    {
      id: 'aua',
      title: 'AUA In-Service Exam',
      columns: [{ id: 'percentile', label: 'Percentile' }],
    },
  ],

  certifications: [
    { id: 'acls',                  label: 'ACLS' },
    { id: 'atls',                  label: 'ATLS' },
    { id: 'procedural_sedation',   label: 'Procedural Sedation' },
    { id: 'principles_of_surgery', label: 'Principles of Surgery' },
  ],
};
```

- [ ] **Step 5: Run the tests**

Run: `npm test -- pd-meeting-defaults`

Expected: PASS, 11 tests.

- [ ] **Step 6: Commit**

```bash
git add src/lib/pd-meeting/types.ts src/lib/pd-meeting/defaults.ts tests/pd-meeting-defaults.test.ts
git commit -m "feat(pd-meeting): fixed section spine and the Manitoba Urology defaults"
```

---

### Task 3: Carry-forward and publish rules

The heart of the feature, and all of it pure so it is tested without a database.

**Files:**
- Create: `src/lib/pd-meeting/carry-forward.ts`
- Create: `tests/pd-meeting-carry-forward.test.ts`

**Interfaces:**
- Consumes: `PdSections`, `PdBullet`, `PD_SECTIONS`, `GOALS_SECTION_ID` from `./types`.
- Produces:
  - `interface SectionView { id, label, previous: PdBullet[], current: PdBullet[] }`
  - `function buildMeetingView(current: PdSections, previous: PdSections | null, labels?: Record<string,string>): SectionView[]`
  - `function carryBullet(b: PdBullet): PdBullet`
  - `interface PublishProblem { sectionId: string; message: string }`
  - `function validateForPublish(current: PdSections, previous: PdSections | null): PublishProblem[]`

- [ ] **Step 1: Write the failing test**

Create `tests/pd-meeting-carry-forward.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  buildMeetingView,
  carryBullet,
  validateForPublish,
} from "@/lib/pd-meeting/carry-forward";
import { emptySections, type PdSections } from "@/lib/pd-meeting/types";

function withBullets(sectionId: string, texts: string[]): PdSections {
  const s = emptySections();
  s[sectionId] = { bullets: texts.map((t, i) => ({ id: `${sectionId}-${i}`, text: t })) };
  return s;
}

describe("buildMeetingView", () => {
  it("returns all eight sections even when both columns are empty", () => {
    expect(buildMeetingView(emptySections(), null)).toHaveLength(8);
  });

  it("puts the previous meeting on the left and this one on the right", () => {
    const prev = withBullets("progress", ["Hard worker"]);
    const cur = withBullets("progress", ["Progressing"]);
    const view = buildMeetingView(cur, prev);
    const progress = view.find((s) => s.id === "progress")!;
    expect(progress.previous.map((b) => b.text)).toEqual(["Hard worker"]);
    expect(progress.current.map((b) => b.text)).toEqual(["Progressing"]);
  });

  it("leaves the left column empty for a first meeting", () => {
    const view = buildMeetingView(withBullets("progress", ["Progressing"]), null);
    expect(view.every((s) => s.previous.length === 0)).toBe(true);
  });

  it("applies label overrides without changing ids", () => {
    const view = buildMeetingView(emptySections(), null, { tres: "T-RES / logbook" });
    expect(view.find((s) => s.id === "tres")!.label).toBe("T-RES / logbook");
  });

  it("tolerates a previous meeting missing a section entirely", () => {
    const prev: PdSections = { progress: { bullets: [{ id: "p1", text: "x" }] } };
    expect(() => buildMeetingView(emptySections(), prev)).not.toThrow();
    expect(buildMeetingView(emptySections(), prev)).toHaveLength(8);
  });
});

describe("carryBullet", () => {
  it("copies the text and records where it came from", () => {
    const out = carryBullet({ id: "old-1", text: "Attend CUA and AUA" });
    expect(out.text).toBe("Attend CUA and AUA");
    expect(out.carriedFrom).toBe("old-1");
    expect(out.id).not.toBe("old-1");
  });

  it("does not carry the old outcome across", () => {
    const out = carryBullet({ id: "old-1", text: "x", outcome: "met" });
    expect(out.outcome).toBeUndefined();
  });
});

describe("validateForPublish", () => {
  it("passes a first meeting with content and no previous goals", () => {
    expect(validateForPublish(withBullets("progress", ["Progressing"]), null)).toEqual([]);
  });

  it("refuses a meeting with nothing in it", () => {
    const problems = validateForPublish(emptySections(), null);
    expect(problems.length).toBeGreaterThan(0);
    expect(problems[0].message).toMatch(/nothing/i);
  });

  it("refuses when a previous goal has no outcome", () => {
    const prev = withBullets("goals", ["Enhance and structure study time"]);
    const cur = withBullets("progress", ["Progressing"]);
    const problems = validateForPublish(cur, prev);
    expect(problems).toHaveLength(1);
    expect(problems[0].sectionId).toBe("goals");
    expect(problems[0].message).toMatch(/outcome/i);
  });

  it("passes once every previous goal has an outcome", () => {
    const prev = withBullets("goals", ["Study time", "Reading"]);
    const cur = emptySections();
    cur.goals = {
      bullets: [
        { id: "n1", text: "Study time", outcome: "met", carriedFrom: "goals-0" },
        { id: "n2", text: "Reading", outcome: "carried", carriedFrom: "goals-1" },
      ],
    };
    expect(validateForPublish(cur, prev)).toEqual([]);
  });

  it("counts an outcome recorded on any bullet citing that goal", () => {
    const prev = withBullets("goals", ["Study time"]);
    const cur = emptySections();
    cur.goals = {
      bullets: [
        { id: "n1", text: "Different wording", outcome: "not_met", carriedFrom: "goals-0" },
      ],
    };
    expect(validateForPublish(cur, prev)).toEqual([]);
  });

  it("ignores outcomes outside the goals section", () => {
    const prev = withBullets("progress", ["Hard worker"]);
    expect(validateForPublish(withBullets("progress", ["Progressing"]), prev)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- pd-meeting-carry-forward`

Expected: FAIL, `Failed to resolve import "@/lib/pd-meeting/carry-forward"`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/pd-meeting/carry-forward.ts`:

```ts
// ---------------------------------------------------------------------------
// Carry-forward: the two-column view, and the rules for publishing.
//
// The previous meeting's column is never copied into this meeting's row. It
// is read through PdMeeting.previousMeetingId at render time, so correcting
// an old record does not silently rewrite the next one's left column, and a
// meeting is never storing someone else's text.
// ---------------------------------------------------------------------------
import {
  GOALS_SECTION_ID,
  PD_SECTIONS,
  type PdBullet,
  type PdSections,
} from './types';

export interface SectionView {
  id: string;
  label: string;
  /** Read-only, from the previous published meeting. Empty on a first meeting. */
  previous: PdBullet[];
  /** Editable, this meeting's column. */
  current: PdBullet[];
}

function bulletsOf(sections: PdSections | null, id: string): PdBullet[] {
  const s = sections?.[id];
  return Array.isArray(s?.bullets) ? s.bullets : [];
}

/**
 * Build the editor's eight rows. Always returns all eight in letter order,
 * whatever either side happens to contain, so the editor never has to guess
 * at a missing key and an older record with fewer sections still renders.
 */
export function buildMeetingView(
  current: PdSections,
  previous: PdSections | null,
  labels: Record<string, string> = {},
): SectionView[] {
  return PD_SECTIONS.map((s) => ({
    id: s.id,
    label: labels[s.id] ?? s.label,
    previous: bulletsOf(previous, s.id),
    current: bulletsOf(current, s.id),
  }));
}

/** Fresh id for a carried bullet. Stable enough; collisions do not matter. */
function newBulletId(): string {
  return `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Copy a previous-meeting bullet into this meeting. The outcome is
 * deliberately dropped: it described what happened to the OLD goal, and
 * re-stating the goal starts that question again.
 */
export function carryBullet(b: PdBullet): PdBullet {
  return { id: newBulletId(), text: b.text, carriedFrom: b.id };
}

export interface PublishProblem {
  sectionId: string;
  message: string;
}

/**
 * What must be true before a meeting can be published.
 *
 *   1. Something was actually recorded.
 *   2. Every goal the PREVIOUS meeting set has an outcome on some bullet in
 *      this meeting's goals section. That is the only thing this app asks
 *      for that the paper letter does not.
 */
export function validateForPublish(
  current: PdSections,
  previous: PdSections | null,
): PublishProblem[] {
  const problems: PublishProblem[] = [];

  const hasAnything = PD_SECTIONS.some((s) =>
    bulletsOf(current, s.id).some((b) => b.text.trim().length > 0),
  );
  if (!hasAnything) {
    problems.push({
      sectionId: PD_SECTIONS[0].id,
      message: 'There is nothing in this record yet.',
    });
    return problems;
  }

  const previousGoals = bulletsOf(previous, GOALS_SECTION_ID);
  if (previousGoals.length > 0) {
    const resolved = new Set(
      bulletsOf(current, GOALS_SECTION_ID)
        .filter((b) => b.outcome && b.carriedFrom)
        .map((b) => b.carriedFrom as string),
    );
    const unresolved = previousGoals.filter((g) => !resolved.has(g.id));
    if (unresolved.length > 0) {
      problems.push({
        sectionId: GOALS_SECTION_ID,
        message:
          unresolved.length === 1
            ? 'One goal from the last meeting still needs an outcome.'
            : `${unresolved.length} goals from the last meeting still need an outcome.`,
      });
    }
  }

  return problems;
}
```

- [ ] **Step 4: Run the tests**

Run: `npm test -- pd-meeting-carry-forward`

Expected: PASS, 13 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/pd-meeting/carry-forward.ts tests/pd-meeting-carry-forward.test.ts
git commit -m "feat(pd-meeting): two-column view, carry-forward, and publish rules"
```

---

### Task 4: Access helper and meeting config API

**Files:**
- Create: `src/lib/pd-meeting/access.ts`
- Create: `src/app/api/programs/[id]/meeting-config/route.ts`

**Interfaces:**
- Produces:
  - `async function canDirectMeetings(userId, programId): Promise<boolean>`
  - `async function getOrCreateMeetingConfig(programId)` returning the row, seeding
    `MANITOBA_UROLOGY_CONFIG` on first call
  - `GET` and `PUT /api/programs/[id]/meeting-config`

- [ ] **Step 1: Write the access helper**

Create `src/lib/pd-meeting/access.ts`:

```ts
import { db } from '@/lib/db';
import { roleCanReadPdMeetings } from '@/lib/program-auth';
import { MANITOBA_UROLOGY_CONFIG } from './defaults';
import type { MeetingConfig } from './types';

/**
 * True when this user may create, read and publish meetings in this
 * programme. Deliberately narrower than roster access: see
 * roleCanReadPdMeetings in program-auth.ts.
 */
export async function canDirectMeetings(
  userId: string,
  programId: string,
): Promise<boolean> {
  const m = await db.programMember.findUnique({
    where: { programId_userId: { programId, userId } },
    select: { role: true },
  });
  return m ? roleCanReadPdMeetings(m.role) : false;
}

/**
 * The programme's meeting configuration, seeded with the Manitoba defaults
 * the first time anyone asks. Seeding on read rather than at program
 * creation means programmes created before this feature existed get one too.
 */
export async function getOrCreateMeetingConfig(programId: string) {
  const existing = await db.programMeetingConfig.findUnique({ where: { programId } });
  if (existing) return existing;

  const d: MeetingConfig = MANITOBA_UROLOGY_CONFIG;
  return db.programMeetingConfig.create({
    data: {
      programId,
      checklists: d.checklists as object,
      scoreTables: d.scoreTables as object,
      certifications: d.certifications as object,
      introText: d.introText,
      letterhead: d.letterhead as object,
    },
  });
}
```

- [ ] **Step 2: Write the config route**

Create `src/app/api/programs/[id]/meeting-config/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { canDirectMeetings, getOrCreateMeetingConfig } from '@/lib/pd-meeting/access';

/** GET /api/programs/[id]/meeting-config */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { id: programId } = await params;

  if (!(await canDirectMeetings(user.id, programId))) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }
  return NextResponse.json({ config: await getOrCreateMeetingConfig(programId) });
}

/**
 * PUT /api/programs/[id]/meeting-config
 *
 * Replaces the editable lists. The eight section IDs are fixed in code and
 * cannot be changed here; sectionConfig only overrides their labels.
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { id: programId } = await params;

  if (!(await canDirectMeetings(user.id, programId))) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Expected a JSON body.' }, { status: 400 });
  }

  await getOrCreateMeetingConfig(programId);
  const data: Record<string, unknown> = {};
  for (const k of ['checklists', 'scoreTables', 'certifications', 'sectionConfig', 'letterhead'] as const) {
    if (k in body) data[k] = body[k] as object;
  }
  if (typeof body.introText === 'string') data.introText = body.introText.slice(0, 4000);
  if (typeof body.logoUrl === 'string' || body.logoUrl === null) data.logoUrl = body.logoUrl;

  const config = await db.programMeetingConfig.update({ where: { programId }, data });
  return NextResponse.json({ config });
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/pd-meeting/access.ts "src/app/api/programs/[id]/meeting-config/route.ts"
git commit -m "feat(pd-meeting): per-program config, seeded with the Manitoba defaults"
```

---

### Task 5: Create and read a meeting

**Files:**
- Create: `src/app/api/pd/meetings/route.ts`
- Create: `src/app/api/pd/meetings/[meetingId]/route.ts`

**Interfaces:**
- Produces:
  - `POST /api/pd/meetings` body `{ programId, residentId, meetingDate?, cycleLabel? }`
  - `GET /api/pd/meetings?residentId=` listing that resident's meetings
  - `GET /api/pd/meetings/[meetingId]` returning `{ meeting, view, config, scores, checklist }`

- [ ] **Step 1: Write the collection route**

Create `src/app/api/pd/meetings/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { canDirectMeetings } from '@/lib/pd-meeting/access';
import { emptySections } from '@/lib/pd-meeting/types';

/**
 * POST /api/pd/meetings
 *
 * Start a meeting. previousMeetingId is resolved once here and then frozen,
 * so correcting an old record later never re-points this one's left column.
 */
export async function POST(req: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  let body: { programId?: string; residentId?: string; meetingDate?: string; cycleLabel?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Expected a JSON body.' }, { status: 400 });
  }
  const { programId, residentId } = body;
  if (!programId || !residentId) {
    return NextResponse.json({ error: 'programId and residentId are required.' }, { status: 400 });
  }
  if (!(await canDirectMeetings(user.id, programId))) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  const member = await db.programMember.findUnique({
    where: { programId_userId: { programId, userId: residentId } },
    select: { id: true },
  });
  if (!member) {
    return NextResponse.json({ error: 'That resident is not in this program.' }, { status: 400 });
  }

  // An unfinished draft is reopened rather than duplicated. Two half-filled
  // records for one meeting is the worst outcome here.
  const openDraft = await db.pdMeeting.findFirst({
    where: { programId, residentId, status: 'DRAFT' },
    select: { id: true },
  });
  if (openDraft) return NextResponse.json({ meeting: openDraft, reopened: true });

  const previous = await db.pdMeeting.findFirst({
    where: { programId, residentId, status: 'PUBLISHED' },
    orderBy: { meetingDate: 'desc' },
    select: { id: true },
  });
  const profile = await db.profile.findUnique({
    where: { userId: residentId },
    select: { pgyYear: true },
  });

  const meeting = await db.pdMeeting.create({
    data: {
      programId,
      residentId,
      directorId: user.id,
      meetingDate: body.meetingDate ? new Date(body.meetingDate) : new Date(),
      cycleLabel: body.cycleLabel?.trim() || null,
      pgyAtMeeting: profile?.pgyYear ?? null,
      previousMeetingId: previous?.id ?? null,
      sections: emptySections() as object,
    },
    select: { id: true },
  });

  return NextResponse.json({ meeting, reopened: false }, { status: 201 });
}

/** GET /api/pd/meetings?residentId=... */
export async function GET(req: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const residentId = new URL(req.url).searchParams.get('residentId');
  if (!residentId) {
    return NextResponse.json({ error: 'residentId is required.' }, { status: 400 });
  }

  const memberships = await db.programMember.findMany({
    where: { userId: user.id, role: { in: ['OWNER', 'PD'] } },
    select: { programId: true },
  });
  const managed = memberships.map((m) => m.programId);
  if (managed.length === 0) return NextResponse.json({ meetings: [] });

  const meetings = await db.pdMeeting.findMany({
    where: { residentId, programId: { in: managed } },
    orderBy: { meetingDate: 'desc' },
    select: {
      id: true, meetingDate: true, cycleLabel: true, status: true,
      publishedAt: true, pgyAtMeeting: true, acknowledgedAt: true,
    },
  });

  return NextResponse.json({
    meetings: meetings.map((m) => ({
      ...m,
      meetingDate: m.meetingDate.toISOString(),
      publishedAt: m.publishedAt?.toISOString() ?? null,
      acknowledgedAt: m.acknowledgedAt?.toISOString() ?? null,
    })),
  });
}
```

- [ ] **Step 2: Write the single-meeting route**

Create `src/app/api/pd/meetings/[meetingId]/route.ts` with a `GET` that loads the meeting,
checks `canDirectMeetings` on its `programId` (404 otherwise), loads `previousMeeting.sections`,
and returns:

```ts
return NextResponse.json({
  meeting: {
    id, meetingDate, cycleLabel, pgyAtMeeting, status,
    publishedAt, previousMeetingId,
    resident: { id, name, email },
    previousMeetingDate,   // for the left column heading
  },
  view: buildMeetingView(
    meeting.sections as PdSections,
    (meeting.previousMeeting?.sections as PdSections) ?? null,
    (config.sectionConfig as Record<string, string>) ?? {},
  ),
  config,
  scores: scoreEntriesGroupedByTableId,
  checklist: checklistStateByItemId,
});
```

Load config with `getOrCreateMeetingConfig(meeting.programId)`, scores with
`db.residentScoreEntry.findMany({ where: { programId, residentId }, orderBy: { sittingAt: 'asc' } })`,
and checklist with `db.residentChecklistItem.findMany({ where: { programId, residentId } })`.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/pd/meetings/
git commit -m "feat(pd-meeting): create a meeting and read it with its two-column view"
```

---

### Task 6: Autosave and publish

**Files:**
- Modify: `src/app/api/pd/meetings/[meetingId]/route.ts` (add `PATCH`)
- Create: `src/app/api/pd/meetings/[meetingId]/publish/route.ts`

**Interfaces:**
- Produces:
  - `PATCH /api/pd/meetings/[meetingId]` body `{ sections?, meetingDate?, cycleLabel? }`
  - `POST /api/pd/meetings/[meetingId]/publish`

- [ ] **Step 1: Add PATCH for autosave**

Appended to the meeting route. Rules: `canDirectMeetings` or 404; a `PUBLISHED` meeting may
still be corrected, but doing so clears `acknowledgedAt` and `acknowledgedName` and writes an
`AuditLog` row, because the resident acknowledged different words.

```ts
const wasPublished = meeting.status === 'PUBLISHED';
const updated = await db.pdMeeting.update({
  where: { id: meeting.id },
  data: {
    ...(body.sections ? { sections: body.sections as object } : {}),
    ...(body.meetingDate ? { meetingDate: new Date(body.meetingDate) } : {}),
    ...(typeof body.cycleLabel === 'string' ? { cycleLabel: body.cycleLabel.trim() || null } : {}),
    // Editing after publish invalidates the acknowledgment.
    ...(wasPublished ? { acknowledgedAt: null, acknowledgedName: null } : {}),
  },
  select: { id: true, updatedAt: true, status: true },
});
```

- [ ] **Step 2: Write the publish route**

`POST /api/pd/meetings/[meetingId]/publish`. It must:

1. Load the meeting plus `previousMeeting.sections`; 404 unless `canDirectMeetings`.
2. Run `validateForPublish(sections, previousSections)`. If it returns problems, respond
   `409` with `{ problems }` and change nothing.
3. Build the snapshot and write it with `status: 'PUBLISHED'` and `publishedAt: new Date()`.

The snapshot freezes everything the record needs to reprint identically in Phase 3:

```ts
const snapshot = {
  takenAt: new Date().toISOString(),
  config,                    // labels, checklists, score tables, letterhead
  scores: scoreEntries,      // every row, as of now
  checklist: checklistState,
  previousSections,          // so the left column survives even if the old record moves
  metrics: await hippoMetricsSince(programId, residentId, previousMeetingDate),
};
```

`hippoMetricsSince` is a small helper in `src/lib/pd-meeting/metrics.ts` returning case
volume by category, EPA counts and rotations in the interval. Keep it to counts; it is
context for the conversation, not an assessment.

- [ ] **Step 3: Typecheck and test**

Run: `npx tsc --noEmit && npm test`

Expected: no errors, all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/pd/meetings/ src/lib/pd-meeting/metrics.ts
git commit -m "feat(pd-meeting): autosave, publish with validation, and the reprint snapshot"
```

---

### Task 7: Scores and checklist

**Files:**
- Create: `src/app/api/pd/residents/[residentId]/scores/route.ts`
- Create: `src/app/api/pd/residents/[residentId]/checklist/route.ts`

These hang off the resident, not the meeting, because they accumulate. `POST` a score row,
`DELETE` one by id, `PUT` a checklist item's completed state. All require
`canDirectMeetings` on a `programId` passed in the body or query, and 404 otherwise.
Checklist writes are `upsert` on the `(residentId, programId, itemId)` unique key, and set
`completedAt` when flipping to true, null when flipping to false.

- [ ] **Step 1: Write both routes**
- [ ] **Step 2: Typecheck**: `npx tsc --noEmit`, no errors
- [ ] **Step 3: Commit**: `git commit -m "feat(pd-meeting): longitudinal score rows and curriculum checklist"`

---

### Task 8: The editor, sections

**Files:**
- Create: `src/app/(app)/pd-dashboard/[userId]/meetings/[meetingId]/page.tsx`
- Create: `src/components/pd-meeting/SectionEditor.tsx`

**Interfaces:**
- Consumes: `GET`/`PATCH /api/pd/meetings/[meetingId]`, `SectionView` from carry-forward.
- Produces: `<SectionEditor view={SectionView} onChange={(bullets: PdBullet[]) => void} isGoals={boolean} previousDate={string | null} />`

- [ ] **Step 1: Build the section editor**

Two columns on desktop via `grid-template-columns: 1fr 1fr`. Left is read-only, headed with
the previous meeting's date, each bullet carrying a carry-forward control that calls
`carryBullet` and appends to the right. Right is a list of editable rows with add and remove.

In the goals section, each previous bullet also shows a four-way outcome control (met,
partly, not met, carried). Choosing one writes `outcome` and `carriedFrom` onto a bullet in
the right column, creating it if the PD has not carried that goal across.

Below 900px the two columns stack: the previous bullet becomes a small disclosure above its
editable field rather than a squeezed second column, per spec section 15.

Follow the dashboard's inline-style and CSS-variable idiom (`var(--surface)`, `var(--border)`,
`var(--text)`, `var(--text-2)`, `var(--text-3)`, `var(--primary)`), not Tailwind hex.

- [ ] **Step 2: Build the page with autosave**

Loads the meeting, renders eight `SectionEditor`s, and autosaves on a 2 second debounce and
on blur. A saving indicator shows "Saving", "Saved HH:MM" or "Not saved" so the PD is never
unsure mid-meeting. Nothing blocks typing.

- [ ] **Step 3: Build**: `npm run build`, successful
- [ ] **Step 4: Commit**: `git commit -m "feat(pd-meeting): two-column section editor with carry-forward and goal outcomes"`

---

### Task 9: The editor, scores, checklists and publish

**Files:**
- Create: `src/components/pd-meeting/ScoreTables.tsx`
- Create: `src/components/pd-meeting/ChecklistPanel.tsx`
- Modify: the meeting page from Task 8

- [ ] **Step 1: Score tables**

One table per `config.scoreTables` entry, a date column plus that table's columns, rows from
`scores[tableId]` ascending. Add-row and delete-row. Values are free text so "Away" and
"Post call" survive alongside "60.8", exactly as the paper letter records them.

- [ ] **Step 2: Checklist panel**

One block per `config.checklists` entry with its target-year column and a tick. Outstanding
rows whose `targetYear` has passed relative to `pgyAtMeeting` get a warning highlight, which
is what the yellow on Practice Management means in the July 2025 letter.

- [ ] **Step 3: Publish control**

A publish button that calls the publish endpoint. On `409`, render each problem next to its
section rather than as a generic error, and scroll to the first. On success, mark the record
published and switch the page to read-only with a note that Phase 3 will add the PDF.

- [ ] **Step 4: Build**: `npm run build`, successful
- [ ] **Step 5: Commit**: `git commit -m "feat(pd-meeting): score tables, curriculum checklist, and publish"`

---

### Task 10: Entry points

**Files:**
- Modify: `src/app/(app)/pd-dashboard/[userId]/page.tsx`

- [ ] **Step 1: Add a meetings block to the resident drill-down**

Lists that resident's meetings newest first from `GET /api/pd/meetings?residentId=`, each
showing date, cycle label, status and acknowledgment state, linking to the editor. Above it,
a "Start a meeting" button posting to `POST /api/pd/meetings`, which reopens an existing
draft rather than creating a second one.

- [ ] **Step 2: Build and run everything**

Run: `npm test && npx tsc --noEmit && npm run build`

Expected: all tests pass, no type errors, successful build.

- [ ] **Step 3: Commit**: `git commit -m "feat(pd-dashboard): meetings list and start-a-meeting on the resident page"`

---

## Done when

- A director can start a meeting for a resident on their roster, and reopening never
  creates a second draft.
- The previous published meeting shows on the left with its date; a first meeting shows an
  empty left column and no carry-forward controls.
- Carrying a bullet across takes one tap and records `carriedFrom`.
- Publishing is refused, with the problem shown against the goals section, until every
  previous goal has an outcome.
- Score rows and checklist ticks persist on the resident and appear in the next meeting.
- A published meeting is read-only, and correcting it clears any acknowledgment.
- `npm test`, `npx tsc --noEmit` and `npm run build` are clean.

## What comes next

Phase 3: the letter-format PDF via `pdfkit`, email and in-app delivery, the resident's
acknowledgment, `/profile/meetings`, and the whole-file export. The snapshot written at
publish is what it renders from, so Phase 3 needs no new data model.
