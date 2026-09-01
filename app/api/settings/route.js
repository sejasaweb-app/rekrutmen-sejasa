import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

// GET — ambil settingan notifikasi WA (baris singleton id=1).
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
      return NextResponse.json({ settings: created });
    }
    console.error("Get settings error:", error);
    return NextResponse.json({ error: "Gagal ambil settingan" }, { status: 500 });
  }

  return NextResponse.json({ settings: data });
}

// PATCH — update settingan notifikasi WA (aktif/nonaktif + isi pesan).
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { wa_notif_enabled, wa_message_approved, wa_message_rejected } = body;

    const updatePayload = {};
    if (typeof wa_notif_enabled === "boolean") updatePayload.wa_notif_enabled = wa_notif_enabled;
    if (typeof wa_message_approved === "string") updatePayload.wa_message_approved = wa_message_approved;
    if (typeof wa_message_rejected === "string") updatePayload.wa_message_rejected = wa_message_rejected;

    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("app_settings")
      .update(updatePayload)
      .eq("id", 1)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ settings: data });
  } catch (err) {
    console.error("Update settings error:", err);
    return NextResponse.json({ error: "Gagal simpan settingan" }, { status: 500 });
  }
}
