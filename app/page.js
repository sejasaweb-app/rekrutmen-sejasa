import Link from "next/link";
import {
  Users,
  Clock,
  Wallet,
  ShieldCheck,
  Headphones,
  Zap,
  FileEdit,
  ClipboardCheck,
  GraduationCap,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import Logo from "@/components/Logo";
import PhotoPlaceholder from "@/components/PhotoPlaceholder";

const BENEFITS = [
  {
    icon: Users,
    title: "Pelanggan Langsung dari Sejasa",
    desc: "Ga perlu cari pelanggan sendiri — kami yang salurkan orderan ke kamu.",
    color: "#E6007E",
  },
  {
    icon: Clock,
    title: "Atur Jadwal Sendiri",
    desc: "Kerja fleksibel, kamu yang tentukan kapan mau aktif terima orderan.",
    color: "#3B82F6",
  },
  {
    icon: Wallet,
    title: "Penghasilan Tambahan",
    desc: "Potensi income harian dari tiap orderan yang kamu selesaikan.",
    color: "#16A34A",
  },
  {
    icon: ShieldCheck,
    title: "Pembayaran Aman & Tepat Waktu",
    desc: "Sistem pembayaran jelas, ga perlu was-was soal transaksi.",
    color: "#F59E0B",
  },
  {
    icon: Headphones,
    title: "Didukung Tim Sejasa",
    desc: "Ada tim yang siap bantu kalau kamu butuh dukungan di lapangan.",
    color: "#8B5CF6",
  },
  {
    icon: Zap,
    title: "Proses Daftar Cepat",
    desc: "Isi form, verifikasi, langsung bisa mulai — ga ribet.",
    color: "#EC4899",
  },
];

const STEPS = [
  { icon: FileEdit, title: "Isi Formulir", desc: "Lengkapi data diri dan pilih kategori layanan." },
  { icon: ClipboardCheck, title: "Screening", desc: "Tim kami review dan hubungi kamu lewat WA/telepon." },
  { icon: GraduationCap, title: "Onboarding", desc: "Persiapan singkat sebelum mulai terima pelanggan." },
  { icon: Sparkles, title: "Mulai Kerja", desc: "Terima orderan pertama kamu dari Sejasa." },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      {/* Nav bar */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size={32} rounded="rounded-lg" />
            <span className="font-semibold text-sm hidden sm:inline">Dispatcher Sejasa</span>
          </div>
          <Link
            href="/apply"
            className="text-sm font-medium bg-brand hover:bg-brand-dark text-white rounded-full px-5 py-2 transition"
          >
            Daftar
          </Link>
        </div>
      </header>

      {/* Hero — gradient background + decorative blur shapes */}
      <section className="relative px-6 pt-16 pb-20 text-center overflow-hidden">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, #FDE6F1 0%, #FAFAFA 55%, #FAFAFA 100%)",
          }}
        />
        <div className="absolute top-10 -left-24 w-72 h-72 rounded-full bg-brand/10 blur-3xl -z-10" />
        <div className="absolute top-32 -right-20 w-72 h-72 rounded-full bg-blue-400/10 blur-3xl -z-10" />

        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand bg-brand-light rounded-full px-3.5 py-1.5 mb-6">
          <Sparkles size={13} />
          Buka Pendaftaran Mitra
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold mb-5 max-w-2xl mx-auto leading-[1.1] tracking-tight">
          Jadi Mitra <span className="text-brand">Dispatcher</span> Sejasa
        </h1>
        <p className="text-ink-muted text-lg max-w-lg mx-auto mb-9">
          Dapatkan pelanggan Massage & Daily Cleaning langsung dari Sejasa.
          Atur jadwal sendiri, mulai dari sekarang.
        </p>
        <Link
          href="/apply"
          className="group inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white font-medium rounded-full px-7 py-3.5 transition shadow-lg shadow-brand/25"
        >
          Daftar Jadi Mitra
          <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>

        {/* Hero image — cocok diisi foto gathering bareng mitra */}
        <div className="max-w-3xl mx-auto mt-14">
          <PhotoPlaceholder
            src="/images/foto-hero.jpg"
            label="Foto hero — misal foto gathering bareng mitra"
            aspect="aspect-[16/7]"
          />
        </div>
      </section>

      {/* Benefits — warna beda tiap card, hover lift */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Kenapa Gabung Jadi Mitra?</h2>
            <p className="text-ink-muted max-w-md mx-auto">
              Beberapa keuntungan yang kamu dapat sebagai mitra Dispatcher Sejasa.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {BENEFITS.map((b) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.title}
                  className="card p-6 hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${b.color}1A` }}
                  >
                    <Icon size={22} style={{ color: b.color }} />
                  </div>
                  <h3 className="font-semibold mb-1.5">{b.title}</h3>
                  <p className="text-sm text-ink-muted leading-relaxed">{b.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Cara Bergabung — konek pakai garis */}
      <section className="px-6 py-20 bg-[#FAFAFA]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">Cara Bergabung</h2>
            <p className="text-ink-muted">4 langkah gampang buat mulai jadi mitra.</p>
          </div>
          <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-6">
            <div
              className="hidden lg:block absolute top-7 left-[12%] right-[12%] h-0.5 -z-0"
              style={{ background: "linear-gradient(90deg, #E6007E33, #E6007E33)" }}
            />
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="relative text-center">
                  <div className="relative inline-flex mb-4">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md shadow-brand/20"
                      style={{ backgroundColor: "#E6007E" }}
                    >
                      <Icon size={24} />
                    </div>
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-ink text-white text-[11px] font-bold flex items-center justify-center border-2 border-[#FAFAFA]">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm mb-1.5">{s.title}</h3>
                  <p className="text-xs text-ink-muted leading-relaxed">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Kategori layanan */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Kategori Layanan</h2>
            <p className="text-ink-muted">Pilih kategori yang paling sesuai sama skill kamu.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="card overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
              <PhotoPlaceholder
                src="/images/foto-massage.jpg"
                label="Foto mitra Massage"
                aspect="aspect-[4/3]"
                rounded=""
              />
              <div className="p-5">
                <span className="text-xs font-semibold text-brand bg-brand-light rounded-full px-2.5 py-1">
                  Massage
                </span>
                <p className="text-sm text-ink-muted mt-3">
                  Layani pelanggan yang butuh jasa pijat profesional di rumah mereka.
                </p>
              </div>
            </div>
            <div className="card overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
              <PhotoPlaceholder
                src="/images/foto-cleaning.jpg"
                label="Foto mitra Daily Cleaning"
                aspect="aspect-[4/3]"
                rounded=""
              />
              <div className="p-5">
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 rounded-full px-2.5 py-1">
                  Daily Cleaning
                </span>
                <p className="text-sm text-ink-muted mt-3">
                  Bantu pelanggan bersihkan rumah mereka secara rutin maupun sekali datang.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Komunitas — foto gathering */}
      <section className="px-6 py-20 bg-[#FAFAFA]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Komunitas Mitra Sejasa</h2>
            <p className="text-ink-muted max-w-md mx-auto">
              Kamu ga sendirian — jadi bagian dari komunitas mitra yang saling
              support satu sama lain.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <PhotoPlaceholder
              src="/images/foto-komunitas-1.jpg"
              label="Foto gathering mitra 1"
              aspect="aspect-square"
            />
            <PhotoPlaceholder
              src="/images/foto-komunitas-2.jpg"
              label="Foto gathering mitra 2"
              aspect="aspect-square"
            />
            <PhotoPlaceholder
              src="/images/foto-komunitas-3.jpg"
              label="Foto gathering mitra 3"
              aspect="aspect-square"
            />
          </div>
        </div>
      </section>

      {/* CTA penutup — full-bleed gradient background */}
      <section className="relative px-6 py-20 text-center overflow-hidden">
        <div
          className="absolute inset-0 -z-10"
          style={{ background: "linear-gradient(135deg, #F0169B, #A80057)" }}
        />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-white/10 blur-3xl -z-10" />
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-3xl -z-10" />

        <h2 className="text-3xl font-bold mb-3 text-white">Siap Gabung Jadi Mitra?</h2>
        <p className="text-white/80 max-w-md mx-auto mb-9">
          Daftar sekarang, tim kami bakal hubungi kamu lewat WhatsApp atau telepon
          setelah lamaran kamu ditinjau.
        </p>
        <Link
          href="/apply"
          className="group inline-flex items-center gap-2 bg-white text-brand font-medium rounded-full px-7 py-3.5 transition hover:bg-gray-50 shadow-lg"
        >
          Daftar Jadi Mitra
          <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </section>
    </main>
  );
}
