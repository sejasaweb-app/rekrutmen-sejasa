import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

const KATEGORI_LABELS = { massage: "Massage Therapist", daily_cleaning: "Daily Cleaning" };

// GET — dipanggil dari halaman /sign/[token] buat nampilin preview PDF & info mitra.
// Token dipakai sebagai "kunci akses" (siapa pun yang punya link bisa buka),
// sama seperti desain awal — jadi jangan expose token di tempat lain selain link WA.
export async function GET(request, { params }) {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("applicants")
    .select("id, nama, kategori, contract_status, contract_url_unsigned, contract_url_signed")
    .eq("contract_token", params.token)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Link tidak valid atau kontrak tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json(
    {
      nama: data.nama,
      kategori: KATEGORI_LABELS[data.kategori] || data.kategori,
      status: data.contract_status,
      previewUrl: data.contract_url_unsigned,
      signedUrl: data.contract_url_signed,
    },
    { headers: { "Cache-Control": "no-store, must-revalidate" } }
  );
}
