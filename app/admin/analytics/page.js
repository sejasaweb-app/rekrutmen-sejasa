"use client";

import { useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  Clock,
  MapPin,
  MessageCircle,
  Users,
  Tags,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  CalendarRange,
  X,
} from "lucide-react";
import ApprovedMitraTable from "@/components/ApprovedMitraTable";

const STAGE_LABELS = {
  data_baru: "Data Baru",
  screening: "Screening",
  onboarding: "Onboarding",
};

const STAGE_COLORS = {
  data_baru: "#94A3B8",
  screening: "#3B82F6",
  onboarding: "#8B5CF6",
};

const RANGE_OPTIONS = [
  { value: "today", label: "Hari ini" },
  { value: "7", label: "7 Hari" },
  { value: "30", label: "30 Hari" },
  { value: "all", label: "Semua" },
  { value: "custom", label: "Custom" },
];

const CATEGORY_COLORS = {
  Massage: "#E6007E",
  "Daily Cleaning": "#0F766E",
};

const KATEGORI_LABELS = { massage: "Massage", daily_cleaning: "Daily Cleaning" };

function todayISO() {
  return new Date().toLocaleDateString("en-CA");
}

// Batas periode versi client, dipakai buat filter data pas export CSV —
// dibuat sama persis logikanya kayak di API (app/api/dashboard/analytics/route.js).
function getClientPeriodBounds(range, customFrom, customTo) {
  const now = new Date();
  if (range === "today") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return { start, end: now };
  }
  if (range === "all") return { start: null, end: now };
  if (range === "custom") {
    if (!customFrom || !customTo) return { start: null, end: now };
    const start = new Date(`${customFrom}T00:00:00`);
    let end = new Date(`${customTo}T23:59:59.999`);
    if (end > now) end = now;
    return { start, end };
  }
  const days = Number(range) || 30;
  const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return { start, end: now };
}

// Delta buat metrik hitungan (total pendaftar, total follow-up) -> persentase perubahan.
function countDelta(current, previous) {
  if (previous === null || previous === undefined) return null;
  if (previous === 0) {
    if (!current) return null;
    return { label: "Baru", positive: true };
  }
  const diff = current - previous;
  const pct = Math.round((diff / previous) * 100);
  if (pct === 0) return null;
  return { label: `${diff >= 0 ? "+" : ""}${pct}%`, positive: diff >= 0 };
}

