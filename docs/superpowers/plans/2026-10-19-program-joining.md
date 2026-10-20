# Program Joining Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a resident attach to a training program at sign-up and let a program director approve them or invite them directly, so a PD's roster fills itself instead of being assembled by hand.

**Architecture:** One `ProgramJoinRequest` table carries both directions of the handshake, distinguished by whether `invitedById` is set. All transition rules live in a pure state machine in `src/lib/program-join/state.ts` that is unit tested without a database; the API routes are thin wrappers that load a row, ask the state machine, and write the result. UI is three surfaces: an onboarding picker, a PD pending queue, and a resident status card.

**Tech Stack:** Next.js 16 (App Router), React, Prisma 5.10 against Supabase Postgres, Supabase Auth via `requireAuth()`, Tailwind, Vitest 2.1 (added by Task 1).

## Scope

This plan implements the joining slice of the design spec:
`docs/superpowers/specs/2026-10-19-pd-program-dashboard-and-meeting-record-design.md`,
sections 5.1 through 5.6, which is spec Phase 0 (joining parts only) plus all of
Phase 1.

Deliberately **not** in this plan, each getting its own plan once this one lands:

- `PdMeeting`, `ResidentScoreEntry`, `ResidentChecklistItem`, `ProgramMeetingConfig`
  and the meeting editor (spec sections 6 through 9, Phase 2).
- PDF render, delivery and acknowledgment (spec section 10, Phase 3).
- Dashboard polish, due dates and digest lines (spec sections 8 and 12, Phase 4).

One exception is pulled forward from Phase 0 because it is cheap and it is the single
most security-relevant line in the whole design: `roleCanReadPdMeetings()` and its
test, in Task 4. Writing the access predicate before any meeting data exists means the
meeting work starts against a gate that is already proven.

When this plan is done, a resident can join University of Manitoba Urology from the
sign-up flow and Dr. Nayak can approve them, or he can find them and invite them. That
is working, shippable software on its own.

## Global Constraints

- Node package manager is `npm`. Lockfile is `package-lock.json`.
- Prisma 5.10.2. Schema at `prisma/schema.prisma`. Migrations are real SQL files under
  `prisma/migrations/<UTC timestamp>_<snake_name>/migration.sql`. Do not use
  `prisma db push` for anything in this plan.
- Every new table gets RLS enabled plus policies, matching
  `prisma/migrations/20260508020000_custom_forms/migration.sql`. Prisma connects as a
  BYPASSRLS superuser so policies are defence in depth against a leaked anon key, not
  the app's own authorisation. App authorisation lives in `src/lib/program-auth.ts`.
- Auth in API routes is always `const { user, error } = await requireAuth(); if (error) return error;`
  from `@/lib/api-auth`. `user.id` is both the Supabase user id and the Prisma
  `User.id`; no mapping is needed.
- Route handler params are a Promise in Next 16: `{ params }: { params: Promise<{ id: string }> }`,
  then `const { id } = await params;`.
- Import alias `@/` resolves to `src/`.
- Prose, comments and UI copy use no em dashes and no en dashes.
- Hide existence rather than denying it: a caller with no business seeing a join
  request gets 404, never 403. The one exception is creating a program, which already
  returns 403 and stays as it is.

---

### Task 1: Vitest harness

There is no test runner in this app today. Every later task is test first, so this
comes first. Match `apps/hippo-handover`, which already runs Vitest 2.1 in this suite,
so anyone moving between the two apps finds the same setup.

**Files:**
- Create: `vitest.config.ts`
- Create: `tests/harness.test.ts`
- Modify: `package.json` (scripts, devDependencies)

**Interfaces:**
- Consumes: nothing.
- Produces: `npm test` runs `vitest run` over `tests/**/*.test.ts` with `@` aliased to `src`.

- [ ] **Step 1: Write the failing test**

Create `tests/harness.test.ts`:

```ts
import { describe, expect, it } from "vitest";

describe("test harness", () => {
  it("runs and resolves the @ alias to src", async () => {
    const mod = await import("@/lib/program-auth");
    expect(typeof mod.roleCanManageProgram).toBe("function");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test`

Expected: FAIL. npm reports `Missing script: "test"`, because no test script exists yet.

- [ ] **Step 3: Install Vitest**

Run: `npm install --save-dev vitest@^2.1.4`

- [ ] **Step 4: Add the config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: { include: ["tests/**/*.test.ts"] },
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
});
```

- [ ] **Step 5: Add the scripts**

In `package.json`, inside `"scripts"`, after the `"lint"` line, add:

```json
    "test": "vitest run",
    "test:watch": "vitest",
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npm test`

Expected: PASS, 1 test in `tests/harness.test.ts`.

- [ ] **Step 7: Commit**

```bash
git add vitest.config.ts tests/harness.test.ts package.json package-lock.json
git commit -m "test: add vitest harness, matching hippo-handover"
```

---

### Task 2: Join-request state machine

The rules for who may do what to a join request are the whole feature. Putting them in
pure functions means they are tested without a database and the four API routes stay
thin enough to read in one screen.

**Files:**
- Create: `src/lib/program-join/state.ts`
- Create: `tests/program-join-state.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type JoinRequestStatus = "PENDING" | "APPROVED" | "DECLINED" | "WITHDRAWN"`
  - `type JoinActor = "director" | "subject"`
  - `type JoinAction = "approve" | "decline" | "withdraw" | "accept"`
  - `interface JoinRequestLike { status: JoinRequestStatus; invitedById: string | null }`
  - `type JoinDecision = { ok: true; nextStatus: JoinRequestStatus } | { ok: false; reason: string }`
    (a discriminated union, so `if (!decision.ok) return ...` narrows `nextStatus`
    to a defined `JoinRequestStatus` for the caller)
  - `function decideJoinAction(req: JoinRequestLike, actor: JoinActor, action: JoinAction): JoinDecision`
  - `function canCreateJoinRequest(existing: JoinRequestLike | null): JoinDecision`

- [ ] **Step 1: Write the failing test**

Create `tests/program-join-state.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  canCreateJoinRequest,
  decideJoinAction,
  type JoinRequestLike,
} from "@/lib/program-join/state";

const asked: JoinRequestLike = { status: "PENDING", invitedById: null };
const invited: JoinRequestLike = { status: "PENDING", invitedById: "pd-1" };

describe("decideJoinAction, resident asked to join", () => {
  it("lets the director approve", () => {
    expect(decideJoinAction(asked, "director", "approve")).toEqual({
      ok: true,
      nextStatus: "APPROVED",
    });
  });

  it("lets the director decline", () => {
    expect(decideJoinAction(asked, "director", "decline")).toEqual({
      ok: true,
      nextStatus: "DECLINED",
    });
  });

  it("lets the subject withdraw their own request", () => {
    expect(decideJoinAction(asked, "subject", "withdraw")).toEqual({
      ok: true,
      nextStatus: "WITHDRAWN",
    });
  });

  it("refuses to let the subject accept their own request", () => {
    const d = decideJoinAction(asked, "subject", "accept");
    expect(d.ok).toBe(false);
    expect(d.reason).toMatch(/not an invitation/i);
  });

  it("refuses to let the subject approve themselves", () => {
    expect(decideJoinAction(asked, "subject", "approve").ok).toBe(false);
  });
});

