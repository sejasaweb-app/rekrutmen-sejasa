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
      },
      colors: {
        brand: {
          DEFAULT: "#E6007E", // primary magenta — sesuaikan ke hex asli logo Sejasa kalau sudah dicek
          dark: "#B8005F",
          light: "#FDE6F1",
        },
        ink: {
          DEFAULT: "#1A1A1A",
          muted: "#6B6B6B",
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
        card: "16px",
      },
    },
  },
  plugins: [],
};
