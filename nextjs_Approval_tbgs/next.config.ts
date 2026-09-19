import type { NextConfig } from "next";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/dashboard/:path*",
        destination: `${BACKEND_URL}/api/v1/dashboard/:path*`,
      },
      {
        source: "/api/approvals/:path*",
        destination: `${BACKEND_URL}/api/v1/approvals/:path*`,
      },
    ];
  },
};

export default nextConfig;