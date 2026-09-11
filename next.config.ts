import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
    NEXT_PUBLIC_APP_BUILD_ID: process.env.NEXT_PUBLIC_APP_BUILD_ID || "local-dev",
  },
  // Next 16.3+ reads this in base-server without a null guard; static export
  // can leave instantInsights undefined and crash on validationLevel.
  experimental: {
    instantInsights: {
      validationLevel: "manual-warning",
    },
  },
};

export default nextConfig;
