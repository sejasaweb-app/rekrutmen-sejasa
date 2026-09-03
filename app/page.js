import Link from "next/link";
import {
  MapPin,
  Wallet,
  Clock,
  ShieldCheck,
  Headphones,
  Zap,
  FileEdit,
  ClipboardCheck,
  GraduationCap,
  Sparkles,
  ArrowRight,
  CalendarCheck,
  Check,
} from "lucide-react";
import Logo from "@/components/Logo";
import PhotoPlaceholder from "@/components/PhotoPlaceholder";

// Palet dikurasi — 4 warna yang berasa satu keluarga sama brand magenta,
// bukan random warna default Tailwind.
const BENEFITS = [
  {
    icon: MapPin,
    title: "Job Sesuai Wilayah",
    desc: "Orderan yang masuk disesuaikan sama radius wilayah kerja kamu, jadi lebih dekat dan efisien.",
    from: "#F0169B",
    to: "#A80057",
  },
  {
    icon: Wallet,
    title: "Penghasilan Terjamin",
    desc: "Dapetin penghasilan yang jelas dari tiap orderan yang kamu selesaikan, tanpa perlu nyari pelanggan sendiri.",
    from: "#F59E0B",
    to: "#B45309",
  },
  {
    icon: Clock,
    title: "Jadwal Kerja Terstruktur",
    desc: "Jadwal diatur lewat sistem sesuai ketersediaan & kebutuhan area, biar adil dan teratur buat semua mitra.",
    from: "#7C3AED",
    to: "#5B21B6",
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
    title: "Dibantu Tim Khusus Sejasa",
    desc: "Ada Tim Khusus Sejasa Official yang siap bantu langsung kalau kamu butuh dukungan di lapangan.",
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

// Perbandingan Mitra Dispatcher vs Reguler — Dispatcher sengaja ditonjolkan
// (border & background brand, poin lebih hidup) buat dorong konversi ke jalur ini.
const DISPATCHER_POINTS = [
  { title: "Job Terjadwal Otomatis", desc: "Tinggal terima, gak perlu buka app terus buat rebutan orderan." },
  { title: "Area Sesuai Wilayah Jangkauan", desc: "Job selalu dekat dari lokasi kamu, hemat waktu & ongkos jalan." },
  { title: "Penghasilan Terjamin", desc: "Ada kepastian income tiap minggu, gak was-was sepi orderan." },
  { title: "Job Lebih Banyak", desc: "Orderan mengalir rutin karena udah masuk sistem penjadwalan." },
];

const REGULAR_POINTS = [
  "Job dengan sistem rebutan",
  "Area job sesuai yang tersedia saat itu",
  "Pendapatan mengikuti job yang berhasil diambil",
  "Jadwal fleksibel, menyesuaikan ketersediaan mitra",
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size={36} rounded="rounded-xl" />
            <span className="font-display font-bold text-[15px] sm:text-lg tracking-tight">Dispatcher Sejasa</span>
          </div>
          <Link
            href="/apply"
            className="group inline-flex items-center gap-1.5 text-sm font-semibold bg-brand hover:bg-brand-dark text-white rounded-full pl-4 sm:pl-5 pr-3.5 sm:pr-4 py-2 sm:py-2.5 shadow-md shadow-brand/25 hover:shadow-lg hover:shadow-brand/35 transition-all hover:scale-[1.03] active:scale-[0.98]"
          >
            Daftar
            <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative px-4 sm:px-6 pt-10 pb-12 sm:pt-16 sm:pb-16 text-center overflow-hidden">
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

        <h1 className="font-display font-extrabold text-[2.1rem] leading-[1.1] sm:text-6xl sm:leading-[1.05] mb-4 sm:mb-5 max-w-2xl mx-auto tracking-tight pt-2 sm:pt-4">
          Jadi Mitra <span className="text-brand">Dispatcher</span> Sejasa
        </h1>
        <p className="text-ink-muted text-base sm:text-lg max-w-lg mx-auto mb-7 sm:mb-9">
          Dapatkan pelanggan Massage & Daily Cleaning sesuai jangkauan wilayah kamu.
          Penghasilan terjamin, didukung langsung oleh Tim Sejasa.
        </p>
        <div className="relative inline-block">
          <span className="absolute inset-0 rounded-full bg-brand opacity-50 blur-2xl animate-pulse scale-110 -z-10" />
          <Link
            href="/apply"
            className="group relative inline-flex items-center gap-2.5 bg-brand hover:bg-brand-dark text-white font-bold text-lg sm:text-xl rounded-full px-10 sm:px-12 py-5 sm:py-6 transition shadow-2xl shadow-brand/50 hover:scale-[1.04] active:scale-[0.98]"
          >
            Daftar Jadi Mitra
            <ArrowRight size={22} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Social proof — angka riil pekerjaan yang udah diselesaikan mitra */}
        <div className="flex justify-center mt-10 sm:mt-14">
          <div className="inline-flex items-center gap-3 sm:gap-4">
            <div className="flex -space-x-3 shrink-0">
              {["1", "2", "3"].map((n) => (
                <div
                  key={n}
                  className="w-9 h-9 sm:w-11 sm:h-11 rounded-full overflow-hidden ring-2 ring-white shadow-sm relative"
                >
                  <PhotoPlaceholder
                    src={`/images/foto-komunitas-${n}.jpg`}
                    label=""
                    aspect="aspect-square"
                    rounded="rounded-full"
                    frame={false}
                    watermark={false}
                  />
                </div>
              ))}
            </div>
            <span className="text-sm sm:text-base text-ink-muted text-left leading-snug">
              <span className="font-extrabold text-brand text-base sm:text-xl">2.500+</span>{" "}
              Pekerjaan sudah diselesaikan oleh Mitra Dispatcher Sejasa
            </span>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-4 sm:px-6 py-12 sm:py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-7 sm:mb-12">
            <h2 className="font-display font-bold text-2xl sm:text-3xl mb-2 sm:mb-3 tracking-tight">Kenapa Gabung Jadi Mitra?</h2>
            <p className="text-ink-muted text-[15px] sm:text-base max-w-md mx-auto">
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
                  <p className="text-[13px] sm:text-sm text-ink-muted leading-relaxed">{b.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Dispatcher vs Reguler */}
      <section className="px-4 sm:px-6 py-12 sm:py-20 bg-[#FAFAFA]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-7 sm:mb-12">
            <h2 className="font-display font-bold text-2xl sm:text-3xl mb-2 sm:mb-3 tracking-tight">
              Perbedaan Mitra Dispatcher dan Mitra Reguler
            </h2>
            <p className="text-ink-muted text-[15px] sm:text-base max-w-md mx-auto">
              Dua jalur buat jadi mitra Sejasa — pilih yang paling cocok sama kamu.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 items-start">
            {/* Dispatcher — ditonjolkan */}
            <div
              className="relative rounded-card p-5 sm:p-7 bg-white border-2 shadow-xl"
              style={{ borderColor: "#E6007E" }}
            >
              <div
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 shadow-md"
                style={{ background: "linear-gradient(135deg, #F0169B, #A80057)" }}
              >
                <CalendarCheck size={22} className="text-white" />
              </div>
              <h3 className="font-display font-bold text-lg sm:text-xl mb-4 text-brand">
                Mitra Dispatcher
              </h3>
              <ul className="space-y-3.5">
                {DISPATCHER_POINTS.map((p) => (
                  <li key={p.title} className="flex gap-2.5">
                    <span
                      className="mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: "#E6007E" }}
                    >
                      <Check size={13} className="text-white" strokeWidth={3} />
                    </span>
                    <span>
                      <span className="block font-semibold text-sm sm:text-[15px] leading-snug">{p.title}</span>
                      <span className="block text-[13px] sm:text-sm text-ink-muted leading-relaxed mt-0.5">{p.desc}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Reguler — netral */}
            <div className="rounded-card p-5 sm:p-7 bg-white border border-gray-200">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 bg-gray-100">
                <Clock size={20} className="text-gray-400" />
              </div>
              <h3 className="font-display font-semibold text-lg sm:text-xl mb-4 text-gray-500">
                Mitra Reguler
              </h3>
              <ul className="space-y-3.5">
                {REGULAR_POINTS.map((point) => (
                  <li key={point} className="flex gap-2.5">
                    <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center bg-gray-200">
                      <Check size={13} className="text-gray-500" strokeWidth={3} />
                    </span>
                    <span className="text-[13px] sm:text-sm text-ink-muted leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Cara Bergabung */}
      <section className="px-4 sm:px-6 py-12 sm:py-20 bg-[#FAFAFA]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 sm:mb-14">
            <h2 className="font-display font-bold text-2xl sm:text-3xl mb-2 sm:mb-3 tracking-tight">Cara Bergabung</h2>
            <p className="text-ink-muted text-[15px] sm:text-base">4 langkah gampang buat mulai jadi mitra.</p>
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
                  <h3 className="font-display font-semibold text-sm sm:text-base mb-1 sm:mb-1.5">{s.title}</h3>
                  <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">{s.desc}</p>
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
            <p className="text-ink-muted text-[15px] sm:text-base">Pilih kategori yang paling sesuai sama skill kamu.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="card overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all duration-200">
              <PhotoPlaceholder
                src="/images/foto-massage.jpg"
                label="Foto mitra Massage"
                aspect="aspect-[4/3]"
                frame={false}
              />
              <div className="p-5 sm:p-6 border-t border-black/[0.04]">
                <span
                  className="text-sm sm:text-base font-bold text-white rounded-full px-3.5 py-1.5 shadow-sm"
                  style={{ background: "linear-gradient(135deg, #F0169B, #A80057)" }}
                >
                  Massage
                </span>
                <p className="text-[15px] sm:text-base text-ink-muted mt-3 sm:mt-3.5 leading-relaxed">
                  Layani pelanggan yang butuh jasa pijat profesional di rumah mereka.
                </p>
              </div>
            </div>
            <div className="card overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all duration-200">
              <PhotoPlaceholder
                src="/images/foto-cleaning.jpg"
                label="Foto mitra Daily Cleaning"
                aspect="aspect-[4/3]"
                frame={false}
              />
              <div className="p-5 sm:p-6 border-t border-black/[0.04]">
                <span
                  className="text-sm sm:text-base font-bold text-white rounded-full px-3.5 py-1.5 shadow-sm"
                  style={{ background: "linear-gradient(135deg, #0EA5A4, #0F766E)" }}
                >
                  Daily Cleaning
                </span>
                <p className="text-[15px] sm:text-base text-ink-muted mt-3 sm:mt-3.5 leading-relaxed">
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
            <p className="text-ink-muted text-[15px] sm:text-base max-w-md mx-auto">
              Kamu ga sendirian — banyak mitra lain yang siap saling bantu dan
              berbagi pengalaman.
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
        <p className="text-white/80 text-[15px] sm:text-base max-w-md mx-auto mb-7 sm:mb-9">
          Daftar sekarang, tim kami bakal hubungi kamu lewat WhatsApp atau telepon
          setelah lamaran kamu ditinjau.
        </p>
        <Link
          href="/apply"
          className="group inline-flex items-center gap-2.5 bg-white text-brand font-bold text-base sm:text-lg rounded-full px-8 sm:px-10 py-4 sm:py-5 transition shadow-2xl hover:bg-gray-50 hover:scale-[1.03] active:scale-[0.98]"
        >
          Daftar Jadi Mitra
          <ArrowRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </section>
    </main>
  );
}