// Delta buat metrik yang lebih pas dibandingin sebagai selisih poin (rate %, hari).
function pointDelta(current, previous, { invert = false, unit = "", decimals = 0 } = {}) {
  if (current === null || current === undefined || previous === null || previous === undefined) return null;
  const diff = current - previous;
  const threshold = decimals > 0 ? 0.05 : 0.5;
  if (Math.abs(diff) < threshold) return null;
  const positive = invert ? diff <= 0 : diff >= 0;
  const val = decimals > 0 ? diff.toFixed(decimals) : Math.round(diff);
  return { label: `${diff >= 0 ? "+" : ""}${val}${unit}`, positive };
}

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [range, setRange] = useState("30");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [showCustomPanel, setShowCustomPanel] = useState(false);
  const [pendingFrom, setPendingFrom] = useState(todayISO());
  const [pendingTo, setPendingTo] = useState(todayISO());
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (range === "custom" && (!customFrom || !customTo)) return;
    setData(null);
    const params = new URLSearchParams({ range });
    if (range === "custom") {
      params.set("from", customFrom);
      params.set("to", customTo);
    }
    fetch(`/api/dashboard/analytics?${params.toString()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then(setData);
  }, [range, customFrom, customTo]);

  function selectRange(value) {
    if (value === "custom") {
      setPendingFrom(customFrom || todayISO());
      setPendingTo(customTo || todayISO());
      setShowCustomPanel(true);
      return;
    }
    setShowCustomPanel(false);
    setRange(value);
  }

  function applyCustomRange() {
    if (!pendingFrom || !pendingTo || pendingFrom > pendingTo) return;
    setCustomFrom(pendingFrom);
    setCustomTo(pendingTo);
    setRange("custom");
    setShowCustomPanel(false);
  }

  const rangeLabel = useMemo(() => {
    if (range === "custom" && customFrom && customTo) {
      return `${formatShortDate(customFrom)} – ${formatShortDate(customTo)}`;
    }
    return RANGE_OPTIONS.find((o) => o.value === range)?.label || "Periode ini";
  }, [range, customFrom, customTo]);

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch("/api/applicants", { cache: "no-store" });
      const json = await res.json();
      const { start, end } = getClientPeriodBounds(range, customFrom, customTo);
      const rows = (json.applicants || []).filter((a) => {
        const t = new Date(a.created_at);
        return (!start || t >= start) && t <= end;
      });

      const headers = ["Nama", "Email", "No Telp", "Gender", "Domisili", "Kategori", "Status", "Tanggal Daftar"];
      const csvRows = rows.map((a) => [
        a.nama,
        a.email,
        a.no_telp,
        a.gender,
        a.domisili,
        KATEGORI_LABELS[a.kategori] || a.kategori,
        a.status,
        new Date(a.created_at).toLocaleString("id-ID"),
      ]);
      const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
      const csv = [headers, ...csvRows].map((r) => r.map(escape).join(",")).join("\r\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `rekrutmen-${range}-${todayISO()}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
      alert("Gagal export data. Coba lagi ya.");
    } finally {
      setExporting(false);
    }
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-56 bg-gray-100 rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
          <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  const maxDomisili = Math.max(1, ...data.topDomisili.map((d) => d.count));
  const maxCategory = Math.max(1, ...(data.categoryBreakdown || []).map((c) => c.count));
  const decisionTotal = data.approvedCount + data.rejectedCount;
  const approvalRate = decisionTotal > 0 ? Math.round((data.approvedCount / decisionTotal) * 100) : null;

  const compare = data.compare;
  const totalDelta = compare ? countDelta(data.total, compare.total) : null;
  const approvalRateDelta =
    compare && approvalRate !== null && compare.approvalRate !== null
      ? pointDelta(approvalRate, Math.round(compare.approvalRate), { unit: " pts" })
      : null;
  const avgDaysDelta =
    compare && data.avgDaysToDecision !== null && compare.avgDaysToDecision !== null
      ? pointDelta(data.avgDaysToDecision, compare.avgDaysToDecision, { invert: true, unit: " hari", decimals: 1 })
      : null;
  const followUpDelta = compare ? countDelta(data.followUpTotal, compare.followUpTotal) : null;

  return (
    <div>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl mb-1 tracking-tight">Performa Rekrutmen</h1>
          <p className="text-ink-muted">Analitik lengkap proses rekrutmen mitra Sejasa.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <div className="flex gap-1.5 bg-gray-50 p-1 rounded-full">
              {RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => selectRange(opt.value)}
                  className={`text-xs font-medium px-3.5 py-1.5 rounded-full transition flex items-center gap-1 ${
                    range === opt.value ? "bg-white text-brand shadow-sm" : "text-ink-muted hover:text-ink"
                  }`}
                >
                  {opt.value === "custom" && <CalendarRange size={12} />}
                  {opt.value === "custom" && range === "custom" && customFrom && customTo
                    ? rangeLabel
                    : opt.label}
                </button>
              ))}
            </div>

            {showCustomPanel && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-72 card p-4 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold">Pilih tanggal</span>
                  <button onClick={() => setShowCustomPanel(false)} className="text-ink-muted hover:text-ink">
                    <X size={16} />
                  </button>
                </div>
                <div className="space-y-2.5">
                  <div>
                    <label className="text-[11px] text-ink-muted block mb-1">Dari</label>
                    <input
                      type="date"
                      value={pendingFrom}
                      max={pendingTo}
                      onChange={(e) => setPendingFrom(e.target.value)}
                      className="input-field !py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-ink-muted block mb-1">Sampai</label>
                    <input
                      type="date"
                      value={pendingTo}
                      min={pendingFrom}
                      max={todayISO()}
                      onChange={(e) => setPendingTo(e.target.value)}
                      className="input-field !py-2 text-sm"
                    />
                  </div>
                </div>
                <button
                  onClick={applyCustomRange}
                  disabled={!pendingFrom || !pendingTo || pendingFrom > pendingTo}
                  className="btn-primary w-full !py-2 text-sm mt-3 disabled:opacity-40"
                >
                  Terapkan
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-full border border-gray-200 hover:border-brand hover:text-brand transition disabled:opacity-50 bg-white"
          >
            <Download size={13} />
            {exporting ? "Menyiapkan..." : "Export CSV"}
          </button>
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users} label="Total Pendaftar" value={data.total} accent="#E6007E" delta={totalDelta} />
        <StatCard
          icon={TrendingUp}
          label="Tingkat Diterima"
          value={approvalRate !== null ? `${approvalRate}%` : "-"}
          sub={decisionTotal > 0 ? `dari ${decisionTotal} keputusan` : "belum ada keputusan"}
          accent="#16A34A"
          delta={approvalRateDelta}
        />
        <StatCard
          icon={Clock}
          label="Rata-rata Proses"
          value={data.avgDaysToDecision !== null ? `${data.avgDaysToDecision.toFixed(1)} hari` : "-"}
          sub={data.decisionCount > 0 ? `dari ${data.decisionCount} kasus` : "belum ada data"}
          accent="#3B82F6"
          delta={avgDaysDelta}
        />
        <StatCard
          icon={MessageCircle}
          label="Total Follow-up"
          value={data.followUpTotal}
          accent="#F59E0B"
          delta={followUpDelta}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Funnel conversion */}
        <div className="card p-5 hover:shadow-lg transition-shadow duration-200">
          <h2 className="font-display text-sm font-semibold mb-4">Funnel Konversi</h2>
          <p className="text-xs text-ink-muted mb-4">Jumlah pelamar yang berhasil mencapai setiap tahap seleksi.</p>
          <div className="space-y-3.5">
            {data.funnelConversion.map((stage) => {
              const pctOfTotal = data.total > 0 ? Math.round((stage.count / data.total) * 100) : 0;
              const pct = data.total > 0 ? (stage.count / data.total) * 100 : 0;
              return (
                <div key={stage.stage}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm">{STAGE_LABELS[stage.stage]}</span>
                    <span className="text-sm font-semibold tabular-nums">
                      {stage.count}
                      <span className="text-xs text-ink-muted font-normal ml-1.5">({pctOfTotal}%)</span>
                    </span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: STAGE_COLORS[stage.stage] }}
                    />
                  </div>
                </div>
              );
            })}
            <div className="flex gap-6 pt-3 border-t border-gray-100">
              <div>
                <span className="text-xs text-ink-muted block">Diterima</span>
                <span className="text-lg font-bold" style={{ color: "#16A34A" }}>
                  {data.approvedCount}
                </span>
              </div>
              <div>
                <span className="text-xs text-ink-muted block">Ditolak</span>
                <span className="text-lg font-bold" style={{ color: "#DC2626" }}>
                  {data.rejectedCount}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Trend chart */}
        <div className="card p-5 hover:shadow-lg transition-shadow duration-200">
          <h2 className="font-display text-sm font-semibold mb-1">Tren Pendaftaran</h2>
          <p className="text-xs text-ink-muted mb-4">
            {rangeLabel}
            {data.trendGranularity === "weekly" && " · per minggu"}
            {data.trendGranularity === "daily" && " · per hari"}
            {data.trendGranularity === "hourly" && " · per jam"}.
          </p>
          <TrendChart trend={data.trend} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top kota */}
        <div className="card p-5 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={16} className="text-ink-muted" />
            <h2 className="font-display text-sm font-semibold">Top Kota</h2>
          </div>
          {data.topDomisili.length === 0 ? (
            <EmptyState icon={MapPin} text="Belum ada data di periode ini." />
          ) : (
            <div className="space-y-3">
              {data.topDomisili.map((d) => (
                <div key={d.domisili}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">{d.domisili}</span>
                    <span className="text-sm font-semibold">{d.count}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${(d.count / maxDomisili) * 100}%`, backgroundColor: "#E6007E" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Distribusi kategori */}
        <div className="card p-5 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center gap-2 mb-4">
            <Tags size={16} className="text-ink-muted" />
            <h2 className="font-display text-sm font-semibold">Distribusi Kategori</h2>
          </div>
          {!data.categoryBreakdown || data.categoryBreakdown.length === 0 ? (
            <EmptyState icon={Tags} text="Belum ada data di periode ini." />
          ) : (
            <div className="space-y-3">
              {data.categoryBreakdown.map((c) => {
                const pct = data.total > 0 ? Math.round((c.count / data.total) * 100) : 0;
                const color = CATEGORY_COLORS[c.kategori] || "#94A3B8";
                return (
                  <div key={c.kategori}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">{c.kategori}</span>
                      <span className="text-sm font-semibold">
                        {c.count} <span className="text-xs text-ink-muted font-normal">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(c.count / maxCategory) * 100}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Follow-up breakdown */}
        <div className="card p-5 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle size={16} className="text-ink-muted" />
            <h2 className="font-display text-sm font-semibold">Hasil Follow-up</h2>
          </div>
          {data.followUpTotal === 0 ? (
            <EmptyState icon={MessageCircle} text="Belum ada catatan follow-up di periode ini." />
          ) : (
            <div className="space-y-2">
              {Object.entries(data.followUpByResponse)
                .sort((a, b) => b[1] - a[1])
                .map(([response, count]) => (
                  <div key={response} className="flex items-center justify-between text-sm">
                    <span className="text-ink-muted">{response}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      <ApprovedMitraTable />
    </div>
  );
}

function TrendChart({ trend }) {
  const maxTrend = Math.max(1, ...trend.map((t) => t.count));

  if (maxTrend <= 1 && trend.every((t) => t.count === 0)) {
    return (
      <div className="relative h-40 flex flex-col items-center justify-center text-center">
        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-2">
          <TrendingUp size={16} className="text-gray-300" />
        </div>
        <p className="text-sm text-ink-muted">Belum ada pendaftaran di periode ini.</p>
      </div>
    );
  }

  const W = 600;
  const H = 160;
  const PAD_TOP = 14;
  const PAD_BOTTOM = 4;
  const usableH = H - PAD_TOP - PAD_BOTTOM;
  const n = trend.length;

  const points = trend.map((t, i) => {
    const x = n <= 1 ? W / 2 : (i / (n - 1)) * W;
    const y = PAD_TOP + usableH - (t.count / maxTrend) * usableH;
    return { x, y, count: t.count, label: t.date };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");
  const areaPath =
    n > 1
      ? `${linePath} L ${points[n - 1].x.toFixed(2)} ${H} L ${points[0].x.toFixed(2)} ${H} Z`
      : "";

  // Biar ga terlalu ramai, cuma tampilin label di bawah tiap ~1/6 titik.
  const labelStep = Math.max(1, Math.ceil(n / 6));

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-40">
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E6007E" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#E6007E" stopOpacity="0" />
          </linearGradient>
        </defs>
        {areaPath && <path d={areaPath} fill="url(#trendFill)" stroke="none" />}
        <path d={linePath} fill="none" stroke="#E6007E" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={n > 40 ? 1.6 : 2.6} fill="#fff" stroke="#E6007E" strokeWidth="2">
            <title>{`${p.label}: ${p.count}`}</title>
          </circle>
        ))}
      </svg>
      <div className="flex justify-between mt-2 text-[10px] text-ink-muted">
        {points
          .filter((_, i) => i % labelStep === 0 || i === n - 1)
          .map((p, i) => (
            <span key={i}>{p.label}</span>
          ))}
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-2">
        <Icon size={16} className="text-gray-300" />
      </div>
      <p className="text-sm text-ink-muted">{text}</p>
    </div>
  );
}

function formatShortDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function StatCard({ icon: Icon, label, value, sub, accent, delta }) {
  return (
    <div className="card p-5 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className="text-[11px] uppercase tracking-wide text-gray-400 font-medium">{label}</div>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${accent}1A` }}
        >
          <Icon size={15} style={{ color: accent }} />
        </div>
      </div>
      <div className="flex items-end gap-2 flex-wrap">
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        {delta && (
          <span
            className={`inline-flex items-center gap-0.5 text-[11px] font-semibold mb-1 ${
              delta.positive ? "text-green-600" : "text-red-500"
            }`}
          >
            {delta.label !== "Baru" &&
              (delta.positive ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />)}
            {delta.label}
          </span>
        )}
      </div>
      {sub && <div className="text-xs text-ink-muted mt-1.5">{sub}</div>}
      {delta && <div className="text-[10px] text-ink-muted mt-0.5">vs periode sebelumnya</div>}
    </div>
  );
}
