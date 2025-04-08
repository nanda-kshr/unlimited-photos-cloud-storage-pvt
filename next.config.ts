import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack(config) {
    config.resolve.fallback = {
      fs: false,
    };
    
    return config;
  },
  images: {
    domains: ['api.telegram.org'],
  },
};

export default nextConfig;
