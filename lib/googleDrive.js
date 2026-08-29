import { google } from "googleapis";
import { Readable } from "stream";

// Upload file ke folder Google Drive pribadi lu, pakai OAuth (bukan Service Account).
// Kenapa OAuth, bukan Service Account? Karena Service Account tidak punya storage
// quota sendiri di My Drive biasa (cuma bisa upload ke Shared Drive, yang butuh
// Google Workspace berbayar). Dengan OAuth, upload dilakukan "atas nama" akun
// Google pribadi lu, jadi makan kuota 15GB yang lu punya.
//
// Butuh 4 env var: GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET,
// GOOGLE_OAUTH_REFRESH_TOKEN, GOOGLE_DRIVE_FOLDER_ID
// Cara dapetin refresh token: jalankan scripts/get-google-refresh-token.js sekali (lihat README).

function getDriveClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN,
  });

  return google.drive({ version: "v3", auth: oauth2Client });
}

/**
 * @param {Buffer} fileBuffer
 * @param {string} fileName
 * @param {string} mimeType
 * @returns {Promise<{ id: string, webViewLink: string }>}
 */
export async function uploadToDrive(fileBuffer, fileName, mimeType) {
  const drive = getDriveClient();

  const res = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
    },
    media: {
      mimeType,
      body: Readable.from(fileBuffer),
    },
    fields: "id, webViewLink",
  });

  // Kasih akses "anyone with link can view" biar admin bisa buka langsung.
  await drive.permissions.create({
    fileId: res.data.id,
    requestBody: { role: "reader", type: "anyone" },
  });

  return { id: res.data.id, webViewLink: res.data.webViewLink };
}

