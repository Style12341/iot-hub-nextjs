import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',  // Set the limit to 10MB
    },
  },
};


export default nextConfig;
