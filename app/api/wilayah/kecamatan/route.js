import { NextResponse } from "next/server";

const BASE = "https://www.emsifa.com/api-wilayah-indonesia/api";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const kotaId = searchParams.get("kota_id");

    if (!kotaId) {
      return NextResponse.json({ error: "kota_id wajib diisi" }, { status: 400 });
    }

    const res = await fetch(`${BASE}/districts/${kotaId}.json`, {
      next: { revalidate: 86400 },
    });
    const districts = await res.json();

    const kecamatan = districts
      .map((d) => ({ id: d.id, name: d.name }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ kecamatan });
  } catch (err) {
    console.error("Wilayah kecamatan error:", err);
    return NextResponse.json({ error: "Gagal ambil data kecamatan" }, { status: 500 });
  }
}
