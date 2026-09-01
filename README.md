# Mitra Sejasa — Recruitment App

Web app pendaftaran mitra Sejasa (kategori Massage & Daily Cleaning) dengan sisi
publik (form apply) dan sisi admin (dashboard + status tracking).

**Stack:** Next.js 14 (App Router) · Supabase (Postgres + Auth) · Google Drive API (storage sertifikat) · Tailwind CSS · Vercel (hosting, gratis)

## 1. Setup Supabase

1. Buat project baru di [supabase.com](https://supabase.com) (gratis).
2. Buka **SQL Editor**, jalankan isi file `supabase/schema.sql`.
3. Buka **Authentication > Users**, tambahkan user admin manual (email + password)
   buat login ke `/admin`.
4. Ambil `Project URL`, `anon public key`, dan `service_role key` dari
   **Project Settings > API**.

## 2. Setup Google Drive (OAuth — pakai akun Google pribadi lu)

> Kenapa OAuth, bukan Service Account? Karena Service Account **tidak punya
> storage quota sendiri** di My Drive biasa — Google cuma izinkan mereka upload
> ke Shared Drive, yang butuh akun Google Workspace berbayar. Dengan OAuth,
> aplikasi upload "atas nama" akun Google pribadi lu, jadi makan kuota 15GB
> yang lu punya.

1. Buka [Google Cloud Console](https://console.cloud.google.com), pakai project yang sama seperti sebelumnya (atau buat baru).
2. Aktifkan **Google Drive API** (APIs & Services > Enable APIs) kalau belum.
3. Buka **APIs & Services > OAuth consent screen**:
   - User Type: **External**
   - Isi nama app (bebas, misal "Mitra Sejasa"), email support, email developer contact
   - Di bagian **Test users**, tambahkan email Google lu sendiri (akun yang 15GB itu)
   - Simpan
4. Buka **APIs & Services > Credentials** > **Create Credentials** > **OAuth client ID**:
   - Application type: **Web application**
   - Authorized redirect URIs, tambahkan: `http://localhost:53682/oauth2callback`
   - Klik Create, copy **Client ID** dan **Client Secret**
5. Isi ke `.env.local`:
   ```
   GOOGLE_OAUTH_CLIENT_ID=...
   GOOGLE_OAUTH_CLIENT_SECRET=...
   ```
6. Jalankan script satu kali buat dapetin refresh token:
   ```bash
   node scripts/get-google-refresh-token.js
   ```
   Buka link yang muncul di terminal, login pakai akun Google lu (yang 15GB), klik Allow.
   Terminal bakal nampilin `GOOGLE_OAUTH_REFRESH_TOKEN=...` — copy itu ke `.env.local`.

   > Kalau di step ini muncul warning "Google hasn't verified this app", klik
   > **Advanced > Go to (nama app) (unsafe)** — wajar karena app-nya belum
   > disubmit buat verifikasi publik Google, dan ini cuma dipakai sendiri.

7. Buat folder baru di Google Drive lu (folder biasa aja, ga perlu di-share ke siapa-siapa karena upload dilakukan atas nama akun lu sendiri).
8. Ambil Folder ID dari URL folder itu (`drive.google.com/drive/folders/INI_FOLDER_ID`), isi ke:
   ```
   GOOGLE_DRIVE_FOLDER_ID=...
   ```

## 3. Setup Fonnte (notifikasi WhatsApp otomatis)

1. Daftar/login ke [fonnte.com](https://fonnte.com), tambah device (scan QR pakai
   nomor WA yang mau dipakai buat kirim notifikasi ke pelamar).
2. Buka menu **Device**, copy **Token** device tersebut.
3. Isi ke `.env.local` (dan nanti ke Environment Variables Vercel):
   ```
   FONNTE_TOKEN=...
   ```
4. Jalankan migration tambahan di **SQL Editor** Supabase: isi file
   `supabase/migration_wa_notif.sql` (bikin tabel `app_settings`).
5. Login ke `/admin/settings`, aktifkan toggle notifikasi dan sesuaikan isi
   pesan buat status Diterima/Ditolak (bisa pakai placeholder `{nama}`,
   `{kategori}`, `{domisili}`).

Fitur ini aman dinonaktifkan kapan saja lewat toggle di halaman Settingan —
kalau nonaktif, update status jalan seperti biasa tanpa kirim WA.

## 4. Jalankan lokal

```bash
cp .env.example .env.local
# isi semua env var di .env.local

npm install
npm run dev
```

- Form publik: `http://localhost:3000/apply`
- Admin: `http://localhost:3000/admin/login`

## 5. Deploy (gratis)

1. Push repo ini ke GitHub.
2. Buka [vercel.com](https://vercel.com), import repo GitHub-nya.
3. Isi semua environment variable yang sama seperti `.env.local` di
   Vercel Project Settings > Environment Variables.
4. Deploy. Selesai — Vercel auto-deploy tiap ada push ke `main`.

## Struktur Folder

```
app/
  page.js                     landing page
  apply/page.js                form pendaftaran publik
  admin/
    login/page.js               login admin
    layout.js                   auth guard + sidebar
    page.js                     dashboard (rekapan + list + filter)
    applicants/[id]/page.js     detail applicant + update status
    settings/page.js             toggle & edit pesan notifikasi WA
  api/
    applicants/route.js          POST submit, GET list (+filter)
    applicants/[id]/route.js     GET detail, PATCH update status/catatan (trigger WA notif)
    settings/route.js            GET/PATCH settingan notifikasi WA
    upload/route.js              upload file ke Google Drive
    dashboard/summary/route.js   rekapan angka buat dashboard
lib/
  supabaseClient.js            koneksi Supabase (public & admin)
  googleDrive.js                upload helper ke Google Drive
  fonnte.js                     helper kirim WA via Fonnte
supabase/
  schema.sql                    schema DB + trigger status_history
  migration_wa_notif.sql        tabel app_settings buat fitur notifikasi WA
```

## Alur Status Applicant

`submitted` → `screening` → `interview` → `trial` → `approved` / `rejected`

Setiap perubahan status otomatis tercatat di tabel `status_history` (lewat
trigger DB), jadi nanti bisa dipakai buat laporan funnel/conversion rate
tanpa kerja tambahan.

## Belum termasuk (next steps)

- Notifikasi email otomatis pas status berubah
- Export data ke Excel/CSV
- Role admin lebih dari satu level
- Cek duplikat pendaftar (email/no telp yang sama)
