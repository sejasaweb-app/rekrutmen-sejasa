import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";
import { sendWhatsAppNotification, renderTemplate } from "@/lib/fonnte";

export const dynamic = "force-dynamic";

const KATEGORI_LABELS = { massage: "Massage Therapist", daily_cleaning: "Daily Cleaning" };

// Kirim notifikasi WA kalau status baru approved/rejected & fitur aktif di settings.
// Sengaja "fire and forget" dengan try/catch sendiri — gagal kirim WA TIDAK BOLEH
// menggagalkan update status pelamar yang sudah tersimpan di DB.
async function maybeSendStatusNotification(supabase, applicant, newStatus) {
  if (newStatus !== "approved" && newStatus !== "rejected") return;

  try {
    const { data: settings } = await supabase
      .from("app_settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (!settings?.wa_notif_enabled) return;

    const template =
      newStatus === "approved" ? settings.wa_message_approved : settings.wa_message_rejected;

    // {catatan_penolakan} — blok siap-pakai, cuma muncul kalau alasan diisi admin,
    // biar admin ga perlu mikirin format kosong/ganjil kalau alasan dikosongin.
    const alasan = applicant.alasan_penolakan || "";
    const catatanPenolakan = alasan ? `\n\nCatatan dari tim: ${alasan}` : "";

    const message = renderTemplate(template, {
      nama: applicant.nama,
      kategori: KATEGORI_LABELS[applicant.kategori] || applicant.kategori,
      domisili: applicant.domisili,
      alasan,
      catatan_penolakan: catatanPenolakan,
    });

    const result = await sendWhatsAppNotification({ phone: applicant.no_telp, message });
    if (!result.success) {
      console.error("Gagal kirim notifikasi WA:", result.error);
    }
  } catch (err) {
    console.error("Notifikasi WA error:", err);
  }
}


export async function GET(request, { params }) {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("applicants")
    .select("*, status_history(*)")
    .eq("id", params.id)
    .single();

  if (error) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
  return NextResponse.json({ applicant: data });
}

// PATCH — admin update status / catatan
export async function PATCH(request, { params }) {
  try {
    const body = await request.json();
    const { status, catatan_admin, alasan_penolakan } = body;

    const updatePayload = {};
    if (status) updatePayload.status = status;
    if (catatan_admin !== undefined) updatePayload.catatan_admin = catatan_admin;
    if (alasan_penolakan !== undefined) updatePayload.alasan_penolakan = alasan_penolakan;

    const supabase = supabaseAdmin();
    const { data: before } = await supabase
      .from("applicants")
      .select("status")
      .eq("id", params.id)
      .single();

    const { data, error } = await supabase
      .from("applicants")
      .update(updatePayload)
      .eq("id", params.id)
      .select()
      .single();

    if (error) throw error;

    // Kirim notifikasi WA cuma kalau status BERUBAH ke approved/rejected
    // (bukan cuma save catatan, dan bukan klik status yang sama lagi).
    if (status && status !== before?.status) {
      await maybeSendStatusNotification(supabase, data, status);
    }

    return NextResponse.json({ applicant: data });
  } catch (err) {
    console.error("Update applicant error:", err);
    return NextResponse.json({ error: "Gagal update status" }, { status: 500 });
  }
}

// DELETE — admin hapus data pendaftar
export async function DELETE(request, { params }) {
  try {
    const supabase = supabaseAdmin();

    // Hapus riwayat follow-up dulu (contact_logs belum tentu punya ON DELETE CASCADE)
    await supabase.from("contact_logs").delete().eq("applicant_id", params.id);

    const { error } = await supabase
      .from("applicants")
      .delete()
      .eq("id", params.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete applicant error:", err);
    return NextResponse.json({ error: "Gagal menghapus data" }, { status: 500 });
  }
}
