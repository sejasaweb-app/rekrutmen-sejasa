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
  Hand,
  SprayCan,
} from "lucide-react";
import Logo from "@/components/Logo";
import PhotoPlaceholder from "@/components/PhotoPlaceholder";
import CategoryVisual from "@/components/CategoryVisual";

// Palet dikurasi — 4 warna yang berasa satu keluarga sama brand magenta,
// bukan random warna default Tailwind.
const BENEFITS = [
  {
    icon: Users,
    title: "Pelanggan Langsung dari Sejasa",
    desc: "Ga perlu cari pelanggan sendiri — kami yang salurkan orderan ke kamu.",
    from: "#F0169B",
    to: "#A80057",
  },
  {
    icon: Clock,
    title: "Atur Jadwal Sendiri",
    desc: "Kerja fleksibel, kamu yang tentukan kapan mau aktif terima orderan.",
    from: "#7C3AED",
    to: "#5B21B6",
  },
  {
    icon: Wallet,
    title: "Penghasilan Tambahan",
    desc: "Potensi income harian dari tiap orderan yang kamu selesaikan.",
    from: "#F59E0B",
    to: "#B45309",
  },
  {
    icon: ShieldCheck,
    title: "Pembayaran Aman & Tepat Waktu",
    desc: "Sistem pembayaran jelas, ga perlu was-was soal transaksi.",
    from: "#0EA5A4",
    to: "#0F766E",
  },
  {
    icon: Headphones,
    title: "Didukung Tim Sejasa",
    desc: "Ada tim yang siap bantu kalau kamu butuh dukungan di lapangan.",
    from: "#7C3AED",
    to: "#5B21B6",
  },
  {
    icon: Zap,
    title: "Proses Daftar Cepat",
    desc: "Isi form, verifikasi, langsung bisa mulai — ga ribet.",
    from: "#F0169B",
    to: "#A80057",
  },
];

const STEPS = [
  { icon: FileEdit, title: "Isi Formulir", desc: "Lengkapi data diri dan pilih kategori layanan." },
  { icon: ClipboardCheck, title: "Screening", desc: "Tim kami review dan hubungi kamu lewat WA/telepon." },
  { icon: GraduationCap, title: "Onboarding", desc: "Persiapan singkat sebelum mulai terima pelanggan." },
  { icon: Sparkles, title: "Mulai Kerja", desc: "Terima orderan pertama kamu dari Sejasa." },
];

