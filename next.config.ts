import type { NextConfig } from "next";

// MIFA روی Cloudflare Pages به‌صورت خروجی استاتیک دیپلوی می‌شود؛
// همه داده‌ها سمت کلاینت (IndexedDB) نگه‌داری می‌شوند.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  devIndicators: false,
};

export default nextConfig;
