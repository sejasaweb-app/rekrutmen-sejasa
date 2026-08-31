"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Sparkles,
  Home,
  CheckCircle2,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
} from "lucide-react";
import StatusBadge from "@/components/StatusBadge";

// Ubah nomor telepon Indonesia (format apapun) jadi link wa.me yang valid
function toWhatsAppLink(phone) {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) {
    digits = "62" + digits.slice(1);
  } else if (!digits.startsWith("62")) {
    digits = "62" + digits;
  }
  return `https://wa.me/${digits}`;
}

const STATUS_OPTIONS = [
  { value: "", label: "Semua Status" },
  { value: "data_baru", label: "Data Baru" },
  { value: "screening", label: "Screening" },
  { value: "onboarding", label: "Onboarding" },
  { value: "approved", label: "Diterima" },
  { value: "rejected", label: "Ditolak" },
];

const KATEGORI_OPTIONS = [
  { value: "", label: "Semua Kategori" },
  { value: "massage", label: "Massage" },
  { value: "daily_cleaning", label: "Daily Cleaning" },
];

const FUNNEL_STEPS = [
  { value: "data_baru", label: "Data Baru", color: "#94A3B8" },
  { value: "screening", label: "Screening", color: "#3B82F6" },
  { value: "onboarding", label: "Onboarding", color: "#8B5CF6" },
  { value: "approved", label: "Diterima", color: "#16A34A" },
  { value: "rejected", label: "Ditolak", color: "#DC2626" },
];

const PAGE_SIZE = 10;

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [kategori, setKategori] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const loadData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (kategori) params.set("kategori", kategori);
    if (q) params.set("q", q);

    const [summaryRes, listRes] = await Promise.all([
      fetch("/api/dashboard/summary", { cache: "no-store" }),
      fetch(`/api/applicants?${params.toString()}`, { cache: "no-store" }),
    ]);
    const summaryData = await summaryRes.json();
    const listData = await listRes.json();

    setSummary(summaryData);
    setApplicants(listData.applicants || []);
    setLoading(false);
    setPage(1);
  }, [status, kategori, q]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const funnelTotal = summary?.total || 0;
  const totalPages = Math.max(1, Math.ceil(applicants.length / PAGE_SIZE));
  const paginated = applicants.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function exportCsv() {
    const headers = ["Nama", "Email", "No Telp", "Gender", "Domisili", "Kategori", "Punya Motor", "Status", "Tanggal Daftar"];
    const rows = applicants.map((a) => [
      a.nama,
      a.email,
      a.no_telp,
      a.gender === "male" ? "Laki-laki" : "Perempuan",
      a.domisili,
      a.kategori.replace("_", " "),
      a.punya_motor ? "Ya" : "Tidak",
      STATUS_OPTIONS.find((s) => s.value === a.status)?.label || a.status,
      new Date(a.created_at).toLocaleDateString("id-ID"),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `rekap-mitra-sejasa-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Dashboard Rekrutmen Mitra</h1>
          <p className="text-ink-muted">Rekapan dan status pendaftaran mitra Sejasa.</p>
        </div>
        <button
          onClick={exportCsv}
          disabled={applicants.length === 0}
          className="flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-ink hover:border-brand hover:text-brand transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          icon={Users}
          label="Total Pendaftar"
          value={summary?.total ?? "-"}
          accent="#E6007E"
          highlight
        />
        <SummaryCard
          icon={Sparkles}
          label="Massage"
          value={summary?.byKategori?.massage ?? 0}
          accent="#F59E0B"
        />
        <SummaryCard
          icon={Home}
          label="Daily Cleaning"
          value={summary?.byKategori?.daily_cleaning ?? 0}
          accent="#3B82F6"
        />
        <SummaryCard
          icon={CheckCircle2}
          label="Diterima"
          value={summary?.byStatus?.approved ?? 0}
          accent="#16A34A"
        />
      </div>

      {/* Funnel chart */}
      <div className="card p-5 mb-6">
        <h2 className="text-sm font-semibold mb-5">Funnel Status</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          {FUNNEL_STEPS.map((step) => {
            const value = summary?.byStatus?.[step.value] ?? 0;
            const pct = funnelTotal > 0 ? (value / funnelTotal) * 100 : 0;
            return (
              <div key={step.value}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-ink flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: step.color }} />
                    {step.label}
                  </span>
                  <span className="text-sm font-semibold tabular-nums">{value}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${pct}%`, backgroundColor: step.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative max-w-xs flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            className="input-field pl-10"
            placeholder="Cari nama, email, atau no. telp"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select className="input-field max-w-[180px]" value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select className="input-field max-w-[180px]" value={kategori} onChange={(e) => setKategori(e.target.value)}>
          {KATEGORI_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/70 text-gray-400 text-left">
              <tr className="text-[11px] uppercase tracking-wider">
                <th className="px-4 py-3 font-semibold">Nama</th>
                <th className="px-4 py-3 font-semibold">Kategori</th>
                <th className="px-4 py-3 font-semibold">Domisili</th>
                <th className="px-4 py-3 font-semibold">Motor</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Tanggal</th>
                <th className="px-4 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="px-4 py-4" colSpan={7}>
                      <div className="h-4 bg-gray-100 rounded animate-pulse w-full max-w-md" />
                    </td>
                  </tr>
                ))
              ) : applicants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="text-ink-muted text-sm">
                      {q || status || kategori
                        ? "Ga ada pendaftar yang cocok dengan filter ini."
                        : "Belum ada pendaftar. Data bakal muncul di sini setelah ada yang isi form."}
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((a) => (
                  <tr key={a.id} className="border-t border-gray-100 hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <Link href={`/admin/applicants/${a.id}`} className="flex items-center gap-3 group">
                        <div className="w-8 h-8 rounded-full bg-brand-light text-brand flex items-center justify-center text-xs font-semibold shrink-0">
                          {a.nama.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-ink group-hover:text-brand">{a.nama}</div>
                          <div className="text-xs text-ink-muted">{a.email}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 capitalize">{a.kategori.replace("_", " ")}</td>
                    <td className="px-4 py-3">{a.domisili}</td>
                    <td className="px-4 py-3">{a.punya_motor ? "Ya" : "Tidak"}</td>
                    <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                    <td className="px-4 py-3 text-ink-muted">
                      {new Date(a.created_at).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-4 py-3">
                      {toWhatsAppLink(a.no_telp) && (
                        <a
                          href={toWhatsAppLink(a.no_telp)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title="Buka WhatsApp"
                          className="inline-flex items-center justify-center w-7 h-7 rounded-full text-green-600 hover:bg-green-50 transition"
                        >
                          <MessageCircle size={15} />
                        </a>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && applicants.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm">
            <span className="text-ink-muted">
              Halaman {page} dari {totalPages} · {applicants.length} total
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-30 hover:border-brand hover:text-brand transition"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-30 hover:border-brand hover:text-brand transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, accent, highlight }) {
  if (highlight) {
    return (
      <div className="card p-5 text-white" style={{ backgroundColor: accent }}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-[11px] uppercase tracking-wide text-white/75 font-medium">{label}</div>
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Icon size={15} className="text-white" />
          </div>
        </div>
        <div className="text-3xl font-bold tracking-tight">{value}</div>
      </div>
    );
  }

  return (
    <div className="card p-5">
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
    </div>
  );
}
