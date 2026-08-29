-- Mitra Sejasa recruitment schema
-- Jalankan ini di Supabase SQL Editor

create extension if not exists "pgcrypto";

create type applicant_category as enum ('massage', 'daily_cleaning');
create type applicant_status as enum (
  'submitted',
  'screening',
  'interview',
  'trial',
  'approved',
  'rejected'
);

create table applicants (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  email text not null,
  no_telp text not null,
  gender text not null check (gender in ('male', 'female')),
  domisili text not null,
  kategori applicant_category not null,
  punya_motor boolean not null default false,
  file_url text,               -- link Google Drive ke sertifikat/paklaring
  file_name text,
  status applicant_status not null default 'submitted',
  catatan_admin text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_applicants_status on applicants(status);
create index idx_applicants_kategori on applicants(kategori);
create index idx_applicants_created_at on applicants(created_at desc);

-- Riwayat perubahan status, buat funnel report
create table status_history (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references applicants(id) on delete cascade,
  from_status applicant_status,
  to_status applicant_status not null,
  changed_by text,              -- email admin yang ubah
  note text,
  created_at timestamptz not null default now()
);

create index idx_status_history_applicant on status_history(applicant_id);

-- Trigger: auto-update updated_at
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_applicants_updated_at
before update on applicants
for each row execute function set_updated_at();

-- Trigger: catat setiap perubahan status ke status_history otomatis
create or replace function log_status_change()
returns trigger as $$
begin
  if (tg_op = 'UPDATE' and old.status is distinct from new.status) then
    insert into status_history (applicant_id, from_status, to_status)
    values (new.id, old.status, new.status);
  elsif (tg_op = 'INSERT') then
    insert into status_history (applicant_id, from_status, to_status)
    values (new.id, null, new.status);
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_log_status_change
after insert or update on applicants
for each row execute function log_status_change();

-- Row Level Security: public cuma bisa insert (submit form), admin (service role) full access
alter table applicants enable row level security;
alter table status_history enable row level security;

create policy "public can submit application"
  on applicants for insert
  to anon
  with check (true);

-- Untuk baca/update/delete, pakai service role key dari backend (bypass RLS),
-- jadi tidak perlu policy tambahan untuk anon di sini.
