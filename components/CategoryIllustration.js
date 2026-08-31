import Image from "next/image";

const DOT_PATTERN = {
  backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
  backgroundSize: "20px 20px",
};

/**
 * Nampilin ilustrasi (PNG transparan) di atas background gradient brand +
 * tekstur dot, buat kartu kategori layanan. Beda dari PhotoPlaceholder:
 * ga ada watermark/color-grading karena ini ilustrasi, bukan foto mitra asli.
 */
export default function CategoryIllustration({ src, alt, from, to, aspect }) {
  return (
    <div
      className={`relative w-full ${aspect} overflow-hidden`}
      style={{ background: `linear-gradient(160deg, ${from}14, ${to}0A)` }}
    >
      <div className="absolute inset-0 opacity-[0.35]" style={{ ...DOT_PATTERN, color: from }} />
      <div
        className="absolute w-40 h-40 rounded-full blur-3xl opacity-25"
        style={{ background: from, top: "-10%", left: "-6%" }}
      />
      <div
        className="absolute w-32 h-32 rounded-full blur-3xl opacity-20"
        style={{ background: to, bottom: "-12%", right: "-4%" }}
      />
      <div className="absolute inset-x-0 bottom-0 h-[88%] sm:h-[90%]">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-contain object-bottom drop-shadow-[0_12px_20px_rgba(0,0,0,0.12)]"
        />
      </div>
    </div>
  );
}
