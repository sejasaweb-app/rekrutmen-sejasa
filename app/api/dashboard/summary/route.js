import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

// Route ini ga baca apapun dari request, jadi Next.js defaultnya nge-cache
// hasilnya sebagai halaman statis. Paksa selalu fresh biar angka ga telat update.
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

// Rekapan buat admin dashboard: total per status & per kategori
export async function GET() {
  try {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase.from("applicants").select("status, kategori, updated_by");
    if (error) throw error;

    const byStatus = {};
    const byKategori = {};
    const processedBySet = new Set();

    for (const row of data) {
      byStatus[row.status] = (byStatus[row.status] || 0) + 1;
      byKategori[row.kategori] = (byKategori[row.kategori] || 0) + 1;
      if (row.updated_by) processedBySet.add(row.updated_by);
    }

    return NextResponse.json(
      {
        total: data.length,
        byStatus,
        byKategori,
        processedByOptions: Array.from(processedBySet).sort(),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  } catch (err) {
    console.error("Summary error:", err);
    return NextResponse.json({ error: "Gagal ambil rekapan" }, { status: 500 });
  }
}
