import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const PROGRESS_STAGES = ["data_baru", "screening", "onboarding"];

// Format tanggal jadi YYYY-MM-DD di timezone lokal (bukan UTC), biar konsisten
// buat pencocokan "hari yang sama" — pakai UTC mentah bisa geser 1 hari.
function localDateKey(date) {
  return new Date(date).toLocaleDateString("en-CA"); // en-CA formatnya persis YYYY-MM-DD
}

function end_of_day(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "30"; // '7' | '14' | '30' | '90' | 'all'

    const supabase = supabaseAdmin();

    const [applicantsRes, historyRes, logsRes] = await Promise.all([
      supabase.from("applicants").select("id, kategori, domisili, status, created_at"),
      supabase.from("status_history").select("applicant_id, to_status, created_at").order("created_at", { ascending: true }),
      supabase.from("contact_logs").select("applicant_id, channel, response, created_at"),
    ]);

    if (applicantsRes.error) throw applicantsRes.error;
    if (historyRes.error) throw historyRes.error;
    if (logsRes.error) throw logsRes.error;

    let applicants = applicantsRes.data;
    let history = historyRes.data;
    let logs = logsRes.data;

    // --- Filter berdasarkan periode yang dipilih ---
    if (range !== "all") {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - Number(range));
      applicants = applicants.filter((a) => new Date(a.created_at) >= cutoff);
      const keepIds = new Set(applicants.map((a) => a.id));
      history = history.filter((h) => keepIds.has(h.applicant_id));
      logs = logs.filter((l) => keepIds.has(l.applicant_id));
    }

    // --- Funnel conversion: berapa applicant yang PERNAH mencapai tiap tahap ---
    const reachedStages = {};
    for (const a of applicants) reachedStages[a.id] = new Set(["data_baru"]);
    for (const h of history) {
      if (!reachedStages[h.applicant_id]) reachedStages[h.applicant_id] = new Set();
      reachedStages[h.applicant_id].add(h.to_status);
    }

    const funnelConversion = PROGRESS_STAGES.map((stage) => ({
      stage,
      count: applicants.filter((a) => reachedStages[a.id]?.has(stage)).length,
    }));
    const approvedCount = applicants.filter((a) => a.status === "approved").length;
    const rejectedCount = applicants.filter((a) => a.status === "rejected").length;

    // --- Tren pendaftaran ---
    // Range pendek (7/14 hari) tetep per-hari biar detail. Range panjang (30/90/semua)
    // dikelompokin per minggu, soalnya puluhan bar harian jadi terlalu padet dibaca.
    const totalDays = range === "all" ? 90 : Math.min(Number(range), 90);
    const useWeekly = totalDays > 21;

    let trend;
    if (useWeekly) {
      const weekCount = Math.ceil(totalDays / 7);
      const buckets = [];
      for (let w = weekCount - 1; w >= 0; w--) {
        const end = new Date();
        end.setDate(end.getDate() - w * 7);
        const start = new Date(end);
        start.setDate(start.getDate() - 6);
        buckets.push({ start, end, label: `${start.getDate()}/${start.getMonth() + 1}` });
      }
      trend = buckets.map((b) => ({
        date: b.label,
        count: applicants.filter((a) => {
          const created = new Date(a.created_at);
          return created >= new Date(b.start.toDateString()) && created <= end_of_day(b.end);
        }).length,
      }));
    } else {
      const days = [];
      for (let i = totalDays - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(localDateKey(d));
      }
      trend = days.map((date) => ({
        date,
        count: applicants.filter((a) => localDateKey(a.created_at) === date).length,
      }));
    }

    // --- Rata-rata waktu sampai keputusan (approved/rejected) dalam hari ---
    const decisionDurations = [];
    const historyByApplicant = {};
    for (const h of history) {
      if (!historyByApplicant[h.applicant_id]) historyByApplicant[h.applicant_id] = [];
      historyByApplicant[h.applicant_id].push(h);
    }
    for (const a of applicants) {
      if (a.status !== "approved" && a.status !== "rejected") continue;
      const decisionEntry = (historyByApplicant[a.id] || []).find((h) => h.to_status === a.status);
      if (!decisionEntry) continue;
      const d = (new Date(decisionEntry.created_at) - new Date(a.created_at)) / (1000 * 60 * 60 * 24);
      decisionDurations.push(d);
    }
    const avgDaysToDecision =
      decisionDurations.length > 0
        ? decisionDurations.reduce((sum, d) => sum + d, 0) / decisionDurations.length
        : null;

    // --- Top kota (diringkas dari domisili "Kecamatan, Kota" jadi kota aja) ---
    // Data domisili disimpan sebagai "Kecamatan, Kota", tapi ada juga fallback manual
    // tanpa koma. Kita ambil bagian kota-nya aja biar analitiknya ga kepecah-pecah
    // per kecamatan (misal 5 pendaftar Jakarta Barat kepecah jadi 5 kecamatan beda).
    function extractKota(domisili) {
      const trimmed = domisili?.trim();
      if (!trimmed) return "Tidak diketahui";
      const parts = trimmed.split(",");
      const raw = parts.length > 1 ? parts[parts.length - 1].trim() : trimmed;
      return raw.replace(/\s+/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
    }
    const kotaCounts = {};
    for (const a of applicants) {
      const key = extractKota(a.domisili);
      kotaCounts[key] = (kotaCounts[key] || 0) + 1;
    }
    const topDomisili = Object.entries(kotaCounts)
      .map(([domisili, count]) => ({ domisili, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // --- Distribusi kategori ---
    const KATEGORI_LABELS = { massage: "Massage", daily_cleaning: "Daily Cleaning" };
    const categoryCounts = {};
    for (const a of applicants) {
      const key = KATEGORI_LABELS[a.kategori] || a.kategori || "Tidak diketahui";
      categoryCounts[key] = (categoryCounts[key] || 0) + 1;
    }
    const categoryBreakdown = Object.entries(categoryCounts)
      .map(([kategori, count]) => ({ kategori, count }))
      .sort((a, b) => b.count - a.count);

    // --- Rekap follow-up ---
    const followUpByResponse = {};
    const followUpByChannel = {};
    for (const log of logs) {
      followUpByResponse[log.response] = (followUpByResponse[log.response] || 0) + 1;
      followUpByChannel[log.channel] = (followUpByChannel[log.channel] || 0) + 1;
    }

    return NextResponse.json(
      {
        range,
        total: applicants.length,
        funnelConversion,
        approvedCount,
        rejectedCount,
        trend,
        trendGranularity: useWeekly ? "weekly" : "daily",
        avgDaysToDecision,
        decisionCount: decisionDurations.length,
        topDomisili,
        categoryBreakdown,
        followUpTotal: logs.length,
        followUpByResponse,
        followUpByChannel,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  } catch (err) {
    console.error("Analytics error:", err);
    return NextResponse.json({ error: "Gagal ambil data analitik" }, { status: 500 });
  }
}
