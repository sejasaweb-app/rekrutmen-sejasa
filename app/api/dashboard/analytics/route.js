import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

const PROGRESS_STAGES = ["data_baru", "screening", "onboarding"];

// Format tanggal jadi YYYY-MM-DD di timezone lokal (bukan UTC), biar konsisten
// buat pencocokan "hari yang sama" — pakai UTC mentah bisa geser 1 hari.
function localDateKey(date) {
  return new Date(date).toLocaleDateString("en-CA"); // en-CA formatnya persis YYYY-MM-DD
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

    // --- Tren pendaftaran harian ---
    const trendDays = range === "all" ? 30 : Math.min(Number(range), 90);
    const days = [];
    for (let i = trendDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(localDateKey(d));
    }
    const trend = days.map((date) => ({
      date,
      count: applicants.filter((a) => localDateKey(a.created_at) === date).length,
    }));

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

    // --- Top domisili ---
    const domisiliCounts = {};
    for (const a of applicants) {
      const key = a.domisili?.trim() || "Tidak diketahui";
      domisiliCounts[key] = (domisiliCounts[key] || 0) + 1;
    }
    const topDomisili = Object.entries(domisiliCounts)
      .map(([domisili, count]) => ({ domisili, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // --- Rekap follow-up ---
    const followUpByResponse = {};
    const followUpByChannel = {};
    for (const log of logs) {
      followUpByResponse[log.response] = (followUpByResponse[log.response] || 0) + 1;
      followUpByChannel[log.channel] = (followUpByChannel[log.channel] || 0) + 1;
    }

    return NextResponse.json({
      range,
      total: applicants.length,
      funnelConversion,
      approvedCount,
      rejectedCount,
      trend,
      avgDaysToDecision,
      decisionCount: decisionDurations.length,
      topDomisili,
      followUpTotal: logs.length,
      followUpByResponse,
      followUpByChannel,
    });
  } catch (err) {
    console.error("Analytics error:", err);
    return NextResponse.json({ error: "Gagal ambil data analitik" }, { status: 500 });
  }
}
