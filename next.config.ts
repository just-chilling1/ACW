import type { NextConfig } from "next";

const nextConfig: NextConfig = {
<<<<<<< HEAD
  // A stray package-lock.json in the home directory makes Turbopack infer the
  // wrong workspace root, which breaks module resolution and route matching.
  turbopack: {
    root: process.cwd(),
  },
=======
>>>>>>> parent of c68e7de (midifications)
  // Keep the MaxMind country DB on disk (not bundled into a broken webpack chunk).
  serverExternalPackages: ["geoip-country"],
  async headers() {
    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
    ];

    return [
      {
        source: "/embed/:path*",
        headers: [
          ...securityHeaders,
          { key: "Cache-Control", value: "no-store, must-revalidate" },
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, nosnippet" },
        ],
      },
      {
        source: "/((?!embed).*)",
        headers: [
          ...securityHeaders,
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Cache-Control", value: "no-store, must-revalidate" },
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, nosnippet" },
        ],
      },
    ];
  },
};

export default nextConfig;
