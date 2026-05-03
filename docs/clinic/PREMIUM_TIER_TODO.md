# Hippo Clinic — Premium-tier improvement opportunities

When you revisit pricing for Hippo Clinic, this is the consolidated list of
free-tier compromises that a paid tier should improve. Search the codebase
for `PREMIUM-TIER TODO` to find each one in context.

## 1. Speech-to-text — eliminate the rate-limit fallback

**Current free tier:** Groq's `whisper-large-v3-turbo` (free, but ~7,200
audio-seconds/min/org soft limit).

**What happens at the limit:** the chunk-upload route catches the 429 and
stops marking chunks as FAILED — instead it sets a `qualityWarning` on
`clinic_audio_status` ("Server transcription rate-limited — using device
dictation") and the recorder's parallel browser/phone SpeechRecognition
becomes the sole transcript source for that segment. No data is lost, but
accuracy drops in noisy clinics, and speaker labels are unavailable on
browser STT.

**Paid-tier improvements:**

- Dedicated OpenAI Whisper (`whisper-1` at $0.006/audio-min) so high-volume
  clinicians never get downgraded to browser STT.
- Or self-hosted `faster-whisper` on a single GPU box — fixed cost ceiling
  for unlimited audio, and the data never leaves your infrastructure.
- Speaker diarisation (Deepgram Nova-2 / AssemblyAI / pyannote) so the
  transcript can attribute each utterance to clinician vs. patient. This
  sharpens the medico-legal audit trail and makes the "said by patient"
  vs. "AI inferred" guardrail crisper.
- Real-time streaming transcription (Deepgram, Soniox) instead of chunked
  10s batches — the desktop view sees a true word-by-word feed.

**Files to revisit:** `src/lib/clinic/whisper.ts`,
`src/app/api/clinic/encounters/[id]/chunk/route.ts`.

## 2. Note-generation model

**Current free tier:** Groq's `llama-3.3-70b-versatile`.

**What it lacks:** strict JSON schema validation isn't natively enforced —
we rely on the prompt and `response_format: { type: "json_object" }`. Long
clinics with complex visits sometimes hit the response-token cap.

**Paid-tier improvements:**

- Anthropic Claude (Sonnet/Opus) for higher fidelity on subtle clinical
  reasoning + much better structured-output guarantees.
- Or OpenAI `gpt-4o` with strict structured outputs for guaranteed schema
  compliance.
- Higher max-token budgets so the 4-paragraph note never truncates on a
  long encounter.

**Files to revisit:** `src/lib/clinic/llm.ts`, `src/lib/clinic/prompts.ts`.

## 3. Storage retention + audit retention

**Current default:** Audio is deleted after transcription confirmation
(safest under PHIA). Audit-logs live in Postgres alongside operational data.

**Paid-tier improvements:**

- Configurable audio retention (e.g. 30/90/365 days for medico-legal
  defence) backed by a separate cold storage bucket.
- Audit-log export to immutable storage (S3 Object Lock / Supabase Storage
  with versioning + write-once policies) so the audit trail is tamper-proof
  even if Postgres is compromised.

## 4. Provincial billing tables

**Current state:** schema accepts uploaded fee schedules; ships empty.

**Paid-tier improvements:**

- Bundle validated fee schedules for MB / ON / AB / BC and keep them
  current (monthly diff against the official manuals). Liability-wise
  you'd want indemnification provisions, so this becomes a paid-tier
  feature.
- Add a "billing review" workflow where suggested codes route to admin
  staff for confirmation before submission.

## 5. Multi-clinician / institution features

**Current state:** RLS is owner-only — every encounter belongs to exactly
one clinician.

**Paid-tier improvements:**

- Institution-scoped sharing (resident's note shows up in attending's
  inbox for sign-off, mirroring the existing Hippo Log EPA flow).
- Clinic-wide template libraries.
- Aggregated follow-up dashboards for admin teams.
- Group billing reports.

## 6. EHR integrations

Free tier ships PDF + EHR-paste export. Paid tier should add:
- HL7 / FHIR push to Oscar / Accuro / Epic.
- Direct PowerChart / Cerner integrations via SMART-on-FHIR.
- One-click "send to referring physician" via secure messaging.
