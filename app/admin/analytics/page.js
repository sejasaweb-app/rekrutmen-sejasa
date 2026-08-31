"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Clock, MapPin, MessageCircle, Users, Tags } from "lucide-react";

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
  { value: "7", label: "7 Hari" },
  { value: "14", label: "14 Hari" },
  { value: "30", label: "30 Hari" },
  { value: "90", label: "90 Hari" },
  { value: "all", label: "Semua" },
];

const CATEGORY_COLORS = {
  Massage: "#E6007E",
  "Daily Cleaning": "#7C3AED",
};

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [range, setRange] = useState("30");

  useEffect(() => {
    setData(null);
    fetch(`/api/dashboard/analytics?range=${range}`, { cache: "no-store" })
      .then((r) => r.json())
      .then(setData);
  }, [range]);

  if (!data) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-56 bg-gray-100 rounded animate-pulse" />
        <div className="h-40 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-40 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  const maxTrend = Math.max(1, ...data.trend.map((t) => t.count));
  const maxDomisili = Math.max(1, ...data.topDomisili.map((d) => d.count));
  const maxCategory = Math.max(1, ...(data.categoryBreakdown || []).map((c) => c.count));
  const decisionTotal = data.approvedCount + data.rejectedCount;
  const approvalRate = decisionTotal > 0 ? Math.round((data.approvedCount / decisionTotal) * 100) : null;

  return (
    <div>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl mb-1 tracking-tight">Performa Rekrutmen</h1>
          <p className="text-ink-muted">Analitik lengkap proses rekrutmen mitra Sejasa.</p>
        </div>
        <div className="flex gap-1.5 bg-gray-50 p-1 rounded-full">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRange(opt.value)}
              className={`text-xs font-medium px-3.5 py-1.5 rounded-full transition ${
                range === opt.value ? "bg-white text-brand shadow-sm" : "text-ink-muted hover:text-ink"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={Users}
          label="Total Pendaftar"
          value={data.total}
          accent="#E6007E"
        />
        <StatCard
          icon={TrendingUp}
          label="Tingkat Diterima"
          value={approvalRate !== null ? `${approvalRate}%` : "-"}
          sub={decisionTotal > 0 ? `dari ${decisionTotal} keputusan` : "belum ada keputusan"}
          accent="#16A34A"
        />
        <StatCard
          icon={Clock}
          label="Rata-rata Proses"
          value={data.avgDaysToDecision !== null ? `${data.avgDaysToDecision.toFixed(1)} hari` : "-"}
          sub={data.decisionCount > 0 ? `dari ${data.decisionCount} kasus` : "belum ada data"}
          accent="#3B82F6"
        />
        <StatCard
          icon={MessageCircle}
          label="Total Follow-up"
          value={data.followUpTotal}
          accent="#F59E0B"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Funnel conversion */}
        <div className="card p-5 hover:shadow-lg transition-shadow duration-200">
          <h2 className="font-display text-sm font-semibold mb-4">Funnel Konversi</h2>
          <p className="text-xs text-ink-muted mb-4">Jumlah pendaftar yang pernah mencapai tiap tahap.</p>
          <div className="space-y-4">
            {data.funnelConversion.map((stage, i) => {
              const pct = data.total > 0 ? (stage.count / data.total) * 100 : 0;
              const prevCount = i === 0 ? data.total : data.funnelConversion[i - 1].count;
              const dropOffPct = prevCount > 0 ? Math.round(((prevCount - stage.count) / prevCount) * 100) : 0;
              return (
                <div key={stage.stage}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm">{STAGE_LABELS[stage.stage]}</span>
                    <span className="text-sm font-semibold tabular-nums">
                      {stage.count}
                      {i > 0 && dropOffPct > 0 && (
                        <span className="text-xs text-ink-muted font-normal ml-1.5">
                          (-{dropOffPct}%)
                        </span>
                      )}
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
            <div className="flex gap-6 pt-2 border-t border-gray-100">
              <div>
                <span className="text-xs text-ink-muted block">Diterima</span>
                <span className="text-lg font-bold" style={{ color: "#16A34A" }}>{data.approvedCount}</span>
              </div>
              <div>
                <span className="text-xs text-ink-muted block">Ditolak</span>
                <span className="text-lg font-bold" style={{ color: "#DC2626" }}>{data.rejectedCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Trend chart */}
        <div className="card p-5 hover:shadow-lg transition-shadow duration-200">
          <h2 className="font-display text-sm font-semibold mb-1">Tren Pendaftaran</h2>
          <p className="text-xs text-ink-muted mb-4">
            {RANGE_OPTIONS.find((o) => o.value === range)?.label || "Periode ini"}
            {data.trendGranularity === "weekly" ? " · per minggu" : " · per hari"}.
          </p>
          <div className="relative h-40">
            {maxTrend === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-2">
                  <TrendingUp size={16} className="text-gray-300" />
                </div>
                <p className="text-sm text-ink-muted">Belum ada pendaftaran di periode ini.</p>
              </div>
            ) : (
              <div className="flex items-end gap-1 h-full">
                {data.trend.map((t) => (
                  <div key={t.date} className="flex-1 flex flex-col items-center justify-end gap-1 group relative">
                    <span className="text-[10px] text-ink-muted opacity-0 group-hover:opacity-100 transition absolute -top-4">
                      {t.count}
                    </span>
                    <div
                      className="w-full rounded-t transition-all"
                      style={{
                        height: `${Math.max(4, (t.count / maxTrend) * 100)}%`,
                        backgroundColor: t.count > 0 ? "#E6007E" : "#F1F5F9",
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-ink-muted">
            <span>
              {data.trendGranularity === "weekly"
                ? data.trend[0]?.date
                : formatShortDate(data.trend[0]?.date)}
            </span>
            <span>
              {data.trendGranularity === "weekly"
                ? data.trend[data.trend.length - 1]?.date
                : formatShortDate(data.trend[data.trend.length - 1]?.date)}
            </span>
          </div>
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
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-2">
                <MapPin size={16} className="text-gray-300" />
              </div>
              <p className="text-sm text-ink-muted">Belum ada data di periode ini.</p>
            </div>
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
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-2">
                <Tags size={16} className="text-gray-300" />
              </div>
              <p className="text-sm text-ink-muted">Belum ada data di periode ini.</p>
            </div>
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
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-2">
                <MessageCircle size={16} className="text-gray-300" />
              </div>
              <p className="text-sm text-ink-muted">Belum ada catatan follow-up di periode ini.</p>
            </div>
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
    </div>
  );
}

function formatShortDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function StatCard({ icon: Icon, label, value, sub, accent }) {
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
      <div className="text-3xl font-bold tracking-tight">{value}</div>
      {sub && <div className="text-xs text-ink-muted mt-1.5">{sub}</div>}
    </div>
  );
}
