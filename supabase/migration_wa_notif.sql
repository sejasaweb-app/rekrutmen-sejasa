-- Migration: fitur notifikasi WhatsApp (Fonnte) saat status diubah ke Diterima/Ditolak
-- Jalankan ini di Supabase SQL Editor (project yang sama dengan schema.sql).
-- Aman dijalankan di project yang sudah production — tidak menyentuh tabel lain.

create table if not exists app_settings (
  id int primary key default 1,
  wa_notif_enabled boolean not null default false,
  wa_message_approved text not null default
    'Halo {nama}, selamat! 🎉 Lamaran kamu sebagai *{kategori}* di Sejasa dinyatakan *Diterima*. Tim kami akan segera menghubungi kamu untuk proses selanjutnya. Terima kasih!',
  wa_message_rejected text not null default
    'Halo {nama}, terima kasih sudah melamar sebagai *{kategori}* di Sejasa. Mohon maaf, saat ini kami belum bisa melanjutkan proses lamaranmu. Semoga sukses selalu untuk kesempatan berikutnya!',
  updated_at timestamptz not null default now(),
  constraint app_settings_singleton check (id = 1)
);

insert into app_settings (id) values (1)
  on conflict (id) do nothing;

create or replace function set_app_settings_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_app_settings_updated_at on app_settings;
create trigger trg_app_settings_updated_at
before update on app_settings
for each row execute function set_app_settings_updated_at();

-- RLS: cuma service role (backend) yang boleh akses, sama seperti tabel applicants.
alter table app_settings enable row level security;
-- Tidak ada policy untuk anon/authenticated — akses hanya lewat service role key di API routes.
