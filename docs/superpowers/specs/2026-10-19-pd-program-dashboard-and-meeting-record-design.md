# Program dashboard, program joining, and the PD 1:1 meeting record

Date: 2026-10-19
Status: approved design, not yet implemented
App: Hippo Cases (`apps/surgitrack`)

## 1. Goal

Give a program director a single place to run their program inside Hippo:

1. Create a program and get their residents attached to it without chasing anyone.
2. Hold the semi-annual Program Director / Resident 1:1 meeting inside the app, on a
   record that mirrors the letter the University of Manitoba Urology program already
   signs, and that shows the transition from the previous meeting to this one.
3. Publish that meeting as a PDF, hand it to the resident inside Hippo, and get a
   dated acknowledgment back without scanning paper.

The reference artefact is `K-Sidhom _PD Meeting_16-Jul-2025 - JN.pdf`, the signed
letter from Dr. Jasmir (Jay) Nayak, Program Director, Section of Urology,
University of Manitoba. Its structure is reproduced in section 6.

## 2. Non-goals

- Replacing Entrada or T-RES. Hippo is a shadow record, not the official training file.
  Every generated PDF says so (section 11).
- Competence Committee workflow. `CCReview` already covers that and stays separate.
  A CC review is a committee decision about a resident; a PD meeting is a private
  1:1 between two people. They do not share a table.
- Offline meeting capture. Meetings happen on wifi. The draft autosaves (section 9)
  but there is no offline queue in this work.
- Any automated placement of a signature image. See section 10.

## 3. What already exists

Confirmed by reading the codebase on 2026-10-19. This work extends it, it does not
rebuild it.

| Capability | Where |
| --- | --- |
| `Program`, `ProgramMember`, roles (OWNER, PD, CHAIR, CC_MEMBER, FACULTY, COORDINATOR, DEPT_HEAD) | `prisma/schema.prisma`, `src/lib/program-auth.ts` |
| Email invite plus token accept page | `ProgramInvite`, `src/app/join/[token]/page.tsx` |
| Program management UI | `src/app/(app)/programs/page.tsx` |
| PD dashboard, per-resident drill-down, reports | `src/app/(app)/pd-dashboard/` |
| Custom form engine and builder | `FormTemplate` / `FormSubmission` / `FormResponse`, `src/lib/forms/` |
| Competence Committee reviews | `CCReview`, `CCReviewNote` |
| Faculty to resident scoping | `FacultyAssignment`, `getResidentRosterScope()` |
| PDF generation | `pdfkit` 0.18 already in `package.json` |
| Notifications, push, PD digest cron | `Notification`, `PushSubscription`, `src/app/api/cron/pd-digest` |
| Audit trail | `AuditLog` |
| Shadow-record disclosure | `Profile.acknowledgedShadowRecordAt` |

Gaps this spec closes: no way to join a program at sign-up, no PD-initiated invite of
an existing Hippo user, no 1:1 meeting record, no letter PDF, no delivery back to the
resident.

Why the existing form engine is not reused for the meeting record: its field types
(`short_text`, `long_text`, `number`, `boolean`, `single_choice`, `multi_choice`,
`likert`, `rubric_grid`, `signature`) cannot express a previous-versus-current column
pair, a score table that accumulates across meetings, or a checklist carrying a target
PGY year. Forcing them in would distort both features.

## 4. Decisions taken

| # | Decision | Chosen |
| --- | --- | --- |
| D1 | Form shape | Fixed spine of eight carry-forward sections plus two signature blocks. The checklists and score tables are per-program editable lists. |
| D2 | How residents join | Resident picks the program at sign-up and lands in a pending queue the PD approves. Plus PD-initiated invite of an existing Hippo user. Plus the existing email invite, unchanged. |
| D3 | Resident's role | Receives the published record in Hippo and taps to acknowledge. The acknowledgment prints on the PDF with its date. The PD's own signature line stays blank. |
| D4 | Where it ships | Inside `apps/surgitrack`. New routes only. |

Improvements folded in after the design was approved, listed here so they are not
mistaken for scope creep: goal outcomes (section 6.4), meeting due dates and reminders
(section 12), the resident's own longitudinal view (section 8), whole-file export
(section 10), audit and access rules (section 11), draft autosave (section 9), and the
PDF fidelity test (section 13).

## 5. Joining a program

### 5.1 Data

