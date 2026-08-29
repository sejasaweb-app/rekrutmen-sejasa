import Image from "next/image";

/**
 * Logo Sejasa — dipakai di landing page, form apply, admin login, dan sidebar admin.
 * size: ukuran container dalam px (default 44)
 */
export default function Logo({ size = 44, rounded = "rounded-xl" }) {
  return (
    <div
      className={`${rounded} overflow-hidden shrink-0 bg-white`}
      style={{ width: size, height: size }}
    >
      <Image
        src="/logo.png"
        alt="Sejasa"
        width={size}
        height={size}
        className="w-full h-full object-contain"
        priority
      />
    </div>
  );
}
