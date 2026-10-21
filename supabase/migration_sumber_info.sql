-- Migration: Sumber Info — "Dapat info pendaftaran dari mana?" (dropdown di form daftar).
-- Jalankan di Supabase SQL Editor SEBELUM deploy kode baru. Aman dijalankan di
-- project yang sudah production — cuma nambah 1 kolom nullable (data lama = NULL).

alter table applicants
  add column if not exists sumber_info text
    check (sumber_info in ('whatsapp', 'facebook', 'teman', 'lainnya'));

comment on column applicants.sumber_info is
  'Asal info pendaftaran yang dipilih calon mitra: whatsapp / facebook / teman / lainnya.';

create index if not exists idx_applicants_sumber_info on applicants(sumber_info);
