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
};

export default nextConfig;
