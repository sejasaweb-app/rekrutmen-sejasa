"use client";

import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import SearchableSelect from "@/components/SearchableSelect";
import Logo from "@/components/Logo";

const initialForm = {
  nama: "",
  email: "",
  no_telp: "",
  gender: "",
  kategori: "",
  punya_motor: "",
  punya_alat_cleaning: "", // khusus daily_cleaning
  melayani_gender: "", // khusus massage
};

export default function ApplyPage() {
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState(null); // sertifikat/paklaring
  const [fotoAlat, setFotoAlat] = useState(null); // foto alat cleaning
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Wilayah: kota + kecamatan
  const [kotaList, setKotaList] = useState([]);
  const [kotaLoading, setKotaLoading] = useState(true);
  const [kotaError, setKotaError] = useState(false);
  const [selectedKota, setSelectedKota] = useState(null); // { id, label }
  const [kecamatanList, setKecamatanList] = useState([]);
  const [kecamatanLoading, setKecamatanLoading] = useState(false);
  const [selectedKecamatan, setSelectedKecamatan] = useState(null); // { id, label }
  const [domisiliManual, setDomisiliManual] = useState(""); // fallback kalau API wilayah gagal

  // Proteksi spam: honeypot field (harusnya selalu kosong) + waktu form pertama dibuka
  const [website, setWebsite] = useState("");
  const [formRenderedAt] = useState(() => Date.now());

  useEffect(() => {
    fetch("/api/wilayah/kota")
      .then((r) => r.json())
      .then((data) => {
        if (data.error || !data.kota) throw new Error();
        setKotaList(data.kota.map((k) => ({ id: k.id, label: k.name, sublabel: k.provinsi })));
      })
      .catch(() => setKotaError(true))
      .finally(() => setKotaLoading(false));
  }, []);

  function handleSelectKota(opt) {
    setSelectedKota(opt);
    setSelectedKecamatan(null);
    setKecamatanList([]);
    setKecamatanLoading(true);
    fetch(`/api/wilayah/kecamatan?kota_id=${opt.id}`)
      .then((r) => r.json())
      .then((data) => {
        setKecamatanList((data.kecamatan || []).map((k) => ({ id: k.id, label: k.name })));
      })
      .finally(() => setKecamatanLoading(false));
  }

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateKategori(value) {
    // reset field khusus kategori pas ganti kategori, biar ga nyangkut data lama
    setForm((prev) => ({
      ...prev,
      kategori: value,
      punya_alat_cleaning: "",
      melayani_gender: "",
    }));
    setFotoAlat(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.nama || !form.email || !form.no_telp || !form.gender || !form.kategori || form.punya_motor === "") {
      toast.error("Lengkapi semua data dulu ya");
      return;
    }

    const domisiliFinal = kotaError
      ? domisiliManual.trim()
      : selectedKota && selectedKecamatan
      ? `${selectedKecamatan.label}, ${selectedKota.label}`
      : "";

    if (!domisiliFinal) {
      toast.error(kotaError ? "Isi domisili kamu dulu ya" : "Pilih kota dan kecamatan dulu ya");
      return;
    }

    if (form.kategori === "daily_cleaning") {
      if (form.punya_alat_cleaning === "") {
        toast.error("Isi dulu apakah kamu punya alat cleaning");
        return;
      }
      if (form.punya_alat_cleaning === "ya" && !fotoAlat) {
        toast.error("Upload dulu foto alat cleaning kamu");
        return;
      }
    }

    if (!file) {
      toast.error("Upload dulu sertifikat/paklaring/rating kamu ya");
      return;
    }

    if (form.kategori === "massage" && !form.melayani_gender) {
      toast.error("Pilih dulu gender yang bisa kamu layani");
      return;
    }

    setSubmitting(true);
    try {
      let file_url = null;
      let file_name = null;
      if (file) {
        const uploaded = await uploadFile(file);
        file_url = uploaded.fileUrl;
        file_name = uploaded.fileName;
      }

      let foto_alat_url = null;
      let foto_alat_name = null;
      if (form.kategori === "daily_cleaning" && form.punya_alat_cleaning === "ya" && fotoAlat) {
        const uploaded = await uploadFile(fotoAlat);
        foto_alat_url = uploaded.fileUrl;
        foto_alat_name = uploaded.fileName;
      }

      const res = await fetch("/api/applicants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          domisili: domisiliFinal,
          punya_motor: form.punya_motor === "ya",
          punya_alat_cleaning:
            form.kategori === "daily_cleaning" ? form.punya_alat_cleaning === "ya" : null,
          file_url,
          file_name,
          foto_alat_url,
          foto_alat_name,
          website,
          form_rendered_at: formRenderedAt,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.duplicate ? data.error : data.error || "Gagal submit");
      }

      setDone(true);
    } catch (err) {
      toast.error(err.message, { duration: 5000 });
    } finally {
      setSubmitting(false);
    }
  }

  async function uploadFile(f) {
    const fd = new FormData();
    fd.append("file", f);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal upload file");
    return { fileUrl: data.fileUrl, fileName: data.fileName };
  }

  if (done) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-brand-light flex items-center justify-center text-brand text-3xl mb-6">
          ✓
        </div>
        <h1 className="text-2xl font-bold mb-2">Pendaftaran terkirim!</h1>
        <p className="text-ink-muted max-w-sm">
          Tim kami akan meninjau data kamu dan menghubungi lewat email atau
          telepon yang kamu daftarkan.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-12 flex justify-center">
      <Toaster position="top-center" />
      <div className="w-full max-w-lg">
        <div className="mb-6">
          <Logo size={48} />
        </div>
        <h1 className="font-display font-bold text-2xl mb-1">Daftar Jadi Mitra Dispatcher Sejasa</h1>
        <p className="text-ink-muted mb-8">
          Isi data di bawah ini dengan lengkap dan benar.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Honeypot — invisible buat manusia, bot biasanya ngisi semua field yang ketemu */}
          <div className="absolute -left-[9999px] opacity-0" aria-hidden="true">
            <label htmlFor="website">Website</label>
            <input
              type="text"
              id="website"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Nama Lengkap</label>
            <input
              className="input-field"
              value={form.nama}
              onChange={(e) => updateField("nama", e.target.value)}
              placeholder="Nama sesuai KTP"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input
              type="email"
              className="input-field"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="nama@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">No. Telepon</label>
            <input
              className="input-field"
              value={form.no_telp}
              onChange={(e) => updateField("no_telp", e.target.value)}
              placeholder="08xxxxxxxxxx"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Jenis Kelamin</label>
            <div className="flex gap-3">
              {[
                { value: "male", label: "Laki-laki" },
                { value: "female", label: "Perempuan" },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => updateField("gender", opt.value)}
                  className={`flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition ${
                    form.gender === opt.value
                      ? "border-brand bg-brand-light text-brand"
                      : "border-gray-200 text-ink-muted"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Kota / Kabupaten</label>
            {kotaError ? (
              <input
                className="input-field"
                value={domisiliManual}
                onChange={(e) => setDomisiliManual(e.target.value)}
                placeholder="Contoh: Kecamatan Kebayoran Baru, Jakarta Selatan"
              />
            ) : (
              <SearchableSelect
                options={kotaList}
                value={selectedKota?.id}
                onChange={handleSelectKota}
                placeholder="Pilih kota/kabupaten"
                loading={kotaLoading}
              />
            )}
          </div>

          {!kotaError && (
            <div>
              <label className="block text-sm font-medium mb-1.5">Kecamatan</label>
              <SearchableSelect
                options={kecamatanList}
                value={selectedKecamatan?.id}
                onChange={setSelectedKecamatan}
                placeholder={selectedKota ? "Pilih kecamatan" : "Pilih kota dulu"}
                disabled={!selectedKota}
                loading={kecamatanLoading}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5">Kategori Layanan</label>
            <div className="flex gap-3">
              {[
                { value: "massage", label: "Massage" },
                { value: "daily_cleaning", label: "Daily Cleaning" },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => updateKategori(opt.value)}
                  className={`flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition ${
                    form.kategori === opt.value
                      ? "border-brand bg-brand-light text-brand"
                      : "border-gray-200 text-ink-muted"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Field khusus Daily Cleaning */}
          {form.kategori === "daily_cleaning" && (
            <div className="bg-brand-light/40 border border-brand-light rounded-xl p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Punya Alat Cleaning Sendiri?
                </label>
                <div className="flex gap-3">
                  {[
                    { value: "ya", label: "Ya, Punya" },
                    { value: "tidak", label: "Tidak Punya" },
                  ].map((opt) => (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => updateField("punya_alat_cleaning", opt.value)}
                      className={`flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition bg-white ${
                        form.punya_alat_cleaning === opt.value
                          ? "border-brand text-brand"
                          : "border-gray-200 text-ink-muted"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {form.punya_alat_cleaning === "ya" && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">Foto Alat Cleaning</label>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    onChange={(e) => setFotoAlat(e.target.files[0])}
                    className="w-full text-sm text-ink-muted file:mr-4 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:text-brand file:font-medium"
                  />
                  <p className="text-xs text-ink-muted mt-1">
                    Foto alat (vacuum, mop, dll) yang kamu punya. Maks 5MB, format JPG/PNG.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Field khusus Massage */}
          {form.kategori === "massage" && (
            <div className="bg-brand-light/40 border border-brand-light rounded-xl p-4">
              <label className="block text-sm font-medium mb-1.5">
                Bisa Melayani Gender Apa?
              </label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { value: "wanita", label: "Wanita Saja" },
                  { value: "pria", label: "Pria Saja" },
                  { value: "keduanya", label: "Keduanya" },
                ].map((opt) => (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => updateField("melayani_gender", opt.value)}
                    className={`rounded-xl border px-4 py-3 text-sm font-medium transition bg-white text-left ${
                      form.melayani_gender === opt.value
                        ? "border-brand text-brand"
                        : "border-gray-200 text-ink-muted"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5">Punya Kendaraan Motor?</label>
            <div className="flex gap-3">
              {[
                { value: "ya", label: "Ya" },
                { value: "tidak", label: "Tidak" },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => updateField("punya_motor", opt.value)}
                  className={`flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition ${
                    form.punya_motor === opt.value
                      ? "border-brand bg-brand-light text-brand"
                      : "border-gray-200 text-ink-muted"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Sertifikat / Paklaring / Rating App Sebelumnya <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full text-sm text-ink-muted file:mr-4 file:rounded-full file:border-0 file:bg-brand-light file:px-4 file:py-2 file:text-brand file:font-medium"
            />
            <p className="text-xs text-ink-muted mt-1">Maks 5MB, format PDF/JPG/PNG</p>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full mt-2">
            {submitting ? "Mengirim..." : "Kirim Pendaftaran"}
          </button>
        </form>
      </div>
    </main>
  );
}