```prisma
enum JoinRequestStatus {
  PENDING
  APPROVED
  DECLINED
  WITHDRAWN
}

model ProgramJoinRequest {
  id           String            @id @default(cuid())
  programId    String
  program      Program           @relation(fields: [programId], references: [id], onDelete: Cascade)
  userId       String
  user         User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  status       JoinRequestStatus @default(PENDING)
  // What the resident told us at sign-up, shown to the PD so they can
  // recognise the person before approving. Not authoritative.
  claimedPgy   Int?
  message      String?
  // Set when the request came from a PD searching for this user rather
  // than the user asking to join. Flips the UI: the resident accepts
  // instead of the PD approving.
  invitedById  String?
  invitedBy    User?             @relation("ProgramJoinInvitesSent", fields: [invitedById], references: [id], onDelete: SetNull)
  decidedById  String?
  decidedBy    User?             @relation("ProgramJoinDecisions", fields: [decidedById], references: [id], onDelete: SetNull)
  decidedAt    DateTime?
  declineReason String?
  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt

  @@unique([programId, userId])
  @@index([programId, status])
  @@index([userId, status])
  @@map("program_join_requests")
}
```

One row covers both directions. `invitedById` null means the resident asked;
`invitedById` set means the PD asked. The unique constraint on `(programId, userId)`
stops duplicate requests, and a withdrawn or declined row is reused rather than
re-inserted.

### 5.2 Resident picks at sign-up

A new step in `src/app/onboarding/page.tsx`, after the role question and before the
finish step. It shows a type-ahead over programs (name and institution), and the
resident taps one. Choosing is optional; skipping leaves a dismissible card on the
dashboard until they join.

Only programs with `discoverable = true` appear. A new boolean on `Program`, default
true, lets a program hide itself from search and run invite-only.

On submit: create a `PENDING` request, notify the program's PD-like members, and show
the resident a waiting state on their dashboard.

### 5.3 PD searches and invites an existing user

On `/programs`, a PD-like member searches Hippo users by name or email. Results show
name, role type and institution, enough to identify the right person and no more.
Sending creates a `ProgramJoinRequest` with `invitedById` set, which reaches the
resident as a notification plus an inbox item. The resident accepts or declines.

Search is limited to 20 results, requires at least 3 characters, and is rate limited
through the existing `src/lib/rate-limit.ts`. It never exposes an email the caller did
not already type in full.

### 5.4 Email invite

`ProgramInvite` and `/join/[token]` are unchanged. They remain the path for someone
who does not have a Hippo account yet.

### 5.5 Approval

Approving creates the `ProgramMember` row with role `RESIDENT` and leaves the
resident's `Profile.roleType` unchanged.

`RESIDENT` is a new value on `ProgramMemberRole`. It is needed because the existing
legacy `MEMBER` value is documented in `src/lib/program-auth.ts` as "an alias for
FACULTY when unset", so joining a resident as `MEMBER` would file them under a
supervising-attending role. It is harmless today only because a resident has no
`FacultyAssignment` rows, which is a coincidence rather than a rule. Adding the value
is additive and leaves every existing row valid. All four capability predicates
(`roleCanManageProgram`, `roleCanReadAllResidents`, `roleCanFinaliseCC`,
`roleCanReadPdMeetings`) return false for it; `roleSeesPhi` returns true, since a
resident sees their own case content. The PD dashboard header carries a pending count, and the
queue sits at the top of the roster with approve and decline on each row. Declining
asks for an optional reason, which the resident sees.

### 5.6 Changes to existing models

Additive only. No existing column changes type and no existing row becomes invalid.

```prisma
// enum ProgramMemberRole
+ RESIDENT   // A trainee on the roster. Sees their own record only.
             // Distinct from legacy MEMBER, which program-auth treats
             // as FACULTY.

// model Program
+ discoverable          Boolean @default(true)  // appears in onboarding search
+ meetingIntervalMonths Int     @default(6)     // drives the next-meeting-due date
+ joinRequests          ProgramJoinRequest[]
+ meetingConfig         ProgramMeetingConfig?
+ pdMeetings            PdMeeting[]
```

## 6. The meeting record

### 6.1 Structure of the source letter

Three pages. Eight sections, each a two-column table comparing the previous meeting to
this one:

