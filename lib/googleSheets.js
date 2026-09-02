import { google } from "googleapis";

// Sync data pelamar ke Google Sheet, sebagai backup + biar orang lain bisa
// lihat raw data tanpa perlu akses admin dashboard / Supabase.
//
// Pakai OAuth client yang sama dengan Google Drive (lib/googleDrive.js), jadi
// TIDAK butuh setup auth baru — cukup tambah scope "spreadsheets" ke refresh
// token yang sudah ada (lihat scripts/get-google-refresh-token.js) dan generate
// ulang sekali. Butuh 1 env var tambahan: GOOGLE_SHEET_ID.
//
// Cara kerja: setiap kali pelamar baru masuk atau statusnya diubah, kita
// upsert satu baris di sheet — dicari berdasarkan ID pelamar di kolom A.
// Kalau belum ada barisnya, ditambahkan baru. Kalau sudah ada, ditimpa.

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

function getSheetsClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN,
  });

  return google.sheets({ version: "v4", auth: oauth2Client });
}

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

// Pastikan sheet "Pelamar" ada dan header row-nya sudah benar.
// Dipanggil sekali per proses cold-start biasanya cukup murah untuk diabaikan cache-nya.
async function ensureSheetReady(sheets, spreadsheetId) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const existing = meta.data.sheets.find((s) => s.properties.title === SHEET_NAME);

  if (!existing) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: SHEET_NAME } } }],
      },
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [HEADERS] },
    });
  }
}

/**
 * Tambah atau update satu baris pelamar di Google Sheet.
 * Fire-and-forget di sisi pemanggil — lempar error ke atas, biarkan
 * caller yang decide (biasanya cuma di-log, tidak menggagalkan flow utama).
 * @param {object} applicant - row data lengkap dari Supabase
 */
export async function upsertApplicantRow(applicant) {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  if (!spreadsheetId) {
    throw new Error("GOOGLE_SHEET_ID belum diset di env");
  }

  const sheets = getSheetsClient();
  await ensureSheetReady(sheets, spreadsheetId);

  // Cari row yang sudah ada berdasarkan ID di kolom A
  const idColumn = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A:A`,
  });

  const ids = idColumn.data.values || [];
  const rowIndex = ids.findIndex((row) => row[0] === applicant.id); // -1 kalau belum ada

  const row = toRow(applicant);

  if (rowIndex === -1) {
    // Belum ada -> append baris baru
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${SHEET_NAME}!A:M`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [row] },
    });
  } else {
    // Sudah ada -> timpa baris itu (rowIndex 0-based termasuk header, jadi +1 buat sheet 1-based)
    const targetRow = rowIndex + 1;
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${SHEET_NAME}!A${targetRow}:M${targetRow}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [row] },
    });
  }
}
