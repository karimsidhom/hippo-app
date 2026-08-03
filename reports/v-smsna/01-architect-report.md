# SMSNA Fellowship Slot — Design Spec (@architect)

Repo verified: `/Users/karimsidhom/Desktop/ClaudeStuff/apps/surgitrack/.claude/worktrees/smsna-fellowship`
Greenfield confirmed: case-insensitive grep for `smsna|oprs|helo` across the whole repo returns **zero files**.

## 1. Verified codebase map

**(a) Residency / training-pathway selection UI**
- `src/app/onboarding/page.tsx` — 10-step wizard. **Step 5 = "Training Country"** (lines 287-322) is the pathway slot: an inline 2-item array `[{value:"US"...},{value:"CA"...}]` at lines 295-298 writing `form.trainingCountry`. Step 4 = role (`USER_ROLE_TYPES`, incl. FELLOW), Step 6 = specialty (`SPECIALTIES`, stores **`spec.name`, not slug** — line 335), Step 7 = PGY (`PGY_YEARS`, 6/7 = Fellow Yr 1/2). `handleFinish` at lines 67-83 calls `updateProfile({...form, trainingYearLabel: \`PGY-${form.pgyYear}\`, trainingCountry})`.
- Post-onboarding edit: `src/app/(app)/profile/page.tsx` lines 283-327 (specialty `<select>` line 293, free-text `subspecialty` line 297, pgyYear line 303). **`trainingCountry` is NOT editable anywhere post-onboarding** — flag for @builder.
- `src/app/(app)/settings/page.tsx` only edits `roleType` (line 343).
- Server: `src/app/api/profile/route.ts` lines 50-68 whitelists `trainingCountry`, `specialty`, `subspecialty`, `roleType`, `pgyYear`, `trainingYearLabel` — **no enum validation, plain passthrough**. `updateProfile(updates: Partial<Profile>)` at `src/context/AuthContext.tsx:337`.

**(b) How the procedure picker gets its list**
- `src/components/shared/ProcedurePicker.tsx` is **fully generic**: prop `procedures: Procedure[]` (line 11), derives categories by grouping on `proc.category` (lines 109-124), and already ships the free-text **"Other" escape hatch** in three places (SubcategoryGrid line 601, ProcedureList line 766, SearchResults line 654). No specialty knowledge inside. Icons via `CATEGORY_ICONS` map (lines 32-73) with `?? '🔹'` fallback (line 76).
- Two and only two call sites feed it: `src/app/(app)/log/page.tsx:169` and `src/components/cases/QuickAddModal.tsx:88`, both `getProceduresBySpecialty(slug)` from `src/lib/procedureLibrary.ts:697` (filters `PROCEDURE_LIBRARY` by `p.specialty === slug`).
- `procedureLibrary.ts` is imported by exactly 3 files (ProcedurePicker type-only, QuickAddModal, log page). `ALL_PROCEDURES_BY_SPECIALTY` in `constants.ts:219` is **dead code — zero consumers**.

**(c) EpaObservation model shape — can it host OPRS with no migration? YES.**
`prisma/schema.prisma:788-845`. Relevant free-form columns:
```
epaId          String   // no format constraint
epaTitle       String
specialtySlug  String
trainingSystem String   // comment says "ACGME" or "RCPSC" — it is a plain String column
complexity     String?  // ← 3-point OPRS difficulty
technique      String?  // ← the specific SMSNA procedure name
entrustmentScore Int?   // ← OPRS overall item (1-5)
criteriaRatings  Json?  // ← OPRS specific + general items
canmedsRatings   Json?  // unused by SMSNA
```
Server contract at `src/app/api/epa/observations/route.ts:7-39` already accepts everything OPRS needs: `trainingSystem: z.string().min(1)`, `specialtySlug: z.string().min(1)`, `entrustmentScore: 1-5`, `criteriaRatings[].entrustmentRating: 0-5`, `complexity`/`technique` nullable strings. **No zod change, no Prisma migration, no API-contract change.**

