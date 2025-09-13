/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@realestate-portfolio/shared", "@realestate-portfolio/ui"],
  experimental: {
    // Enable app directory
    typedRoutes: true,
  },
}

module.exports = nextConfig