1. Progress in training
2. Immediate goals
3. Career planning
4. Areas of concern on behalf of residents
5. Areas for improvement / areas of concern on behalf of Faculty
6. T-RES
7. Current CBD levels (Urology CBD Level, Surgical Foundations)
8. Entrada Reminders

Then blocks that accumulate across meetings rather than comparing two columns:

- Mini-QUEST results: date, overall, MCQ, OSCE, VR, rank, one row per sitting.
- Exam results: AUA percentile by year, QUEST PGY4.
- Core Curriculum: session, the PGY it must be completed in, a completion tick.
  Outstanding rows are highlighted (Practice Management, PGY 3-5, is highlighted on
  the July 2025 letter).
- QI modules: session, completion tick.
- Certifications: ACLS, ATLS, Procedural Sedation, Principle of Surgery.

Finally two signature blocks, program director on the left, resident on the right.

### 6.2 Data

```prisma
enum PdMeetingStatus {
  DRAFT
  PUBLISHED
}

model PdMeeting {
  id            String          @id @default(cuid())
  programId     String
  program       Program         @relation(fields: [programId], references: [id], onDelete: Cascade)
  residentId    String
  resident      User            @relation("PdMeetingsAsResident", fields: [residentId], references: [id], onDelete: Cascade)
  // The PD who held the meeting. Kept even if they later leave the program.
  directorId    String
  director      User            @relation("PdMeetingsAsDirector", fields: [directorId], references: [id], onDelete: Cascade)

  meetingDate   DateTime
  // Free text, e.g. "PGY-3 mid-year". Printed under the date.
  cycleLabel    String?
  // The resident's training year at the time of the meeting, printed in the
  // RE: line ("Dr. Karim Sidhom PGY3"). Snapshotted, not read live.
  pgyAtMeeting  Int?

  status        PdMeetingStatus @default(DRAFT)
  publishedAt   DateTime?

  // The previous PUBLISHED meeting for this resident in this program.
  // Resolved once at creation and then frozen, so re-publishing an old
  // record never re-points its left column.
  previousMeetingId String?    @unique
  previousMeeting   PdMeeting? @relation("PdMeetingChain", fields: [previousMeetingId], references: [id], onDelete: SetNull)
  nextMeeting       PdMeeting? @relation("PdMeetingChain")

  // The eight carry-forward sections, this meeting's column only.
  // Shape: { [sectionId]: { bullets: PdBullet[] } }
  // The previous column is read from previousMeeting, never duplicated here.
  sections      Json

  // Everything the record needs to reprint identically later: the score
  // rows, checklist state, and the Hippo-derived metrics as they stood at
  // publish time. Written on publish, null while DRAFT.
  snapshot      Json?

  acknowledgedAt DateTime?
  // Denormalised so the PDF can print the name as it was, even if the
  // resident later changes it.
  acknowledgedName String?

  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  @@index([programId, meetingDate])
  @@index([residentId, status])
  @@map("pd_meetings")
}
```

`PdBullet` (TypeScript, in `src/lib/pd-meeting/types.ts`):

```ts
export interface PdBullet {
  id: string;
  text: string;
  /**
   * Set only on bullets in the "Immediate goals" section. Records what
   * happened to the goal the PREVIOUS meeting set. This is the loop the
   * paper letter never closes.
   */
  outcome?: "met" | "partly" | "not_met" | "carried";
  /** The previous-meeting bullet id this was carried forward from. */
  carriedFrom?: string;
}
```

Longitudinal data lives on the resident, not on the meeting, so it is entered once and
every later meeting shows the full history:

```prisma
model ResidentScoreEntry {
  id         String   @id @default(cuid())
  programId  String
  program    Program  @relation(fields: [programId], references: [id], onDelete: Cascade)
  residentId String
  resident   User     @relation("ResidentScores", fields: [residentId], references: [id], onDelete: Cascade)
  // Which table this row belongs to. Matches a ProgramMeetingConfig
  // scoreTable id, e.g. "mini_quest" or "aua".
  tableId    String
  sittingAt  DateTime
  // Column id to value. Values are strings so "Away" and "Post call"
  // round-trip alongside "60.8".
  values     Json
  note       String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([programId, residentId, tableId, sittingAt])
  @@map("resident_score_entries")
}

model ResidentChecklistItem {
  id          String    @id @default(cuid())
  programId   String
  program     Program   @relation(fields: [programId], references: [id], onDelete: Cascade)
  residentId  String
  resident    User      @relation("ResidentChecklist", fields: [residentId], references: [id], onDelete: Cascade)
  // Matches a ProgramMeetingConfig checklist item id.
  itemId      String
  completed   Boolean   @default(false)
  completedAt DateTime?
  note        String?
  updatedAt   DateTime  @updatedAt

  @@unique([residentId, programId, itemId])
  @@index([programId, residentId])
  @@map("resident_checklist_items")
}
```