describe("decideJoinAction, director invited the resident", () => {
  it("lets the subject accept", () => {
    expect(decideJoinAction(invited, "subject", "accept")).toEqual({
      ok: true,
      nextStatus: "APPROVED",
    });
  });

  it("lets the subject decline", () => {
    expect(decideJoinAction(invited, "subject", "decline")).toEqual({
      ok: true,
      nextStatus: "DECLINED",
    });
  });

  it("lets the director withdraw the invitation", () => {
    expect(decideJoinAction(invited, "director", "withdraw")).toEqual({
      ok: true,
      nextStatus: "WITHDRAWN",
    });
  });

  it("refuses to let the director approve their own invitation", () => {
    const d = decideJoinAction(invited, "director", "approve");
    expect(d.ok).toBe(false);
    expect(d.reason).toMatch(/resident/i);
  });
});

describe("decideJoinAction, already settled", () => {
  for (const status of ["APPROVED", "DECLINED", "WITHDRAWN"] as const) {
    it(`refuses every action on a ${status} request`, () => {
      const req: JoinRequestLike = { status, invitedById: null };
      for (const action of ["approve", "decline", "withdraw", "accept"] as const) {
        expect(decideJoinAction(req, "director", action).ok).toBe(false);
        expect(decideJoinAction(req, "subject", action).ok).toBe(false);
      }
    });
  }
});

