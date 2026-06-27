import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "kudago.com",
      },
      {
        protocol: "https",
        hostname: "*.kudago.com",
      },
    ],
  },
};

export default nextConfig;

