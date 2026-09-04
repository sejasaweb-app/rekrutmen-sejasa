import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";
import crypto from "crypto";

/**
 * Koordinat ini diukur langsung dari 2 contoh kontrak (Cleaning & Massage)
 * yang formatnya sama persis. Kalau desain kontrak di-update (font/margin
 * berubah), koordinat ini perlu diukur ulang.
 *
 * Sistem koordinat PDF: origin (0,0) di KIRI BAWAH halaman.
 * Ukuran halaman: 596 x 842 pt (A4).
 */
const LAYOUT = {
  daily_cleaning: {
    templatePath: path.join(process.cwd(), "templates", "template_cleaning_blank.pdf"),
    // maxWidth digedein karena template udah dibersihin total di baris ini (lihat catatan di bawah)
    openingDate: { page: 0, x: 328, y: 842 - 263.3 + 2, size: 11, maxWidth: 128 },
    closingDate: { page: 4, x: 97.7, y: 842 - 284.3 + 2, size: 11, maxWidth: 90 },
    mitraName: { page: 4, x: 72, y: 842 - 451.9 + 2, size: 12, maxWidth: 200 },
    signatureBox: { page: 4, x: 60, y: 400, width: 160, height: 75 },
  },
  massage: {
    templatePath: path.join(process.cwd(), "templates", "template_massage_blank.pdf"),
    openingDate: { page: 0, x: 328, y: 842 - 263.3 + 2, size: 11, maxWidth: 128 },
    closingDate: { page: 4, x: 97.7, y: 842 - 284.3 + 2, size: 11, maxWidth: 90 },
    mitraName: { page: 4, x: 72, y: 842 - 451.9 + 2, size: 12, maxWidth: 200 },
    signatureBox: { page: 4, x: 60, y: 400, width: 160, height: 75 },
  },
};

function formatTanggalIndo(date) {
  const bulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  return `${date.getDate()} ${bulan[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Step 1: generate PDF kontrak yang udah keisi nama + tanggal, BELUM ada
 * tanda tangan. `tanggal` WAJIB dikirim ulang persis sama waktu di-regenerate
 * saat mitra tanda tangan (disimpan di kolom applicants.contract_tanggal),
 * biar teks yang tercetak di PDF final konsisten dengan versi yang direview mitra.
 */
export async function generateFilledContract({ kategori, namaMitra, tanggal }) {
  const layout = LAYOUT[kategori];
  if (!layout) throw new Error(`Kategori tidak dikenal: ${kategori}`);

  const templateBytes = fs.readFileSync(layout.templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);
  const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const tanggalText = formatTanggalIndo(new Date(tanggal));

  const pages = pdfDoc.getPages();

  const drawText = (fieldCfg, text) => {
    let size = fieldCfg.size;
    if (fieldCfg.maxWidth) {
      while (
        font.widthOfTextAtSize(text, size) > fieldCfg.maxWidth &&
        size > 7
      ) {
        size -= 0.5;
      }
    }
    pages[fieldCfg.page].drawText(text, {
      x: fieldCfg.x,
      y: fieldCfg.y,
      size,
      font,
      color: rgb(0, 0, 0),
    });
    return { size, width: font.widthOfTextAtSize(text, size) };
  };

  const openingDateResult = drawText(layout.openingDate, tanggalText);
  // Template aslinya punya kalimat "... tanggal [TANGGAL] dan antara:" — bagian
  // "dan antara:" udah dibersihkan dari template PDF (lihat catatan LAYOUT di atas),
  // jadi di sini kita gambar ulang biar nempel persis setelah teks tanggal,
  // pakai ukuran font yang sama biar konsisten satu baris.
  pages[layout.openingDate.page].drawText("dan antara:", {
    x: layout.openingDate.x + openingDateResult.width + 4,
    y: layout.openingDate.y,
    size: openingDateResult.size,
    font,
    color: rgb(0, 0, 0),
  });

  drawText(layout.closingDate, tanggalText);
  drawText(layout.mitraName, namaMitra);

  return pdfDoc.save();
}

/**
 * Step 2: tempel gambar tanda tangan (base64 PNG dari canvas) ke posisi
 * signatureBox, lalu "lock" dokumen + catat audit trail (hash, waktu, IP).
 */
export async function embedSignatureAndLock({ kategori, filledPdfBytes, signaturePngBase64, meta }) {
  const layout = LAYOUT[kategori];
  const pdfDoc = await PDFDocument.load(filledPdfBytes);

  const pngBytes = Buffer.from(
    signaturePngBase64.replace(/^data:image\/png;base64,/, ""),
    "base64"
  );
  const pngImage = await pdfDoc.embedPng(pngBytes);

  const box = layout.signatureBox;
  const page = pdfDoc.getPages()[box.page];

  const scaled = pngImage.scaleToFit(box.width, box.height);
  page.drawImage(pngImage, {
    x: box.x,
    y: box.y,
    width: scaled.width,
    height: scaled.height,
  });

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  page.drawText(
    `Ditandatangani secara elektronik pada ${meta.signedAt} | IP: ${meta.ip}`,
    { x: 57, y: 40, size: 7, font, color: rgb(0.4, 0.4, 0.4) }
  );

  const finalBytes = await pdfDoc.save();
  const hash = crypto.createHash("sha256").update(finalBytes).digest("hex");

  return { finalBytes, hash };
}

export { LAYOUT };