**(d) How `trainingSystem` is derived + every switch on it**
Derived from `profile.trainingCountry` in 5 places, all the identical inline ternary:
| File:line | Expression |
|---|---|
| `src/app/(app)/log/page.tsx:1176` | `profile?.trainingCountry === "CA" ? "RCPSC" : "ACGME"` |
| `src/components/cases/QuickAddModal.tsx:398` | `profile?.trainingCountry === "US" ? "ACGME" : "RCPSC"` (note: inverted default vs log page — pre-existing inconsistency) |
| `src/components/epa/EpaDashboard.tsx:808,1056` | `isCanadian = !trainingCountry \|\| trainingCountry === "CA"` |
| `src/components/epa/EpaAnalyticsPanel.tsx:267,690` | same |
| `src/lib/export-branding.ts:438-442` | `trainingSystemLabel(country)` → returns `"—"` for unknown |

`trainingCountry` also feeds `getSpecialtyEpaData(specialty, country)` (`src/lib/epa/data.ts:6751-6760`, `country === "CA" ? RCPSC_MAP : ACGME_MAP`) from: `EpaDashboard.tsx:907`, `EpaAnalyticsPanel.tsx:307`, `api/epa/suggest/route.ts:47`, `api/epa/ai-suggest/route.ts:198`, `app/(app)/pd-dashboard/[userId]/page.tsx:214`, `EpaObservationForm.tsx:95`.

Stored `trainingSystem` is only *read back* for display/export: `api/epa/export/route.ts:179,458`, `review/[token]/page.tsx:15`, `api/epa/observations/[id]/route.ts:113`. **No switch statement anywhere branches on the stored value** — it is a passthrough label. `epaId` prefix switches (`stageOf`, `getStageColor`) test `TTP|TD|C|F` and all have safe defaults; `"SMSNA-…"` matches none.

## 2. Decision: no-migration reuse

**Chosen: zero Prisma migration. Reuse `Profile.trainingCountry = "SMSNA"` as the pathway marker and `EpaObservation` as the OPRS record.**

Options analyzed:
1. **New `Profile.trainingProgram` column** — cleanest semantics, but requires a prod Supabase migration and a new whitelist entry, for zero functional gain.
2. **`profile.subspecialty === "SMSNA"`** — rejected: it is a *free-text input* on the profile page (line 297); an exact-match predicate on user-typed text is fragile, and it does not reach the framework-derivation code paths.
3. **New `SPECIALTIES` entry** — **rejected outright**: `SPECIALTIES` is rendered in 6 UIs (onboarding grid, log-page chips, QuickAddModal chips, CaseFilters dropdown, profile `<select>`, name lookups). Adding SMSNA there shows it to every existing user → violates "change nothing else".
4. **`trainingCountry = "SMSNA"` (chosen)** — this column *already is* the "which assessment framework applies" switch in this codebase; it is a nullable String with no DB/zod constraint; onboarding step 5 is literally the slot the owner described; and every consumer already routes through 2 identical patterns, so gating is a mechanical 1-line swap.

Accepted trade-off: an SMSNA fellow's US/CA country is not separately stored. Nothing in the app uses `trainingCountry` for anything except EPA-framework selection and one export label, so this is lossless in practice. If the owner later wants both, the only change is moving the marker into a new column behind `isSmsnaProfile()` — one function body.

**API/critical-path touch: NO.** Zero changes to `prisma/schema.prisma`, `src/lib/shared/schemas/*`, any `src/app/api/**` route handler, or any exported type signature. `TrainingSystem = "ACGME" | "RCPSC"` in `src/lib/epa/data.ts:8` must **stay unwidened** — SMSNA is a stored string, not an EPA framework. @api-guardian is therefore **not required**; @builder proceeds directly. (If @builder finds itself editing a route or a schema, stop and escalate.)

