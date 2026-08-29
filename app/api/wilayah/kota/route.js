import { NextResponse } from "next/server";

// Ambil semua Kota/Kabupaten se-Indonesia dari dataset publik (gratis, ga perlu API key).
// Di-cache 1 hari (data wilayah admin ga sering berubah) biar ga nge-hit API luar tiap request.
const BASE = "https://www.emsifa.com/api-wilayah-indonesia/api";

export async function GET() {
  try {
    const provincesRes = await fetch(`${BASE}/provinces.json`, {
      next: { revalidate: 86400 },
    });
    const provinces = await provincesRes.json();

    const regencyLists = await Promise.all(
      provinces.map(async (p) => {
        const res = await fetch(`${BASE}/regencies/${p.id}.json`, {
          next: { revalidate: 86400 },
        });
        const regencies = await res.json();
        return regencies.map((r) => ({ id: r.id, name: r.name, provinsi: p.name }));
      })
    );

    const kota = regencyLists.flat().sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ kota });
  } catch (err) {
    console.error("Wilayah kota error:", err);
    return NextResponse.json({ error: "Gagal ambil data kota" }, { status: 500 });
  }
}
