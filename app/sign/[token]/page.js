"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import SignaturePad from "signature_pad";

export default function SignContractPage() {
  const { token } = useParams();
  const canvasRef = useRef(null);
  const padRef = useRef(null);
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState({ text: "", type: "" });

  useEffect(() => {
    fetch(`/api/contracts/${token}`, { cache: "no-store" })
      .then((res) => res.json().then((body) => ({ ok: res.ok, body })))
      .then(({ ok, body }) => {
        if (!ok) {
          setLoadError(body.error || "Link tidak valid");
          return;
        }
        setData(body);
      })
      .catch(() => setLoadError("Gagal memuat data kontrak"));
  }, [token]);

  useEffect(() => {
    if (!canvasRef.current || padRef.current) return;
    const canvas = canvasRef.current;
    const resize = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const savedData = padRef.current && !padRef.current.isEmpty() ? padRef.current.toData() : null;
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext("2d").scale(ratio, ratio);
      if (savedData && padRef.current) padRef.current.fromData(savedData);
    };
    window.addEventListener("resize", resize);
    resize();
    padRef.current = new SignaturePad(canvas, {
      backgroundColor: "rgba(255,255,255,0)",
      penColor: "rgb(10, 10, 100)",
    });
    return () => window.removeEventListener("resize", resize);
  }, [data]);

  async function handleSubmit() {
    if (!padRef.current || padRef.current.isEmpty()) {
      setStatus({ text: "Tanda tangan dulu sebelum kirim, ya.", type: "error" });
      return;
    }
    setSubmitting(true);
    setStatus({ text: "Mengirim...", type: "" });

    try {
      const signaturePng = padRef.current.toDataURL("image/png");
      const res = await fetch(`/api/contracts/${token}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signaturePng }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Gagal mengirim tanda tangan");

      setStatus({ text: "success", type: "success" });
      setData((d) => ({ ...d, status: "ditandatangani", signedUrl: body.downloadUrl }));
    } catch (err) {
      setStatus({ text: err.message, type: "error" });
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-lg font-bold text-brand mb-1">Tanda Tangan Perjanjian Kemitraan</h1>
      <p className="text-sm text-ink-muted mb-4">
        Baca dulu kontrak di bawah, lalu tanda tangan di kotak yang tersedia.
      </p>

      {loadError && <p className="text-sm text-red-600">{loadError}</p>}

      {data && (
        <>
          <div className="mb-4 text-sm">
            <span className="font-medium">{data.nama}</span> — {data.kategori}
          </div>

          {data.status === "ditandatangani" ? (
            <div className="card p-6 text-center">
              <p className="text-green-700 font-medium mb-3">Kontrak sudah ditandatangani. Terima kasih!</p>
              {data.signedUrl && (
                <a href={data.signedUrl} target="_blank" rel="noreferrer" className="btn-primary inline-block text-sm px-5 py-2">
                  Lihat/unduh PDF final
                </a>
              )}
            </div>
          ) : (
            <>
              <iframe
                title="Preview kontrak"
                src={data.previewUrl ? data.previewUrl.replace("/view", "/preview") : ""}
                className="w-full border border-gray-200 rounded-lg bg-white"
                style={{ height: "60vh" }}
              />

              <p className="text-sm text-ink-muted mt-4 mb-2">Tanda tangan di sini:</p>
              <div className="border-2 border-dashed border-gray-200 rounded-lg bg-white" style={{ touchAction: "none" }}>
                <canvas
                  ref={canvasRef}
                  className="w-full block"
                  style={{ height: 180, touchAction: "none" }}
                />
              </div>

              <div className="flex gap-2.5 mt-3">
                <button
                  type="button"
                  onClick={() => padRef.current?.clear()}
                  className="flex-1 rounded-lg bg-gray-100 text-ink py-3 text-sm font-semibold"
                >
                  Hapus
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-brand text-white py-3 text-sm font-semibold disabled:opacity-50"
                >
                  {submitting ? "Mengirim..." : "Setuju & Kirim Tanda Tangan"}
                </button>
              </div>

              {status.text && status.type === "error" && (
                <p className="text-sm text-red-600 mt-3">{status.text}</p>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
