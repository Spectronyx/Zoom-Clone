import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.0.105",
    "192.168.0.105:3000",
    "localhost:3000",
  ],
};

export default nextConfig;
