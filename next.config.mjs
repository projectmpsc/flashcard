/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: true,
  staticPageGenerationTimeout: 120,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production"
  },
  // Add performance optimizations
  reactStrictMode: true,
  poweredByHeader: false
}

export default nextConfig;
