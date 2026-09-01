import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const PROGRESS_STAGES = ["data_baru", "screening", "onboarding"];
const DAY_MS = 24 * 60 * 60 * 1000;

// Format tanggal jadi YYYY-MM-DD di timezone lokal (bukan UTC), biar konsisten
// buat pencocokan "hari yang sama" — pakai UTC mentah bisa geser 1 hari.
function localDateKey(date) {
  return new Date(date).toLocaleDateString("en-CA"); // en-CA formatnya persis YYYY-MM-DD
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Tentuin batas periode (start/end) berdasarkan pilihan range.
// range 'all' -> start = null (ga ada batas bawah).
function getPeriodBounds(range, fromParam, toParam, now) {
  if (range === "today") {
    return { start: startOfDay(now), end: now };
  }
  if (range === "all") {
    return { start: null, end: now };
  }
  if (range === "custom") {
    if (!fromParam || !toParam) return { start: null, end: now };
    const start = startOfDay(new Date(`${fromParam}T00:00:00`));
    let end = endOfDay(new Date(`${toParam}T00:00:00`));
    if (end > now) end = now;
    return { start, end };
  }
  const days = Number(range);
  const safeDays = Number.isFinite(days) && days > 0 ? days : 30;
  const start = new Date(now.getTime() - safeDays * DAY_MS);
  return { start, end: now };
}

// Periode pembanding: durasi yang sama, persis sebelum periode yang dipilih.
function getPreviousBounds(start, end) {
  if (!start) return null;
  const duration = end.getTime() - start.getTime();
  if (duration <= 0) return null;
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - duration);
  return { start: prevStart, end: prevEnd };
}

function filterByPeriod(items, start, end) {
  return items.filter((item) => {
    const t = new Date(item.created_at);
    return (!start || t >= start) && t <= end;
  });
}

