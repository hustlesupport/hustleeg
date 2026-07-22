import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // picsum.photos is used for seed/placeholder imagery only — swap for the
    // real asset host (CDN / S3 / Cloudinary) before going to production.
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    // Speeds up navigations by prefetching and caching more aggressively.
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
};

export default nextConfig;
