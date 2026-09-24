import type { NextConfig } from "next";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

const nextConfig: NextConfig = {
  basePath: "/tbgs-approval",
  assetPrefix: "/tbgs-approval",
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
      {
        source: "/api/v1/:path*",
        destination: `${BACKEND_URL}/api/v1/:path*`,
      },
    ];
  },
  reactStrictMode: true,
  output: "standalone",
};

export default nextConfig;
