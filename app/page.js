import Link from "next/link";
import Logo from "@/components/Logo";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="mb-6">
        <Logo size={64} rounded="rounded-2xl" />
      </div>
      <h1 className="text-3xl font-bold mb-3">Jadi Mitra Dispatcher Sejasa</h1>
      <p className="text-ink-muted max-w-md mb-8">
        Bergabung sebagai mitra penyedia jasa Massage atau Daily Cleaning dan
        dapatkan pelanggan langsung dari Sejasa.
      </p>
      <Link href="/apply" className="btn-primary">
        Daftar Sekarang
      </Link>
    </main>
  );
}
