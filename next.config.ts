import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  env: {
    // Build producción: inyectar URL API (no depender de .env que puede faltar).
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL ||
      (process.env.NODE_ENV === "production" ? "https://api.portpax.com" : "http://localhost:8000"),
  },
};

export default nextConfig;
