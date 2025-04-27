import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  poweredByHeader: false,
  reactStrictMode: false
};

export default nextConfig;
module.exports = {
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: "upgrade-insecure-requests" }
        ],
      },
    ]
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}