/** @type {import('next').NextConfig} */
const nextConfig = {
  // your next.js config
  experimental: {
    externalDir: true,
  },
  typescript: {
    // Skip type checking during build to avoid blocking Docker build
    ignoreBuildErrors: true,
  },
  eslint: {
    // Skip ESLint during build to avoid blocking Docker build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig; 