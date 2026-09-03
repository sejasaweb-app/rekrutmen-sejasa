import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";
import { generateFilledContract, embedSignatureAndLock } from "@/lib/contractGenerator";
import { uploadToDrive } from "@/lib/googleDrive";

export const dynamic = "force-dynamic";
// Alur ini generate PDF 2x + tempel tanda tangan + upload ke Google Drive dalam
// satu request — di cold start (function baru boot + auth Google dari nol) ini
// gampang lewat dari limit default 10s dan bikin percobaan pertama gagal diam-diam.
export const maxDuration = 60;

// POST — dipanggil dari halaman /sign/[token] setelah mitra gambar tanda tangan.
// body: { signaturePng: 'data:image/png;base64,...' }
export async function POST(request, { params }) {
  try {
    const supabase = supabaseAdmin();
    const { data: applicant, error } = await supabase
      .from("applicants")
      .select("*")
      .eq("contract_token", params.token)
      .single();

    if (error || !applicant) {
      return NextResponse.json({ error: "Link tidak valid atau kontrak tidak ditemukan" }, { status: 404 });
    }
    if (applicant.contract_status === "ditandatangani") {
      return NextResponse.json({ error: "Kontrak ini sudah ditandatangani sebelumnya" }, { status: 409 });
    }

    const { signaturePng } = await request.json();
    if (!signaturePng) {
      return NextResponse.json({ error: "signaturePng wajib dikirim" }, { status: 400 });
    }

    // Regenerate PDF terisi (belum ttd) dari data yang sama persis dengan versi
    // yang direview mitra (kategori, nama, contract_tanggal yang sudah tersimpan),
    // baru tempel tanda tangan di atasnya — jadi kita tidak perlu simpan bytes PDF
    // mentah di mana pun selain Google Drive.
    const filledBytes = await generateFilledContract({
      kategori: applicant.kategori,
      namaMitra: applicant.nama,
      tanggal: applicant.contract_tanggal,
    });

    const { finalBytes, hash } = await embedSignatureAndLock({
      kategori: applicant.kategori,
      filledPdfBytes: filledBytes,
      signaturePngBase64: signaturePng,
      meta: {
        signedAt: new Date().toISOString(),
        ip: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    const fileName = `Kontrak-Signed-${applicant.nama.replace(/\s+/g, "_")}-${params.token.slice(0, 8)}.pdf`;
    const drive = await uploadToDrive(Buffer.from(finalBytes), fileName, "application/pdf");

    const { error: updateError } = await supabase
      .from("applicants")
      .update({
        contract_status: "ditandatangani",
        contract_url_signed: drive.webViewLink,
        contract_hash: hash,
        contract_signed_at: new Date().toISOString(),
      })
      .eq("id", applicant.id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, hash, downloadUrl: drive.webViewLink });
  } catch (err) {
    console.error("Sign contract error:", err);
    return NextResponse.json({ error: err.message || "Gagal memproses tanda tangan" }, { status: 500 });
  }
}