### 6.3 Per-program configuration

```prisma
model ProgramMeetingConfig {
  id          String   @id @default(cuid())
  programId   String   @unique
  program     Program  @relation(fields: [programId], references: [id], onDelete: Cascade)
  // Letterhead: uploaded logo plus the address block printed beside it.
  logoUrl     String?
  letterhead  Json?
  // Section headings, so a program can reword "T-RES" or drop a section
  // it does not use. The eight section IDs are fixed; only labels and
  // visibility are configurable.
  sectionConfig Json?
  // Checklists: [{ id, title, items: [{ id, label, targetYear? }] }]
  checklists  Json
  // Score tables: [{ id, title, columns: [{ id, label }] }]
  scoreTables Json
  // Certifications: [{ id, label }]
  certifications Json
  // The boilerplate paragraph under the RE: line.
  introText   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("program_meeting_configs")
}
```

Seeded on first use with the Manitoba Urology defaults taken verbatim from the July
2025 letter, so Dr. Nayak's first meeting matches his paper without configuration.
The eight section IDs are fixed in code; a program may relabel or hide a section but
not invent a ninth, which keeps the PDF layout predictable.

### 6.4 Carry-forward behaviour

Creating a meeting resolves `previousMeetingId` to the resident's most recent
`PUBLISHED` meeting in that program, then freezes it.

The editor shows each section as two columns. Left is the previous meeting, read-only,
headed with its date. Right is this meeting, editable. Every left-hand bullet has a
carry-forward control that copies it into the right column with `carriedFrom` set, so
unchanged items take one tap instead of retyping.

In the Immediate goals section, each previous bullet additionally asks for an outcome
(met, partly, not met, carried) before the meeting can be published. That is the one
place the app asks for more than the paper does, and it is what turns a list of goals
into a record of whether they happened.

A resident's first meeting has no previous column. The left side shows an empty state
and the carry-forward controls are absent.

## 7. Hippo-derived metrics

On opening the editor and again at publish, the app computes from data Hippo already
holds and writes the result into `snapshot`:

- case volume by category and by role over the interval since the previous meeting,
- EPA observations completed, achieved and outstanding,
- rotations completed since the last meeting and the ones coming up,
- logging consistency, for example weeks with no cases logged.

These render in a "Since your last meeting" panel beside the sections. They are
informational context for the conversation and are printed in the PDF under their own
heading, clearly separated from what the PD typed.

## 8. The resident's own view

At `/profile/meetings`, a resident sees their own meetings, newest first, and for each
one the published PDF and the acknowledgment state. Above the list, a longitudinal
strip shows goals set versus their outcomes across meetings, and the score tables
trended over time.

A resident sees only their own meetings. There is no path from here to anyone else's.

## 9. Editing and publishing

- The editor autosaves the draft on a 2 second debounce and on blur. Meetings are
  filled live in front of the resident and losing the content would be bad.
- A draft is visible only to the PD who created it. The resident sees nothing until
  publish.
- Publishing validates: every Immediate goals bullet from the previous meeting has an
  outcome, the meeting date is set, and at least one section has content. It writes
  `snapshot`, sets `publishedAt`, renders the PDF, notifies the resident, and locks the
  sections.
- A published meeting can be corrected by the PD. Doing so records an entry in
  `AuditLog`, clears any acknowledgment, re-renders the PDF, and tells the resident it
  changed. There is no silent edit after publish.

## 10. PDF, delivery, acknowledgment

Rendered with `pdfkit` in `src/lib/pd-meeting/pdf.ts`, reproducing the three-page
layout: letterhead, date, RE line, intro paragraph, the eight two-column tables, the
score tables, the checklists with outstanding rows highlighted, the certifications,
and the two signature blocks.

Delivery on publish:

1. The PD can download it or email it to the resident through the existing
   `src/lib/email`.
