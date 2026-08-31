import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

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
    const { status, catatan_admin } = body;

    const updatePayload = {};
    if (status) updatePayload.status = status;
    if (catatan_admin !== undefined) updatePayload.catatan_admin = catatan_admin;

    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("applicants")
      .update(updatePayload)
      .eq("id", params.id)
      .select()
      .single();

    if (error) throw error;
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
