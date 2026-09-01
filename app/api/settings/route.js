import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

// Hitung berapa WA yang sukses terkirim sejak awal bulan ini (waktu server).
async function getWaUsage(supabase) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const { count } = await supabase
    .from("wa_send_log")
    .select("id", { count: "exact", head: true })
    .eq("success", true)
    .gte("created_at", startOfMonth.toISOString());

  return {
    count: count || 0,
    monthLabel: now.toLocaleDateString("id-ID", { month: "long", year: "numeric" }),
  };
}

// GET — ambil settingan notifikasi WA (baris singleton id=1) + pemakaian WA bulan ini.
// Kalau baris belum ada (migration baru dijalankan tanpa seed), buat default-nya di sini.
export async function GET() {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("app_settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // Baris singleton belum ada — insert default lalu kembalikan.
      const { data: created, error: insertError } = await supabase
        .from("app_settings")
        .insert([{ id: 1 }])
        .select()
        .single();
      if (insertError) {
        console.error("Create default settings error:", insertError);
        return NextResponse.json({ error: "Gagal ambil settingan" }, { status: 500 });
      }
      const waUsage = await getWaUsage(supabase);
      return NextResponse.json({ settings: created, waUsage });
    }
    console.error("Get settings error:", error);
    return NextResponse.json({ error: "Gagal ambil settingan" }, { status: 500 });
  }

  const waUsage = await getWaUsage(supabase);
  return NextResponse.json({ settings: data, waUsage });
}

// PATCH — update settingan notifikasi WA (aktif/nonaktif + isi pesan + limit bulanan).
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { wa_notif_enabled, wa_message_approved, wa_message_rejected, wa_monthly_limit } = body;

    const updatePayload = {};
    if (typeof wa_notif_enabled === "boolean") updatePayload.wa_notif_enabled = wa_notif_enabled;
    if (typeof wa_message_approved === "string") updatePayload.wa_message_approved = wa_message_approved;
    if (typeof wa_message_rejected === "string") updatePayload.wa_message_rejected = wa_message_rejected;
    if (typeof wa_monthly_limit === "number" && wa_monthly_limit > 0) {
      updatePayload.wa_monthly_limit = Math.floor(wa_monthly_limit);
    }

    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("app_settings")
      .update(updatePayload)
      .eq("id", 1)
      .select()
      .single();

    if (error) throw error;
    const waUsage = await getWaUsage(supabase);
    return NextResponse.json({ settings: data, waUsage });
  } catch (err) {
    console.error("Update settings error:", err);
    return NextResponse.json({ error: "Gagal simpan settingan" }, { status: 500 });
  }
}