describe("canCreateJoinRequest", () => {
  it("allows a first request", () => {
    expect(canCreateJoinRequest(null)).toEqual({ ok: true, nextStatus: "PENDING" });
  });

  it("allows a retry after a decline", () => {
    expect(
      canCreateJoinRequest({ status: "DECLINED", invitedById: null }),
    ).toEqual({ ok: true, nextStatus: "PENDING" });
  });

  it("allows a retry after a withdrawal", () => {
    expect(
      canCreateJoinRequest({ status: "WITHDRAWN", invitedById: null }),
    ).toEqual({ ok: true, nextStatus: "PENDING" });
  });

  it("refuses a duplicate while one is pending", () => {
    const d = canCreateJoinRequest(asked);
    expect(d.ok).toBe(false);
    expect(d.reason).toMatch(/already/i);
  });

  it("refuses when the user is already approved", () => {
    const d = canCreateJoinRequest({ status: "APPROVED", invitedById: null });
    expect(d.ok).toBe(false);
    expect(d.reason).toMatch(/already/i);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- program-join-state`

Expected: FAIL with `Failed to resolve import "@/lib/program-join/state"`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/program-join/state.ts`:

```ts
// ---------------------------------------------------------------------------
// Join-request state machine.
//
// One table carries both directions of the handshake:
//
//   invitedById == null  the resident asked to join. The director
//                        approves or declines; the resident may withdraw.
//   invitedById != null  the director invited the resident. The resident
//                        accepts or declines; the director may withdraw.
//
// Keeping the rules here, as pure functions over a plain object, means
// they are tested without a database and the route handlers stay thin.
// Routes load the row, call decideJoinAction(), and write nextStatus.
// ---------------------------------------------------------------------------

export type JoinRequestStatus = "PENDING" | "APPROVED" | "DECLINED" | "WITHDRAWN";

/** Who is trying to act. Resolved by the route from the session. */
export type JoinActor = "director" | "subject";

export type JoinAction = "approve" | "decline" | "withdraw" | "accept";

/** The subset of ProgramJoinRequest the rules actually depend on. */
export interface JoinRequestLike {
  status: JoinRequestStatus;
  invitedById: string | null;
}

/**
 * A discriminated union rather than one object with optional fields,
 * so that a caller writing
 *
 *   if (!decision.ok) return NextResponse.json({ error: decision.reason });
 *   await db.x.update({ data: { status: decision.nextStatus } });
 *
 * gets a defined JoinRequestStatus on the second line. With optional
 * fields TypeScript cannot narrow one from the other and that update
 * fails to compile.
 */
export type JoinDecision =
  | { ok: true; nextStatus: JoinRequestStatus; reason?: undefined }
  | { ok: false; nextStatus?: undefined; reason: string };

const deny = (reason: string): JoinDecision => ({ ok: false, reason });
const allow = (nextStatus: JoinRequestStatus): JoinDecision => ({
  ok: true,
  nextStatus,
});

/**
 * True when the request was opened by the director inviting someone,
 * rather than by the resident asking to join.
 */
function isInvitation(req: JoinRequestLike): boolean {
  return req.invitedById !== null;
}

export function decideJoinAction(
  req: JoinRequestLike,
  actor: JoinActor,
  action: JoinAction,
): JoinDecision {
  if (req.status !== "PENDING") {
    return deny(`This request is already ${req.status.toLowerCase()}.`);
  }

  if (isInvitation(req)) {
    // The director asked. Only the resident can settle it.
    if (actor === "subject") {
      if (action === "accept") return allow("APPROVED");
      if (action === "decline") return allow("DECLINED");
      return deny("Accept or decline this invitation.");
    }
    if (action === "withdraw") return allow("WITHDRAWN");
    return deny("Only the resident can accept or decline an invitation.");
  }

  // The resident asked. Only the director can settle it.
  if (actor === "director") {
    if (action === "approve") return allow("APPROVED");
    if (action === "decline") return allow("DECLINED");
    return deny("Approve or decline this request.");
  }
  if (action === "withdraw") return allow("WITHDRAWN");
  return deny("This is a request, not an invitation. The director decides it.");
}

/**
 * Whether a new request may be opened, given whatever row already exists
 * for this (program, user) pair. A settled row is reused rather than
 * duplicated, because (programId, userId) is unique.
 */
export function canCreateJoinRequest(
  existing: JoinRequestLike | null,
): JoinDecision {
  if (!existing) return allow("PENDING");
  if (existing.status === "PENDING") {
    return deny("There is already a pending request for this program.");
  }
  if (existing.status === "APPROVED") {
    return deny("You are already a member of this program.");
  }
  // DECLINED or WITHDRAWN. Let them try again.
  return allow("PENDING");
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- program-join-state`

Expected: PASS, 17 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/program-join/state.ts tests/program-join-state.test.ts
git commit -m "feat(programs): join-request state machine with full transition tests"
```

---

### Task 3: Schema and migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20261019120000_program_join_requests/migration.sql`

**Interfaces:**
- Consumes: nothing.
- Produces: Prisma model `ProgramJoinRequest`, enum `JoinRequestStatus`, enum value
  `ProgramMemberRole.RESIDENT`, and columns `Program.discoverable` and
  `Program.meetingIntervalMonths`.

- [ ] **Step 1: Add the enum and model to the schema**

In `prisma/schema.prisma`, add `RESIDENT` as the final value of `enum ProgramMemberRole`:

```prisma
  RESIDENT      // A trainee on the roster. Sees their own record only.
                // Distinct from legacy MEMBER, which this file documents
                // as an alias for FACULTY, and which would therefore file
                // a resident under a supervising-attending role.
```

Add a new enum next to it:

```prisma
enum JoinRequestStatus {
  PENDING
  APPROVED
  DECLINED
  WITHDRAWN
}
```

Add the model after `model ProgramInvite`:

```prisma
model ProgramJoinRequest {
  id           String            @id @default(cuid())
  programId    String
  program      Program           @relation(fields: [programId], references: [id], onDelete: Cascade)
  userId       String
  user         User              @relation("ProgramJoinRequests", fields: [userId], references: [id], onDelete: Cascade)
  status       JoinRequestStatus @default(PENDING)

  // What the resident told us at sign-up, shown to the director so they
  // can recognise the person before approving. Never authoritative.
  claimedPgy   Int?
  message      String?

  // Set when the director invited this user rather than the user asking
  // to join. Flips the handshake: the resident accepts instead of the
  // director approving. See src/lib/program-join/state.ts.
  invitedById  String?
  invitedBy    User?             @relation("ProgramJoinInvitesSent", fields: [invitedById], references: [id], onDelete: SetNull)

  decidedById   String?
  decidedBy     User?            @relation("ProgramJoinDecisions", fields: [decidedById], references: [id], onDelete: SetNull)
  decidedAt     DateTime?
  declineReason String?

  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt

  @@unique([programId, userId])
  @@index([programId, status])
  @@index([userId, status])
  @@map("program_join_requests")
}
```

Add two columns to `model Program`, after `description`:

```prisma
  // Appears in the onboarding program search. False runs the program
  // invite-only.
  discoverable          Boolean  @default(true)
  // Drives the next-meeting-due date on the PD dashboard. Semi-annual
  // by default, matching the University of Manitoba Urology cycle.
  meetingIntervalMonths Int      @default(6)
```

Add the back-relations. On `model Program`:

```prisma
  joinRequests ProgramJoinRequest[]
```

On `model User`, beside the other program relations:

```prisma
  programJoinRequests    ProgramJoinRequest[] @relation("ProgramJoinRequests")
  programJoinInvitesSent ProgramJoinRequest[] @relation("ProgramJoinInvitesSent")
  programJoinDecisions   ProgramJoinRequest[] @relation("ProgramJoinDecisions")
```

- [ ] **Step 2: Validate the schema**

Run: `npx prisma validate`

Expected: `The schema at prisma/schema.prisma is valid`.

If it reports a missing opposite relation, the back-relations on `User` or `Program`
were not added. Add the missing side and run again.

- [ ] **Step 3: Write the migration**

Create `prisma/migrations/20261019120000_program_join_requests/migration.sql`:

```sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Program join requests.
--
-- One table for both directions of the handshake. invitedById null means
-- the resident asked to join; invitedById set means the director invited
-- them. Transition rules live in src/lib/program-join/state.ts.
-- ─────────────────────────────────────────────────────────────────────────────

-- New member role. Additive: every existing row stays valid. Note that a
-- value added to an enum cannot be USED in the same transaction that adds
-- it, which is fine here because nothing below references it.
ALTER TYPE "ProgramMemberRole" ADD VALUE IF NOT EXISTS 'RESIDENT';

CREATE TYPE "JoinRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED', 'WITHDRAWN');

ALTER TABLE "programs"
  ADD COLUMN "discoverable" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "meetingIntervalMonths" INTEGER NOT NULL DEFAULT 6;

CREATE TABLE "program_join_requests" (
  "id"            TEXT NOT NULL,
  "programId"     TEXT NOT NULL,
  "userId"        TEXT NOT NULL,
  "status"        "JoinRequestStatus" NOT NULL DEFAULT 'PENDING',
  "claimedPgy"    INTEGER,
  "message"       TEXT,
  "invitedById"   TEXT,
  "decidedById"   TEXT,
  "decidedAt"     TIMESTAMP(3),
  "declineReason" TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL,
  CONSTRAINT "program_join_requests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "program_join_requests_programId_userId_key"
  ON "program_join_requests"("programId", "userId");
CREATE INDEX "program_join_requests_programId_status_idx"
  ON "program_join_requests"("programId", "status");
CREATE INDEX "program_join_requests_userId_status_idx"
  ON "program_join_requests"("userId", "status");

ALTER TABLE "program_join_requests"
  ADD CONSTRAINT "program_join_requests_programId_fkey"
  FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "program_join_requests"
  ADD CONSTRAINT "program_join_requests_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "program_join_requests"
  ADD CONSTRAINT "program_join_requests_invitedById_fkey"
  FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "program_join_requests"
  ADD CONSTRAINT "program_join_requests_decidedById_fkey"
  FOREIGN KEY ("decidedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── RLS ──────────────────────────────────────────────────────────────────────
-- Same posture as 20260508020000_custom_forms. Prisma connects as a
-- BYPASSRLS superuser, so this protects only against a leaked anon key
-- reaching PostgREST. The app's real authorisation is program-auth.ts.
ALTER TABLE "program_join_requests" ENABLE ROW LEVEL SECURITY;

-- The subject sees their own requests. Members of the program see the
-- program's requests.
CREATE POLICY "program_join_requests_self_or_program" ON "program_join_requests" FOR SELECT
  USING (
    "userId" = current_setting('request.jwt.claims', true)::json->>'sub'
    OR "programId" IN (
      SELECT "programId" FROM "program_members"
      WHERE "userId" = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );
```

- [ ] **Step 4: Check the migration matches the schema**

Run:

```bash
npx prisma migrate diff \
  --from-migrations prisma/migrations \
  --to-schema-datamodel prisma/schema.prisma \
  --shadow-database-url "$SHADOW_DATABASE_URL" \
  --exit-code
```

Expected: exit code 0 and `No difference detected`.

Exit code 2 means the hand-written SQL and the schema disagree; read the printed diff
and correct the SQL, not the schema. If `SHADOW_DATABASE_URL` is not set, ask Karim
for a scratch Postgres URL rather than pointing it at production.

- [ ] **Step 5: Apply and regenerate**

Run: `npx prisma migrate deploy && npx prisma generate`

Expected: `1 migration found` and `Applied`, then a successful client generation.

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20261019120000_program_join_requests/
git commit -m "feat(programs): ProgramJoinRequest model, RESIDENT role, program discoverability"
```

---

### Task 4: Access predicates

Two changes to `src/lib/program-auth.ts`. The new `RESIDENT` role must be inert in
every existing capability bucket, and PD meeting records get their own predicate,
narrower than `roleCanReadAllResidents()`, before any meeting data exists.

**Files:**
- Modify: `src/lib/program-auth.ts`
- Create: `tests/program-auth.test.ts`

**Interfaces:**
- Consumes: `ProgramMemberRole` from `@prisma/client`.
- Produces: `function roleCanReadPdMeetings(role: ProgramMemberRole): boolean`.
  Existing exports keep their signatures.

- [ ] **Step 1: Write the failing test**

Create `tests/program-auth.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  roleCanFinaliseCC,
  roleCanManageProgram,
  roleCanReadAllResidents,
  roleCanReadPdMeetings,
  roleSeesPhi,
} from "@/lib/program-auth";
import type { ProgramMemberRole } from "@prisma/client";

const ALL: ProgramMemberRole[] = [
  "OWNER",
  "MEMBER",
  "PD",
  "CHAIR",
  "CC_MEMBER",
  "FACULTY",
  "COORDINATOR",
  "DEPT_HEAD",
  "RESIDENT",
];

describe("roleCanReadPdMeetings", () => {
  it("admits only the director roles", () => {
    expect(ALL.filter(roleCanReadPdMeetings)).toEqual(["OWNER", "PD"]);
  });

  it("excludes every role that can read the roster but is not the director", () => {
    // Roster access must not imply access to someone's 1:1 record.
    for (const role of ["CHAIR", "CC_MEMBER", "DEPT_HEAD", "COORDINATOR"] as const) {
      expect(roleCanReadAllResidents(role)).toBe(true);
      expect(roleCanReadPdMeetings(role)).toBe(false);
    }
  });

  it("is never wider than roleCanReadAllResidents", () => {
    for (const role of ALL) {
      if (roleCanReadPdMeetings(role)) {
        expect(roleCanReadAllResidents(role)).toBe(true);
      }
    }
  });
});

describe("the RESIDENT role is inert", () => {
  it("grants no program-wide capability", () => {
    expect(roleCanManageProgram("RESIDENT")).toBe(false);
    expect(roleCanReadAllResidents("RESIDENT")).toBe(false);
    expect(roleCanFinaliseCC("RESIDENT")).toBe(false);
    expect(roleCanReadPdMeetings("RESIDENT")).toBe(false);
  });

  it("still sees case content, because a resident sees their own", () => {
    expect(roleSeesPhi("RESIDENT")).toBe(true);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- program-auth`

Expected: FAIL. `roleCanReadPdMeetings is not a function`.

- [ ] **Step 3: Add the predicate**

In `src/lib/program-auth.ts`, after the `FINALISES_CC` and `PHI_BLIND` declarations,
add:

```ts
// PD 1:1 meeting records are a private conversation between the director
// and one resident, so they get a bucket of their own. Deliberately
// narrower than READ_ALL: a CC member or coordinator holding roster
// access must NOT thereby see someone's 1:1 record. Keep this list at
// two entries unless a programme explicitly asks otherwise.
const READS_PD_MEETINGS: ProgramMemberRole[] = ['OWNER', 'PD'];
```

Then, after `roleCanFinaliseCC`, add:

```ts
export function roleCanReadPdMeetings(role: ProgramMemberRole): boolean {
  return READS_PD_MEETINGS.includes(role);
}
```

- [ ] **Step 4: Confirm RESIDENT needs no further change**

`RESIDENT` is absent from `PD_LIKE`, `READ_ALL`, `FINALISES_CC` and
`READS_PD_MEETINGS`, so the first four predicates already return false for it.
`roleSeesPhi` returns `!PHI_BLIND.includes(role)`, and `PHI_BLIND` is
`['COORDINATOR']`, so it already returns true. No edit is needed. The test in Step 1
is what proves this and stops a later edit from quietly changing it.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test`

Expected: PASS, all three test files.

- [ ] **Step 6: Commit**

```bash
git add src/lib/program-auth.ts tests/program-auth.test.ts
git commit -m "feat(programs): roleCanReadPdMeetings predicate, RESIDENT role coverage"
```

---

### Task 5: Program discovery endpoint

The onboarding picker needs a search that is readable by a signed-in user who is not
yet in any program. This is the only program query in the app that is not scoped to
membership, so it returns the minimum needed to recognise a program and nothing else.

**Files:**
- Create: `src/app/api/programs/discover/route.ts`
- Create: `tests/program-discover.test.ts`
- Create: `src/lib/program-join/discover.ts`

**Interfaces:**
- Consumes: `canCreateJoinRequest` is not used here. `db` from `@/lib/db`,
  `requireAuth` from `@/lib/api-auth`.
- Produces:
  - `function normaliseDiscoverQuery(raw: string | null): string | null` in `src/lib/program-join/discover.ts`
  - `GET /api/programs/discover?q=` returning
    `{ programs: Array<{ id, name, institution, specialty, memberCount, myStatus }> }`
    where `myStatus` is `null | "PENDING" | "APPROVED" | "DECLINED" | "WITHDRAWN" | "MEMBER"`.

- [ ] **Step 1: Write the failing test**

Create `tests/program-discover.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { normaliseDiscoverQuery } from "@/lib/program-join/discover";

describe("normaliseDiscoverQuery", () => {
  it("returns null for a missing query", () => {
    expect(normaliseDiscoverQuery(null)).toBeNull();
  });

  it("returns null for whitespace", () => {
    expect(normaliseDiscoverQuery("   ")).toBeNull();
  });

  it("returns null below two characters, to keep the search bounded", () => {
    expect(normaliseDiscoverQuery("m")).toBeNull();
  });

  it("trims and keeps a usable query", () => {
    expect(normaliseDiscoverQuery("  Manitoba ")).toBe("Manitoba");
  });

  it("caps an absurdly long query rather than passing it to the database", () => {
    expect(normaliseDiscoverQuery("x".repeat(500))).toHaveLength(100);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- program-discover`

Expected: FAIL with `Failed to resolve import "@/lib/program-join/discover"`.

- [ ] **Step 3: Write the helper**

Create `src/lib/program-join/discover.ts`:

```ts
/** Longest query we will send to the database. */
const MAX_QUERY = 100;
/** Shortest query worth running, to keep the result set bounded. */
const MIN_QUERY = 2;

/**
 * Normalise the ?q= parameter for program discovery. Returns null when
 * the caller has not typed enough to run a useful search, which the
 * route turns into an empty result rather than a scan of every program.
 */
export function normaliseDiscoverQuery(raw: string | null): string | null {
  const q = (raw ?? '').trim();
  if (q.length < MIN_QUERY) return null;
  return q.slice(0, MAX_QUERY);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- program-discover`

Expected: PASS, 5 tests.

- [ ] **Step 5: Write the route**

Create `src/app/api/programs/discover/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { normaliseDiscoverQuery } from '@/lib/program-join/discover';

/**
 * GET /api/programs/discover?q=...
 *
 * Search discoverable programs so a resident can attach to one during
 * onboarding. This is the only program query in the app that is not
 * scoped to membership, so it is deliberately thin: name, institution,
 * specialty, member count, and the caller's own status with it. No
 * roster, no member names, no counts that could identify anyone.
 */
export async function GET(req: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const q = normaliseDiscoverQuery(new URL(req.url).searchParams.get('q'));
  if (!q) return NextResponse.json({ programs: [] });

  const programs = await db.program.findMany({
    where: {
      discoverable: true,
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { institution: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      name: true,
      institution: true,
      specialty: true,
      _count: { select: { members: true } },
      members: { where: { userId: user.id }, select: { id: true }, take: 1 },
      joinRequests: {
        where: { userId: user.id },
        select: { status: true },
        take: 1,
      },
    },
    orderBy: { name: 'asc' },
    take: 20,
  });

  return NextResponse.json({
    programs: programs.map((p) => ({
      id: p.id,
      name: p.name,
      institution: p.institution,
      specialty: p.specialty,
      memberCount: p._count.members,
      myStatus: p.members.length
        ? ('MEMBER' as const)
        : (p.joinRequests[0]?.status ?? null),
    })),
  });
}
```

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`

Expected: no errors. If `joinRequests` is unknown on `program`, `npx prisma generate`
was not run after Task 3.

- [ ] **Step 7: Commit**

```bash
git add src/lib/program-join/discover.ts src/app/api/programs/discover/route.ts tests/program-discover.test.ts
git commit -m "feat(programs): discoverable-program search for onboarding"
```

---

### Task 6: Resident requests to join

**Files:**
- Create: `src/app/api/programs/[id]/join-requests/route.ts`

**Interfaces:**
- Consumes: `canCreateJoinRequest` from `@/lib/program-join/state`.
- Produces: `POST /api/programs/[id]/join-requests` with body
  `{ claimedPgy?: number; message?: string }`, returning `{ request: { id, status } }`
  or `{ error }` with status 400, 404 or 409.

- [ ] **Step 1: Write the route**

Create `src/app/api/programs/[id]/join-requests/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { canCreateJoinRequest } from '@/lib/program-join/state';

/**
 * POST /api/programs/[id]/join-requests
 *
 * A resident asks to join a program. Creates a PENDING request with
 * invitedById null, which is what tells the state machine the director
 * is the one who decides it.
 *
 * A previously declined or withdrawn row is reused rather than
 * duplicated, because (programId, userId) is unique.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { id: programId } = await params;

  const program = await db.program.findFirst({
    where: { id: programId, discoverable: true },
    select: { id: true },
  });
  // 404 rather than 403: do not confirm that a hidden program exists.
  if (!program) {
    return NextResponse.json({ error: 'Program not found.' }, { status: 404 });
  }

  const alreadyMember = await db.programMember.findUnique({
    where: { programId_userId: { programId, userId: user.id } },
    select: { id: true },
  });
  if (alreadyMember) {
    return NextResponse.json(
      { error: 'You are already a member of this program.' },
      { status: 409 },
    );
  }

  let body: { claimedPgy?: unknown; message?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    // An empty body is fine. Both fields are optional.
  }

  const claimedPgy =
    typeof body.claimedPgy === 'number' &&
    Number.isInteger(body.claimedPgy) &&
    body.claimedPgy >= 1 &&
    body.claimedPgy <= 10
      ? body.claimedPgy
      : null;
  const message =
    typeof body.message === 'string' && body.message.trim()
      ? body.message.trim().slice(0, 500)
      : null;

  const existing = await db.programJoinRequest.findUnique({
    where: { programId_userId: { programId, userId: user.id } },
    select: { status: true, invitedById: true },
  });

  const decision = canCreateJoinRequest(existing);
  if (!decision.ok) {
    return NextResponse.json({ error: decision.reason }, { status: 409 });
  }

  const request = await db.programJoinRequest.upsert({
    where: { programId_userId: { programId, userId: user.id } },
    create: { programId, userId: user.id, claimedPgy, message, status: 'PENDING' },
    update: {
      status: 'PENDING',
      claimedPgy,
      message,
      // Clear the previous outcome so the director sees a fresh request.
      invitedById: null,
      decidedById: null,
      decidedAt: null,
      declineReason: null,
    },
    select: { id: true, status: true },
  });

  return NextResponse.json({ request }, { status: 201 });
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Verify the guards by hand**

With the dev server running (`npm run dev`), signed in as a resident:

```bash
curl -s -X POST localhost:3000/api/programs/<a-discoverable-program-id>/join-requests \
  -H 'content-type: application/json' -d '{"claimedPgy":4}'
```

Expected: `201` and `{"request":{"id":"...","status":"PENDING"}}`.

Run the same command again. Expected: `409` and
`{"error":"There is already a pending request for this program."}`.

- [ ] **Step 4: Commit**

```bash
git add "src/app/api/programs/[id]/join-requests/route.ts"
git commit -m "feat(programs): residents can request to join a discoverable program"
```

---

### Task 7: Director lists and decides

**Files:**
- Modify: `src/app/api/programs/[id]/join-requests/route.ts` (add `GET`)
- Create: `src/app/api/programs/[id]/join-requests/[requestId]/route.ts`

**Interfaces:**
- Consumes: `decideJoinAction` from `@/lib/program-join/state`, `isProgramOwner` from
  `@/lib/program-auth`.
- Produces:
  - `GET /api/programs/[id]/join-requests?status=PENDING` returning
    `{ requests: Array<{ id, status, claimedPgy, message, createdAt, invitedById, user: { id, name, email, image, roleType, trainingYearLabel, institution } }> }`
  - `PATCH /api/programs/[id]/join-requests/[requestId]` with body
    `{ action: "approve" | "decline" | "withdraw" | "accept"; declineReason?: string }`

- [ ] **Step 1: Add the list handler**

Append to `src/app/api/programs/[id]/join-requests/route.ts`:

```ts
/**
 * GET /api/programs/[id]/join-requests?status=PENDING
 *
 * The director's queue. Owner-only, because the list carries the names
 * and emails of people who are not yet members.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { id: programId } = await params;

  if (!(await isProgramOwner(user.id, programId))) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  const statusParam = new URL(req.url).searchParams.get('status');
  const status =
    statusParam === 'APPROVED' ||
    statusParam === 'DECLINED' ||
    statusParam === 'WITHDRAWN' ||
    statusParam === 'PENDING'
      ? statusParam
      : 'PENDING';

  const requests = await db.programJoinRequest.findMany({
    where: { programId, status },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      status: true,
      claimedPgy: true,
      message: true,
      invitedById: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          profile: {
            select: {
              roleType: true,
              trainingYearLabel: true,
              institution: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json({
    requests: requests.map((r) => ({
      id: r.id,
      status: r.status,
      claimedPgy: r.claimedPgy,
      message: r.message,
      invitedById: r.invitedById,
      createdAt: r.createdAt.toISOString(),
      user: {
        id: r.user.id,
        name: r.user.name,
        email: r.user.email,
        image: r.user.image,
        roleType: r.user.profile?.roleType ?? null,
        trainingYearLabel: r.user.profile?.trainingYearLabel ?? null,
        institution: r.user.profile?.institution ?? null,
      },
    })),
  });
}
```

Add `isProgramOwner` to the existing import from `@/lib/program-auth` at the top of the
file. The file currently imports nothing from it, so add the line:

```ts
import { isProgramOwner } from '@/lib/program-auth';
```

- [ ] **Step 2: Write the decide handler**

Create `src/app/api/programs/[id]/join-requests/[requestId]/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { isProgramOwner } from '@/lib/program-auth';
import {
  decideJoinAction,
  type JoinAction,
  type JoinActor,
} from '@/lib/program-join/state';

const ACTIONS: JoinAction[] = ['approve', 'decline', 'withdraw', 'accept'];

/**
 * PATCH /api/programs/[id]/join-requests/[requestId]
 *
 * Settles a request. Who may do what is decided entirely by
 * decideJoinAction(); this handler only resolves which actor the caller
 * is, applies the result, and creates the ProgramMember row on approval.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; requestId: string }> },
) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { id: programId, requestId } = await params;

  let body: { action?: unknown; declineReason?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Expected a JSON body.' }, { status: 400 });
  }

  const action = body.action as JoinAction;
  if (!ACTIONS.includes(action)) {
    return NextResponse.json(
      { error: `action must be one of ${ACTIONS.join(', ')}.` },
      { status: 400 },
    );
  }

  const request = await db.programJoinRequest.findFirst({
    where: { id: requestId, programId },
    select: { id: true, status: true, invitedById: true, userId: true },
  });
  if (!request) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  const isSubject = request.userId === user.id;
  const isDirector = await isProgramOwner(user.id, programId);
  // A caller who is neither must not learn that this request exists.
  if (!isSubject && !isDirector) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }
  // The subject's own claim wins when a director somehow requested to
  // join their own program, so the state machine sees the stricter actor.
  const actor: JoinActor = isSubject ? 'subject' : 'director';

  const decision = decideJoinAction(request, actor, action);
  if (!decision.ok) {
    return NextResponse.json({ error: decision.reason }, { status: 409 });
  }

  const declineReason =
    decision.nextStatus === 'DECLINED' && typeof body.declineReason === 'string'
      ? body.declineReason.trim().slice(0, 500) || null
      : null;

  // Approval has to create the membership and settle the request
  // together, or a crash between them leaves a resident approved with no
  // roster row.
  await db.$transaction(async (tx) => {
    await tx.programJoinRequest.update({
      where: { id: request.id },
      data: {
        status: decision.nextStatus,
        decidedById: user.id,
        decidedAt: new Date(),
        declineReason,
      },
    });

    if (decision.nextStatus === 'APPROVED') {
      await tx.programMember.upsert({
        where: {
          programId_userId: { programId, userId: request.userId },
        },
        create: { programId, userId: request.userId, role: 'RESIDENT' },
        update: {},
      });
    }
  });

  return NextResponse.json({ request: { id: request.id, status: decision.nextStatus } });
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 4: Verify by hand**

Signed in as the program director, with the request id from Task 6:

```bash
curl -s "localhost:3000/api/programs/<programId>/join-requests?status=PENDING"
```

Expected: the pending resident, with `invitedById: null`.

```bash
curl -s -X PATCH localhost:3000/api/programs/<programId>/join-requests/<requestId> \
  -H 'content-type: application/json' -d '{"action":"approve"}'
```

Expected: `{"request":{"id":"...","status":"APPROVED"}}`, and
`GET /api/programs` as that resident now lists the program.

Repeat the PATCH. Expected: `409` and `This request is already approved.`

- [ ] **Step 5: Commit**

```bash
git add "src/app/api/programs/[id]/join-requests/"
git commit -m "feat(programs): director queue and approve/decline for join requests"
```

---

### Task 8: Director invites an existing user

`GET /api/programs/[id]/search-users` already exists and already excludes the caller,
existing members and outstanding `ProgramInvite` rows. Two changes: it must also
exclude people who already have a pending join request, and there must be a way to
send.

**Files:**
- Modify: `src/app/api/programs/[id]/search-users/route.ts`
- Create: `src/app/api/programs/[id]/join-requests/invite/route.ts`

**Interfaces:**
- Consumes: `canCreateJoinRequest` from `@/lib/program-join/state`.
- Produces: `POST /api/programs/[id]/join-requests/invite` with body `{ userId: string }`,
  returning `{ request: { id, status } }`.

- [ ] **Step 1: Exclude pending requests from search**

In `src/app/api/programs/[id]/search-users/route.ts`, extend the existing
`Promise.all` to a third query:

```ts
  const [existingMembers, pendingInvites, pendingRequests] = await Promise.all([
    db.programMember.findMany({
      where: { programId: id },
      select: { userId: true },
    }),
    db.programInvite.findMany({
      where: {
        programId: id,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: { email: true },
    }),
    db.programJoinRequest.findMany({
      where: { programId: id, status: 'PENDING' },
      select: { userId: true },
    }),
  ]);
```

Then, immediately after `excludeUserIds.add(user.id);`, add:

```ts
  for (const r of pendingRequests) excludeUserIds.add(r.userId);
```

- [ ] **Step 2: Write the invite route**

Create `src/app/api/programs/[id]/join-requests/invite/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { isProgramOwner } from '@/lib/program-auth';
import { canCreateJoinRequest } from '@/lib/program-join/state';

/**
 * POST /api/programs/[id]/join-requests/invite
 *
 * The director invites someone who already has a Hippo account. Creates
 * a PENDING request with invitedById set, which flips the handshake:
 * the resident accepts rather than the director approving.
 *
 * ProgramInvite stays the path for people who have no account yet. It is
 * email-and-token based, so using it here would mail a link to someone
 * who is already signed in.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { id: programId } = await params;

  if (!(await isProgramOwner(user.id, programId))) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  let body: { userId?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Expected a JSON body.' }, { status: 400 });
  }
  const targetId = typeof body.userId === 'string' ? body.userId : '';
  if (!targetId) {
    return NextResponse.json({ error: 'userId is required.' }, { status: 400 });
  }
  if (targetId === user.id) {
    return NextResponse.json(
      { error: 'You cannot invite yourself.' },
      { status: 400 },
    );
  }

  const target = await db.user.findUnique({
    where: { id: targetId },
    select: { id: true },
  });
  if (!target) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  const alreadyMember = await db.programMember.findUnique({
    where: { programId_userId: { programId, userId: targetId } },
    select: { id: true },
  });
  if (alreadyMember) {
    return NextResponse.json(
      { error: 'They are already a member of this program.' },
      { status: 409 },
    );
  }

  const existing = await db.programJoinRequest.findUnique({
    where: { programId_userId: { programId, userId: targetId } },
    select: { status: true, invitedById: true },
  });
  const decision = canCreateJoinRequest(existing);
  if (!decision.ok) {
    return NextResponse.json({ error: decision.reason }, { status: 409 });
  }

  const request = await db.programJoinRequest.upsert({
    where: { programId_userId: { programId, userId: targetId } },
    create: {
      programId,
      userId: targetId,
      invitedById: user.id,
      status: 'PENDING',
    },
    update: {
      status: 'PENDING',
      invitedById: user.id,
      decidedById: null,
      decidedAt: null,
      declineReason: null,
    },
    select: { id: true, status: true },
  });

  const program = await db.program.findUnique({
    where: { id: programId },
    select: { name: true },
  });

  await db.notification.create({
    data: {
      userId: targetId,
      type: 'PROGRAM_INVITE',
      title: `Invitation to join ${program?.name ?? 'a program'}`,
      body: 'A program director has invited you to join their program on Hippo.',
      url: '/programs',
    },
  });

  return NextResponse.json({ request }, { status: 201 });
}
```

- [ ] **Step 3: Check the notification type exists**

Run: `grep -n "PROGRAM_INVITE\|model Notification" -A 20 prisma/schema.prisma | head -40`

If `Notification.type` is an enum without `PROGRAM_INVITE`, add that value to the enum
and to the same migration style as Task 3, in a new migration
`20261019130000_notification_program_invite`. If `type` is a plain `String`, no change
is needed.

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 5: Verify by hand**

As the director:

```bash
curl -s "localhost:3000/api/programs/<programId>/search-users?q=sid"
curl -s -X POST localhost:3000/api/programs/<programId>/join-requests/invite \
  -H 'content-type: application/json' -d '{"userId":"<residentUserId>"}'
```

Expected: `201`. Re-running `search-users` no longer returns that resident.

As that resident:

```bash
curl -s -X PATCH localhost:3000/api/programs/<programId>/join-requests/<requestId> \
  -H 'content-type: application/json' -d '{"action":"accept"}'
```

Expected: `{"request":{"id":"...","status":"APPROVED"}}`.

As that resident, against a request they were not invited to, `{"action":"approve"}`
must return `409`, not success.

- [ ] **Step 6: Commit**

```bash
git add "src/app/api/programs/[id]/search-users/route.ts" "src/app/api/programs/[id]/join-requests/invite/route.ts"
git commit -m "feat(programs): director can invite an existing Hippo user in app"
```

---

### Task 9: Onboarding program picker

**Files:**
- Create: `src/components/programs/ProgramPicker.tsx`
- Modify: `src/app/onboarding/page.tsx`

**Interfaces:**
- Consumes: `GET /api/programs/discover`, `POST /api/programs/[id]/join-requests`.
- Produces: `<ProgramPicker value={...} onChange={...} />`, a controlled component
  whose `value` is `{ id: string; name: string } | null`.

- [ ] **Step 1: Write the component**

Create `src/components/programs/ProgramPicker.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';

export interface PickedProgram {
  id: string;
  name: string;
}

interface DiscoveredProgram extends PickedProgram {
  institution: string | null;
  specialty: string | null;
  memberCount: number;
  myStatus: string | null;
}

/**
 * Type-ahead over discoverable programs, used during onboarding so a
 * resident can attach themselves instead of waiting for an invite.
 * Choosing is optional: the caller may submit with value still null.
 */
export function ProgramPicker({
  value,
  onChange,
}: {
  value: PickedProgram | null;
  onChange: (p: PickedProgram | null) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DiscoveredProgram[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (value) return;
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/programs/discover?q=${encodeURIComponent(q)}`,
        );
        const data = await res.json();
        if (!cancelled) setResults(data.programs ?? []);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, value]);

  if (value) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-[#2563eb] bg-[#2563eb]/10 px-4 py-3">
        <div>
          <p className="font-semibold text-[#f1f5f9]">{value.name}</p>
          <p className="text-sm text-[#94a3b8]">
            Your program director will be asked to approve you.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            onChange(null);
            setQuery('');
          }}
          className="text-sm text-[#94a3b8] underline"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by program or institution"
        className="w-full rounded-lg border border-[#334155] bg-[#0f172a] px-4 py-3 text-[#f1f5f9] placeholder:text-[#64748b]"
        aria-label="Search for your program"
      />
      {loading && <p className="text-sm text-[#64748b]">Searching...</p>}
      {!loading && query.trim().length >= 2 && results.length === 0 && (
        <p className="text-sm text-[#64748b]">
          No programs match that. You can skip this and join later from Programs.
        </p>
      )}
      <ul className="space-y-1">
        {results.map((p) => {
          const taken = p.myStatus === 'MEMBER' || p.myStatus === 'PENDING';
          return (
            <li key={p.id}>
              <button
                type="button"
                disabled={taken}
                onClick={() => onChange({ id: p.id, name: p.name })}
                className="w-full rounded-lg border border-[#334155] px-4 py-3 text-left hover:border-[#2563eb] disabled:opacity-50"
              >
                <p className="font-medium text-[#f1f5f9]">{p.name}</p>
                <p className="text-sm text-[#94a3b8]">
                  {[p.institution, p.specialty].filter(Boolean).join(' . ')}
                  {taken ? ` . ${p.myStatus === 'MEMBER' ? 'Already a member' : 'Request pending'}` : ''}
                </p>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
```

- [ ] **Step 2: Wire it into onboarding**

In `src/app/onboarding/page.tsx`:

1. Import the component and its type at the top:

```tsx
import { ProgramPicker, type PickedProgram } from '@/components/programs/ProgramPicker';
```

2. Add state beside the existing form state:

```tsx
const [program, setProgram] = useState<PickedProgram | null>(null);
```

3. Render the picker in the step that follows the role question, inside the same
   wrapper used by the other fields, under a heading of "Your program" and the helper
   line "Optional. You can join later from Programs."

4. In the existing submit handler, after the profile save succeeds and before the
   redirect, post the join request. A failure here must not block onboarding:

```tsx
if (program) {
  try {
    await fetch(`/api/programs/${program.id}/join-requests`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        claimedPgy: typeof form.pgyYear === 'number' ? form.pgyYear : undefined,
      }),
    });
  } catch {
    // Onboarding has already saved. Joining can be retried from Programs.
  }
}
```

- [ ] **Step 3: Build**

Run: `npm run build`

Expected: a successful build.

- [ ] **Step 4: Verify in the browser**

Start `npm run dev`, sign up as a new user, reach the onboarding step, type "Manitoba",
pick the program, and finish. Then as the director, `GET /api/programs/<id>/join-requests?status=PENDING`
must list that user with the `claimedPgy` they entered.

Check it at 390px wide as well. The results list must not overflow horizontally.

- [ ] **Step 5: Commit**

```bash
git add src/components/programs/ProgramPicker.tsx src/app/onboarding/page.tsx
git commit -m "feat(onboarding): optional program picker that opens a join request"
```

---

### Task 10: Director pending queue

**Files:**
- Create: `src/components/programs/JoinRequestQueue.tsx`
- Modify: `src/app/(app)/pd-dashboard/page.tsx`

**Interfaces:**
- Consumes: `GET /api/programs/[id]/join-requests`, `PATCH /api/programs/[id]/join-requests/[requestId]`.
- Produces: `<JoinRequestQueue programId={...} onChanged={...} />`.

- [ ] **Step 1: Write the component**

Create `src/components/programs/JoinRequestQueue.tsx`:

```tsx
'use client';

import { useCallback, useEffect, useState } from 'react';

interface QueuedRequest {
  id: string;
  claimedPgy: number | null;
  message: string | null;
  invitedById: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    roleType: string | null;
    trainingYearLabel: string | null;
    institution: string | null;
  };
}

/**
 * The director's approval queue. Renders nothing at all when empty, so
 * it can sit permanently at the top of the roster without taking space
 * on the common day where there is nothing waiting.
 */
export function JoinRequestQueue({
  programId,
  onChanged,
}: {
  programId: string;
  onChanged?: () => void;
}) {
  const [requests, setRequests] = useState<QueuedRequest[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/programs/${programId}/join-requests?status=PENDING`,
      );
      const data = await res.json();
      setRequests(data.requests ?? []);
    } catch {
      setRequests([]);
    }
  }, [programId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function decide(id: string, action: 'approve' | 'decline') {
    setBusy(id);
    try {
      await fetch(`/api/programs/${programId}/join-requests/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      await load();
      onChanged?.();
    } finally {
      setBusy(null);
    }
  }

  // Only requests the resident opened need a decision from the director.
  // Ones the director sent are waiting on the resident, so they do not
  // belong in an action queue.
  const awaitingMe = requests.filter((r) => r.invitedById === null);
  if (awaitingMe.length === 0) return null;

  return (
    <section className="mb-6 rounded-xl border border-[#f59e0b]/40 bg-[#f59e0b]/5 p-4">
      <h2 className="mb-3 font-semibold text-[#f1f5f9]">
        {awaitingMe.length} waiting to join
      </h2>
      <ul className="space-y-2">
        {awaitingMe.map((r) => (
          <li
            key={r.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[#0f172a] px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-[#f1f5f9]">
                {r.user.name ?? r.user.email}
              </p>
              <p className="truncate text-sm text-[#94a3b8]">
                {[
                  r.claimedPgy ? `PGY-${r.claimedPgy}` : r.user.trainingYearLabel,
                  r.user.institution,
                  r.user.email,
                ]
                  .filter(Boolean)
                  .join(' . ')}
              </p>
              {r.message && (
                <p className="mt-1 text-sm italic text-[#94a3b8]">{r.message}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy === r.id}
                onClick={() => decide(r.id, 'decline')}
                className="rounded-lg border border-[#334155] px-3 py-2 text-sm text-[#94a3b8] disabled:opacity-50"
              >
                Decline
              </button>
              <button
                type="button"
                disabled={busy === r.id}
                onClick={() => decide(r.id, 'approve')}
                className="rounded-lg bg-[#2563eb] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                Approve
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 2: Mount it on the dashboard**

In `src/app/(app)/pd-dashboard/page.tsx`, import the component and render it directly
above the roster, inside the same container, passing the program id the page already
resolves and an `onChanged` that re-runs the page's existing resident fetch so an
approved resident appears without a reload.

- [ ] **Step 3: Build**

Run: `npm run build`

Expected: a successful build.

- [ ] **Step 4: Verify in the browser**

As the director with one pending request: the banner reads "1 waiting to join".
Approve it. The banner disappears and the resident appears in the roster. A request
the director sent (Task 8) must not appear in this queue, because it is waiting on the
resident, not on them.

- [ ] **Step 5: Commit**

```bash
git add src/components/programs/JoinRequestQueue.tsx "src/app/(app)/pd-dashboard/page.tsx"
git commit -m "feat(pd-dashboard): pending join-request queue above the roster"
```

---

### Task 11: Resident status card

The last gap: a resident who requested a program, or who was invited to one, has
nowhere to see it.

**Files:**
- Create: `src/app/api/programs/my-requests/route.ts`
- Create: `src/components/programs/MyProgramStatus.tsx`
- Modify: `src/app/(app)/dashboard/page.tsx`

**Interfaces:**
- Consumes: `decideJoinAction` indirectly through the PATCH route from Task 7.
- Produces: `GET /api/programs/my-requests` returning
  `{ requests: Array<{ id, programId, programName, status, invited: boolean }> }`,
  and `<MyProgramStatus />`.

- [ ] **Step 1: Write the route**

Create `src/app/api/programs/my-requests/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';

/**
 * GET /api/programs/my-requests
 *
 * The caller's own outstanding join requests and invitations. Scoped to
 * the caller by construction, so there is no role check.
 */
export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const requests = await db.programJoinRequest.findMany({
    where: { userId: user.id, status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      status: true,
      invitedById: true,
      program: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({
    requests: requests.map((r) => ({
      id: r.id,
      programId: r.program.id,
      programName: r.program.name,
      status: r.status,
      invited: r.invitedById !== null,
    })),
  });
}
```

- [ ] **Step 2: Write the component**

Create `src/components/programs/MyProgramStatus.tsx`:

```tsx
'use client';

import { useCallback, useEffect, useState } from 'react';

interface MyRequest {
  id: string;
  programId: string;
  programName: string;
  invited: boolean;
}

/**
 * Shows the resident where their program request stands. Two shapes:
 * a request they opened is simply waiting, while an invitation they
 * received needs an answer.
 */
export function MyProgramStatus() {
  const [requests, setRequests] = useState<MyRequest[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/programs/my-requests');
      const data = await res.json();
      setRequests(data.requests ?? []);
    } catch {
      setRequests([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function respond(r: MyRequest, action: 'accept' | 'decline' | 'withdraw') {
    setBusy(r.id);
    try {
      await fetch(`/api/programs/${r.programId}/join-requests/${r.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      await load();
    } finally {
      setBusy(null);
    }
  }

  if (requests.length === 0) return null;

  return (
    <div className="mb-6 space-y-2">
      {requests.map((r) => (
        <div
          key={r.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#334155] bg-[#0f172a] px-4 py-3"
        >
          <div className="min-w-0">
            <p className="truncate font-medium text-[#f1f5f9]">{r.programName}</p>
            <p className="text-sm text-[#94a3b8]">
              {r.invited
                ? 'You have been invited to join this program.'
                : 'Waiting for the program director to approve you.'}
            </p>
          </div>
          <div className="flex gap-2">
            {r.invited ? (
              <>
                <button
                  type="button"
                  disabled={busy === r.id}
                  onClick={() => respond(r, 'decline')}
                  className="rounded-lg border border-[#334155] px-3 py-2 text-sm text-[#94a3b8] disabled:opacity-50"
                >
                  Decline
                </button>
                <button
                  type="button"
                  disabled={busy === r.id}
                  onClick={() => respond(r, 'accept')}
                  className="rounded-lg bg-[#2563eb] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  Accept
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={busy === r.id}
                onClick={() => respond(r, 'withdraw')}
                className="rounded-lg border border-[#334155] px-3 py-2 text-sm text-[#94a3b8] disabled:opacity-50"
              >
                Withdraw
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Cover the resident who skipped the picker**

Spec section 5.2 promises that a resident who skips the onboarding picker keeps seeing
a dismissible prompt until they join. The component as written returns null for them,
because they have no pending request. Extend it.

Add to the route in Step 1, so one call answers both questions:

```ts
  const memberships = await db.programMember.count({
    where: { userId: user.id },
  });
```

and include `hasProgram: memberships > 0` in the JSON response.

Then in the component, read `hasProgram` into state alongside `requests`, and replace
the `if (requests.length === 0) return null;` guard with:

```tsx
  const dismissed =
    typeof window !== 'undefined' &&
    window.localStorage.getItem('hippo-program-nudge-dismissed') === '1';

  if (requests.length === 0) {
    // Nothing outstanding. Nudge only if they are in no program at all
    // and have not waved this away before.
    if (hasProgram || dismissed) return null;
    return (
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#334155] bg-[#0f172a] px-4 py-3">
        <div>
          <p className="font-medium text-[#f1f5f9]">You are not in a program yet</p>
          <p className="text-sm text-[#94a3b8]">
            Join one so your program director can see your progress.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              window.localStorage.setItem('hippo-program-nudge-dismissed', '1');
              setHasProgram(true);
            }}
            className="rounded-lg border border-[#334155] px-3 py-2 text-sm text-[#94a3b8]"
          >
            Not now
          </button>
          <a
            href="/programs"
            className="rounded-lg bg-[#2563eb] px-3 py-2 text-sm font-medium text-white"
          >
            Find my program
          </a>
        </div>
      </div>
    );
  }
```

Dismissal lives in `localStorage` rather than a new profile column, because it is a
per-device convenience and not worth a migration.

- [ ] **Step 4: Mount it**

In `src/app/(app)/dashboard/page.tsx`, import `MyProgramStatus` and render it near the
top of the dashboard body, above the existing cards. It renders nothing for a resident
who is already in a program with nothing outstanding, so it costs no space in the
normal case.

- [ ] **Step 5: Build**

Run: `npm run build`

Expected: a successful build.

- [ ] **Step 6: Verify the full round trip**

0. A user who skips the picker sees "You are not in a program yet", and "Not now"
   hides it for that browser.
1. New user signs up, picks a program in onboarding.
2. Their dashboard shows "Waiting for the program director to approve you."
3. The director's dashboard shows "1 waiting to join". They approve.
4. The resident's card disappears and the program appears under Programs.
5. The director invites a second existing user from Programs.
6. That user's dashboard shows the invitation with Accept and Decline.
7. They accept and appear on the roster.

- [ ] **Step 7: Run everything**

Run: `npm test && npx tsc --noEmit && npm run build`

Expected: all tests pass, no type errors, successful build.

- [ ] **Step 8: Commit**

```bash
git add src/app/api/programs/my-requests/route.ts src/components/programs/MyProgramStatus.tsx "src/app/(app)/dashboard/page.tsx"
git commit -m "feat(programs): resident sees pending requests and answers invitations"
```

---

## Done when

- A resident can find and request a program during onboarding, and skip it without
  being blocked.
- A director sees requests waiting, and approving creates exactly one `ProgramMember`
  with role `RESIDENT`.
- A director can find an existing Hippo user and invite them, and that user accepts in
  the app rather than through an emailed token.
- Declined and withdrawn requests can be reopened; pending and approved ones cannot be
  duplicated.
- `npm test`, `npx tsc --noEmit` and `npm run build` are all clean.

## What comes next

Phase 2 of the spec, the PD 1:1 meeting record with carry-forward columns, gets its
own plan once this lands. `roleCanReadPdMeetings()` from Task 4 is already in place and
tested, so that plan starts against a proven gate.
