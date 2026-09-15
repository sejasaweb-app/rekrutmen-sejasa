/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          DEFAULT: "#E6007E", // primary magenta — sesuaikan ke hex asli logo Sejasa kalau sudah dicek
          dark: "#B8005F",
          light: "#FDE6F1",
        },
        ink: {
          DEFAULT: "#1C1917",
          muted: "#78716C",
        },
        // Override abu-abu default Tailwind (cool gray) jadi warm neutral
        // (skala mirip "stone") — biar berpadu lebih natural sama brand
        // magenta, bukan abu-abu biru generik bawaan template. Ini otomatis
        // kepakai ke SEMUA className gray-* yang udah ada di seluruh app,
        // gak perlu ganti satu-satu.
        gray: {
          50: "#FAFAF9",
          100: "#F2F1EF",
          200: "#E7E4E1",
          300: "#D3CFCB",
          400: "#A39D97",
          500: "#78716C",
          600: "#57534E",
          700: "#44403C",
          800: "#292524",
          900: "#1C1917",
        },
        status: {
          submitted: "#94A3B8",
          screening: "#3B82F6",
          interview: "#F59E0B",
          trial: "#8B5CF6",
          approved: "#16A34A",
          rejected: "#DC2626",
        },
      },
      borderRadius: {
        card: "14px",
        control: "10px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(28, 25, 23, 0.04), 0 6px 16px -6px rgba(28, 25, 23, 0.08)",
        "card-lg": "0 4px 10px rgba(28, 25, 23, 0.05), 0 16px 32px -12px rgba(28, 25, 23, 0.14)",
      },
    },
  },
  plugins: [],
};
