"use client";

import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { useState } from "react";

/**
 * Placeholder foto — otomatis pakai foto asli kalau file-nya udah ada di public/images/,
 * kalau belum ada, tampilin placeholder yang tetep enak dilihat (bukan broken image icon).
 *
 * Foto asli dikasih frame tipis + watermark "sejasa.com" pojok kanan bawah,
 * biar keliatan proper dan konsisten di semua ukuran layar.
 */
export default function PhotoPlaceholder({
  src,
  label,
  aspect,
  rounded = "rounded-card",
  watermark = true,
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={`relative w-full ${aspect} ${rounded} overflow-hidden ${
        failed
          ? "border-2 border-dashed border-brand/25 bg-gradient-to-br from-brand-light to-gray-50"
          : "ring-1 ring-inset ring-black/10"
      }`}
    >
      {!failed && (
        <>
          <Image
            src={src}
            alt={label}
            fill
            className="object-cover"
            onError={() => setFailed(true)}
          />
          {watermark && (
            <>
              {/* Gradient halus biar watermark tetep kebaca di foto terang maupun gelap */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[38%] bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
              <div className="pointer-events-none absolute bottom-2 right-2.5 sm:bottom-3 sm:right-3.5 flex items-center gap-1 sm:gap-1.5 [filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.45))]">
                <Image
                  src="/logo-white.png"
                  alt="Sejasa"
                  width={18}
                  height={18}
                  className="w-3.5 h-3.5 sm:w-[18px] sm:h-[18px] object-contain"
                />
                <span className="text-white text-[11px] sm:text-xs font-bold tracking-tight">
                  sejasa.com
                </span>
              </div>
            </>
          )}
        </>
      )}
      {failed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5">
          <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-sm">
            <ImageIcon size={18} className="text-brand" />
          </div>
          <span className="text-xs text-ink-muted px-4 text-center max-w-[180px]">{label}</span>
        </div>
      )}
    </div>
  );
}