// Metrik inti (dipakai buat periode aktif & periode pembanding)
function computeCoreMetrics(applicantsSubset, allHistory, allLogs) {
  const ids = new Set(applicantsSubset.map((a) => a.id));
  const subLogs = allLogs.filter((l) => ids.has(l.applicant_id));
  const subHistory = allHistory.filter((h) => ids.has(h.applicant_id));

  const approvedCount = applicantsSubset.filter((a) => a.status === "approved").length;
  const rejectedCount = applicantsSubset.filter((a) => a.status === "rejected").length;
  const decisionTotal = approvedCount + rejectedCount;
  const approvalRate = decisionTotal > 0 ? (approvedCount / decisionTotal) * 100 : null;

  const historyByApplicant = {};
  for (const h of subHistory) {
    if (!historyByApplicant[h.applicant_id]) historyByApplicant[h.applicant_id] = [];
    historyByApplicant[h.applicant_id].push(h);
  }
  const decisionDurations = [];
  for (const a of applicantsSubset) {
    if (a.status !== "approved" && a.status !== "rejected") continue;
    const decisionEntry = (historyByApplicant[a.id] || []).find((h) => h.to_status === a.status);
    if (!decisionEntry) continue;
    const d = (new Date(decisionEntry.created_at) - new Date(a.created_at)) / DAY_MS;
    decisionDurations.push(d);
  }
  const avgDaysToDecision =
    decisionDurations.length > 0
      ? decisionDurations.reduce((sum, d) => sum + d, 0) / decisionDurations.length
      : null;

  return {
    total: applicantsSubset.length,
    approvedCount,
    rejectedCount,
    approvalRate,
    avgDaysToDecision,
    followUpTotal: subLogs.length,
  };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "30"; // 'today' | '7' | '14' | '30' | '90' | 'all' | 'custom'
    const fromParam = searchParams.get("from"); // YYYY-MM-DD, dipakai kalau range === 'custom'
    const toParam = searchParams.get("to");
    const now = new Date();

    const supabase = supabaseAdmin();

    const [applicantsRes, historyRes, logsRes] = await Promise.all([
      supabase.from("applicants").select("id, kategori, domisili, status, created_at"),
      supabase.from("status_history").select("applicant_id, to_status, created_at").order("created_at", { ascending: true }),
      supabase.from("contact_logs").select("applicant_id, channel, response, created_at"),
    ]);

    if (applicantsRes.error) throw applicantsRes.error;
    if (historyRes.error) throw historyRes.error;
    if (logsRes.error) throw logsRes.error;

    const allApplicants = applicantsRes.data;
    const allHistory = historyRes.data;
    const allLogs = logsRes.data;

    const { start, end } = getPeriodBounds(range, fromParam, toParam, now);

    const applicants = filterByPeriod(allApplicants, start, end);
    const applicantIds = new Set(applicants.map((a) => a.id));
    const history = allHistory.filter((h) => applicantIds.has(h.applicant_id));
    const logs = allLogs.filter((l) => applicantIds.has(l.applicant_id));

    // --- Periode pembanding (buat badge naik/turun di stat card) ---
    const prevBounds = getPreviousBounds(start, end);
    const compare = prevBounds
      ? computeCoreMetrics(filterByPeriod(allApplicants, prevBounds.start, prevBounds.end), allHistory, allLogs)
      : null;

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
    // "Hari ini" -> per jam. Range pendek (7/14 hari) -> per hari. Range panjang
    // (30/90/semua/custom lebar) -> per minggu, biar ga terlalu padet dibaca.
    let trend;
    let trendGranularity;

    if (range === "today") {
      const currentHour = now.getHours();
      trend = Array.from({ length: currentHour + 1 }, (_, h) => ({
        date: `${String(h).padStart(2, "0")}:00`,
        count: applicants.filter((a) => new Date(a.created_at).getHours() === h).length,
      }));
      trendGranularity = "hourly";
    } else {
      // Rentang aktual buat nge-bucket: pakai batas periode kalau ada,
      // fallback ke tanggal pendaftar paling lama (buat "Semua").
      let rangeStart = start;
      if (!rangeStart) {
        const oldest = allApplicants.reduce(
          (min, a) => Math.min(min, new Date(a.created_at).getTime()),
          now.getTime()
        );
        rangeStart = new Date(Math.max(oldest, now.getTime() - 90 * DAY_MS));
      }
      const totalDays = Math.max(1, Math.min(Math.round((end - rangeStart) / DAY_MS) + 1, 180));
      const useWeekly = totalDays > 21;

      if (useWeekly) {
        const weekCount = Math.ceil(totalDays / 7);
        const buckets = [];
        for (let w = weekCount - 1; w >= 0; w--) {
          const bucketEnd = new Date(end.getTime() - w * 7 * DAY_MS);
          const bucketStart = new Date(bucketEnd.getTime() - 6 * DAY_MS);
          buckets.push({
            start: startOfDay(bucketStart),
            end: endOfDay(bucketEnd),
            label: `${bucketStart.getDate()}/${bucketStart.getMonth() + 1}`,
          });
        }
        trend = buckets.map((b) => ({
          date: b.label,
          count: applicants.filter((a) => {
            const created = new Date(a.created_at);
            return created >= b.start && created <= b.end;
          }).length,
        }));
        trendGranularity = "weekly";
      } else {
        const days = [];
        for (let i = totalDays - 1; i >= 0; i--) {
          days.push(localDateKey(new Date(end.getTime() - i * DAY_MS)));
        }
        trend = days.map((date) => ({
          date,
          count: applicants.filter((a) => localDateKey(a.created_at) === date).length,
        }));
        trendGranularity = "daily";
      }
    }

    // --- Rata-rata waktu sampai keputusan (approved/rejected) dalam hari ---
    const historyByApplicant = {};
    for (const h of history) {
      if (!historyByApplicant[h.applicant_id]) historyByApplicant[h.applicant_id] = [];
      historyByApplicant[h.applicant_id].push(h);
    }
    const decisionDurations = [];
    for (const a of applicants) {
      if (a.status !== "approved" && a.status !== "rejected") continue;
      const decisionEntry = (historyByApplicant[a.id] || []).find((h) => h.to_status === a.status);
      if (!decisionEntry) continue;
      const d = (new Date(decisionEntry.created_at) - new Date(a.created_at)) / DAY_MS;
      decisionDurations.push(d);
    }
    const avgDaysToDecision =
      decisionDurations.length > 0
        ? decisionDurations.reduce((sum, d) => sum + d, 0) / decisionDurations.length
        : null;

    // --- Top kota (diringkas dari domisili "Kecamatan, Kota" jadi kota aja) ---
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
        periodStart: start ? start.toISOString() : null,
        periodEnd: end.toISOString(),
        total: applicants.length,
        funnelConversion,
        approvedCount,
        rejectedCount,
        trend,
        trendGranularity,
        avgDaysToDecision,
        decisionCount: decisionDurations.length,
        topDomisili,
        categoryBreakdown,
        followUpTotal: logs.length,
        followUpByResponse,
        followUpByChannel,
        compare, // null kalau range === 'all' (ga ada periode pembanding yang jelas)
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
