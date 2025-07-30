import type { NextConfig } from "next";

module.exports = {
  transpilePackages: ["@react-email/tailwind"],
  rewrites: async () => {
    return process.env.NODE_ENV === 'development' ? [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ] : []
  },
  // For WebSocket support in Vercel
  experimental: {
    serverComponentsExternalPackages: ['ws'],
  },
}

export default nextConfig;
