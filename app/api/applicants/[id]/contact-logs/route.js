import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";


// GET — list riwayat follow-up buat 1 applicant
export async function GET(request, { params }) {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("contact_logs")
    .select("*")
    .eq("applicant_id", params.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("List contact logs error:", error);
    return NextResponse.json({ error: "Gagal ambil riwayat follow-up" }, { status: 500 });
  }

  return NextResponse.json({ logs: data });
}

// POST — tambah catatan follow-up baru (dilakukan sebelum ubah status resmi)
export async function POST(request, { params }) {
  try {
    const body = await request.json();
    const { channel, response, catatan } = body;

    if (!channel || !response) {
      return NextResponse.json({ error: "Channel dan respon wajib diisi" }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("contact_logs")
      .insert([{ applicant_id: params.id, channel, response, catatan: catatan || null }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ log: data }, { status: 201 });
  } catch (err) {
    console.error("Create contact log error:", err);
    return NextResponse.json({ error: "Gagal simpan follow-up" }, { status: 500 });
  }
}
