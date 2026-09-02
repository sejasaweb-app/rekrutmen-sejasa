import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

// GET — daftar mitra yang berstatus "approved", lengkap dengan tanggal diterimanya
// (diambil dari status_history, bukan created_at applicants — karena tanggal daftar
// dan tanggal diterima itu dua hal beda). Dipakai buat rekap KPI di tab Performa.
// query params: from, to (YYYY-MM-DD, filter berdasarkan TANGGAL DITERIMA), kategori, q
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const kategori = searchParams.get("kategori");
    const q = searchParams.get("q");

    const supabase = supabaseAdmin();

    // Ambil semua perpindahan status ke "approved", urut lama -> baru.
    const { data: history, error: historyError } = await supabase
      .from("status_history")
      .select("applicant_id, created_at")
      .eq("to_status", "approved")
      .order("created_at", { ascending: true });

    if (historyError) throw historyError;

    // Kalau satu mitra sempat "approved" lebih dari sekali (misal: direset lalu
    // diterima ulang), pakai tanggal yang paling baru sebagai tanggal diterima.
    const approvedAtByApplicant = {};
    for (const h of history) {
      approvedAtByApplicant[h.applicant_id] = h.created_at;
    }

    const applicantIds = Object.keys(approvedAtByApplicant);
    if (applicantIds.length === 0) {
      return NextResponse.json({ approved: [], total: 0 });
    }

    // Cuma tampilin yang status SEKARANG masih "approved" — kalau statusnya udah
    // berubah lagi (misal ditolak belakangan), ga relevan buat rekap "mitra diterima".
    let query = supabase
      .from("applicants")
      .select("id, nama, email, no_telp, kategori, domisili, status, created_at")
      .eq("status", "approved")
      .in("id", applicantIds);

    if (kategori) query = query.eq("kategori", kategori);
    if (q) query = query.or(`nama.ilike.%${q}%,email.ilike.%${q}%,no_telp.ilike.%${q}%`);

    const { data: applicants, error: applicantsError } = await query;
    if (applicantsError) throw applicantsError;

    let rows = applicants.map((a) => ({
      id: a.id,
      nama: a.nama,
      email: a.email,
      no_telp: a.no_telp,
      kategori: a.kategori,
      domisili: a.domisili,
      created_at: a.created_at, // tanggal daftar
      approved_at: approvedAtByApplicant[a.id], // tanggal diterima
    }));

    // Filter berdasarkan TANGGAL DITERIMA (approved_at), bukan tanggal daftar.
    if (from) {
      const start = new Date(`${from}T00:00:00`);
      rows = rows.filter((r) => new Date(r.approved_at) >= start);
    }
    if (to) {
      const end = new Date(`${to}T23:59:59.999`);
      rows = rows.filter((r) => new Date(r.approved_at) <= end);
    }

    rows.sort((a, b) => new Date(b.approved_at) - new Date(a.approved_at));

    return NextResponse.json({ approved: rows, total: rows.length });
  } catch (err) {
    console.error("Approved mitra error:", err);
    return NextResponse.json({ error: "Gagal ambil data mitra diterima" }, { status: 500 });
  }
}
