"use client";

import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { useState } from "react";

/**
 * Placeholder foto — otomatis pakai foto asli kalau file-nya udah ada di public/images/,
 * kalau belum ada, tampilin placeholder yang tetep enak dilihat (bukan broken image icon).
 *
 * Foto asli dibungkus frame premium: shadow berlapis biar kesan "ngambang",
 * sheen tipis di atas, watermark "sejasa.com" model frosted-glass pill di
 * pojok kanan bawah (bukan kotak putih polos), dan efek zoom halus pas di-hover.
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
      className={`group relative w-full ${aspect} ${rounded} overflow-hidden ${
        failed
          ? "border-2 border-dashed border-brand/25 bg-gradient-to-br from-brand-light to-gray-50"
          : "ring-1 ring-black/[0.06] shadow-[0_2px_6px_rgba(16,24,40,0.06),0_12px_28px_-8px_rgba(16,24,40,0.18)]"
      }`}
    >
      {!failed && (
        <>
          <Image
            src={src}
            alt={label}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.045]"
            onError={() => setFailed(true)}
          />

          {/* Sheen tipis di atas biar foto ga keliatan flat */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.14] via-transparent to-transparent" />

          {watermark && (
            <>
              {/* Gradient lembut buat depth + jaga kontras watermark */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[34%] bg-gradient-to-t from-black/35 to-transparent" />

              {/* Watermark: frosted-glass pill, bukan solid putih */}
              <div className="pointer-events-none absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3.5 flex items-center gap-1.5 rounded-full pl-1.5 pr-2.5 py-1 bg-white/15 backdrop-blur-md ring-1 ring-white/25 shadow-sm">
                <Image
                  src="/logo.png"
                  alt="Sejasa"
                  width={16}
                  height={16}
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 object-contain drop-shadow-sm"
                />
                <span className="text-white text-[11px] sm:text-xs font-bold tracking-tight [text-shadow:0_1px_2px_rgba(0,0,0,0.35)]">
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
