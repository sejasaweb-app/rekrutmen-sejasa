import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

// Route ini ga baca apapun dari request, jadi Next.js defaultnya nge-cache
// hasilnya sebagai halaman statis. Paksa selalu fresh biar angka ga telat update.
export const dynamic = "force-dynamic";

// Rekapan buat admin dashboard: total per status & per kategori
export async function GET() {
  try {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase.from("applicants").select("status, kategori");
    if (error) throw error;

    const byStatus = {};
    const byKategori = {};

    for (const row of data) {
      byStatus[row.status] = (byStatus[row.status] || 0) + 1;
      byKategori[row.kategori] = (byKategori[row.kategori] || 0) + 1;
    }

    return NextResponse.json({
      total: data.length,
      byStatus,
      byKategori,
    });
  } catch (err) {
    console.error("Summary error:", err);
    return NextResponse.json({ error: "Gagal ambil rekapan" }, { status: 500 });
  }
}
