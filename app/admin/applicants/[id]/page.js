"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { ArrowLeft, FileText, Clock, MessageCircle, Phone, Mail, MoreHorizontal } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";

const STATUS_FLOW = ["data_baru", "screening", "onboarding", "approved", "rejected"];
const STATUS_LABELS = {
  data_baru: "Data Baru",
  screening: "Screening",
  onboarding: "Onboarding",
  approved: "Diterima",
  rejected: "Ditolak",
};

const CHANNEL_OPTIONS = [
  { value: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { value: "telepon", label: "Telepon", icon: Phone },
  { value: "email", label: "Email", icon: Mail },
  { value: "lainnya", label: "Lainnya", icon: MoreHorizontal },
];

const RESPONSE_OPTIONS = [
  "Tertarik",
  "Minta Waktu",
  "Tidak Tertarik",
  "Tidak Bisa Dihubungi",
  "Lainnya",
];

// Ubah nomor telepon Indonesia (format apapun: 08xx, +62xx, 62xx) jadi link wa.me yang valid
function toWhatsAppLink(phone) {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, ""); // buang semua karakter selain angka
  if (digits.startsWith("0")) {
    digits = "62" + digits.slice(1);
  } else if (!digits.startsWith("62")) {
    digits = "62" + digits;
  }
  return `https://wa.me/${digits}`;
}