// Tekstur dot-grid halus buat background, biar section ga polos rata
const DOT_GRID = {
  backgroundImage: "radial-gradient(circle, #E6007E22 1px, transparent 1px)",
  backgroundSize: "24px 24px",
};

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      {/* Nav bar */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size={28} rounded="rounded-lg" />
            <span className="font-display font-bold text-sm hidden sm:inline">Dispatcher Sejasa</span>
          </div>
          <Link
            href="/apply"
            className="text-sm font-medium bg-brand hover:bg-brand-dark text-white rounded-full px-4 sm:px-5 py-1.5 sm:py-2 transition"
          >
            Daftar
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative px-4 sm:px-6 pt-10 pb-12 sm:pt-16 sm:pb-20 text-center overflow-hidden">
        <div className="absolute inset-0 -z-20" style={DOT_GRID} />
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 75% 55% at 50% 0%, #FDE6F1 0%, #FAFAFA 60%, #FAFAFA 100%)",
          }}
        />
        <div className="absolute top-10 -left-24 w-72 h-72 rounded-full bg-brand/10 blur-3xl -z-10" />
        <div className="absolute top-32 -right-20 w-72 h-72 rounded-full bg-purple-400/10 blur-3xl -z-10" />

        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand bg-white shadow-sm rounded-full px-3.5 py-1.5 mb-5 sm:mb-6">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand" />
          </span>
          Buka Pendaftaran Mitra
        </span>
        <h1 className="font-display font-extrabold text-[2.1rem] leading-[1.1] sm:text-6xl sm:leading-[1.05] mb-4 sm:mb-5 max-w-2xl mx-auto tracking-tight">
          Jadi Mitra <span className="text-brand">Dispatcher</span> Sejasa
        </h1>
        <p className="text-ink-muted text-base sm:text-lg max-w-lg mx-auto mb-7 sm:mb-9">
          Dapatkan pelanggan Massage & Daily Cleaning langsung dari Sejasa.
          Atur jadwal sendiri, mulai dari sekarang.
        </p>
        <Link
          href="/apply"
          className="group inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white font-semibold rounded-full px-6 sm:px-7 py-3 sm:py-3.5 transition shadow-xl shadow-brand/25"
        >
          Daftar Jadi Mitra
          <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>

        {/* Hero image — cocok diisi foto gathering bareng mitra */}
        <div className="max-w-3xl mx-auto mt-8 sm:mt-14">
          <PhotoPlaceholder
            src="/images/foto-hero.jpg"
            label="Foto hero — misal foto gathering bareng mitra"
            aspect="aspect-[4/3] sm:aspect-[16/9]"
            objectPosition="center 25%"
          />
        </div>
      </section>

      {/* Benefits */}
      <section className="px-4 sm:px-6 py-12 sm:py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-7 sm:mb-12">
            <h2 className="font-display font-bold text-2xl sm:text-3xl mb-2 sm:mb-3 tracking-tight">Kenapa Gabung Jadi Mitra?</h2>
            <p className="text-ink-muted text-sm sm:text-base max-w-md mx-auto">
              Beberapa keuntungan yang kamu dapat sebagai mitra Dispatcher Sejasa.
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
            {BENEFITS.map((b) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.title}
                  className="card p-3.5 sm:p-6 hover:-translate-y-1 hover:shadow-xl transition-all duration-200"
                >
                  <div
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center mb-2.5 sm:mb-4 shadow-md"
                    style={{ background: `linear-gradient(135deg, ${b.from}, ${b.to})` }}
                  >
                    <Icon size={18} className="text-white sm:hidden" />
                    <Icon size={22} className="text-white hidden sm:block" />
                  </div>
                  <h3 className="font-display font-semibold text-sm sm:text-base mb-1 sm:mb-1.5 leading-snug">{b.title}</h3>
                  <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">{b.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Cara Bergabung */}
      <section className="px-4 sm:px-6 py-12 sm:py-20 bg-[#FAFAFA]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 sm:mb-14">
            <h2 className="font-display font-bold text-2xl sm:text-3xl mb-2 sm:mb-3 tracking-tight">Cara Bergabung</h2>
            <p className="text-ink-muted text-sm sm:text-base">4 langkah gampang buat mulai jadi mitra.</p>
          </div>
          <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-6">
            <div
              className="hidden lg:block absolute top-7 left-[12%] right-[12%] h-0.5 -z-0"
              style={{ background: "linear-gradient(90deg, #E6007E44, #E6007E44)" }}
            />
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="relative text-center">
                  <div className="relative inline-flex mb-3 sm:mb-4">
                    <div
                      className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand/25"
                      style={{ background: "linear-gradient(135deg, #F0169B, #A80057)" }}
                    >
                      <Icon size={20} className="sm:hidden" />
                      <Icon size={24} className="hidden sm:block" />
                    </div>
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-ink text-white text-[11px] font-bold flex items-center justify-center border-2 border-[#FAFAFA]">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="font-display font-semibold text-xs sm:text-sm mb-1 sm:mb-1.5">{s.title}</h3>
                  <p className="text-[11px] sm:text-xs text-ink-muted leading-relaxed">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Kategori layanan */}
      <section className="px-4 sm:px-6 py-12 sm:py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-7 sm:mb-12">
            <h2 className="font-display font-bold text-2xl sm:text-3xl mb-2 sm:mb-3 tracking-tight">Kategori Layanan</h2>
            <p className="text-ink-muted text-sm sm:text-base">Pilih kategori yang paling sesuai sama skill kamu.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="card overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all duration-200">
              <CategoryVisual
                icon={Hand}
                from="#F0169B"
                to="#A80057"
                aspect="aspect-[16/9] sm:aspect-[4/3]"
              />
              <div className="p-4 sm:p-5">
                <span
                  className="text-xs font-semibold text-white rounded-full px-2.5 py-1"
                  style={{ background: "linear-gradient(135deg, #F0169B, #A80057)" }}
                >
                  Massage
                </span>
                <p className="text-sm text-ink-muted mt-2.5 sm:mt-3">
                  Layani pelanggan yang butuh jasa pijat profesional di rumah mereka.
                </p>
              </div>
            </div>
            <div className="card overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all duration-200">
              <CategoryVisual
                icon={SprayCan}
                from="#7C3AED"
                to="#5B21B6"
                aspect="aspect-[16/9] sm:aspect-[4/3]"
              />
              <div className="p-4 sm:p-5">
                <span
                  className="text-xs font-semibold text-white rounded-full px-2.5 py-1"
                  style={{ background: "linear-gradient(135deg, #7C3AED, #5B21B6)" }}
                >
                  Daily Cleaning
                </span>
                <p className="text-sm text-ink-muted mt-2.5 sm:mt-3">
                  Bantu pelanggan bersihkan rumah mereka secara rutin maupun sekali datang.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Komunitas */}
      <section className="px-4 sm:px-6 py-12 sm:py-20 bg-[#FAFAFA]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-7 sm:mb-12">
            <h2 className="font-display font-bold text-2xl sm:text-3xl mb-2 sm:mb-3 tracking-tight">Komunitas Mitra Sejasa</h2>
            <p className="text-ink-muted text-sm sm:text-base max-w-md mx-auto">
              Kamu ga sendirian — jadi bagian dari komunitas mitra yang saling
              support satu sama lain.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-5">
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

      {/* CTA penutup */}
      <section className="relative px-4 sm:px-6 py-14 sm:py-20 text-center overflow-hidden">
        <div
          className="absolute inset-0 -z-20"
          style={{ background: "linear-gradient(135deg, #F0169B, #A80057)" }}
        />
        <div
          className="absolute inset-0 -z-10 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-white/10 blur-3xl -z-10" />
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-3xl -z-10" />

        <h2 className="font-display font-bold text-2xl sm:text-3xl mb-2.5 sm:mb-3 text-white tracking-tight">
          Siap Gabung Jadi Mitra?
        </h2>
        <p className="text-white/80 text-sm sm:text-base max-w-md mx-auto mb-7 sm:mb-9">
          Daftar sekarang, tim kami bakal hubungi kamu lewat WhatsApp atau telepon
          setelah lamaran kamu ditinjau.
        </p>
        <Link
          href="/apply"
          className="group inline-flex items-center gap-2 bg-white text-brand font-semibold rounded-full px-6 sm:px-7 py-3 sm:py-3.5 transition hover:bg-gray-50 shadow-xl"
        >
          Daftar Jadi Mitra
          <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </section>
    </main>
  );
}
