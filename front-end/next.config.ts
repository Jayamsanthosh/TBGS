// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   experimental: {
//     turbopackFileSystemCacheForDev: false,
//   },
// };

// export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: process.env.BASE_PATH || "",
  experimental: {
    turbopackFileSystemCacheForDev: false,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.BACKEND_URL || "http://192.168.1.15:92"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;