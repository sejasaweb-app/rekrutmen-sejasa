/**
 * Script SEKALI JALAN buat backfill semua data pelamar yang SUDAH ADA di
 * Supabase (sebelum fitur sync Google Sheet ini di-deploy) ke Google Sheet.
 *
 * Setelah ini dijalankan sekali, sinkronisasi selanjutnya berjalan otomatis
 * setiap ada pendaftar baru / perubahan status (lihat lib/googleSheets.js).
 * Aman dijalankan berkali-kali — upsert berdasarkan ID, jadi tidak akan
 * membuat baris duplikat.
 *
 * Cara pakai:
 *   1. Pastikan .env.local sudah lengkap: SUPABASE env vars,
 *      GOOGLE_OAUTH_* (dengan scope spreadsheets), dan GOOGLE_SHEET_ID.
 *   2. Jalankan: node scripts/backfill-sheet.js
 */

require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");
const { google } = require("googleapis");

const SHEET_NAME = "Pelamar";

const HEADERS = [
  "ID",
  "Nama",
  "Email",
  "No. Telp",
  "Gender",
  "Domisili",
  "Kategori",
  "Status",
  "Punya Motor",
  "Catatan Admin",
  "Alasan Penolakan",
  "Tanggal Daftar",
  "Terakhir Diupdate",
];

const KATEGORI_LABELS = { massage: "Massage Therapist", daily_cleaning: "Daily Cleaning" };
const STATUS_LABELS = {
  submitted: "Baru Daftar",
  screening: "Screening",
  onboarding: "Onboarding",
  approved: "Diterima",
  rejected: "Ditolak",
};

function toRow(applicant) {
  return [
    applicant.id,
    applicant.nama || "",
    applicant.email || "",
    applicant.no_telp || "",
    applicant.gender || "",
    applicant.domisili || "",
    KATEGORI_LABELS[applicant.kategori] || applicant.kategori || "",
    STATUS_LABELS[applicant.status] || applicant.status || "",
    applicant.punya_motor ? "Ya" : "Tidak",
    applicant.catatan_admin || "",
    applicant.alasan_penolakan || "",
    applicant.created_at ? new Date(applicant.created_at).toLocaleString("id-ID") : "",
    new Date().toLocaleString("id-ID"),
  ];
}

async function main() {
  const {
    NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    GOOGLE_OAUTH_CLIENT_ID,
    GOOGLE_OAUTH_CLIENT_SECRET,
    GOOGLE_OAUTH_REFRESH_TOKEN,
    GOOGLE_SHEET_ID,
  } = process.env;

  const missing = Object.entries({
    NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    GOOGLE_OAUTH_CLIENT_ID,
    GOOGLE_OAUTH_CLIENT_SECRET,
    GOOGLE_OAUTH_REFRESH_TOKEN,
    GOOGLE_SHEET_ID,
  })
    .filter(([, v]) => !v)
    .map(([k]) => k);

  if (missing.length) {
    console.error(`\nEnv var belum lengkap di .env.local: ${missing.join(", ")}\n`);
    process.exit(1);
  }

  // --- Ambil semua data pelamar dari Supabase ---
  const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  console.log("Mengambil data pelamar dari Supabase...");
  const { data: applicants, error } = await supabase
    .from("applicants")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Gagal ambil data dari Supabase:", error.message);
    process.exit(1);
  }

  if (!applicants || applicants.length === 0) {
    console.log("Tidak ada data pelamar di Supabase. Selesai, tidak ada yang perlu di-backfill.");
    return;
  }

  console.log(`Ditemukan ${applicants.length} pelamar. Menyiapkan Google Sheet...`);

  // --- Setup Google Sheets client ---
  const oauth2Client = new google.auth.OAuth2(GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET);
  oauth2Client.setCredentials({ refresh_token: GOOGLE_OAUTH_REFRESH_TOKEN });
  const sheets = google.sheets({ version: "v4", auth: oauth2Client });

  // Pastikan tab "Pelamar" ada
  const meta = await sheets.spreadsheets.get({ spreadsheetId: GOOGLE_SHEET_ID });
  const existingSheet = meta.data.sheets.find((s) => s.properties.title === SHEET_NAME);

  if (!existingSheet) {
    console.log(`Tab "${SHEET_NAME}" belum ada, membuat tab baru...`);
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: GOOGLE_SHEET_ID,
      requestBody: { requests: [{ addSheet: { properties: { title: SHEET_NAME } } }] },
    });
  }

  // Tulis ulang header + semua data sekaligus (lebih cepat & simpel daripada
  // upsert satu-satu untuk backfill besar; aman karena ini overwrite penuh
  // dari data Supabase yang merupakan sumber kebenaran).
  const rows = applicants.map(toRow);

  console.log(`Menulis ${rows.length} baris ke tab "${SHEET_NAME}"...`);

  await sheets.spreadsheets.values.clear({
    spreadsheetId: GOOGLE_SHEET_ID,
    range: `${SHEET_NAME}!A:M`,
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: GOOGLE_SHEET_ID,
    range: `${SHEET_NAME}!A1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [HEADERS, ...rows] },
  });

  console.log(`\nSelesai! ${rows.length} data pelamar berhasil di-backfill ke Google Sheet.`);
  console.log(`Buka: https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/edit\n`);
}

main().catch((err) => {
  console.error("Backfill gagal:", err);
  process.exit(1);
});
