import { supabaseAdmin } from "@/lib/supabaseClient";

// Ambil identitas admin yang login dari header "Authorization: Bearer <token>"
// yang dikirim client (lihat lib/adminFetch.js). Dipakai buat nyatet SIAPA
// yang melakukan perubahan (status, follow-up, dst) — bukan sekadar percaya
// klaim dari body request, tapi diverifikasi ke Supabase Auth langsung biar
// gak bisa dipalsuin dari sisi klien.
//
// Return null kalau token gak ada/gak valid — caller tetap boleh lanjut
// proses update-nya (biar gak ngeblok kerjaan admin gara-gara masalah kecil
// di sisi auth), cuma field "diupdate oleh" bakal kosong buat request itu.
export async function getAdminUser(request) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return null;

    const supabase = supabaseAdmin();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return null;
    return data.user;
  } catch {
    return null;
  }
}
