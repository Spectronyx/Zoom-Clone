import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "localhost",
    "localhost:3000",
    "192.168.0.105",
    "192.168.0.105:3000",
    "192.168.1.107",
    "192.168.1.107:3000",
  ],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:8000/api/:path*",
      },
      {
        source: "/ws/:path*",
        destination: "http://127.0.0.1:8000/ws/:path*",
      },
    ];
  },
};

export default nextConfig;
