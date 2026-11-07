-- Hippo Clinic — Reverse migration for HippoVFinal.
-- Paste into Supabase SQL editor for project nitdinoerkzgoozpucgm.
-- Drops everything the additive clinic migration added; touches no
-- existing tables/data.

alter table if exists "clinic_ai_audit_logs"      drop constraint if exists "clinic_ai_audit_logs_encounterId_fkey";
alter table if exists "clinic_audio_status"       drop constraint if exists "clinic_audio_status_encounterId_fkey";
alter table if exists "clinic_exports"            drop constraint if exists "clinic_exports_encounterId_fkey";
alter table if exists "clinic_consent_records"    drop constraint if exists "clinic_consent_records_encounterId_fkey";
alter table if exists "clinic_followup_tasks"     drop constraint if exists "clinic_followup_tasks_encounterId_fkey";
alter table if exists "clinic_note_versions"      drop constraint if exists "clinic_note_versions_encounterId_fkey";
alter table if exists "clinic_note_versions"      drop constraint if exists "clinic_note_versions_noteId_fkey";
alter table if exists "clinic_notes"              drop constraint if exists "clinic_notes_encounterId_fkey";
alter table if exists "clinic_encounter_markers"  drop constraint if exists "clinic_encounter_markers_encounterId_fkey";
alter table if exists "clinic_transcripts"        drop constraint if exists "clinic_transcripts_encounterId_fkey";
alter table if exists "clinic_recording_chunks"   drop constraint if exists "clinic_recording_chunks_encounterId_fkey";
alter table if exists "clinic_encounters"         drop constraint if exists "clinic_encounters_patientId_fkey";

do $$
begin
  begin
    alter publication supabase_realtime drop table clinic_transcripts, clinic_notes, clinic_audio_status, clinic_followup_tasks, clinic_encounters;
  exception when others then null;
  end;
end $$;

drop table if exists "clinic_ai_audit_logs"       cascade;
drop table if exists "clinic_billing_suggestions" cascade;
drop table if exists "clinic_billing_codes"       cascade;
drop table if exists "clinic_audio_status"        cascade;
drop table if exists "clinic_exports"             cascade;
drop table if exists "clinic_consent_records"     cascade;
drop table if exists "clinic_followup_tasks"      cascade;
drop table if exists "clinic_templates"           cascade;
drop table if exists "clinic_note_versions"       cascade;
drop table if exists "clinic_notes"               cascade;
drop table if exists "clinic_encounter_markers"   cascade;
drop table if exists "clinic_transcripts"         cascade;
drop table if exists "clinic_recording_chunks"    cascade;
drop table if exists "clinic_encounters"          cascade;
drop table if exists "clinic_patients"            cascade;

drop type if exists "ClinicChunkStatus";
drop type if exists "ClinicFollowUpStatus";
drop type if exists "ClinicConsentMode";
drop type if exists "ClinicNoteStatus";
drop type if exists "ClinicInputMode";
drop type if exists "ClinicNoteType";

do $$
begin
  drop policy if exists clinic_audio_owner_read on storage.objects;
  drop policy if exists clinic_audio_owner_write on storage.objects;
exception when others then null;
end $$;

-- Bucket itself: delete via Supabase Dashboard → Storage → clinic-audio → delete bucket.
-- (Postgres-level DELETE on storage.buckets is blocked by Supabase trigger.)
