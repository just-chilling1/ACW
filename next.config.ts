import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the MaxMind country DB on disk (not bundled into a broken webpack chunk).
  serverExternalPackages: ["geoip-country"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, must-revalidate",
          },
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive, nosnippet",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
