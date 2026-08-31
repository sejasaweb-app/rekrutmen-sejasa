"use client";

import { Sparkles } from "lucide-react";

const DOT_PATTERN = {
  backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
  backgroundSize: "20px 20px",
};

/**
 * Visual pengganti foto buat kartu kategori layanan — icon besar dengan badge
 * gradient brand, tekstur dot tipis, dan blob blur di belakang biar berlapis
 * (bukan cuma icon polos di kotak warna).
 */
export default function CategoryVisual({ icon: Icon, from, to, aspect }) {
  return (
    <div
      className={`relative w-full ${aspect} overflow-hidden flex items-center justify-center`}
      style={{ background: `linear-gradient(160deg, ${from}14, ${to}0A)` }}
    >
      <div className="absolute inset-0 opacity-[0.35]" style={{ ...DOT_PATTERN, color: from }} />
      <div
        className="absolute w-40 h-40 rounded-full blur-3xl opacity-30"
        style={{ background: from, top: "-12%", left: "-8%" }}
      />
      <div
        className="absolute w-32 h-32 rounded-full blur-3xl opacity-20"
        style={{ background: to, bottom: "-16%", right: "-6%" }}
      />

      <div className="relative">
        <div
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-[26px] flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${from}, ${to})`,
            boxShadow: `0 18px 32px -14px ${from}70`,
          }}
        >
          <Icon size={38} className="text-white" strokeWidth={1.6} />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md ring-1 ring-black/5">
          <Sparkles size={14} style={{ color: from }} />
        </div>
      </div>
    </div>
  );
}