2. The resident gets a notification and a permanent copy at `/profile/meetings`.
3. The resident taps "I reviewed this". That sets `acknowledgedAt` and
   `acknowledgedName`, and the PDF reprints with "Acknowledged in Hippo by
   {name} on {date}" beneath the resident's signature line.

The program director's signature line is always left blank. The app never places,
draws, renders or reuses anyone's signature image.

Whole-file export: `/pd-dashboard/[userId]` gains an export that renders every
published meeting for that resident into one PDF, with the score tables and checklists
up front. That is the artefact a PD needs at promotion time or for a Royal College
application.

## 11. Access control, audit, privacy

Meeting records are personnel data and are more sensitive than case logs. The existing
`roleCanReadAllResidents()` is too broad for them, because it includes CHAIR,
CC_MEMBER, DEPT_HEAD and COORDINATOR.

A new predicate in `src/lib/program-auth.ts`:

```ts
// PD meeting records are a private 1:1 between the director and the
// resident. Deliberately narrower than roleCanReadAllResidents(): a
// CC member or coordinator having roster access does NOT imply access
// to someone's 1:1 record.
export function roleCanReadPdMeetings(role: ProgramMemberRole): boolean {
  return (['OWNER', 'PD'] as ProgramMemberRole[]).includes(role);
}
```

Access to a `PdMeeting` therefore requires either a PD-like membership in that
program, or being the resident the record is about and the record being published.
Every other role gets 404, not 403, so the existence of a record is not disclosed.

Audited through the existing `AuditLog`: create, each publish, every post-publish edit,
every PDF render, every acknowledgment, and every read of a record by someone who is
not its subject.

Every generated PDF carries a footer stating that Hippo is not the official training
record, consistent with `Profile.acknowledgedShadowRecordAt`. Removing a resident from
a program does not delete their meetings; they keep their copies, and the program keeps
the record.

## 12. Due dates and reminders

`Program` gains `meetingIntervalMonths` (default 6). The PD dashboard computes a next
meeting due date per resident from their last published meeting, or from their program
start if they have none, and surfaces residents who are overdue in the existing action
queue. The existing `api/cron/pd-digest` job gains a line for meetings coming due in
the next 30 days and those already overdue.

## 13. Testing

- Unit: carry-forward resolution including the first-meeting case; goal outcome
  validation; snapshot determinism, meaning the same meeting re-rendered yields an
  identical PDF; score and checklist aggregation across meetings.
- Access control: a table-driven test over all eight roles plus subject and stranger,
  asserting read, write, publish and export for each. This is the test that matters
  most and it is written first.
- Join flow: duplicate request, withdrawn then re-requested, declined then
  re-requested, PD-initiated invite accepted and declined, approval creating exactly
  one `ProgramMember`.
- Fidelity: seed Karim Sidhom's July 2025 data, render the PDF, and compare it against
  `K-Sidhom _PD Meeting_16-Jul-2025 - JN.pdf` section by section. Dr. Nayak will not
  adopt a generator whose output he does not recognise, so this is an acceptance gate,
  not a nicety.

## 14. Phases

Each phase ends with a changelog entry, and work stops for Karim's go-ahead before the
next one starts.

| Phase | Contents |
| --- | --- |
| 0 | Prisma models, migration, `src/lib/pd-meeting/types.ts`, the Manitoba default config seed, `roleCanReadPdMeetings()` and its access-control test. No UI. |
| 1 | Joining: onboarding program picker, PD-initiated user search and invite, pending queue on the dashboard, approve and decline. |
| 2 | The meeting record: editor with two-column carry-forward, goal outcomes, score tables, checklists, autosave, publish. |
| 3 | PDF render, email and in-app delivery, resident acknowledgment, `/profile/meetings`, whole-file export. |
| 4 | Dashboard polish against the Hippo design bar, due dates and overdue surfacing, digest lines. |

## 15. Risks

- **Dr. Nayak does not adopt it.** The fidelity gate in section 13 and the Manitoba
  default config are the mitigation. If the generated letter is not recognisably his,
  nothing else matters.
- **Two columns on a phone.** The editor is desktop-first. On narrow screens the
  previous column collapses into a per-bullet disclosure above each editable field
  rather than shrinking to an unreadable pair of columns.
- **Scope pressure from CC reviews.** `CCReview` already exists and will look adjacent.
  Keeping them separate is deliberate, and merging them is out of scope here.
