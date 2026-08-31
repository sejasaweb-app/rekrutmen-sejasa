import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";


// POST — submit lamaran baru (dipanggil dari form publik)
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      nama,
      email,
      no_telp,
      gender,
      domisili,
      kategori,
      punya_motor,
      file_url,
      file_name,
      punya_alat_cleaning,
      foto_alat_url,
      foto_alat_name,
      melayani_gender,
      website, // honeypot — field ga kelihatan di UI, cuma bot yang biasanya ngisi ini
      form_rendered_at, // timestamp pas form pertama kali dibuka
    } = body;

    // --- Deteksi bot: honeypot terisi ---
    if (website) {
      console.warn("Spam terdeteksi (honeypot terisi), request diabaikan diam-diam.");
      // Balikin respons sukses palsu biar bot ga tau kedeteksi, tapi data ga disimpan
      return NextResponse.json({ applicant: { id: "ignored" } }, { status: 201 });
    }

    // --- Deteksi bot: submit terlalu cepat (manusia butuh waktu isi form) ---
    if (form_rendered_at) {
      const elapsed = Date.now() - Number(form_rendered_at);
      if (elapsed < 3000) {
        console.warn("Spam terdeteksi (submit terlalu cepat), request diabaikan diam-diam.");
        return NextResponse.json({ applicant: { id: "ignored" } }, { status: 201 });
      }
    }

    if (!nama || !email || !no_telp || !gender || !domisili || !kategori) {
      return NextResponse.json({ error: "Data belum lengkap" }, { status: 400 });
    }

    if (!file_url) {
      return NextResponse.json(
        { error: "Wajib upload sertifikat/paklaring/rating" },
        { status: 400 }
      );
    }

    // --- Rate limit per IP: maks 5 percobaan per jam ---
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const supabase = supabaseAdmin();

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: attemptCount, error: rateLimitError } = await supabase
      .from("submission_attempts")
      .select("id", { count: "exact", head: true })
      .eq("ip", ip)
      .gte("created_at", oneHourAgo);

    if (rateLimitError) throw rateLimitError;

    if (attemptCount >= 5) {
      return NextResponse.json(
        { error: "Terlalu banyak percobaan pendaftaran. Coba lagi dalam 1 jam ya." },
        { status: 429 }
      );
    }

    await supabase.from("submission_attempts").insert([{ ip }]);

    // Validasi field khusus per kategori
    if (kategori === "daily_cleaning") {
      if (punya_alat_cleaning === undefined || punya_alat_cleaning === null) {
        return NextResponse.json(
          { error: "Wajib isi apakah punya alat cleaning" },
          { status: 400 }
        );
      }
      if (punya_alat_cleaning === true && !foto_alat_url) {
        return NextResponse.json(
          { error: "Wajib upload foto alat cleaning" },
          { status: 400 }
        );
      }
    }

    if (kategori === "massage" && !melayani_gender) {
      return NextResponse.json(
        { error: "Wajib isi gender yang bisa dilayani" },
        { status: 400 }
      );
    }

    // Cek duplikat: email atau no_telp yang sama sudah pernah daftar
    const { data: existing, error: checkError } = await supabase
      .from("applicants")
      .select("id, email, no_telp, status")
      .or(`email.eq.${email},no_telp.eq.${no_telp}`)
      .limit(1);

    if (checkError) throw checkError;

    if (existing && existing.length > 0) {
      const dupe = existing[0];
      const field = dupe.email === email ? "email" : "no. telepon";
      return NextResponse.json(
        {
          error: `Data dengan ${field} ini sudah pernah mendaftar sebelumnya.`,
          duplicate: true,
        },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from("applicants")
      .insert([
        {
          nama,
          email,
          no_telp,
          gender,
          domisili,
          kategori,
          punya_motor: !!punya_motor,
          file_url: file_url || null,
          file_name: file_name || null,
          punya_alat_cleaning: kategori === "daily_cleaning" ? !!punya_alat_cleaning : null,
          foto_alat_url: kategori === "daily_cleaning" ? foto_alat_url || null : null,
          foto_alat_name: kategori === "daily_cleaning" ? foto_alat_name || null : null,
          melayani_gender: kategori === "massage" ? melayani_gender : null,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ applicant: data }, { status: 201 });
  } catch (err) {
    console.error("Create applicant error:", err);
    return NextResponse.json({ error: "Gagal submit lamaran" }, { status: 500 });
  }
}

// GET — list applicants buat dashboard admin, support filter & search
// query params: status, kategori, q (cari nama/email/telp)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const kategori = searchParams.get("kategori");
    const q = searchParams.get("q");

    const supabase = supabaseAdmin();
    let query = supabase
      .from("applicants")
      .select("*")
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);
    if (kategori) query = query.eq("kategori", kategori);
    if (q) query = query.or(`nama.ilike.%${q}%,email.ilike.%${q}%,no_telp.ilike.%${q}%`);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ applicants: data });
  } catch (err) {
    console.error("List applicants error:", err);
    return NextResponse.json({ error: "Gagal ambil data" }, { status: 500 });
  }
}
