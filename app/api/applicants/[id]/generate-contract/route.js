import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";
import { generateAndSendContract } from "@/lib/contractService";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// POST — tombol "Kirim Kontrak" / "Kirim Ulang" di halaman detail admin.
export async function POST(request, { params }) {
  try {
    const supabase = supabaseAdmin();
    const { data: applicant, error } = await supabase
      .from("applicants")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error || !applicant) {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
    }
    if (applicant.status !== "approved") {
      return NextResponse.json({ error: "Kontrak hanya bisa dikirim untuk mitra berstatus Diterima" }, { status: 400 });
    }
    if (applicant.contract_status === "ditandatangani") {
      return NextResponse.json({ error: "Kontrak mitra ini sudah ditandatangani" }, { status: 409 });
    }

    const { applicant: updated, signUrl } = await generateAndSendContract(supabase, applicant);
    return NextResponse.json({ applicant: updated, signUrl });
  } catch (err) {
    console.error("Generate contract error:", err);
    return NextResponse.json({ error: err.message || "Gagal membuat kontrak" }, { status: 500 });
  }
}
