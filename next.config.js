/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Template PDF dibaca via fs.readFileSync dengan path yang dibangun dinamis
  // (lib/contractGenerator.js), jadi Next.js file tracing tidak otomatis
  // mendeteksinya. Tanpa ini, folder templates/ bisa ke-drop pas build
  // production/deploy ke Vercel dan generate kontrak akan gagal.
  outputFileTracingIncludes: {
    "/api/applicants/[id]/generate-contract": ["./templates/**"],
    "/api/contracts/[token]/sign": ["./templates/**"],
  },
};

module.exports = nextConfig;