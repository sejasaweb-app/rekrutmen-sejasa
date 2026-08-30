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
      className={`relative w-full ${aspect} ${rounded} overflow-hidden bg-gradient-to-br from-brand-light to-gray-100`}
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
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <ImageIcon size={28} className="text-brand/40" />
          <span className="text-xs text-ink-muted px-4 text-center">{label}</span>
        </div>
      )}
    </div>
  );
}
