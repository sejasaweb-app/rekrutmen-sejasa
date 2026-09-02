"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  CalendarRange,
  X,
} from "lucide-react";

const KATEGORI_OPTIONS = [
  { value: "", label: "Semua Kategori" },
  { value: "massage", label: "Massage" },
  { value: "daily_cleaning", label: "Daily Cleaning" },
];

const KATEGORI_STYLES = {
  massage: { label: "Massage", classes: "bg-brand-light text-brand" },
  daily_cleaning: { label: "Daily Cleaning", classes: "bg-teal-100 text-teal-700" },
};

const RANGE_OPTIONS = [
  { value: "7", label: "7 Hari" },
  { value: "30", label: "30 Hari" },
  { value: "90", label: "90 Hari" },
  { value: "all", label: "Semua" },
  { value: "custom", label: "Custom" },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50];

function todayISO() {
  return new Date().toLocaleDateString("en-CA");
}

// Ubah pilihan range jadi batas tanggal (YYYY-MM-DD) buat dikirim ke API.
function rangeToBounds(range, customFrom, customTo) {
  if (range === "all") return { from: null, to: null };
  if (range === "custom") return { from: customFrom || null, to: customTo || null };
  const days = Number(range) || 30;
  const to = todayISO();
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - (days - 1));
  return { from: fromDate.toLocaleDateString("en-CA"), to };
}

function formatShortDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function ApprovedMitraTable() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [q, setQ] = useState("");
  const [kategori, setKategori] = useState("");
  const [range, setRange] = useState("30");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [showCustomPanel, setShowCustomPanel] = useState(false);
  const [pendingFrom, setPendingFrom] = useState(todayISO());
  const [pendingTo, setPendingTo] = useState(todayISO());

  const [sortBy, setSortBy] = useState("approved_at");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  const { from, to } = useMemo(() => rangeToBounds(range, customFrom, customTo), [range, customFrom, customTo]);

  const loadData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (kategori) params.set("kategori", kategori);
    if (q) params.set("q", q);
    try {
      const res = await fetch(`/api/dashboard/approved?${params.toString()}`, { cache: "no-store" });
      const json = await res.json();
      setRows(json.approved || []);
    } finally {
      setLoading(false);
    }
  }, [from, to, kategori, q]);

  useEffect(() => {
    if (range === "custom" && (!customFrom || !customTo)) return;
    loadData();
  }, [loadData, range, customFrom, customTo]);

  useEffect(() => {
    setPage(1);
  }, [q, kategori, range, customFrom, customTo, pageSize]);

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

  function toggleSort(field) {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir(field === "nama" ? "asc" : "desc");
    }
  }

  const withLamaProses = useMemo(
    () =>
      rows.map((r) => ({
        ...r,
        lama_proses: (new Date(r.approved_at) - new Date(r.created_at)) / (24 * 60 * 60 * 1000),
      })),
    [rows]
  );

  const sorted = useMemo(() => {
    const copy = [...withLamaProses];
    copy.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "nama") cmp = a.nama.localeCompare(b.nama);
      else if (sortBy === "kategori") cmp = a.kategori.localeCompare(b.kategori);
      else if (sortBy === "created_at") cmp = new Date(a.created_at) - new Date(b.created_at);
      else if (sortBy === "lama_proses") cmp = a.lama_proses - b.lama_proses;
      else cmp = new Date(a.approved_at) - new Date(b.approved_at);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [withLamaProses, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  async function handleExport() {
    setExporting(true);
    try {
      const headers = ["Nama", "Email", "No Telp", "Kategori", "Domisili", "Tanggal Daftar", "Tanggal Diterima", "Lama Proses (hari)"];
      const csvRows = sorted.map((r) => [
        r.nama,
        r.email,
        r.no_telp,
        KATEGORI_STYLES[r.kategori]?.label || r.kategori,
        r.domisili,
        new Date(r.created_at).toLocaleDateString("id-ID"),
        new Date(r.approved_at).toLocaleDateString("id-ID"),
        r.lama_proses.toFixed(1),
      ]);
      const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
      const csv = [headers, ...csvRows].map((r) => r.map(escape).join(",")).join("\r\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `mitra-diterima-${range}-${todayISO()}.csv`;
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

  return (
    <div className="card p-5 mt-6">
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 size={16} className="text-green-600" />
            <h2 className="font-display text-sm font-semibold">Mitra Diterima</h2>
          </div>
          <p className="text-xs text-ink-muted">
            Difilter berdasarkan tanggal diterima (bukan tanggal daftar) — buat kebutuhan rekap KPI.
          </p>
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
                  {opt.value === "custom" && range === "custom" && customFrom && customTo ? rangeLabel : opt.label}
                </button>
              ))}
            </div>

            {showCustomPanel && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-72 card p-4 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold">Pilih tanggal diterima</span>
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
            disabled={exporting || sorted.length === 0}
            className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-full border border-gray-200 hover:border-brand hover:text-brand transition disabled:opacity-50 bg-white"
          >
            <Download size={13} />
            {exporting ? "Menyiapkan..." : "Export CSV"}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama, email, atau no. telp..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="input-field !pl-9 text-sm"
          />
        </div>
        <select
          value={kategori}
          onChange={(e) => setKategori(e.target.value)}
          className="input-field !w-auto text-sm"
        >
          {KATEGORI_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <div className="text-xs text-ink-muted ml-auto">
          {loading ? "Memuat..." : `${sorted.length} mitra diterima`}
        </div>
      </div>

      <div className="overflow-x-auto -mx-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-y border-gray-100 bg-gray-50/50">
              <SortableHeader label="Nama" field="nama" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
              <SortableHeader label="Kategori" field="kategori" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
              <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px]">Domisili</th>
              <SortableHeader label="Tgl Daftar" field="created_at" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
              <SortableHeader label="Tgl Diterima" field="approved_at" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
              <SortableHeader label="Lama Proses" field="lama_proses" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center">
                  <div className="flex flex-col items-center gap-2 text-ink-muted text-sm">
                    <CheckCircle2 size={20} className="text-gray-300" />
                    {q || kategori
                      ? "Ga ada mitra diterima yang cocok dengan filter ini."
                      : "Belum ada mitra yang diterima di periode ini."}
                  </div>
                </td>
              </tr>
            ) : (
              paginated.map((r) => {
                const kategoriStyle = KATEGORI_STYLES[r.kategori];
                return (
                  <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/admin/applicants/${r.id}`} className="flex items-center gap-3 group">
                        <div className="w-8 h-8 rounded-full bg-brand-light text-brand flex items-center justify-center text-xs font-semibold shrink-0 ring-1 ring-brand/10 group-hover:ring-brand/30 transition">
                          {r.nama.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-ink group-hover:text-brand transition-colors">{r.nama}</div>
                          <div className="text-xs text-ink-muted">{r.email}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${kategoriStyle?.classes || "bg-gray-100 text-gray-600"}`}>
                        {kategoriStyle?.label || r.kategori.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{r.domisili}</td>
                    <td className="px-4 py-3 text-ink-muted">{new Date(r.created_at).toLocaleDateString("id-ID")}</td>
                    <td className="px-4 py-3 font-medium text-green-700">
                      {new Date(r.approved_at).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{r.lama_proses.toFixed(1)} hari</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!loading && sorted.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-1 pt-3 border-t border-gray-100 text-sm mt-1">
          <span className="text-ink-muted">
            Halaman {currentPage} dari {totalPages} · {sorted.length} total
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
      <td className="px-4 py-3"><div className="h-3 w-16 bg-gray-100 rounded animate-pulse" /></td>
      <td className="px-4 py-3"><div className="h-3 w-16 bg-gray-100 rounded animate-pulse" /></td>
      <td className="px-4 py-3"><div className="h-3 w-14 bg-gray-100 rounded animate-pulse" /></td>
    </tr>
  );
}
