import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@react-email/tailwind"],
  rewrites: async () => {
    return process.env.NODE_ENV === 'development' ? [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ] : []
  },
  // Updated configuration for WebSocket support
  serverExternalPackages: ['ws'],
};

export default nextConfig;