## 3. File-by-file change list for @builder (implementation order)

### CREATE (types → data → UI)

**1. `src/lib/smsna/gate.ts`** — the single gating predicate.
```ts
export const SMSNA_TRAINING_SYSTEM = "SMSNA";
export const SMSNA_SPECIALTY_SLUG = "smsna";
export const SMSNA_SPECIALTY_NAME = "SMSNA Fellowship";
export function isSmsnaProfile(p?: { trainingCountry?: string | null } | null): boolean;
export function resolveTrainingSystem(p?: { trainingCountry?: string | null } | null): "SMSNA" | "RCPSC" | "ACGME";
```
`resolveTrainingSystem` must preserve today's exact behaviour for non-SMSNA: `"CA" → "RCPSC"`, everything else → `"ACGME"` (match the log-page default, and fix QuickAddModal to it — call this out in the PR as an intentional 1-line normalisation, or keep QuickAddModal's inverted default by passing an explicit fallback; @builder picks one and documents it).

**2. `src/lib/smsna/taxonomy.ts`** — the SMSNA case taxonomy, verbatim from the Mayo Q2-2026 form.
```ts
export type SmsnaCategoryKey =
  | "penile-prosthetics" | "male-infertility" | "male-reconstruction"
  | "female-reconstruction" | "gender-affirmation" | "general-office";
export interface SmsnaCategory { key: SmsnaCategoryKey; name: string; icon: string; procedures: string[]; }
export const SMSNA_CATEGORIES: SmsnaCategory[];          // 6 entries, all procedures from the brief
export function getSmsnaProcedures(): Procedure[];        // adapter → src/lib/procedureLibrary Procedure
export function getSmsnaCategoryByName(name: string): SmsnaCategory | undefined;
export function getSmsnaCategoryForProcedure(procedureName: string): SmsnaCategory | undefined;
```
Category display names (must match exactly, they become `CaseLog.procedureCategory`): `Penile Surgery and Prosthetics`, `Male Infertility`, `Male Urethra and Reconstructive Surgery`, `Female Reconstructive Surgery`, `Gender Affirmation Surgery`, `General Urology and Office Procedures`.
`getSmsnaProcedures()` builds `Procedure` objects: `id: \`smsna-${catIdx}-${i}\``, `specialty: "smsna"`, `category: cat.name`, `subcategory: cat.name`, `approaches: []`, `aliases: []`, `complexityTier: 2`, `active: true`.
**Do NOT append these to `PROCEDURE_LIBRARY`** — keep them out of the global array so they can never leak into another specialty's list or global search.
The "Other Procedures" free-text escape is already provided by `ProcedurePicker` — do not add an "Other" pseudo-procedure.

