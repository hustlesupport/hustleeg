import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // picsum.photos is used for seed/placeholder imagery only — swap for the
    // real asset host (CDN / S3 / Cloudinary) before going to production.
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      { protocol: "https", hostname: "i.ibb.co" },
      { protocol: "https", hostname: "ibb.co" },
      // Product images uploaded via the admin panel land in Supabase Storage
      // (see src/lib/supabase-storage.ts) — public URLs are always
      // <project-ref>.supabase.co, so a subdomain wildcard survives a
      // project ref change without touching this file again.
      { protocol: "https", hostname: "**.supabase.co" },
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
  async headers() {
    // No Content-Security-Policy here yet — checkout embeds a Paymob iframe
    // and a CSP written without knowing Paymob's exact script/frame domains
    // would risk silently breaking payment. Add one deliberately, tested
    // against a real Paymob checkout, before launch.
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
