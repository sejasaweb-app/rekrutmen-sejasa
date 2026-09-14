"use client";

import { supabasePublic } from "@/lib/supabaseClient";

// Wrapper fetch buat dipakai di halaman admin waktu melakukan perubahan
// (PATCH status, tambah follow-up, dst). Otomatis nempelin token sesi admin
// yang lagi login ke header Authorization, jadi backend tau siapa yang
// ngelakuin perubahan itu buat dicatat di riwayat/audit trail.
//
// Cukup ganti fetch(...) jadi adminFetch(...) di request yang MENGUBAH data
// (PATCH/POST/DELETE). Request baca data biasa (GET) gak perlu ini.
export async function adminFetch(url, options = {}) {
  const { data } = await supabasePublic.auth.getSession();
  const token = data?.session?.access_token;

  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  return fetch(url, { ...options, headers });
}