**3. `src/lib/smsna/oprs.ts`** — the grading instrument, labelled *"Adapted from the Operative Performance Rating System (OPRS) for urology residents, J Urol 2012;188(5):1877-1882."*
```ts
export const OPRS_CITATION: string;
export interface OprsItem { id: string; label: string; hint?: string }
export const OPRS_DIFFICULTY: { value: 1|2|3; label: string; description: string }[];
export const OPRS_LIKERT: { value: 1|2|3|4|5; label: string; description: string; color: string }[];
export const OPRS_GENERAL_ITEMS: OprsItem[];   // exactly 3
export const OPRS_OVERALL_ITEM: OprsItem;      // exactly 1
export const OPRS_ITEMS_BY_CATEGORY: Record<SmsnaCategoryKey, OprsItem[]>;  // 4-6 each
export function getOprsInstrument(key: SmsnaCategoryKey):
  { difficulty: typeof OPRS_DIFFICULTY; specific: OprsItem[]; general: OprsItem[]; overall: OprsItem };
```
Difficulty (3-point, **rated first**): 1 = Least difficult third of cases of this type; 2 = Average difficulty; 3 = Most difficult third of cases of this type.
Likert (5-point, all items b-d): 1 = Unable to perform / assessor took over; 2 = Frequent verbal guidance and hands-on assistance; 3 = **Competent — completed with minimal guidance**; 4 = Smooth and independent, rare prompting; 5 = Expert / exemplary.
General items (3, every instrument): `G1 Instrument handling and respect for tissue`; `G2 Time and motion — economy and efficiency of movement`; `G3 Operative flow and forward planning — anticipates the next step, directs the team`.
Overall: `OV1 Overall operative performance for this procedure`.
Procedure-specific banks (category-level, 4-6 each):
- **penile-prosthetics**: corporal exposure and incision choice; corporal dilation, measurement and component sizing; reservoir/pump placement, tubing routing and connections; infection-prevention technique (no-touch, irrigation, prophylaxis); correction of curvature or deformity (modeling / plication / grafting) where applicable; closure and device cycling with final function check.
- **male-infertility**: microsurgical set-up, microscope/loupe use and ergonomics; identification and preservation of cord anatomy (arteries, lymphatics, vas); microsuture handling and patency-oriented anastomotic technique; testicular tissue handling and sperm-retrieval technique with specimen management; use of intraoperative adjuncts (Doppler, andrology-bench confirmation); atraumatic hemostasis and closure.
- **male-reconstruction**: positioning, exposure and correct perineal/penile dissection planes; urethral mobilization, stricture assessment and margins; anastomosis or graft/flap harvest, inset and fixation; device sizing, siting and tensioning (cuff / sling / balloon); catheter management, watertight closure and drainage decisions; intraoperative problem-solving when anatomy deviates from plan.
- **female-reconstruction**: positioning, exposure and vestibular/vaginal field preparation; dissection in the correct plane with preservation of urethra and bladder; sling/mesh or flap placement, tensioning and fixation; cystoscopic confirmation of bladder and ureteral integrity; fistula tract identification, excision and tension-free multilayer closure; hemostasis and packing/drain decisions.
- **gender-affirmation**: preoperative marking, flap design and tissue planning; orchiectomy / penile disassembly / clitoral release with neurovascular preservation; neovaginal canal creation or urethral lengthening; graft or flap harvest, inset, and depth/caliber assessment; neo-meatus and neo-scrotal/labial construction and fixation; packing, dilator or catheter management and closure.
- **general-office**: positioning, consent/time-out and local anesthesia technique; endoscope or probe handling and image optimization; energy/device selection appropriate to the tissue (laser, cautery, injectable); accuracy of the diagnostic manoeuvre or measurement (Doppler, sensory testing, injection site); recognition and management of intraprocedural findings or complications; post-procedure instructions and documentation-ready assessment.

**4. `src/components/smsna/OprsObservationForm.tsx`** — the grading form. **Reuse the visual language of `src/components/epa/EpaObservationForm.tsx`**: copy its `inputStyle` / `labelStyle` / `sectionStyle` / `sectionTitleStyle` (lines 64-78), its Assessment-Context grid (lines 305-355), its Send-for-sign-off `ChoiceCard` block (lines 357-549 + component at 901-932), its Continue/Change/Consider block (774-819), its Flags block (821-856) and its Footer (858-896). Do **not** invent new patterns.
```ts
interface OprsObservationFormProps {
  categoryKey: SmsnaCategoryKey;
  categoryName: string;
  procedureName: string;
  prefillData?: { caseLogId: string; caseDate: Date; procedureName: string; attendingLabel?: string };
  onSubmit:   (data: EpaObservationInput) => Promise<void>;
  onSaveDraft:(data: EpaObservationInput) => Promise<void>;
  onCancel:   () => void;
}
```
Render order (this is the OPRS contract): header with category + `OPRS_CITATION` → **3-point difficulty first** → assessment context/assessor/sign-off → procedure-specific items (5-point) → 3 general items (5-point) → overall item (5-point) → Continue/Change/Consider → flags → footer.
`buildInput()` maps onto the **existing** `EpaObservationInput` (`src/lib/types.ts:581`):
```
epaId            = `SMSNA-${categoryKey.toUpperCase()}`      // e.g. SMSNA-PENILE-PROSTHETICS
epaTitle         = `OPRS — ${categoryName}`
specialtySlug    = "smsna"
trainingSystem   = "SMSNA"
complexity       = `Difficulty ${n} — ${label}`               // the 3-point scale
technique        = procedureName                              // preserves the exact SMSNA procedure
criteriaRatings  = [...specific, ...general].map(i => ({ criterionId: i.id, label: i.label, entrustmentRating: 1..5, comment }))
entrustmentScore = overall item rating (1-5)
achievement      = overall >= 3 ? "ACHIEVED" : "NOT_ACHIEVED" // OPRS competence anchor is 3, not 4
```
Add a code comment: on SMSNA rows, `entrustmentRating`/`entrustmentScore` carry the **OPRS 5-point Likert**, not the Royal College O-Score.

