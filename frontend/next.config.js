/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Optimize for Docker builds
  output: 'standalone',
  typescript: {
    // Note: This allows production builds to complete even with type errors
    // Remove this if you want strict type checking
    ignoreBuildErrors: false,
  },
  eslint: {
    // Note: This allows production builds to complete even with ESLint errors
    // Remove this if you want strict linting
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
      },
    ],
  },
};

module.exports = nextConfig;
