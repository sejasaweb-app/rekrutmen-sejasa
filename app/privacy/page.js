export const metadata = {
  title: "Kebijakan Privasi — Rekrutmen Mitra Sejasa",
  description:
    "Kebijakan privasi untuk formulir pendaftaran mitra Sejasa (Massage & Daily Cleaning).",
};

const SECTIONS = [
  {
    title: "1. Data yang Kami Kumpulkan",
    body: [
      "Saat Anda mendaftar sebagai calon mitra melalui formulir ini, kami mengumpulkan data yang Anda berikan secara langsung, meliputi: nama lengkap, alamat email, nomor telepon/WhatsApp, jenis kelamin, domisili (kota & kecamatan), status kepemilikan motor, status kepemilikan alat kerja (untuk kategori Daily Cleaning), serta dokumen pendukung seperti foto alat kerja dan sertifikat/paklaring/rating dari platform sebelumnya (jika ada).",
      "Kami juga mencatat data teknis minimum yang diperlukan untuk proses administrasi kontrak kemitraan, seperti waktu pengajuan, status lamaran, dan riwayat komunikasi follow-up (WhatsApp/telepon/email) antara tim rekrutmen dan calon mitra.",
    ],
  },
  {
    title: "2. Tujuan Penggunaan Data",
    body: [
      "Data yang Anda berikan digunakan semata-mata untuk keperluan proses rekrutmen dan administrasi kemitraan dengan Sejasa, termasuk: verifikasi kelayakan calon mitra, proses screening dan onboarding, komunikasi terkait status lamaran, serta pembuatan dan pengiriman dokumen Perjanjian Kemitraan (kontrak) bagi calon mitra yang diterima.",
      "Kami tidak menggunakan data Anda untuk tujuan pemasaran pihak ketiga atau tujuan lain di luar proses rekrutmen dan kemitraan ini.",
    ],
  },
  {
    title: "3. Penyimpanan Data",
    body: [
      "Data formulir disimpan pada basis data terkelola (Supabase). Dokumen pendukung (foto alat kerja, sertifikat/paklaring) dan dokumen kontrak yang dihasilkan disimpan pada Google Drive milik tim Sejasa dengan akses yang dibatasi hanya untuk kebutuhan verifikasi dan administrasi.",
      "Kami menerapkan langkah keamanan yang wajar untuk melindungi data Anda dari akses, perubahan, atau pengungkapan yang tidak sah.",
    ],
  },
  {
    title: "4. Berbagi Data",
    body: [
      "Kami tidak menjual atau membagikan data pribadi Anda kepada pihak ketiga untuk kepentingan komersial. Data hanya diakses oleh tim internal Sejasa yang bertanggung jawab atas proses rekrutmen dan pengelolaan mitra, serta penyedia layanan teknis (seperti hosting dan penyimpanan cloud) yang mendukung operasional sistem ini.",
    ],
  },
  {
    title: "5. Hak Anda",
    body: [
      "Anda berhak meminta akses, koreksi, atau penghapusan data pribadi yang telah Anda berikan melalui formulir ini, dengan menghubungi kami melalui kontak yang tercantum di bawah. Permintaan penghapusan data dapat memengaruhi kelanjutan proses lamaran kemitraan Anda.",
    ],
  },
  {
    title: "6. Perubahan Kebijakan",
    body: [
      "Kebijakan privasi ini dapat diperbarui dari waktu ke waktu. Perubahan akan diterbitkan pada halaman ini beserta tanggal pembaruan.",
    ],
  },
  {
    title: "7. Kontak",
    body: [
      "Jika Anda memiliki pertanyaan mengenai kebijakan privasi ini atau data Anda, silakan hubungi kami melalui email: sejasawebapp@gmail.com.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand">
          Rekrutmen Mitra Sejasa
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink sm:text-4xl">
          Kebijakan Privasi
        </h1>
        <p className="mt-3 text-sm text-ink-muted">
          Terakhir diperbarui: 10 September 2026
        </p>

        <p className="mt-8 text-base leading-relaxed text-ink">
          Kebijakan privasi ini menjelaskan bagaimana kami mengumpulkan,
          menggunakan, dan melindungi data pribadi yang Anda berikan saat
          mengajukan diri sebagai calon mitra Sejasa melalui situs ini,
          untuk kategori Massage dan Daily Cleaning.
        </p>

        <div className="mt-10 space-y-10">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="font-display text-xl font-bold text-ink">
                {section.title}
              </h2>
              <div className="mt-3 space-y-3">
                {section.body.map((paragraph, i) => (
                  <p key={i} className="text-base leading-relaxed text-ink-muted">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-14 rounded-card border border-brand-light bg-brand-light/40 p-5 text-sm text-ink-muted">
          Dengan mengirimkan formulir pendaftaran mitra, Anda menyatakan
          telah membaca dan menyetujui kebijakan privasi ini.
        </div>
      </div>
    </main>
  );
}