**5. (OPTIONAL) `src/components/smsna/SmsnaAssessmentPanel.tsx`** — ~60-line read-only card for the analytics EPA/Milestones tabs (count of OPRS observations by category + link to `/cases`). **No new charts, no new analytics math.** Purely to avoid showing an SMSNA fellow the "EPA tracking coming soon for Urology" empty state.

### MODIFY

**6. `src/app/onboarding/page.tsx`** — the slot.
- Lines 295-298: append a third card `{ value: "SMSNA", label: "SMSNA Fellowship", desc: "Sexual medicine fellowship — SMSNA case log + OPRS assessments", flag: "🧬" }`.
- Line 301 `onClick`: when `country.value === "SMSNA"`, also `update({ roleType: "FELLOW", pgyYear: 6, specialty: form.specialty || "Urology" })`.
- Line 292 subtitle → "This determines your case-log taxonomy and assessment framework".
- Line 75: `trainingYearLabel: form.trainingCountry === "SMSNA" ? "SMSNA Fellow" : \`PGY-${form.pgyYear}\``.
- Do **not** add step-skipping logic; steps 6/7 render with the pre-set defaults.

**7. `src/app/(app)/log/page.tsx`** — picker + grading swap.
- Imports (after line 14/20): `isSmsnaProfile`, `resolveTrainingSystem`, `SMSNA_SPECIALTY_SLUG/NAME`, `getSmsnaProcedures`, `getSmsnaCategoryForProcedure`, `OprsObservationForm`.
- Lines 63-71: `const isSmsna = isSmsnaProfile(profile);` — when true, `userSpecialtySlug = SMSNA_SPECIALTY_SLUG`, `userSpecialtyName = SMSNA_SPECIALTY_NAME` (bypass the `SPECIALTIES.find` lookup, which would otherwise silently fall back to `"urology"`).
- Line 169: `const specialtyProcedures = isSmsna ? getSmsnaProcedures() : getProceduresBySpecialty(form.specialtySlug || "urology");`
- Lines 544-572 (specialty chip row): wrap in `{!isSmsna && (…)}`; in the SMSNA branch render a static "SMSNA Fellowship" badge.
- Lines 262-273 in `doSubmit`: `if (isSmsna) { setShowOprs(true); window.scrollTo(...); return; }` **before** `startEpaSuggestionFetch` / `setShowEpaSuggestions(true)` — SMSNA never calls the EPA suggestion engine.
- Lines 1133-1192: add a sibling `{isSmsna && showOprs && (…<OprsObservationForm categoryKey={getSmsnaCategoryForProcedure(form.procedureName)?.key ?? "general-office"} … onSubmit={handleEpaObservationSubmit} onSaveDraft={handleEpaObservationDraft} …/>)}` reusing the identical modal wrapper markup. `handleEpaObservationSubmit`/`Draft` (lines 344-398) need **no change**.
- Line 1176: `trainingSystem={resolveTrainingSystem(profile)}` (behaviour-identical for non-SMSNA).

