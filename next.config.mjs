/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: true,
  experimental: {
    // Remove webpack5 as it's no longer needed in Next.js 14
  },
  staticPageGenerationTimeout: 120,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production"
  }
}

export default nextConfig;
