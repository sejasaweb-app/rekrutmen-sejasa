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
  PauseCircle,
  UserCircle2,
} from "lucide-react";
import StatusBadge, { STATUS_META } from "@/components/StatusBadge";
import BulkStatusModal from "@/components/BulkStatusModal";
import FilterDropdown from "@/components/FilterDropdown";

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
  { value: "", label: "Status" },
  { value: "data_baru", label: "Data Baru" },
  { value: "pending", label: "Pending" },
  { value: "screening", label: "Screening" },
  { value: "onboarding", label: "Onboarding" },
  { value: "approved", label: "Diterima" },
  { value: "rejected", label: "Ditolak" },
];

const KATEGORI_OPTIONS = [
  { value: "", label: "Kategori" },
  { value: "massage", label: "Massage" },
  { value: "daily_cleaning", label: "Daily Cleaning" },
];

const GENDER_OPTIONS = [
  { value: "", label: "Gender" },
  { value: "male", label: "Laki-laki" },
  { value: "female", label: "Perempuan" },
];

const SUMBER_INFO_OPTIONS = [
  { value: "", label: "Sumber Info" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "facebook", label: "Facebook" },
  { value: "teman", label: "Teman" },
  { value: "lainnya", label: "Lainnya" },
];

const SUMBER_INFO_LABELS = {
  whatsapp: "WhatsApp",
  facebook: "Facebook",
  teman: "Teman",
  lainnya: "Lainnya",
};

const PUNYA_ALAT_OPTIONS = [
  { value: "", label: "Alat Cleaning" },
  { value: "ya", label: "Punya Alat" },
  { value: "tidak", label: "Tidak Punya Alat" },
];

const PUNYA_MOTOR_OPTIONS = [
  { value: "", label: "Motor" },
  { value: "ya", label: "Punya Motor" },
  { value: "tidak", label: "Tidak Punya Motor" },
];

// Batas pelamar per sekali proses ubah status massal (jaga-jaga salah pilih,
// dan biar kuota WhatsApp ga kebakar sekaligus).
const MAX_BULK = 100;

const KATEGORI_STYLES = {
  massage: { label: "Massage", classes: "bg-brand-light text-brand" },
  daily_cleaning: { label: "Daily Cleaning", classes: "bg-teal-100 text-teal-700" },
};