**8. `src/components/cases/QuickAddModal.tsx`** — same treatment.
- Add `const isSmsna = isSmsnaProfile(profile);` and `const effectiveSlug = isSmsna ? SMSNA_SPECIALTY_SLUG : specialtySlug;` — use `effectiveSlug` at lines 88, 113, 181. **Do not** initialise `useState` from `profile` (it hydrates async).
- Line 114: `specialtyName: isSmsna ? SMSNA_SPECIALTY_NAME : SPECIALTIES.find(...)?.name` — otherwise the analytics donut buckets SMSNA cases as "Unknown".
- Lines 486-503: wrap the chip row in `{!isSmsna && (…)}`.
- Line 397-398: render `OprsObservationForm` when `isSmsna`, else `EpaObservationForm` with `trainingSystem={resolveTrainingSystem(profile)}`.
- Mirror the log page's EPA-suggestion skip.

**9. `src/lib/epa/data.ts`** — ONE guard, line 6755 (top of `getSpecialtyEpaData`): `if (country === "SMSNA") return undefined;`
This makes every EPA consumer degrade into its existing "no framework" path instead of silently serving ACGME EPAs to an SMSNA fellow. Zero behaviour change for `"US"` / `"CA"` / `undefined`. **Do not widen `TrainingSystem` (line 8).**

**10. `src/lib/export-branding.ts:438`** — prepend `if (country === "SMSNA") return "SMSNA Fellowship (OPRS, J Urol 2012)";` (otherwise exports print `"—"`).

**11. `src/app/review/[token]/page.tsx`** — the sign-off gap fix (see Risk 8). Add `criteriaRatings?: { criterionId: string; label: string; entrustmentRating: number | null; comment?: string }[]` to the `Observation` interface (lines 10-37) and a render block gated on `observation.trainingSystem === "SMSNA" && observation.criteriaRatings?.length` showing the item labels + 1-5 values. Strictly additive; existing RCPSC/ACGME reviewers see byte-identical output. The API already returns the field (`api/epa/review/[token]/route.ts:58` returns the whole record).

**12. (OPTIONAL) `src/app/(app)/analytics/page.tsx:341-357`** — `{isSmsna ? <SmsnaAssessmentPanel/> : <EpaAnalyticsPanel …/>}` for both the EPAs and Milestones tabs.
**13. (OPTIONAL) `src/components/shared/ProcedurePicker.tsx:32-73`** — append the 6 SMSNA category names to `CATEGORY_ICONS`. Verified: none of the 6 collide with an existing key.

**Not touched (deliberately):** `prisma/schema.prisma`, all `src/app/api/**`, `src/lib/shared/schemas/*`, `src/lib/constants.ts` (`SPECIALTIES` stays 17 entries), `src/lib/procedureLibrary.ts`, `src/components/epa/EpaObservationForm.tsx`, `mobile/**`.

## 4. Gating logic

**Single predicate:** `isSmsnaProfile(profile) ⇔ profile?.trainingCountry === "SMSNA"`, defined once in `src/lib/smsna/gate.ts`.
**Evaluated in exactly 4 client components** — `app/(app)/log/page.tsx`, `components/cases/QuickAddModal.tsx`, `app/(app)/analytics/page.tsx` (optional), `app/onboarding/page.tsx` (write side).
**Evaluated in zero server routes.** The backend stays data-driven: it stores whatever `trainingSystem`/`specialtySlug` the client sends. The one server-side *data* guard is `getSpecialtyEpaData` returning `undefined` for `"SMSNA"`, which is a lookup-table change, not a branch.
Set on write: onboarding step 5 only. Since `trainingCountry` is not editable post-onboarding, note for the owner that today the only way to switch into or out of the SMSNA slot is to re-run onboarding — @builder should flag this rather than silently adding a new settings control.

