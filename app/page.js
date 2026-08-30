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
} from "lucide-react";
import Logo from "@/components/Logo";
import PhotoPlaceholder from "@/components/PhotoPlaceholder";

const BENEFITS = [
  {
    icon: Users,
    title: "Pelanggan Langsung dari Sejasa",
    desc: "Ga perlu cari pelanggan sendiri — kami yang salurkan orderan ke kamu.",
  },
  {
    icon: Clock,
    title: "Atur Jadwal Sendiri",
    desc: "Kerja fleksibel, kamu yang tentukan kapan mau aktif terima orderan.",
  },
  {
    icon: Wallet,
    title: "Penghasilan Tambahan",
    desc: "Potensi income harian dari tiap orderan yang kamu selesaikan.",
  },
  {
    icon: ShieldCheck,
    title: "Pembayaran Aman & Tepat Waktu",
    desc: "Sistem pembayaran jelas, ga perlu was-was soal transaksi.",
  },
  {
    icon: Headphones,
    title: "Didukung Tim Sejasa",
    desc: "Ada tim yang siap bantu kalau kamu butuh dukungan di lapangan.",
  },
  {
    icon: Zap,
    title: "Proses Daftar Cepat",
    desc: "Isi form, verifikasi, langsung bisa mulai — ga ribet.",
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
    <main className="min-h-screen">
      {/* Hero */}
      <section className="px-6 pt-14 pb-16 text-center">
        <div className="flex justify-center mb-6">
          <Logo size={56} rounded="rounded-2xl" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-4 max-w-xl mx-auto leading-tight">
          Jadi Mitra Dispatcher Sejasa
        </h1>
        <p className="text-ink-muted max-w-lg mx-auto mb-8">
          Bergabung sebagai mitra penyedia jasa Massage atau Daily Cleaning dan
          dapatkan pelanggan langsung dari Sejasa — atur jadwal sendiri, mulai
          dari sekarang.
        </p>
        <Link href="/apply" className="btn-primary inline-block">
          Daftar Jadi Mitra
        </Link>

        {/* Hero image — cocok banget diisi foto gathering/kumpul bareng mitra, kesan hangat & komunitas */}
        <div className="max-w-3xl mx-auto mt-12">
          <PhotoPlaceholder
            src="/images/foto-hero.jpg"
            label="Foto hero — misal foto gathering bareng mitra"
            aspect="aspect-[16/7]"
          />
        </div>
      </section>

      {/* Benefits */}
      <section className="px-6 py-16 bg-[#FAFAFA]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">Kenapa Gabung Jadi Mitra?</h2>
          <p className="text-ink-muted text-center mb-10 max-w-md mx-auto">
            Beberapa keuntungan yang kamu dapat sebagai mitra Dispatcher Sejasa.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {BENEFITS.map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.title} className="card p-6">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center mb-4"
                    style={{ backgroundColor: "#E6007E1A" }}
                  >
                    <Icon size={20} style={{ color: "#E6007E" }} />
                  </div>
                  <h3 className="font-semibold mb-1.5">{b.title}</h3>
                  <p className="text-sm text-ink-muted">{b.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Cara Bergabung */}
      <section className="px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">Cara Bergabung</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="text-center">
                  <div className="relative inline-flex mb-4">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-white"
                      style={{ backgroundColor: "#E6007E" }}
                    >
                      <Icon size={24} />
                    </div>
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-ink text-white text-[11px] font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{s.title}</h3>
                  <p className="text-xs text-ink-muted">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Kategori layanan dengan foto */}
      <section className="px-6 py-16 bg-[#FAFAFA]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">Kategori Layanan</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="card overflow-hidden">
              {/* Ganti foto-massage.jpg di public/images/ pakai foto mitra Massage asli */}
              <PhotoPlaceholder
                src="/images/foto-massage.jpg"
                label="Foto mitra Massage"
                aspect="aspect-[4/3]"
                rounded=""
              />
              <div className="p-5">
                <h3 className="font-semibold mb-1">Massage</h3>
                <p className="text-sm text-ink-muted">
                  Layani pelanggan yang butuh jasa pijat profesional di rumah mereka.
                </p>
              </div>
            </div>
            <div className="card overflow-hidden">
              {/* Ganti foto-cleaning.jpg di public/images/ pakai foto mitra Daily Cleaning asli */}
              <PhotoPlaceholder
                src="/images/foto-cleaning.jpg"
                label="Foto mitra Daily Cleaning"
                aspect="aspect-[4/3]"
                rounded=""
              />
              <div className="p-5">
                <h3 className="font-semibold mb-1">Daily Cleaning</h3>
                <p className="text-sm text-ink-muted">
                  Bantu pelanggan bersihkan rumah mereka secara rutin maupun sekali datang.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Komunitas — foto gathering/kumpul bareng mitra, bukti sosial sebelum orang daftar */}
      <section className="px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">Komunitas Mitra Sejasa</h2>
          <p className="text-ink-muted text-center mb-10 max-w-md mx-auto">
            Kamu ga sendirian — jadi bagian dari komunitas mitra yang saling
            support satu sama lain.
          </p>
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

      {/* CTA penutup */}
      <section className="px-6 py-16 text-center">
        <h2 className="text-2xl font-bold mb-3">Siap Gabung Jadi Mitra?</h2>
        <p className="text-ink-muted max-w-md mx-auto mb-8">
          Daftar sekarang, tim kami bakal hubungi kamu lewat WhatsApp atau telepon
          setelah lamaran kamu ditinjau.
        </p>
        <Link href="/apply" className="btn-primary inline-block">
          Daftar Jadi Mitra
        </Link>
      </section>
    </main>
  );
}
