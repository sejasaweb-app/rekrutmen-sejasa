/**
 * Script SEKALI JALAN buat dapetin Google OAuth refresh token.
 * Ga masuk ke aplikasi utama, cuma dipakai manual di terminal buat setup awal.
 *
 * Cara pakai:
 *   1. Isi GOOGLE_OAUTH_CLIENT_ID dan GOOGLE_OAUTH_CLIENT_SECRET di .env.local dulu
 *      (lihat README bagian "Setup Google Drive (OAuth)")
 *   2. Jalankan: node scripts/get-google-refresh-token.js
 *   3. Buka link yang muncul di terminal, login pakai akun Google yang 15GB itu,
 *      klik Allow.
 *   4. Copy "refresh token" yang muncul di terminal, taruh ke .env.local sebagai
 *      GOOGLE_OAUTH_REFRESH_TOKEN
 */

require("dotenv").config({ path: ".env.local" });
const { google } = require("googleapis");
const readline = require("readline");
const http = require("http");
const url = require("url");

const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:53682/oauth2callback";
const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "\nGOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET belum diisi di .env.local\n"
  );
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent", // paksa Google selalu kasih refresh_token, bukan cuma access_token
  scope: SCOPES,
});

console.log("\nBuka link ini di browser, login pakai akun Google (yang 15GB storage-nya):\n");
console.log(authUrl + "\n");

const server = http
  .createServer(async (req, res) => {
    if (!req.url.startsWith("/oauth2callback")) return;

    const qs = new url.URL(req.url, REDIRECT_URI).searchParams;
    const code = qs.get("code");

    res.end("Berhasil! Kembali ke terminal ya, bro.");
    server.close();

    const { tokens } = await oauth2Client.getToken(code);

    console.log("\n=== SIMPAN INI KE .env.local ===\n");
    console.log(`GOOGLE_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}\n`);

    if (!tokens.refresh_token) {
      console.log(
        "Ga ada refresh_token yang muncul. Biasanya karena akun ini sudah pernah kasih izin sebelumnya.\n" +
          "Buka https://myaccount.google.com/permissions, cabut akses aplikasi ini, lalu jalankan script ini lagi.\n"
      );
    }

    process.exit(0);
  })
  .listen(53682);
