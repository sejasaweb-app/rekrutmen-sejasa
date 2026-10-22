import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";
import { getAdminUser } from "@/lib/adminAuth";
import {
  maybeSyncToSheet,
  maybeSendStatusNotification,
  maybeAutoSendContract,
  maybeTagStatusHistory,
} from "@/lib/applicantStatus";

export const dynamic = "force-dynamic";

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
    const { status, catatan_admin, alasan_penolakan, alasan_pending } = body;
    const adminUser = await getAdminUser(request);

    const updatePayload = {};
    if (status) updatePayload.status = status;
    if (catatan_admin !== undefined) updatePayload.catatan_admin = catatan_admin;
    if (alasan_penolakan !== undefined) updatePayload.alasan_penolakan = alasan_penolakan;
    if (alasan_pending !== undefined) updatePayload.alasan_pending = alasan_pending;
    updatePayload.updated_by = adminUser?.email || null;

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
      await maybeTagStatusHistory(supabase, params.id, adminUser?.email, catatan_admin);
      await maybeSendStatusNotification(supabase, data, status);
      await maybeAutoSendContract(supabase, data, status);
    }

    await maybeSyncToSheet(data);

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
