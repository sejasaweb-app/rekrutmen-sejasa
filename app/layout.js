import "./globals.css";
import { Plus_Jakarta_Sans, Sora } from "next/font/google";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
});

export const metadata = {
  title: "Dispatcher Sejasa — Daftar Jadi Mitra",
  description: "Formulir pendaftaran mitra Sejasa untuk kategori Massage & Daily Cleaning",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${jakarta.variable} ${sora.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
