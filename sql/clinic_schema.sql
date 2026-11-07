-- ═══════════════════════════════════════════════════════════════════════════
-- HIPPO CLINIC — Schema migration
-- Run AFTER `prisma db push` for the canonical Prisma-generated tables, OR
-- apply this directly to a Supabase project that doesn't run Prisma.
-- This file additionally enables the Supabase Storage bucket and RLS that
-- Prisma cannot manage.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Storage bucket for clinic audio chunks ────────────────────────────────
-- Private. Audio is uploaded by the recording client; transcription jobs
-- read it server-side via the service role.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'clinic-audio',
  'clinic-audio',
  false,
  104857600, -- 100 MB per chunk hard cap
  array['audio/webm','audio/ogg','audio/mp4','audio/mpeg','audio/wav','audio/x-m4a']
)
on conflict (id) do nothing;

-- Storage policies: only owner can read; uploads are signed-URL based.
-- (Service role bypasses RLS for transcription pipeline.)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'clinic_audio_owner_read'
  ) then
    create policy clinic_audio_owner_read on storage.objects
      for select
      using (
        bucket_id = 'clinic-audio'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'clinic_audio_owner_write'
  ) then
    create policy clinic_audio_owner_write on storage.objects
      for insert
      with check (
        bucket_id = 'clinic-audio'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;
end $$;

-- ─── Realtime publication ──────────────────────────────────────────────────
-- Make clinic_transcripts, clinic_notes, clinic_audio_status, and
-- clinic_followup_tasks broadcast on supabase_realtime so the desktop sees
-- the phone's recording live.
alter publication supabase_realtime
  add table clinic_transcripts, clinic_notes, clinic_audio_status,
            clinic_followup_tasks, clinic_encounters;

-- ─── Row-level security ────────────────────────────────────────────────────
-- Owner-only by default. The clinician who created the encounter is the
-- only person who can read their patient data. (Institution-shared access
-- is a Phase 4 feature.)
alter table clinic_patients          enable row level security;
alter table clinic_encounters        enable row level security;
alter table clinic_recording_chunks  enable row level security;
alter table clinic_transcripts       enable row level security;
alter table clinic_encounter_markers enable row level security;
alter table clinic_notes             enable row level security;
alter table clinic_note_versions     enable row level security;
alter table clinic_templates         enable row level security;
alter table clinic_followup_tasks    enable row level security;
alter table clinic_consent_records   enable row level security;
alter table clinic_exports           enable row level security;
alter table clinic_audio_status      enable row level security;
alter table clinic_ai_audit_logs     enable row level security;
alter table clinic_billing_codes       enable row level security;
alter table clinic_billing_suggestions enable row level security;

-- Patients
create policy clinic_patients_owner_all on clinic_patients
  for all using (auth.uid()::text = "ownerUserId")
  with check (auth.uid()::text = "ownerUserId");

-- Encounters
create policy clinic_encounters_owner_all on clinic_encounters
  for all using (auth.uid()::text = "clinicianId")
  with check (auth.uid()::text = "clinicianId");

-- Child rows of encounter — owner check via subquery
create policy clinic_recording_chunks_owner_all on clinic_recording_chunks
  for all using (
    exists (select 1 from clinic_encounters e
            where e.id = clinic_recording_chunks."encounterId"
              and e."clinicianId" = auth.uid()::text)
  )
  with check (
    exists (select 1 from clinic_encounters e
            where e.id = clinic_recording_chunks."encounterId"
              and e."clinicianId" = auth.uid()::text)
  );

create policy clinic_transcripts_owner_all on clinic_transcripts
  for all using (
    exists (select 1 from clinic_encounters e
            where e.id = clinic_transcripts."encounterId"
              and e."clinicianId" = auth.uid()::text)
  )
  with check (
    exists (select 1 from clinic_encounters e
            where e.id = clinic_transcripts."encounterId"
              and e."clinicianId" = auth.uid()::text)
  );

create policy clinic_encounter_markers_owner_all on clinic_encounter_markers
  for all using (
    exists (select 1 from clinic_encounters e
            where e.id = clinic_encounter_markers."encounterId"
              and e."clinicianId" = auth.uid()::text)
  )
  with check (
    exists (select 1 from clinic_encounters e
            where e.id = clinic_encounter_markers."encounterId"
              and e."clinicianId" = auth.uid()::text)
  );

create policy clinic_notes_owner_all on clinic_notes
  for all using (
    exists (select 1 from clinic_encounters e
            where e.id = clinic_notes."encounterId"
              and e."clinicianId" = auth.uid()::text)
  )
  with check (
    exists (select 1 from clinic_encounters e
            where e.id = clinic_notes."encounterId"
              and e."clinicianId" = auth.uid()::text)
  );

create policy clinic_note_versions_owner_all on clinic_note_versions
  for all using (
    exists (select 1 from clinic_encounters e
            where e.id = clinic_note_versions."encounterId"
              and e."clinicianId" = auth.uid()::text)
  )
  with check (
    exists (select 1 from clinic_encounters e
            where e.id = clinic_note_versions."encounterId"
              and e."clinicianId" = auth.uid()::text)
  );

create policy clinic_templates_owner_all on clinic_templates
  for all using ("ownerUserId" is null or auth.uid()::text = "ownerUserId")
  with check (auth.uid()::text = "ownerUserId");

create policy clinic_followup_tasks_owner_all on clinic_followup_tasks
  for all using (auth.uid()::text = "ownerUserId")
  with check (auth.uid()::text = "ownerUserId");

create policy clinic_consent_records_owner_all on clinic_consent_records
  for all using (
    exists (select 1 from clinic_encounters e
            where e.id = clinic_consent_records."encounterId"
              and e."clinicianId" = auth.uid()::text)
  )
  with check (
    exists (select 1 from clinic_encounters e
            where e.id = clinic_consent_records."encounterId"
              and e."clinicianId" = auth.uid()::text)
  );

create policy clinic_exports_owner_all on clinic_exports
  for all using (auth.uid()::text = "ownerUserId")
  with check (auth.uid()::text = "ownerUserId");

create policy clinic_audio_status_owner_all on clinic_audio_status
  for all using (
    exists (select 1 from clinic_encounters e
            where e.id = clinic_audio_status."encounterId"
              and e."clinicianId" = auth.uid()::text)
  )
  with check (
    exists (select 1 from clinic_encounters e
            where e.id = clinic_audio_status."encounterId"
              and e."clinicianId" = auth.uid()::text)
  );

create policy clinic_ai_audit_logs_owner_select on clinic_ai_audit_logs
  for select using (auth.uid()::text = "ownerUserId");

-- Billing codes: global rows (ownerUserId IS NULL) are readable by every
-- authenticated clinician (they're just fee-schedule reference data, not
-- patient PHI). User-added rows are owner-only.
create policy clinic_billing_codes_read on clinic_billing_codes
  for select using ("ownerUserId" is null or auth.uid()::text = "ownerUserId");
create policy clinic_billing_codes_owner_write on clinic_billing_codes
  for all using ("ownerUserId" is not null and auth.uid()::text = "ownerUserId")
  with check ("ownerUserId" is not null and auth.uid()::text = "ownerUserId");

-- Billing suggestions are per-encounter, owner-only.
create policy clinic_billing_suggestions_owner_all on clinic_billing_suggestions
  for all using (auth.uid()::text = "ownerUserId")
  with check (auth.uid()::text = "ownerUserId");
