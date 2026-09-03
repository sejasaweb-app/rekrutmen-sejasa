-- Migration: e-sign kontrak kemitraan, terintegrasi ke tabel applicants yang sudah ada.
-- Jalankan ini di Supabase SQL Editor (project yang sama dengan schema.sql).
-- Aman dijalankan di project yang sudah production — cuma nambah kolom & tabel baru.

alter table applicants
  add column if not exists contract_status text
    check (contract_status in ('belum_dibuat', 'menunggu_ttd', 'ditandatangani'))
    default 'belum_dibuat',
  add column if not exists contract_token uuid,
  add column if not exists contract_tanggal date,          -- tanggal yang dicetak di kontrak, dipakai lagi saat regenerate PDF sebelum di-lock
  add column if not exists contract_url_unsigned text,      -- link Google Drive, PDF sebelum ttd
  add column if not exists contract_url_signed text,        -- link Google Drive, PDF final setelah ttd
  add column if not exists contract_hash text,               -- sha256 dari PDF final, buat audit
  add column if not exists contract_sent_at timestamptz,
  add column if not exists contract_signed_at timestamptz;

create unique index if not exists idx_applicants_contract_token
  on applicants(contract_token) where contract_token is not null;

-- Toggle "kirim kontrak otomatis begitu status = approved" + template pesan WA-nya.
-- Default OFF — admin klik tombol "Kirim Kontrak" manual di halaman detail pelamar.
alter table app_settings
  add column if not exists contract_auto_send_enabled boolean not null default false,
  add column if not exists wa_message_contract text not null default
    'Halo {nama}, selamat bergabung sebagai *{kategori}* di Sejasa! Sebelum mulai, mohon baca & tanda tangani kontrak kemitraan lewat link berikut ya:

{link}

Kalau ada pertanyaan soal isi kontrak, langsung hubungi tim kami.';
