"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import WhatsAppIcon from "./WhatsAppIcon";

const WHATSAPP_NUMBER = "6285117246897";
const DEFAULT_MESSAGE = "Halo, saya mau tanya soal pendaftaran Mitra Dispatcher Sejasa.";

export default function FloatingWhatsApp() {
  const pathname = usePathname();
  const [showBubble, setShowBubble] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowBubble(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  // Ga usah muncul di admin panel — ini buat calon mitra, bukan internal tim
  if (pathname?.startsWith("/admin")) return null;

  const link = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`;

  return (
    <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end gap-3">
      {showBubble && !dismissed && (
        <div className="relative max-w-[210px] bg-white rounded-2xl rounded-br-sm shadow-xl border border-gray-100 p-3.5">
          <button
            onClick={() => setDismissed(true)}
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition"
            aria-label="Tutup"
          >
            <X size={12} className="text-gray-600" />
          </button>
          <p className="text-sm text-ink leading-snug">
            Ada pertanyaan? Chat kami langsung di WhatsApp 👋
          </p>
        </div>
      )}

      <a
        href={link}
        target="_blank"
        rel="noreferrer"
        className="relative flex items-center justify-center w-14 h-14 rounded-full shadow-xl transition hover:scale-105"
        style={{ backgroundColor: "#25D366" }}
        aria-label="Chat WhatsApp"
      >
        <span
          className="absolute inline-flex h-full w-full rounded-full opacity-40 animate-ping"
          style={{ backgroundColor: "#25D366" }}
        />
        <WhatsAppIcon size={28} className="relative text-white" />
      </a>
    </div>
  );
}
