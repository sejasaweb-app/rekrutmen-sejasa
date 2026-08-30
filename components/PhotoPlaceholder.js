"use client";

import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { useState } from "react";

/**
 * Placeholder foto — otomatis pakai foto asli kalau file-nya udah ada di public/images/,
 * kalau belum ada, tampilin placeholder yang tetep enak dilihat (bukan broken image icon).
 *
 * Foto asli dikasih:
 * - Frame putih tipis + shadow lembut, biar kesan "kartu foto" yang elegan (bisa dimatiin
 *   lewat prop `frame={false}` buat foto yang udah nempel di dalam .card lain, misal
 *   kategori layanan, biar ga dobel bingkai).
 * - Color grading halus (kontras & saturasi dinaikin dikit + tint brand tipis) biar semua
 *   foto — walau dari sumber/pencahayaan beda-beda — kerasa satu palet & nyatu.
 * - Watermark "sejasa.com" model logo+teks putih dengan drop-shadow, tanpa background
 *   kotak, di pojok kanan bawah.
 */
export default function PhotoPlaceholder({
  src,
  label,
  aspect,
  rounded = "rounded-card",
  watermark = true,
  frame = true,
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`relative w-full ${aspect} ${rounded} overflow-hidden border-2 border-dashed border-brand/25 bg-gradient-to-br from-brand-light to-gray-50`}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5">
          <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-sm">
            <ImageIcon size={18} className="text-brand" />
          </div>
          <span className="text-xs text-ink-muted px-4 text-center max-w-[180px]">{label}</span>
        </div>
      </div>
    );
  }

  const photo = (
    <div className={`group relative w-full h-full ${frame ? "rounded-[11px]" : rounded} overflow-hidden ${frame ? "ring-1 ring-black/[0.06]" : ""}`}>
      <Image
        src={src}
        alt={label}
        fill
        className="object-cover [filter:saturate(1.1)_contrast(1.05)] transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        onError={() => setFailed(true)}
      />
      {/* Tint brand tipis biar tonal-nya nyatu di semua foto */}
      <div className="pointer-events-none absolute inset-0 bg-brand/[0.05] mix-blend-multiply" />

      {watermark && (
        <>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[32%] bg-gradient-to-t from-black/40 to-transparent" />
          <div className="pointer-events-none absolute bottom-2 right-2.5 sm:bottom-2.5 sm:right-3 flex items-center gap-1.5 [filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.45))]">
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
    </div>
  );

  if (!frame) {
    return <div className={`relative w-full ${aspect} ${rounded} overflow-hidden`}>{photo}</div>;
  }

  return (
    <div
      className={`relative w-full ${aspect} ${rounded} bg-white p-[5px] sm:p-1.5 ring-1 ring-black/[0.04] shadow-[0_2px_8px_rgba(16,24,40,0.06),0_14px_28px_-12px_rgba(16,24,40,0.22)]`}
    >
      {photo}
    </div>
  );
}
