"use client";

import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { MessageCircle, CheckCircle2, XCircle, Info } from "lucide-react";

const PLACEHOLDER_HINTS = [
  { key: "{nama}", desc: "Nama pelamar" },
  { key: "{kategori}", desc: "Kategori lamaran (Massage Therapist / Daily Cleaning)" },
  { key: "{domisili}", desc: "Domisili pelamar" },
];

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [msgApproved, setMsgApproved] = useState("");
  const [msgRejected, setMsgRejected] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/settings");
    const data = await res.json();
    if (res.ok && data.settings) {
      setEnabled(!!data.settings.wa_notif_enabled);
      setMsgApproved(data.settings.wa_message_approved || "");
      setMsgRejected(data.settings.wa_message_rejected || "");
    } else {
      toast.error(data.error || "Gagal ambil settingan");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wa_notif_enabled: enabled,
        wa_message_approved: msgApproved,
        wa_message_rejected: msgRejected,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      toast.error(data.error || "Gagal simpan settingan");
      return;
    }
    toast.success("Settingan tersimpan");
  }

  if (loading) {
    return (
      <div className="max-w-2xl">
        <div className="h-6 w-48 bg-gray-100 rounded animate-pulse mb-6" />
        <div className="card p-6 h-40 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <Toaster position="top-center" />
      <h1 className="text-xl font-bold mb-1">Pengaturan</h1>
      <p className="text-ink-muted text-sm mb-6">
        Atur notifikasi WhatsApp otomatis ke pelamar saat status diubah.
      </p>

      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0">
              <MessageCircle size={17} />
            </div>
            <div>
              <p className="font-semibold text-sm">Notifikasi WhatsApp Otomatis</p>
              <p className="text-xs text-ink-muted">
                Kirim WA ke pelamar otomatis via Fonnte saat status diubah ke Diterima/Ditolak.
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={() => setEnabled((v) => !v)}
            className={`relative w-11 h-6 rounded-full transition shrink-0 ${
              enabled ? "bg-brand" : "bg-gray-200"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                enabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      <div className="card p-6 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle2 size={16} className="text-green-600" />
          <label className="text-sm font-semibold">Pesan untuk Status Diterima</label>
        </div>
        <p className="text-xs text-ink-muted mb-3">Terkirim otomatis saat status diubah ke Diterima.</p>
        <textarea
          className="input-field min-h-[120px] text-sm"
          value={msgApproved}
          onChange={(e) => setMsgApproved(e.target.value)}
          placeholder="Halo {nama}, selamat! Lamaran kamu sebagai {kategori} diterima..."
        />
      </div>

      <div className="card p-6 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <XCircle size={16} className="text-red-600" />
          <label className="text-sm font-semibold">Pesan untuk Status Ditolak</label>
        </div>
        <p className="text-xs text-ink-muted mb-3">Terkirim otomatis saat status diubah ke Ditolak.</p>
        <textarea
          className="input-field min-h-[120px] text-sm"
          value={msgRejected}
          onChange={(e) => setMsgRejected(e.target.value)}
          placeholder="Halo {nama}, terima kasih sudah melamar sebagai {kategori}..."
        />
      </div>

      <div className="card p-4 mb-6 bg-gray-50/60 border-dashed">
        <div className="flex items-start gap-2">
          <Info size={15} className="text-ink-muted mt-0.5 shrink-0" />
          <div className="text-xs text-ink-muted">
            <p className="font-medium text-ink mb-1">Placeholder yang bisa dipakai di pesan:</p>
            <ul className="space-y-0.5">
              {PLACEHOLDER_HINTS.map((p) => (
                <li key={p.key}>
                  <code className="bg-white border border-gray-200 rounded px-1.5 py-0.5 text-[11px]">
                    {p.key}
                  </code>{" "}
                  — {p.desc}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <button onClick={save} disabled={saving} className="btn-primary text-sm px-6 py-2.5">
        {saving ? "Menyimpan..." : "Simpan Settingan"}
      </button>
    </div>
  );
}
