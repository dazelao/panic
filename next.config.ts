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