export default function ApplicantDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [applicant, setApplicant] = useState(null);
  const [catatan, setCatatan] = useState("");
  const [alasanPenolakan, setAlasanPenolakan] = useState("");
  const [savingAlasan, setSavingAlasan] = useState(false);
  const [saving, setSaving] = useState(false);

  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [channel, setChannel] = useState("whatsapp");
  const [response, setResponse] = useState(RESPONSE_OPTIONS[0]);
  const [logCatatan, setLogCatatan] = useState("");
  const [savingLog, setSavingLog] = useState(false);

  async function loadApplicant() {
    const res = await fetch(`/api/applicants/${id}`);
    const data = await res.json();
    setApplicant(data.applicant);
    setCatatan(data.applicant?.catatan_admin || "");
    setAlasanPenolakan(data.applicant?.alasan_penolakan || "");
  }

  async function loadLogs() {
    setLogsLoading(true);
    const res = await fetch(`/api/applicants/${id}/contact-logs`);
    const data = await res.json();
    setLogs(data.logs || []);
    setLogsLoading(false);
  }

  useEffect(() => {
    loadApplicant();
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function updateStatus(newStatus) {
    setSaving(true);
    const body = { status: newStatus };
    // Kalau lagi ubah ke Ditolak, sertakan alasan yang udah diisi admin (kalau ada)
    // biar langsung kepakai di pesan WA penolakan tanpa perlu simpan manual dulu.
    if (newStatus === "rejected") body.alasan_penolakan = alasanPenolakan;

    const res = await fetch(`/api/applicants/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      toast.error(data.error || "Gagal update status");
      return;
    }
    toast.success(`Status diubah ke ${STATUS_LABELS[newStatus]}`);
    loadApplicant();
  }

  // Simpan alasan penolakan tanpa ubah status — buat kasus admin mau edit
  // alasan setelah status udah Ditolak (nggak trigger kirim ulang WA).
  async function saveAlasan() {
    setSavingAlasan(true);
    const res = await fetch(`/api/applicants/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alasan_penolakan: alasanPenolakan }),
    });
    setSavingAlasan(false);
    if (!res.ok) {
      toast.error("Gagal simpan alasan");
      return;
    }
    toast.success("Alasan tersimpan");
  }

  async function saveCatatan() {
    setSaving(true);
    const res = await fetch(`/api/applicants/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ catatan_admin: catatan }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error("Gagal simpan catatan");
      return;
    }
    toast.success("Catatan tersimpan");
  }

  async function addLog() {
    setSavingLog(true);
    const res = await fetch(`/api/applicants/${id}/contact-logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel, response, catatan: logCatatan }),
    });
    const data = await res.json();
    setSavingLog(false);
    if (!res.ok) {
      toast.error(data.error || "Gagal simpan follow-up");
      return;
    }
    toast.success("Follow-up dicatat");
    setLogCatatan("");
    loadLogs();
  }

  if (!applicant) {
    return (
      <div className="max-w-2xl">
        <div className="h-6 w-40 bg-gray-100 rounded animate-pulse mb-6" />
        <div className="card p-6 space-y-4">
          <div className="h-6 w-48 bg-gray-100 rounded animate-pulse" />
          <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  const history = [...(applicant.status_history || [])].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  );

  return (
    <div className="max-w-2xl">
      <Toaster position="top-center" />
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-ink-muted mb-4 hover:text-brand transition"
      >
        <ArrowLeft size={15} />
        Kembali ke Dashboard
      </button>

      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-brand-light text-brand flex items-center justify-center font-semibold shrink-0">
              {applicant.nama.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold">{applicant.nama}</h1>
              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                <p className="text-ink-muted text-sm">{applicant.email} · {applicant.no_telp}</p>
                {toWhatsAppLink(applicant.no_telp) && (
                  <a
                    href={toWhatsAppLink(applicant.no_telp)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-full px-2.5 py-1 transition"
                  >
                    <MessageCircle size={12} />
                    Buka WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>
          <StatusBadge status={applicant.status} />
        </div>

        <dl className="grid grid-cols-2 gap-4 text-sm mb-6">
          <Field label="Kategori" value={applicant.kategori.replace("_", " ")} />
          <Field label="Domisili" value={applicant.domisili} />
          <Field label="Jenis Kelamin" value={applicant.gender === "male" ? "Laki-laki" : "Perempuan"} />
          <Field label="Punya Motor" value={applicant.punya_motor ? "Ya" : "Tidak"} />

          {applicant.kategori === "daily_cleaning" && (
            <>
              <Field
                label="Punya Alat Cleaning"
                value={applicant.punya_alat_cleaning ? "Ya" : "Tidak"}
              />
              <Field
                label="Foto Alat Cleaning"
                value={
                  applicant.foto_alat_url ? (
                    <a
                      href={applicant.foto_alat_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-brand hover:underline"
                    >
                      <FileText size={14} />
                      Lihat Foto
                    </a>
                  ) : (
                    "Tidak ada"
                  )
                }
              />
            </>
          )}

          {applicant.kategori === "massage" && (
            <Field
              label="Melayani Gender"
              value={
                { wanita: "Wanita Saja", pria: "Pria Saja", keduanya: "Keduanya" }[
                  applicant.melayani_gender
                ] || "-"
              }
            />
          )}

          <Field
            label="Daftar Pada"
            value={new Date(applicant.created_at).toLocaleString("id-ID")}
          />
          <Field
            label="Sertifikat/Paklaring"
            value={
              applicant.file_url ? (
                <a
                  href={applicant.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-brand hover:underline"
                >
                  <FileText size={14} />
                  Lihat File
                </a>
              ) : (
                "Tidak ada"
              )
            }
          />
        </dl>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Ubah Status</label>
          <div className="flex flex-wrap gap-2">
            {STATUS_FLOW.map((s) => (
              <button
                key={s}
                disabled={saving || applicant.status === s}
                onClick={() => updateStatus(s)}
                className={`text-xs font-medium rounded-full px-4 py-2 border transition ${
                  applicant.status === s
                    ? "bg-brand text-white border-brand"
                    : "border-gray-200 text-ink-muted hover:border-brand hover:text-brand"
                }`}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Alasan Penolakan (opsional)</label>
          <p className="text-xs text-ink-muted mb-2">
            Diisi sebelum klik status Ditolak — otomatis disertakan di pesan WA ke pelamar.
            Beda dari Catatan Internal di bawah (yang nggak pernah dikirim ke pelamar).
          </p>
          <textarea
            className="input-field min-h-[80px]"
            value={alasanPenolakan}
            onChange={(e) => setAlasanPenolakan(e.target.value)}
            placeholder="Misal: Domisili di luar area jangkauan saat ini."
          />
          <button
            onClick={saveAlasan}
            disabled={savingAlasan}
            className="btn-primary mt-3 text-sm px-5 py-2"
          >
            {savingAlasan ? "Menyimpan..." : "Simpan Alasan"}
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Catatan Internal</label>
          <textarea
            className="input-field min-h-[100px]"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Catatan hasil interview, alasan reject, dsb."
          />
          <button onClick={saveCatatan} disabled={saving} className="btn-primary mt-3 text-sm px-5 py-2">
            Simpan Catatan
          </button>
        </div>
      </div>

      {/* Follow-up log — dicatat sebelum ubah status resmi */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <MessageCircle size={16} className="text-ink-muted" />
          <h2 className="text-sm font-semibold">Riwayat Follow-up</h2>
        </div>
        <p className="text-xs text-ink-muted mb-4">
          Catat hasil komunikasi (WA/telepon/dll) sebelum mengubah status lamaran.
        </p>

        {/* Form tambah log */}
        <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {CHANNEL_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setChannel(opt.value)}
                  className={`flex items-center gap-1.5 text-xs font-medium rounded-full px-3 py-1.5 border transition ${
                    channel === opt.value
                      ? "border-brand bg-brand-light text-brand"
                      : "border-gray-200 text-ink-muted bg-white"
                  }`}
                >
                  <Icon size={13} />
                  {opt.label}
                </button>
              );
            })}
            {channel === "whatsapp" && toWhatsAppLink(applicant.no_telp) && (
              <a
                href={toWhatsAppLink(applicant.no_telp)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs font-medium rounded-full px-3 py-1.5 bg-green-600 text-white hover:bg-green-700 transition ml-auto"
              >
                <MessageCircle size={13} />
                Chat Sekarang
              </a>
            )}
          </div>

          <select
            className="input-field text-sm"
            value={response}
            onChange={(e) => setResponse(e.target.value)}
          >
            {RESPONSE_OPTIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          <textarea
            className="input-field text-sm min-h-[70px]"
            placeholder="Catatan tambahan (opsional) — misal detail obrolan, waktu janjian ulang, dsb."
            value={logCatatan}
            onChange={(e) => setLogCatatan(e.target.value)}
          />

          <button
            onClick={addLog}
            disabled={savingLog}
            className="btn-primary text-sm px-5 py-2"
          >
            {savingLog ? "Menyimpan..." : "Catat Follow-up"}
          </button>
        </div>

        {/* List riwayat follow-up */}
        {logsLoading ? (
          <div className="h-12 bg-gray-50 rounded-lg animate-pulse" />
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-2">
              <MessageCircle size={16} className="text-gray-300" />
            </div>
            <p className="text-sm text-ink-muted">Belum ada catatan follow-up.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {logs.map((log) => {
              const channelOpt = CHANNEL_OPTIONS.find((c) => c.value === log.channel);
              const Icon = channelOpt?.icon || MoreHorizontal;
              return (
                <li key={log.id} className="flex gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-ink-muted">
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{channelOpt?.label || log.channel}</span>
                      <span className="text-xs text-ink-muted">→</span>
                      <span className="text-sm">{log.response}</span>
                    </div>
                    {log.catatan && <p className="text-sm text-ink-muted mt-0.5">{log.catatan}</p>}
                    <p className="text-xs text-ink-muted mt-1">
                      {new Date(log.created_at).toLocaleString("id-ID")}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Status history timeline */}
      {history.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-ink-muted" />
            <h2 className="text-sm font-semibold">Riwayat Status</h2>
          </div>
          <ol className="relative border-l border-gray-200 ml-1.5 space-y-5">
            {history.map((h) => (
              <li key={h.id} className="ml-4">
                <div className="absolute w-2.5 h-2.5 bg-brand rounded-full -left-[5px] mt-1.5 border-2 border-white" />
                <div className="flex items-center gap-2 flex-wrap">
                  {h.from_status && (
                    <>
                      <span className="text-xs text-ink-muted">{STATUS_LABELS[h.from_status]}</span>
                      <span className="text-xs text-ink-muted">→</span>
                    </>
                  )}
                  <StatusBadge status={h.to_status} />
                </div>
                <p className="text-xs text-ink-muted mt-1">
                  {new Date(h.created_at).toLocaleString("id-ID")}
                </p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <dt className="text-ink-muted text-xs mb-0.5">{label}</dt>
      <dd className="font-medium capitalize">{value}</dd>
    </div>
  );
}
