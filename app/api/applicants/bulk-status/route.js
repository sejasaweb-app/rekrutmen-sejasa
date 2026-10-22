import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";
import { getAdminUser } from "@/lib/adminAuth";
import {
  maybeSyncToSheet,
  maybeSendStatusNotification,
  maybeAutoSendContract,
  maybeTagStatusHistory,
} from "@/lib/applicantStatus";

export const dynamic = "force-dynamic";
// Tiap pelamar bisa makan waktu (kirim WA + sync Sheet), jadi kasih napas lebih.
export const maxDuration = 60;

const VALID_STATUS = ["data_baru", "pending", "screening", "onboarding", "approved", "rejected"];

// Batas per request. Client mengirim per potongan kecil (5 id) sambil nampilin
// progress, jadi 20 ini cuma pengaman kalau endpoint dipanggil dengan cara lain.
const MAX_IDS_PER_REQUEST = 20;

// POST /api/applicants/bulk-status
// body: { ids: string[], status, catatan, alasan_penolakan?, alasan_pending? }
//
// Aturannya sama persis dengan ubah status 1 pelamar (PATCH /api/applicants/[id]):
// riwayat status ke-tag nama admin, WA terkirim kalau status baru Diterima/Ditolak
// & fitur aktif di Pengaturan, kontrak otomatis kalau toggle-nya nyala, lalu sync Sheet.
// Bedanya: diproses satu-satu (bukan paralel) biar ga kena rate limit WA dan riwayat
// status ga ketuker, dan pelamar yang sudah berstatus sama dilewati (ga kirim WA dobel).
export async function POST(request) {
  try {
    const adminUser = await getAdminUser(request);
    if (!adminUser) {
      return NextResponse.json(
        { error: "Sesi login admin tidak valid, silakan login ulang." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { status, catatan, alasan_penolakan, alasan_pending } = body;
    const ids = [...new Set(Array.isArray(body.ids) ? body.ids.filter(Boolean) : [])];

    if (!VALID_STATUS.includes(status)) {
      return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
    }
    if (ids.length === 0) {
      return NextResponse.json({ error: "Belum ada pelamar yang dipilih" }, { status: 400 });
    }
    if (ids.length > MAX_IDS_PER_REQUEST) {
      return NextResponse.json(
        { error: `Maksimal ${MAX_IDS_PER_REQUEST} pelamar per request` },
        { status: 400 }
      );
    }
    if (!catatan || !String(catatan).trim()) {
      return NextResponse.json({ error: "Catatan wajib diisi" }, { status: 400 });
    }
    if (status === "pending" && !String(alasan_pending || "").trim()) {
      return NextResponse.json({ error: "Alasan pending wajib diisi" }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    const note = `[Update massal] ${String(catatan).trim()}`;

    const updated = [];
    const skipped = [];
    const failed = [];

    for (const id of ids) {
      try {
        const { data: before, error: beforeError } = await supabase
          .from("applicants")
          .select("status")
          .eq("id", id)
          .single();

        if (beforeError || !before) {
          failed.push({ id, error: "Data tidak ditemukan" });
          continue;
        }

        // Sudah di status tujuan -> lewati (juga mencegah WA terkirim dua kali).
        if (before.status === status) {
          skipped.push(id);
          continue;
        }

        const updatePayload = { status, updated_by: adminUser.email || null };
        if (status === "rejected" && alasan_penolakan !== undefined) {
          updatePayload.alasan_penolakan = alasan_penolakan;
        }
        if (status === "pending") {
          updatePayload.alasan_pending = String(alasan_pending).trim();
        }

        const { data, error } = await supabase
          .from("applicants")
          .update(updatePayload)
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;

        await maybeTagStatusHistory(supabase, id, adminUser.email, note);
        await maybeSendStatusNotification(supabase, data, status);
        await maybeAutoSendContract(supabase, data, status);
        await maybeSyncToSheet(data);

        updated.push(id);
      } catch (err) {
        console.error(`Bulk update gagal untuk ${id}:`, err);
        failed.push({ id, error: "Gagal update" });
      }
    }

    return NextResponse.json({ updated, skipped, failed });
  } catch (err) {
    console.error("Bulk status error:", err);
    return NextResponse.json({ error: "Gagal memproses update massal" }, { status: 500 });
  }
}
