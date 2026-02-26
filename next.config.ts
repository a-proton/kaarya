import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://206.189.147.215/api/:path*",
      },
    ];
  },
};

export default nextConfig;
