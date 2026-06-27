import type { NextConfig } from "next";

const r2Hostname = process.env.R2_PUBLIC_URL
  ? new URL(process.env.R2_PUBLIC_URL).hostname
  : null;

const nextConfig: NextConfig = {
  // Prisma's WASM query engine must not be bundled by webpack: webpack converts
  // the .wasm import into a forbidden new WebAssembly.Module() call. Marking
  // these as external lets copyWorkerdPackages copy them as-is so wrangler
  // handles the .wasm as a static module binding (allowed in Workers).
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.discordapp.com" },
      // GCS (local dev fallback)
      { protocol: "https", hostname: "storage.googleapis.com" },
      // R2 (production) — only added when R2_PUBLIC_URL is set
      ...(r2Hostname ? [{ protocol: "https" as const, hostname: r2Hostname }] : []),
      { protocol: "https", hostname: "is1-ssl.mzstatic.com" },
      { protocol: "https", hostname: "is2-ssl.mzstatic.com" },
      { protocol: "https", hostname: "is3-ssl.mzstatic.com" },
      { protocol: "https", hostname: "is4-ssl.mzstatic.com" },
      { protocol: "https", hostname: "is5-ssl.mzstatic.com" },
      { protocol: "https", hostname: "yt3.googleusercontent.com" },
      { protocol: "https", hostname: "i.scdn.co" },
      { protocol: "https", hostname: "mosaic.scdn.co" },
    ],
  },
};

export default nextConfig;
