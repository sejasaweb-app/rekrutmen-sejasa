-- Migration: audit trail multi-admin — nyatet SIAPA (email) yang melakukan
-- perubahan status, catatan, dan follow-up. Kolom "changed_by" di
-- status_history sebenarnya sudah ada dari schema.sql awal, tapi belum
-- pernah diisi (trigger log_status_change() cuma isi from_status/to_status).
-- Migration ini TIDAK mengubah trigger — API route yang akan mengisi kolom
-- changed_by secara manual setelah trigger jalan.
-- Jalankan di Supabase SQL Editor. Aman dijalankan di project yang sudah
-- production — cuma nambah kolom baru.

-- Nyatet siapa admin yang terakhir update data mitra ini (status/catatan/dst),
-- selalu keisi walau cuma edit catatan tanpa ganti status.
alter table applicants
  add column if not exists updated_by text;

comment on column applicants.updated_by is
  'Email admin yang terakhir update data mitra ini.';

-- Nyatet siapa admin yang mencatat follow-up ini.
alter table contact_logs
  add column if not exists created_by text;

comment on column contact_logs.created_by is
  'Email admin yang mencatat follow-up ini.';
