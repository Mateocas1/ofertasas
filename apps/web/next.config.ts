import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@ofertasas/vtex-client", "@ofertasas/db"],
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.carrefour.com.ar" },
      { protocol: "https", hostname: "**.jumbo.com.ar" },
      { protocol: "https", hostname: "**.disco.com.ar" },
    ],
  },
};
export default nextConfig;