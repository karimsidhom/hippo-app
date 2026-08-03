# SMSNA Fellowship Slot — Build Report (@builder)

Worktree: `/Users/karimsidhom/Desktop/ClaudeStuff/apps/surgitrack/.claude/worktrees/smsna-fellowship`
Base commit: `a75e3d42`
Implemented changes 1-13 from `reports/v-smsna/01-architect-report.md`, in order, including optional items 5, 12, 13.

## Files Created

| File | Purpose |
|---|---|
| `src/lib/smsna/gate.ts` | `SMSNA_TRAINING_SYSTEM`, `SMSNA_SPECIALTY_SLUG`, `SMSNA_SPECIALTY_NAME`, `isSmsnaProfile()`, `resolveTrainingSystem()` |
| `src/lib/smsna/taxonomy.ts` | `SmsnaCategoryKey`, `SMSNA_CATEGORIES` (6 categories), `getSmsnaProcedures()`, `getSmsnaCategoryByKey/ByName/ForProcedure()` |
| `src/lib/smsna/oprs.ts` | `OPRS_CITATION`, `OPRS_DIFFICULTY`, `OPRS_LIKERT`, `OPRS_GENERAL_ITEMS`, `OPRS_OVERALL_ITEM`, `OPRS_ITEMS_BY_CATEGORY`, `getOprsInstrument()` |
| `src/components/smsna/OprsObservationForm.tsx` | The OPRS grading form (change 4) |
| `src/components/smsna/SmsnaAssessmentPanel.tsx` | Read-only OPRS summary card for analytics (change 5, optional — implemented) |

## Files Modified

| File | Lines (approx, current tree) | Change |
|---|---|---|
| `src/app/onboarding/page.tsx` | 72-76 (`handleFinish` trainingYearLabel), 287-328 (Step 5 card list + onClick) | Change 6 |
| `src/app/(app)/log/page.tsx` | 19-22 (imports), 63-76 (`isSmsna`, slug/name), 119-122 (`showOprs` state), 176-186 (`specialtyProcedures`, `smsnaCategory`), 278-286 (`doSubmit` skip), 571-611 (specialty chip wrap), 1210 (`trainingSystem` fix), 1230-1287 (OPRS modal block) | Change 7 |
| `src/components/cases/QuickAddModal.tsx` | 24-26 (imports), 85-99 (`showOprs`, `isSmsna`, `effectiveSlug`, `procedures`), 121-124 (specialtyId/Name), 167-176 (skip on success), 197-236 (skip on error, reqBody), 339-344 (`resetForm`, guard), 419-424 (`trainingSystem` fix), 439-499 (new OPRS early-return block), 567-608 (specialty chip wrap) | Change 8 |
| `src/lib/epa/data.ts` | 6751-6766 (`getSpecialtyEpaData` guard) | Change 9 |
| `src/lib/export-branding.ts` | 438-443 (`trainingSystemLabel`) | Change 10 |
| `src/app/review/[token]/page.tsx` | 10-38 (`Observation.criteriaRatings`), 433-468 (new render block) | Change 11 |
| `src/app/(app)/analytics/page.tsx` | 22-24 (imports), 54-56 (`isSmsna`), 342-368 (EPAs/Milestones tab gating) | Change 12 (optional, implemented) |
| `src/components/shared/ProcedurePicker.tsx` | 70-74 (`CATEGORY_ICONS`) | Change 13 (optional, implemented) |

`git status --porcelain` confirms only these 8 modified + 5 created files (plus the pre-existing untracked `node_modules` symlink and `reports/`, both present before I started). No file outside the spec's allow-list was touched. `prisma/schema.prisma`, `src/app/api/**`, `src/lib/shared/schemas/**`, `src/lib/constants.ts` (SPECIALTIES still 17 entries), `src/lib/procedureLibrary.ts` (PROCEDURE_LIBRARY untouched), `src/components/epa/EpaObservationForm.tsx`, and `mobile/**` were not edited.

## resolveTrainingSystem decision

Implemented exactly as the architect's recommendation:

```ts
export function resolveTrainingSystem(
  p?: { trainingCountry?: string | null } | null,
  fallback: "ACGME" | "RCPSC" = "ACGME",
): "SMSNA" | "RCPSC" | "ACGME" {
  const country = p?.trainingCountry;
  if (country === SMSNA_TRAINING_SYSTEM) return "SMSNA";
  if (country === "CA") return "RCPSC";
  if (country === "US") return "ACGME";
  return fallback;
}
```

- `log/page.tsx:1210` calls `resolveTrainingSystem(profile)` — default fallback `"ACGME"`, matching its pre-existing `trainingCountry === "CA" ? "RCPSC" : "ACGME"` behaviour byte-for-byte for `undefined`/`null`/`"US"`.
- `QuickAddModal.tsx:421` calls `resolveTrainingSystem(profile, "RCPSC")` — matching its pre-existing (inverted) `trainingCountry === "US" ? "ACGME" : "RCPSC"` behaviour byte-for-byte for `undefined`/`null`/`"CA"`.
- Both call sites are therefore behaviour-identical to before this feature for every existing (non-SMSNA) user. Verified no other call sites derive `trainingSystem` from `trainingCountry` inline (the other 3 locations — `EpaDashboard.tsx`, `EpaAnalyticsPanel.tsx` x2 — use the separate `isCanadian = !trainingCountry || trainingCountry === "CA"` pattern, which is untouched and out of scope per the spec).

## Risk verification (Risks 3, 4, 8)

**Risk 3 — `EpaAnalyticsPanel.tsx` undefined tolerance.** Read the full component. Its `specialtyEpaData` useMemo already does `if (!raw) return undefined;` immediately after calling `getSpecialtyEpaData`, and the component has an identical "coming soon" empty-state guard to `EpaDashboard.tsx`'s line-957 pattern, at its own line ~478: `if (!specialtyEpaData && !foundationsEpaData) { return <...coming soon...> }`. For an SMSNA profile, `isCanadian = !trainingCountry || trainingCountry==="CA"` evaluates `false` (trainingCountry is `"SMSNA"`, neither falsy nor `"CA"`), so `foundationsEpaData` is `undefined`, and `getSpecialtyEpaData(specialty, "SMSNA")` now returns `undefined` (change 9) so `specialtyEpaData` is also `undefined`. Both are undefined → the existing empty-state renders, no crash. **Verdict: already safe as-is — the architect's note that it "lacks the 957-style guard" does not match the code in this commit; no fix was needed.** With change 12 (optional) in place, an SMSNA fellow never actually reaches `EpaAnalyticsPanel` anyway — `SmsnaAssessmentPanel` renders instead.

