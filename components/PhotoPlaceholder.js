"use client";

import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { useState } from "react";

/**
 * Placeholder foto — otomatis pakai foto asli kalau file-nya udah ada di public/images/,
 * kalau belum ada, tampilin placeholder yang tetep enak dilihat (bukan broken image icon).
 */
export default function PhotoPlaceholder({ src, label, aspect, rounded = "rounded-card" }) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={`relative w-full ${aspect} ${rounded} overflow-hidden ${
        failed ? "border-2 border-dashed border-brand/25 bg-gradient-to-br from-brand-light to-gray-50" : ""
      }`}
    >
      {!failed && (
        <Image
          src={src}
          alt={label}
          fill
          className="object-cover"
          onError={() => setFailed(true)}
        />
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
