import { NextResponse } from "next/server";

// Area layanan: cuma Jabodetabek, Bandung, dan Surabaya — biar calon mitra
// ga bingung scroll ratusan kota se-Indonesia. Data tetap diambil dari dataset
// publik (gratis, ga perlu API key), tapi difilter pakai whitelist kode wilayah
// (kode Kemendagri) di bawah. Di-cache 1 hari biar ga nge-hit API luar tiap request.
//
// Mau nambah/kurangi area? Cukup edit daftar SERVICE_AREAS — tiap baris
// [kode kota/kabupaten, nama area]. Kode provinsi diambil otomatis dari 2 digit awal.
// (Route kecamatan ikut memakai daftar ini lewat export ALLOWED_KOTA_IDS.)
const BASE = "https://www.emsifa.com/api-wilayah-indonesia/api";

export const SERVICE_AREAS = [
  // Jabodetabek — DKI Jakarta (Kep. Seribu sengaja ga dimasukin, 3101)
  ["3173", "Jabodetabek"], // Kota Jakarta Pusat
  ["3175", "Jabodetabek"], // Kota Jakarta Utara
  ["3174", "Jabodetabek"], // Kota Jakarta Barat
  ["3171", "Jabodetabek"], // Kota Jakarta Selatan
  ["3172", "Jabodetabek"], // Kota Jakarta Timur
  // Jabodetabek — Tangerang (Banten)
  ["3671", "Jabodetabek"], // Kota Tangerang
  ["3674", "Jabodetabek"], // Kota Tangerang Selatan
  ["3603", "Jabodetabek"], // Kabupaten Tangerang
  // Jabodetabek — Bekasi, Depok, Bogor (Jawa Barat)
  ["3275", "Jabodetabek"], // Kota Bekasi
  ["3216", "Jabodetabek"], // Kabupaten Bekasi
  ["3276", "Jabodetabek"], // Kota Depok
  ["3271", "Jabodetabek"], // Kota Bogor
  ["3201", "Jabodetabek"], // Kabupaten Bogor
  // Bandung
  ["3273", "Bandung"], // Kota Bandung
  ["3204", "Bandung"], // Kabupaten Bandung
  ["3217", "Bandung"], // Kabupaten Bandung Barat
  ["3277", "Bandung"], // Kota Cimahi
  // Surabaya
  ["3578", "Surabaya"], // Kota Surabaya
];

export const ALLOWED_KOTA_IDS = SERVICE_AREAS.map(([id]) => id);

export async function GET() {
  try {
    const provinceIds = [...new Set(ALLOWED_KOTA_IDS.map((id) => id.slice(0, 2)))];

    // Cuma ambil provinsi yang kepake (DKI, Jabar, Banten, Jatim) — jauh lebih
    // ringan dibanding narik semua 34 provinsi.
    const regencyLists = await Promise.all(
      provinceIds.map(async (pid) => {
        const res = await fetch(`${BASE}/regencies/${pid}.json`, {
          next: { revalidate: 86400 },
        });
        if (!res.ok) throw new Error(`Gagal ambil regencies provinsi ${pid}`);
        return res.json();
      })
    );
    const regencyById = new Map(regencyLists.flat().map((r) => [String(r.id), r]));

    // Urutan mengikuti SERVICE_AREAS (Jabodetabek dulu, lalu Bandung, Surabaya)
    const kota = SERVICE_AREAS.map(([id, area]) => {
      const r = regencyById.get(id);
      return r ? { id: r.id, name: r.name, area } : null;
    }).filter(Boolean);

    return NextResponse.json({ kota });
  } catch (err) {
    console.error("Wilayah kota error:", err);
    return NextResponse.json({ error: "Gagal ambil data kota" }, { status: 500 });
  }
}
