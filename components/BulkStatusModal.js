"use client";

import { useEffect, useState } from "react";
import { X, Loader2, AlertTriangle } from "lucide-react";
import { STATUS_META } from "@/components/StatusBadge";
import { adminFetch } from "@/lib/adminFetch";

const STATUS_ORDER = ["data_baru", "pending", "screening", "onboarding", "approved", "rejected"];

// Sama dengan pilihan alasan pending di halaman detail pelamar.
const PENDING_REASON_PRESETS = [
  "Wilayah belum dibutuhkan saat ini",
  "Area sepi/belum ada demand",
  "Nunggu WA/telepon dibalas",
  "Dokumen belum lengkap",
  "Lainnya",
];

// Dikirim per potongan kecil supaya tiap request cepat (WA + sync Sheet dikerjain
// satu-satu di server) dan progress-nya bisa ditampilin ke admin.
const CHUNK_SIZE = 5;

/**
 * Modal ubah status banyak pelamar sekaligus.
 * selected: array pelamar yang dipilih (butuh id, nama, status)
 * onDone: ({ status, updated, skipped, failedIds }) => void
 */
export default function BulkStatusModal({ open, onClose, selected, onDone }) {
  const [status, setStatus] = useState("");
  const [catatan, setCatatan] = useState("");
  const [pendingPreset, setPendingPreset] = useState(PENDING_REASON_PRESETS[0]);
  const [pendingCustom, setPendingCustom] = useState("");
  const [alasanPenolakan, setAlasanPenolakan] = useState("");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  useEffect(() => {
    if (!open) return;
    setStatus("");
    setCatatan("");
    setPendingPreset(PENDING_REASON_PRESETS[0]);
    setPendingCustom("");
    setAlasanPenolakan("");
    setRunning(false);
    setProgress({ done: 0, total: 0 });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape" && !running) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, running, onClose]);

  if (!open) return null;

  const targets = status ? selected.filter((a) => a.status !== status) : selected;
  const skipCount = selected.length - targets.length;
  const sendsWhatsApp = status === "approved" || status === "rejected";
  const pendingReason = pendingPreset === "Lainnya" ? pendingCustom.trim() : pendingPreset;

  const canSubmit =
    Boolean(status) &&
    catatan.trim().length > 0 &&
    targets.length > 0 &&
    !(status === "pending" && !pendingReason) &&
    !running;

  async function submit() {
    if (!canSubmit) return;
    setRunning(true);

    const ids = targets.map((a) => a.id);
    setProgress({ done: 0, total: ids.length });

    let updated = 0;
    let skipped = skipCount;
    const failedIds = [];

    for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
      const chunk = ids.slice(i, i + CHUNK_SIZE);
      const body = { ids: chunk, status, catatan: catatan.trim() };
      if (status === "pending") body.alasan_pending = pendingReason;
      if (status === "rejected") body.alasan_penolakan = alasanPenolakan.trim();

      try {
        const res = await adminFetch("/api/applicants/bulk-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal");
        updated += data.updated.length;
        skipped += data.skipped.length;
        failedIds.push(...data.failed.map((f) => f.id));
      } catch {
        failedIds.push(...chunk);
      }

      setProgress({ done: Math.min(i + CHUNK_SIZE, ids.length), total: ids.length });
    }

    setRunning(false);
    onDone({ status, updated, skipped, failedIds });
  }

  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !running) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Ubah status massal"
        className="bg-white rounded-card shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-gray-100">
          <div>
            <h2 className="font-display font-bold text-lg tracking-tight">Ubah Status Massal</h2>
            <p className="text-sm text-ink-muted mt-0.5">
              <span className="font-semibold text-ink tabular-nums">{selected.length}</span> pelamar dipilih
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={running}
            className="p-1.5 rounded-full text-ink-muted hover:bg-gray-100 hover:text-ink transition disabled:opacity-40"
            title="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium mb-2">Status baru</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {STATUS_ORDER.map((value) => {
                const meta = STATUS_META[value];
                const Icon = meta.icon;
                const active = status === value;
                return (
                  <button
                    key={value}
                    type="button"
                    disabled={running}
                    onClick={() => setStatus(value)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium text-left transition disabled:opacity-60 ${
                      active
                        ? "border-brand bg-brand-light/40 text-brand ring-1 ring-brand/30"
                        : "border-gray-200 text-ink hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <Icon size={15} strokeWidth={2.25} style={{ color: meta.dot }} />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          {status === "pending" && (
            <div>
              <label className="block text-sm font-medium mb-1.5">Alasan Pending</label>
              <div className="relative">
                <select
                  className="input-field appearance-none pr-9 cursor-pointer"
                  value={pendingPreset}
                  onChange={(e) => setPendingPreset(e.target.value)}
                  disabled={running}
                >
                  {PENDING_REASON_PRESETS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <svg
                  className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-muted"
                  width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
              {pendingPreset === "Lainnya" && (
                <input
                  className="input-field mt-2"
                  placeholder="Tulis alasan pending"
                  value={pendingCustom}
                  onChange={(e) => setPendingCustom(e.target.value)}
                  disabled={running}
                />
              )}
            </div>
          )}

          {status === "rejected" && (
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Alasan Penolakan <span className="text-ink-muted font-normal">(opsional)</span>
              </label>
              <textarea
                className="input-field min-h-[76px] resize-y"
                placeholder="Alasan ini ikut muncul di pesan WhatsApp ke pelamar"
                value={alasanPenolakan}
                onChange={(e) => setAlasanPenolakan(e.target.value)}
                disabled={running}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5">Catatan Internal</label>
            <textarea
              className="input-field min-h-[76px] resize-y"
              placeholder="Contoh: Lolos screening batch 22 Okt"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              disabled={running}
            />
            <p className="text-xs text-ink-muted mt-1.5">
              Dicatat di riwayat status tiap pelamar. Catatan internal masing-masing pelamar tidak ditimpa.
            </p>
          </div>

          {status && skipCount > 0 && (
            <p className="text-xs text-ink-muted bg-gray-50 rounded-lg px-3 py-2">
              {skipCount} pelamar sudah berstatus {STATUS_META[status].label}, jadi dilewati.
            </p>
          )}

          {sendsWhatsApp && targets.length > 0 && (
            <div className="flex gap-2.5 rounded-xl bg-amber-50 border border-amber-100 px-3.5 py-3 text-xs text-amber-800 leading-relaxed">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              <span>
                Kalau notifikasi WhatsApp aktif di Pengaturan, pesan{" "}
                <b>{STATUS_META[status].label}</b> akan terkirim ke <b>{targets.length}</b> pelamar
                dan tidak bisa ditarik. {status === "approved" && "Kontrak juga ikut terkirim otomatis kalau fiturnya aktif. "}
                Pastikan pilihannya sudah benar.
              </span>
            </div>
          )}

          {running && (
            <div>
              <div className="flex items-center justify-between text-xs text-ink-muted mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Loader2 size={13} className="animate-spin" />
                  Memproses {progress.done} dari {progress.total}...
                </span>
                <span className="tabular-nums">{pct}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand rounded-full transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-ink-muted mt-2">Jangan tutup halaman ini sampai selesai.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={running}
            className="rounded-full px-5 py-2 text-sm font-medium text-ink-muted hover:bg-gray-100 transition disabled:opacity-40"
          >
            Batal
          </button>
          <button onClick={submit} disabled={!canSubmit} className="btn-primary text-sm px-6 py-2.5">
            {running ? "Memproses..." : `Ubah ${targets.length} Pelamar`}
          </button>
        </div>
      </div>
    </div>
  );
}