**Risk 4 — `pd-dashboard/[userId]/page.tsx` undefined tolerance.** `const specialtyData = resident.specialty ? getSpecialtyEpaData(resident.specialty, resident.trainingCountry || "CA") : undefined;` — for an SMSNA resident this now returns `undefined` (change 9). The only consumer is `{specialtyData && (<EpaHeatmap .../>)}`, which short-circuits cleanly. **Verdict: already safe as-is; no fix needed; file not modified** (it is not in the spec's allow-list of files to change, and none was required).

**Risk 8 — `review/[token]/page.tsx` `criteriaRatings` gap.** Confirmed real: the `Observation` interface had no `criteriaRatings` field and there was no render block for it, only `canmedsRatings`. Also confirmed the API (`api/epa/review/[token]/route.ts:58`, read-only, not modified) returns `observation: notification.epaObservation` — the full Prisma record, `criteriaRatings` included, no `select`. **Fixed** by change 11: added the field to the `Observation` interface and an additive render block gated on `observation.trainingSystem === "SMSNA" && observation.criteriaRatings?.length`, placed between the existing CanMEDS block and the safety/professionalism flags block. RCPSC/ACGME reviewers (`trainingSystem` never `"SMSNA"` for them) see byte-identical output — verified by reading the full diff.

## Deviations / judgment calls (flagged for @validator and the owner)

1. **SMSNA procedure list content is unverified against source.** Change 2's spec text says the taxonomy should be "verbatim from the Mayo Q2-2026 form," but that form was not included anywhere in the architect spec handed to me. I built clinically-reasonable procedure lists (10-12 per category) using standard SMSNA/andrology fellowship case-log nomenclature so the build wasn't blocked, and flagged this in a code comment at the top of `src/lib/smsna/taxonomy.ts`. **This needs a human pass against the actual Mayo Q2-2026 form before it ships to real fellows** — the OPRS grading item banks (change 3) were fully specified in the spec text and were transcribed verbatim; only the raw procedure *names* (change 2) are the unverified part.

2. **QuickAddModal procedure list — resolved a spec inconsistency.** Change 8's spec text says "use `effectiveSlug`" at line 88 (the `getProceduresBySpecialty` call) with no explicit branch to `getSmsnaProcedures()`, unlike change 7 for `log/page.tsx` which explicitly says `isSmsna ? getSmsnaProcedures() : getProceduresBySpecialty(...)`. Taking change 8 literally would make `getProceduresBySpecialty(SMSNA_SPECIALTY_SLUG)` return `[]` (SMSNA procedures are deliberately never appended to `PROCEDURE_LIBRARY`, per change 2), leaving an SMSNA fellow with an empty procedure picker in Quick Add. I implemented `const procedures = isSmsna ? getSmsnaProcedures() : getProceduresBySpecialty(effectiveSlug);`, mirroring the log page's explicit and clearly-intentional pattern. This is the only place I deviated from a literal spec instruction; the deviation makes the feature actually work and is consistent with every other part of the spec (the `getSmsnaProcedures()` adapter exists specifically to feed `ProcedurePicker`).

3. **OPRS form render-order adaptation.** The Assessment Context grid in the original `EpaObservationForm` includes a "Case Complexity" (Low/Normal/High) select and a conditional "Technique" select (from `epaDefinition.techniqueOptions`). Neither applies to OPRS: complexity is replaced by the dedicated 3-point OPRS difficulty scale (rendered first, per the spec's explicit render-order contract), and technique is the fixed, already-known `procedureName` (shown in the header), not a dropdown. The Assessment Context grid was trimmed to Assessor Role / Assessor Name / Basis of Assessment / Date accordingly — this is a direct, necessary consequence of the spec's own render-order and `buildInput()` field mapping, not an independent judgment call.

4. **Onboarding "Skip for now" button** (bottom of step 10) does not set `trainingYearLabel` for any pathway (SMSNA or otherwise) — that was already true before this change and is out of the spec's named line (75, in `handleFinish` only). Not touched.

5. **`trainingCountry` remains non-editable post-onboarding** (spec Risk 15) — flagging per spec instruction rather than adding a settings control unilaterally. The only way into or out of the SMSNA pathway today is re-running onboarding.

## Quality Gates

- **`npx tsc --noEmit`**: baseline (before any edits) = 0 errors. After all 13 changes = **0 errors, 0 new errors.** Ran twice to confirm (final run after all edits, output captured below).
- **`npx next lint --dir src/lib/smsna --dir src/components/smsna`**: **could not run.** This repo is on Next `^16.2.2`, which removed the `next lint` subcommand entirely (`next lint --help` → `error: unknown option '--dir'`; `next --help` lists no `lint` command at all). There is also no root ESLint config (`npx eslint src/lib/smsna src/components/smsna` → "No files matching the pattern... found" / no config resolved; only `mobile/.eslintrc.json` exists, which is for the excluded mobile app). `npm run lint` (→ `next lint`) is therefore already broken on `main` at this Next version, independent of this feature — **skipped per the fallback instruction, and flagged here rather than silently claiming a pass.**
- **`git status --porcelain`**: change set is exactly 8 modified files + 5 newly created files under `src/lib/smsna/` and `src/components/smsna/`, matching the spec's file list precisely. `node_modules` (symlink) and `reports/` were already untracked before I started (confirmed via the initial `git status --porcelain` I ran before any edits).

```
$ npx tsc --noEmit
(zero output, exit 0)
```

## Ready for @validator and @tester

Everything in changes 1-13 is implemented, gated behind `isSmsnaProfile(profile)`, and typechecks clean. The two items flagged above (SMSNA procedure-name content unverified against the real Mayo form; one literal-spec-vs-log-page inconsistency resolved in QuickAddModal) are the only open items — neither blocks typecheck/build, both are documented in-code and here for a deliberate human decision.