const FUNNEL_STEPS = [
  { value: "data_baru", label: "Data Baru", color: "#94A3B8" },
  { value: "pending", label: "Pending", color: "#F59E0B" },
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
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkOpen, setBulkOpen] = useState(false);

  // Filter & pagination state — nilai awal diambil dari URL, jadi kalau user
  // pencet tombol back dari halaman detail, dia balik ke state yang sama persis
  // (filter, pencarian, halaman, dan jumlah baris per halaman) bukan ke default.
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [kategori, setKategori] = useState(searchParams.get("kategori") || "");
  const [gender, setGender] = useState(searchParams.get("gender") || "");
  const [kota, setKota] = useState(searchParams.get("kota") || "");
  const [diprosesOleh, setDiprosesOleh] = useState(searchParams.get("diproses_oleh") || "");
  const [sumberInfo, setSumberInfo] = useState(searchParams.get("sumber_info") || "");
  const [punyaAlat, setPunyaAlat] = useState(searchParams.get("punya_alat") || "");
  const [punyaMotor, setPunyaMotor] = useState(searchParams.get("punya_motor") || "");
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
    if (gender) params.set("gender", gender);
    if (kota) params.set("kota", kota);
    if (diprosesOleh) params.set("diproses_oleh", diprosesOleh);
    if (sumberInfo) params.set("sumber_info", sumberInfo);
    if (punyaAlat) params.set("punya_alat", punyaAlat);
    if (punyaMotor) params.set("punya_motor", punyaMotor);
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
  }, [status, kategori, gender, kota, diprosesOleh, sumberInfo, punyaAlat, punyaMotor, q]);

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
  }, [status, kategori, gender, kota, diprosesOleh, sumberInfo, punyaAlat, punyaMotor, q, pageSize]);

  // Ganti filter/pencarian = daftar yang tampil berubah, jadi pilihan (checkbox)
  // dikosongin biar ga ada pelamar "kepilih tapi ga keliatan" yang ikut ke-update.
  const isFirstSelectionRun = useRef(true);
  useEffect(() => {
    if (isFirstSelectionRun.current) {
      isFirstSelectionRun.current = false;
      return;
    }
    setSelectedIds(new Set());
  }, [status, kategori, gender, kota, diprosesOleh, sumberInfo, punyaAlat, punyaMotor, q]);

  // Simpan kombinasi filter/halaman ke URL (replace, ga nambah history baru)
  // biar tombol back browser dari halaman detail balik ke state list yang sama.
  useEffect(() => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (kategori) params.set("kategori", kategori);
    if (gender) params.set("gender", gender);
    if (kota) params.set("kota", kota);
    if (diprosesOleh) params.set("diproses_oleh", diprosesOleh);
    if (sumberInfo) params.set("sumber_info", sumberInfo);
    if (punyaAlat) params.set("punya_alat", punyaAlat);
    if (punyaMotor) params.set("punya_motor", punyaMotor);
    if (q) params.set("q", q);
    if (page > 1) params.set("page", String(page));
    if (pageSize !== PAGE_SIZE_OPTIONS[0]) params.set("pageSize", String(pageSize));
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [status, kategori, gender, kota, diprosesOleh, sumberInfo, punyaAlat, punyaMotor, page, pageSize, pathname, router, q]);

  const hasActiveFilters = Boolean(
    q || status || kategori || gender || kota || diprosesOleh || sumberInfo || punyaAlat || punyaMotor
  );

  function resetFilters() {
    setQ("");
    setStatus("");
    setKategori("");
    setGender("");
    setKota("");
    setDiprosesOleh("");
    setSumberInfo("");
    setPunyaAlat("");
    setPunyaMotor("");
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
    if (!window.confirm(`Hapus data "${nama}"? Data ini tidak bisa dikembalikan lagi.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/applicants/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setApplicants((prev) => prev.filter((a) => a.id !== id));
      toast.success("Data berhasil dihapus");
      refreshSummary();
    } catch {
      toast.error("Gagal menghapus data, silakan coba lagi");
    } finally {
      setDeletingId(null);
    }
  }

  const funnelTotal = summary?.total || 0;

  const kotaFilterOptions = useMemo(
    () => [{ value: "", label: "Kota" }, ...(summary?.kotaOptions || []).map((k) => ({ value: k, label: k }))],
    [summary]
  );
  const adminFilterOptions = useMemo(
    () => [
      { value: "", label: "Admin" },
      { value: "__belum__", label: "Belum Diproses" },
      ...(summary?.processedByOptions || []).map((email) => ({ value: email, label: email.split("@")[0] })),
    ],
    [summary]
  );

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

  // --- Pilih banyak pelamar (buat ubah status massal) ---
  // Yang dihitung cuma pelamar yang masih ada di daftar sekarang, jadi kalau ada
  // yang barusan dihapus/ilang dari hasil, jumlahnya tetap akurat.
  const selectedApplicants = useMemo(
    () => sortedApplicants.filter((a) => selectedIds.has(a.id)),
    [sortedApplicants, selectedIds]
  );
  const selectedCount = selectedApplicants.length;
  const pageIds = paginated.map((a) => a.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected = pageIds.some((id) => selectedIds.has(id));
  const selectableTotal = Math.min(sortedApplicants.length, MAX_BULK);

  function toggleOne(id) {
    if (!selectedIds.has(id) && selectedIds.size >= MAX_BULK) {
      toast.error(`Maksimal ${MAX_BULK} pelamar sekali proses`);
      return;
    }
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function togglePage() {
    if (allPageSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pageIds.forEach((id) => next.delete(id));
        return next;
      });
      return;
    }
    const next = new Set(selectedIds);
    for (const id of pageIds) {
      if (next.size >= MAX_BULK) {
        toast.error(`Maksimal ${MAX_BULK} pelamar sekali proses`);
        break;
      }
      next.add(id);
    }
    setSelectedIds(next);
  }

  function selectAllResults() {
    setSelectedIds(new Set(sortedApplicants.slice(0, MAX_BULK).map((a) => a.id)));
    if (sortedApplicants.length > MAX_BULK) {
      toast(`Dibatasi ${MAX_BULK} pelamar pertama sekali proses`);
    }
  }

  function handleBulkDone({ status: newStatus, updated, skipped, failedIds }) {
    setBulkOpen(false);
    const label = STATUS_META[newStatus]?.label || newStatus;
    if (updated > 0) {
      toast.success(
        `${updated} pelamar diubah ke ${label}${skipped > 0 ? ` · ${skipped} dilewati` : ""}`
      );
    } else if (failedIds.length === 0) {
      toast("Tidak ada yang diubah, semua sudah berstatus " + label);
    }
    if (failedIds.length > 0) {
      toast.error(`${failedIds.length} pelamar gagal diubah. Masih terpilih, coba lagi ya.`, { duration: 6000 });
    }
    // Yang gagal tetap kepilih biar tinggal klik "Ubah Status" lagi.
    setSelectedIds(new Set(failedIds));
    loadData();
  }

  function exportCsv() {
    const headers = ["Nama", "Email", "No Telp", "Gender", "Domisili", "Kategori", "Punya Motor", "Punya Alat Cleaning", "Sumber Info", "Jam Operasional", "Status", "Diproses Oleh", "Tanggal Daftar"];
    const rows = sortedApplicants.map((a) => [
      a.nama,
      a.email,
      a.no_telp,
      a.gender === "male" ? "Laki-laki" : "Perempuan",
      a.domisili,
      a.kategori.replace("_", " "),
      a.punya_motor ? "Ya" : "Tidak",
      a.kategori === "daily_cleaning" ? (a.punya_alat_cleaning ? "Ya" : "Tidak") : "-",
      SUMBER_INFO_LABELS[a.sumber_info] || "-",
      a.jam_operasional ? a.jam_operasional.replace("-", " – ") : "-",
      STATUS_META[a.status]?.label || a.status,
      a.updated_by || "-",
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
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
          icon={PauseCircle}
          label="Pending"
          value={summary?.byStatus?.pending ?? 0}
          accent="#F59E0B"
          onClick={() => setStatus("pending")}
        />
        <SummaryCard
          icon={CheckCircle2}
          label="Diterima"
          value={summary?.byStatus?.approved ?? 0}
          accent="#16A34A"
        />
      </div>

      {/* Funnel chart */}
      <div className="card p-5 mb-6 hover:shadow-card-lg transition-shadow duration-200">
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
                      <span className="text-xs text-ink-muted font-normal ml-1.5 tabular-nums">({Math.round(pct)}%)</span>
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
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <FilterDropdown label="Status" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
          <FilterDropdown label="Kategori" value={kategori} onChange={setKategori} options={KATEGORI_OPTIONS} />
          <FilterDropdown label="Gender" value={gender} onChange={setGender} options={GENDER_OPTIONS} />
          <FilterDropdown label="Kota" value={kota} onChange={setKota} options={kotaFilterOptions} searchable />
          <FilterDropdown label="Admin" value={diprosesOleh} onChange={setDiprosesOleh} options={adminFilterOptions} />
          <FilterDropdown label="Sumber Info" value={sumberInfo} onChange={setSumberInfo} options={SUMBER_INFO_OPTIONS} />
          <FilterDropdown label="Punya Motor" value={punyaMotor} onChange={setPunyaMotor} options={PUNYA_MOTOR_OPTIONS} />
          <FilterDropdown label="Alat Cleaning" value={punyaAlat} onChange={setPunyaAlat} options={PUNYA_ALAT_OPTIONS} />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/70 text-gray-400 text-left">
              <tr className="text-[11px] uppercase tracking-wider">
                <th className="pl-4 pr-0 py-3 w-10">
                  <input
                    type="checkbox"
                    aria-label="Pilih semua di halaman ini"
                    title="Pilih semua di halaman ini"
                    className="w-4 h-4 rounded border-gray-300 accent-brand cursor-pointer align-middle"
                    checked={allPageSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = somePageSelected && !allPageSelected;
                    }}
                    onChange={togglePage}
                    disabled={loading || paginated.length === 0}
                  />
                </th>
                <SortableHeader label="Nama" field="nama" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Kategori</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Domisili</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Motor</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Sumber Info</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Status</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Diproses Oleh</th>
                <SortableHeader label="Tanggal" field="created_at" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                <th className="px-4 py-3 font-semibold whitespace-nowrap text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              ) : applicants.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center">
                    <div className="text-ink-muted text-sm">
                      {q || status || kategori
                        ? "Tidak ada pendaftar yang cocok dengan filter ini."
                        : "Belum ada pendaftar. Data bakal muncul di sini setelah ada yang isi form."}
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((a) => {
                  const kategoriStyle = KATEGORI_STYLES[a.kategori];
                  return (
                    <tr
                      key={a.id}
                      className={`border-t border-gray-100 transition-colors ${
                        selectedIds.has(a.id) ? "bg-brand-light/30 hover:bg-brand-light/40" : "hover:bg-gray-50/80"
                      }`}
                    >
                      <td className="pl-4 pr-0 py-3 w-10">
                        <input
                          type="checkbox"
                          aria-label={`Pilih ${a.nama}`}
                          className="w-4 h-4 rounded border-gray-300 accent-brand cursor-pointer align-middle"
                          checked={selectedIds.has(a.id)}
                          onChange={() => toggleOne(a.id)}
                        />
                      </td>
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
                      <td className="px-4 py-3 whitespace-nowrap">
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
                      <td className="px-4 py-3 text-ink-muted">
                        {SUMBER_INFO_LABELS[a.sumber_info] || <span className="text-gray-300">-</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={a.status} /></td>
                      <td className="px-4 py-3">
                        {a.updated_by ? (
                          <span
                            className="inline-flex items-center gap-1 text-xs text-ink-muted"
                            title={a.updated_by}
                          >
                            <UserCircle2 size={13} className="text-gray-400" />
                            {a.updated_by.split("@")[0]}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">-</span>
                        )}
                      </td>
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
                <span className="relative inline-flex">
                  <select
                    className="input-field appearance-none !w-auto !py-1.5 !pl-3 !pr-7 text-sm cursor-pointer"
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                  >
                    {PAGE_SIZE_OPTIONS.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-ink-muted" />
                </span>
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

      {/* Spacer biar bar bawah ga nutupin pagination */}
      {selectedCount > 0 && <div className="h-20" />}

      {/* Bar aksi massal — muncul pas ada pelamar yang dipilih */}
      {selectedCount > 0 && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-2xl">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-gray-900 text-white shadow-2xl px-4 py-3">
            <div className="flex items-center gap-3 text-sm">
              <span>
                <b className="tabular-nums">{selectedCount}</b> dipilih
              </span>
              {selectedCount < selectableTotal && (
                <button
                  onClick={selectAllResults}
                  className="text-xs text-gray-300 underline underline-offset-2 hover:text-white transition"
                >
                  Pilih semua {selectableTotal}
                  {sortedApplicants.length > MAX_BULK ? ` (maks. ${MAX_BULK})` : ""}
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => setSelectedIds(new Set())}
                className="rounded-full px-3.5 py-1.5 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition"
              >
                Batal
              </button>
              <button
                onClick={() => setBulkOpen(true)}
                className="rounded-full bg-brand hover:bg-brand-dark px-4 py-1.5 text-sm font-medium text-white transition"
              >
                Ubah Status
              </button>
            </div>
          </div>
        </div>
      )}

      <BulkStatusModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        selected={selectedApplicants}
        onDone={handleBulkDone}
      />
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
    <th className="px-4 py-3 font-semibold whitespace-nowrap">
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
      <td className="pl-4 pr-0 py-3 w-10"><div className="w-4 h-4 rounded bg-gray-100 animate-pulse" /></td>
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
      <td className="px-4 py-3"><div className="h-3 w-14 bg-gray-100 rounded animate-pulse" /></td>
      <td className="px-4 py-3"><div className="h-5 w-20 bg-gray-100 rounded-full animate-pulse" /></td>
      <td className="px-4 py-3"><div className="h-3 w-16 bg-gray-100 rounded animate-pulse" /></td>
      <td className="px-4 py-3"><div className="h-3 w-10 bg-gray-100 rounded animate-pulse ml-auto" /></td>
    </tr>
  );
}

function SummaryCard({ icon: Icon, label, value, accent, highlight, onClick }) {
  const Tag = onClick ? "button" : "div";
  const clickableProps = onClick ? { onClick, type: "button" } : {};

  if (highlight) {
    return (
      <Tag
        {...clickableProps}
        className={`card p-5 text-white hover:shadow-card-lg hover:-translate-y-0.5 transition-all duration-200 text-left w-full border-transparent ${onClick ? "cursor-pointer" : ""}`}
        style={{ background: `linear-gradient(135deg, #F0169B, ${accent === "#E6007E" ? "#8A0049" : accent})` }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="text-[13px] text-white/80 font-medium">{label}</div>
          <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
            <Icon size={15} className="text-white" />
          </div>
        </div>
        <div className="text-3xl font-bold tracking-tight tabular-nums">{value}</div>
      </Tag>
    );
  }

  return (
    <Tag
      {...clickableProps}
      className={`card p-5 hover:shadow-card-lg hover:-translate-y-0.5 transition-all duration-200 text-left w-full ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="text-[13px] text-ink-muted font-medium">{label}</div>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${accent}1A` }}
        >
          <Icon size={15} style={{ color: accent }} />
        </div>
      </div>
      <div className="text-3xl font-bold tracking-tight tabular-nums">{value}</div>
    </Tag>
  );
}
