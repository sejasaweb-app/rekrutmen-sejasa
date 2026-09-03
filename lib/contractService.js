import crypto from "crypto";
import { generateFilledContract } from "@/lib/contractGenerator";
import { uploadToDrive } from "@/lib/googleDrive";
import { sendWhatsAppNotification, renderTemplate } from "@/lib/fonnte";

const KATEGORI_LABELS = { massage: "Massage Therapist", daily_cleaning: "Daily Cleaning" };

// Dipakai oleh dua caller: tombol manual "Kirim Kontrak" di halaman detail admin,
// dan hook otomatis di PATCH /api/applicants/[id] kalau contract_auto_send_enabled aktif.
export async function generateAndSendContract(supabase, applicant) {
  const kategori = applicant.kategori;
  const tanggal = new Date().toISOString().slice(0, 10);

  const filledBytes = await generateFilledContract({
    kategori,
    namaMitra: applicant.nama,
    tanggal,
  });

  const token = crypto.randomUUID();
  const fileName = `Kontrak-${applicant.nama.replace(/\s+/g, "_")}-${token.slice(0, 8)}.pdf`;
  const drive = await uploadToDrive(Buffer.from(filledBytes), fileName, "application/pdf");

  const { data: updated, error } = await supabase
    .from("applicants")
    .update({
      contract_status: "menunggu_ttd",
      contract_token: token,
      contract_tanggal: tanggal,
      contract_url_unsigned: drive.webViewLink,
      contract_sent_at: new Date().toISOString(),
    })
    .eq("id", applicant.id)
    .select()
    .single();

  if (error) throw error;

  // Gagal kirim WA TIDAK BOLEH menggagalkan proses generate kontrak yang sudah
  // tersimpan di DB — sama seperti pola WA notif approve/reject yang sudah ada.
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const signUrl = `${baseUrl}/sign/${token}`;

  try {
    const { data: settings } = await supabase.from("app_settings").select("*").eq("id", 1).single();
    const template = settings?.wa_message_contract;
    if (template) {
      const message = renderTemplate(template, {
        nama: applicant.nama,
        kategori: KATEGORI_LABELS[kategori] || kategori,
        link: signUrl,
      });
      const result = await sendWhatsAppNotification({ phone: applicant.no_telp, message });
      await supabase.from("wa_send_log").insert({
        applicant_id: applicant.id,
        status_target: "contract_sent",
        phone: applicant.no_telp,
        success: result.success,
        error: result.success ? null : result.error,
      });
    }
  } catch (err) {
    console.error("Gagal kirim WA link kontrak:", err);
  }

  return { applicant: updated, signUrl };
}
