"use client";

import { useEffect, useState, useCallback, useRef, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import {
  Users,
  Sparkles,
  Home,
  CheckCircle2,
  Search,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  MessageCircle,
  Trash2,
  X,
  Bike,
} from "lucide-react";
import StatusBadge, { STATUS_META } from "@/components/StatusBadge";

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

// "Diperbarui 5 detik lalu" / "2 menit lalu" — biar admin tau data-nya seger apa nggak
// tanpa perlu tebak-tebak, berguna banget pas acara on-site yang datanya cepet berubah.
function formatRelativeTime(date) {
  if (!date) return "";
  const diffSec = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (diffSec < 5) return "Baru saja diperbarui";
  if (diffSec < 60) return `Diperbarui ${diffSec} detik lalu`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `Diperbarui ${diffMin} menit lalu`;
  const diffHour = Math.round(diffMin / 60);
  return `Diperbarui ${diffHour} jam lalu`;
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

const KATEGORI_STYLES = {
  massage: { label: "Massage", classes: "bg-brand-light text-brand" },
  daily_cleaning: { label: "Daily Cleaning", classes: "bg-teal-100 text-teal-700" },
};

const FUNNEL_STEPS = [
  { value: "data_baru", label: "Data Baru", color: "#94A3B8" },
  { value: "screening", label: "Screening", color: "#3B82F6" },
  { value: "onboarding", label: "Onboarding", color: "#8B5CF6" },
  { value: "approved", label: "Diterima", color: "#16A34A" },
  { value: "rejected", label: "Ditolak", color: "#DC2626" },
];

const PAGE_SIZE_OPTIONS = [20, 50, 100];

function AdminDashboardContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [summary, setSummary] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [, setTick] = useState(0); // cuma buat trigger re-render tiap menit biar teks "X menit lalu" update
  const [deletingId, setDeletingId] = useState(null);

  // Filter & pagination state — nilai awal diambil dari URL, jadi kalau user
  // pencet tombol back dari halaman detail, dia balik ke state yang sama persis
  // (filter, pencarian, halaman, dan jumlah baris per halaman) bukan ke default.
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [kategori, setKategori] = useState(searchParams.get("kategori") || "");
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [pageSize, setPageSize] = useState(
    PAGE_SIZE_OPTIONS.includes(Number(searchParams.get("pageSize")))
      ? Number(searchParams.get("pageSize"))
      : PAGE_SIZE_OPTIONS[0]
  );
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");

  const isFirstFilterRun = useRef(true);

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
    setLastUpdated(new Date());
  }, [status, kategori, q]);

  // Tombol refresh manual — dipisah dari `loading` (yang juga dipakai skeleton awal)
  // biar animasi ikon berputar cuma jelas kelihatan pas user sengaja klik refresh.
  async function handleManualRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  // Update teks "X menit lalu" tiap 30 detik, tanpa perlu fetch ulang ke server.
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const refreshSummary = useCallback(() => {
    fetch("/api/dashboard/summary", { cache: "no-store" })
      .then((r) => r.json())
      .then(setSummary);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset ke halaman 1 setiap kali filter/pencarian berubah karena aksi user
  // (bukan saat mount pertama, biar page dari URL tetap kepakai waktu balik dari detail).
  useEffect(() => {
    if (isFirstFilterRun.current) {
      isFirstFilterRun.current = false;
      return;
    }
    setPage(1);
  }, [status, kategori, q, pageSize]);

  // Simpan kombinasi filter/halaman ke URL (replace, ga nambah history baru)
  // biar tombol back browser dari halaman detail balik ke state list yang sama.
  useEffect(() => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (kategori) params.set("kategori", kategori);
    if (q) params.set("q", q);
    if (page > 1) params.set("page", String(page));
    if (pageSize !== PAGE_SIZE_OPTIONS[0]) params.set("pageSize", String(pageSize));
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [status, kategori, q, page, pageSize, pathname, router]);

  const hasActiveFilters = Boolean(q || status || kategori);

  function resetFilters() {
    setQ("");
    setStatus("");
    setKategori("");
  }

  function toggleSort(field) {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir(field === "nama" ? "asc" : "desc");
    }
  }

  async function handleDelete(id, nama) {
    if (!window.confirm(`Hapus data "${nama}"? Data ini ga bisa dikembalikan lagi.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/applicants/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setApplicants((prev) => prev.filter((a) => a.id !== id));
      toast.success("Data berhasil dihapus");
      refreshSummary();
    } catch {
      toast.error("Gagal menghapus data, coba lagi ya");
    } finally {
      setDeletingId(null);
    }
  }

  const funnelTotal = summary?.total || 0;

  const sortedApplicants = useMemo(() => {
    const arr = [...applicants];
    arr.sort((a, b) => {
      const cmp =
        sortBy === "nama"
          ? a.nama.localeCompare(b.nama, "id")
          : new Date(a.created_at) - new Date(b.created_at);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [applicants, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedApplicants.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = sortedApplicants.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function exportCsv() {
    const headers = ["Nama", "Email", "No Telp", "Gender", "Domisili", "Kategori", "Punya Motor", "Status", "Tanggal Daftar"];
    const rows = sortedApplicants.map((a) => [
      a.nama,
      a.email,
      a.no_telp,
      a.gender === "male" ? "Laki-laki" : "Perempuan",
      a.domisili,
      a.kategori.replace("_", " "),
      a.punya_motor ? "Ya" : "Tidak",
      STATUS_META[a.status]?.label || a.status,
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
      <Toaster position="top-center" />
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl mb-1 tracking-tight">Dashboard Rekrutmen Mitra</h1>
          <p className="text-ink-muted">Rekapan dan status pendaftaran mitra Sejasa.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {lastUpdated && (
            <span className="text-xs text-ink-muted mr-1">{formatRelativeTime(lastUpdated)}</span>
          )}
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            title="Muat ulang data terbaru"
            className="flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-ink hover:border-brand hover:text-brand hover:shadow-sm transition disabled:opacity-60 shrink-0 bg-white"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Memuat..." : "Refresh"}
          </button>
          <button
            onClick={exportCsv}
            disabled={applicants.length === 0}
            className="flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-ink hover:border-brand hover:text-brand hover:shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0 bg-white"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
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
      <div className="card p-5 mb-6 hover:shadow-lg transition-shadow duration-200">
        <h2 className="font-display text-sm font-semibold mb-5">Funnel Status</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          {FUNNEL_STEPS.map((step) => {
            const value = summary?.byStatus?.[step.value] ?? 0;
            const pct = funnelTotal > 0 ? (value / funnelTotal) * 100 : 0;
            const Icon = STATUS_META[step.value]?.icon;
            return (
              <div key={step.value}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-ink flex items-center gap-2">
                    {Icon ? (
                      <Icon size={13} style={{ color: step.color }} strokeWidth={2.25} />
                    ) : (
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: step.color }} />
                    )}
                    {step.label}
                  </span>
                  <span className="text-sm font-semibold tabular-nums">
                    {value}
                    {funnelTotal > 0 && (
                      <span className="text-xs text-ink-muted font-normal ml-1.5">({Math.round(pct)}%)</span>
                    )}
                  </span>
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
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative max-w-xs flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            className="input-field pl-10"
            placeholder="Cari nama, email, atau no. telp"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
              title="Bersihkan pencarian"
            >
              <X size={14} />
            </button>
          )}
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
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-xs font-medium text-ink-muted hover:text-brand transition px-2 py-1.5"
          >
            <X size={13} />
            Reset filter
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/70 text-gray-400 text-left">
              <tr className="text-[11px] uppercase tracking-wider">
                <SortableHeader label="Nama" field="nama" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <th className="px-4 py-3 font-semibold">Kategori</th>
                <th className="px-4 py-3 font-semibold">Domisili</th>
                <th className="px-4 py-3 font-semibold">Motor</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <SortableHeader label="Tanggal" field="created_at" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <th className="px-4 py-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
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
                paginated.map((a) => {
                  const kategoriStyle = KATEGORI_STYLES[a.kategori];
                  return (
                    <tr key={a.id} className="border-t border-gray-100 hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/admin/applicants/${a.id}`} className="flex items-center gap-3 group">
                          <div className="w-8 h-8 rounded-full bg-brand-light text-brand flex items-center justify-center text-xs font-semibold shrink-0 ring-1 ring-brand/10 group-hover:ring-brand/30 transition">
                            {a.nama.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-ink group-hover:text-brand transition-colors">{a.nama}</div>
                            <div className="text-xs text-ink-muted">{a.email}</div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${kategoriStyle?.classes || "bg-gray-100 text-gray-600"}`}>
                          {kategoriStyle?.label || a.kategori.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink-muted">{a.domisili}</td>
                      <td className="px-4 py-3">
                        {a.punya_motor ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                            <Bike size={13} /> Ya
                          </span>
                        ) : (
                          <span className="text-xs text-ink-muted">Tidak</span>
                        )}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                      <td className="px-4 py-3 text-ink-muted">
                        {new Date(a.created_at).toLocaleDateString("id-ID")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
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
                          <button
                            onClick={() => handleDelete(a.id, a.nama)}
                            disabled={deletingId === a.id}
                            title="Hapus data"
                            className="inline-flex items-center justify-center w-7 h-7 rounded-full text-red-500 hover:bg-red-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && applicants.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 text-sm">
            <span className="text-ink-muted">
              Halaman {currentPage} dari {totalPages} · {applicants.length} total
            </span>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-ink-muted">
                Tampilkan
                <select
                  className="input-field !w-auto !py-1.5 !px-3 text-sm"
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                >
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-30 hover:border-brand hover:text-brand transition"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-30 hover:border-brand hover:text-brand transition"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<div className="text-sm text-ink-muted">Memuat dashboard...</div>}>
      <AdminDashboardContent />
    </Suspense>
  );
}

function SortableHeader({ label, field, sortBy, sortDir, onSort }) {
  const active = sortBy === field;
  return (
    <th className="px-4 py-3 font-semibold">
      <button
        onClick={() => onSort(field)}
        className={`flex items-center gap-1 uppercase tracking-wider text-[11px] font-semibold transition ${
          active ? "text-brand" : "text-gray-400 hover:text-ink"
        }`}
      >
        {label}
        {active ? (
          sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />
        ) : (
          <ArrowUpDown size={11} className="opacity-40" />
        )}
      </button>
    </th>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-t border-gray-100">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse shrink-0" />
          <div className="space-y-1.5 w-full max-w-[160px]">
            <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
            <div className="h-2.5 bg-gray-100 rounded animate-pulse w-full" />
          </div>
        </div>
      </td>
      <td className="px-4 py-3"><div className="h-5 w-20 bg-gray-100 rounded-full animate-pulse" /></td>
      <td className="px-4 py-3"><div className="h-3 w-28 bg-gray-100 rounded animate-pulse" /></td>
      <td className="px-4 py-3"><div className="h-3 w-10 bg-gray-100 rounded animate-pulse" /></td>
      <td className="px-4 py-3"><div className="h-5 w-20 bg-gray-100 rounded-full animate-pulse" /></td>
      <td className="px-4 py-3"><div className="h-3 w-16 bg-gray-100 rounded animate-pulse" /></td>
      <td className="px-4 py-3"><div className="h-3 w-10 bg-gray-100 rounded animate-pulse ml-auto" /></td>
    </tr>
  );
}

function SummaryCard({ icon: Icon, label, value, accent, highlight }) {
  if (highlight) {
    return (
      <div
        className="card p-5 text-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
        style={{ backgroundColor: accent }}
      >
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
    <div className="card p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
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