## 5. Risk list

| # | Path | Risk | Mitigation |
|---|---|---|---|
| 1 | `src/lib/epa/data.ts:6751` | `country="SMSNA"` falls through to `ACGME_MAP` → SMSNA fellow shown ACGME urology EPAs | Change 9 (guard → `undefined`) |
| 2 | `EpaDashboard.tsx:808,907,957` | `isCanadian=false`; after #1 `specialtyEpaData=undefined` → existing graceful empty state at 957. No crash | Optional change 12 replaces the copy |
| 3 | `EpaAnalyticsPanel.tsx:307` | Same call; **@builder MUST verify** the panel tolerates `undefined` the way EpaDashboard does (it lacks the 957-style guard) | Add an early return if absent |
| 4 | `pd-dashboard/[userId]/page.tsx:214` | `getSpecialtyEpaData(specialty, trainingCountry\|\|"CA")` → `undefined` after #1; **@builder MUST verify** downstream null-handling | Guard/early-return if it dereferences |
| 5 | `api/epa/ai-suggest:198-209`, `api/epa/suggest:47-54` | Return `{suggestions:[]}` / 404 JSON — no crash. SMSNA path never calls them (changes 7, 8) | None needed |
| 6 | `api/epa/export:390 stageOf`, `EpaObservationForm:45-61`, `EpaObservationCard:11-18` | `epaId` prefix tests `TTP\|TD\|C\|F`; `"SMSNA-…"` matches none. All three have safe defaults (verified) | None needed |
| 7 | `export-branding.ts:438` → `"—"`; `logbook-print/page.tsx:276-278` prints raw `"SMSNA"` | Cosmetic only | Change 10; logbook-print is already acceptable |
| 8 | `review/[token]/page.tsx:10-37` | Renders `canmedsRatings` but **not `criteriaRatings`** → the attending signing by email would not see the per-item OPRS scores. **Real functional gap** | Change 11 (gated on `trainingSystem === "SMSNA"`, additive) |
| 9 | `api/epa/observations/[id]/submit/route.ts:91-125` + `buildEpaReviewEmail` | Email copy says "EPA"; link/flow work correctly with SMSNA ids | Accept for v1; cosmetic follow-up |
| 10 | `CaseFilters.tsx:55` | `specialtyId="smsna"` not in the specialty filter dropdown → SMSNA cases only reachable via "All" | Accept (adding it to `SPECIALTIES` would leak into 5 other UIs) |
| 11 | `stats.ts:493,507` | Unknown `specialtyName` → bucket "Unknown"; colour falls back to `#6366f1` | Change 8 sets `specialtyName` explicitly |
| 12 | `log/page.tsx:65`, `QuickAddModal.tsx:355` | `SPECIALTIES.find` misses `"smsna"` → silent fallback to `"urology"` → **wrong procedure list** | Changes 7, 8 branch on `isSmsna` **before** the lookup |
| 13 | `QuickAddModal.tsx:398` vs `log/page.tsx:1176` | Pre-existing inverted defaults (`US?ACGME:RCPSC` vs `CA?RCPSC:ACGME`) — differ for `trainingCountry === null` | `resolveTrainingSystem` normalises; @builder must state the chosen default in the PR |
| 14 | `mobile/src/app/(app)/profile.tsx` | Reads `trainingCountry` for display only; no SMSNA awareness | Out of scope — web-only feature; flag to owner |
| 15 | Onboarding | `trainingCountry` has no post-onboarding editor | Flag to owner; do not add UI unilaterally |

## 6. Next steps
- [ ] @api-guardian — **NOT required**. No schema, route, shared-type, `.d.ts`, or OpenAPI/GraphQL change. If @builder finds itself editing `prisma/schema.prisma`, `src/app/api/**`, or `src/lib/shared/schemas/**`, stop and escalate.
- [ ] @builder — implement in the order 1→13 above. Must-verify items are Risks 3, 4, 8.
