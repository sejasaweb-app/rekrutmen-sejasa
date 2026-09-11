-- Migration: Jam Operasional (standby) — dipilih calon mitra saat daftar.
-- Ini acuan jam mitra wajib standby & terima job kalau ada order masuk
-- di jam tersebut; di luar jam itu, mitra bebas (tidak ada kewajiban standby).
-- Jalankan di Supabase SQL Editor. Aman dijalankan di project yang sudah
-- production — cuma nambah 1 kolom baru dengan constraint.

alter table applicants
  add column if not exists jam_operasional text
    check (jam_operasional in ('08:00-17:00', '09:00-18:00'));

comment on column applicants.jam_operasional is
  'Jam standby yang dipilih mitra saat daftar — acuan jam wajib terima job kalau ada order masuk.';
