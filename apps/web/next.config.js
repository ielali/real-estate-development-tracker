/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@realestate-portfolio/shared", "@realestate-portfolio/ui"],
  experimental: {
    // Enable app directory
    typedRoutes: true,
  },
}

// Enable bundle analyzer when ANALYZE=true
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
  openAnalyzer: true,
})

module.exports = withBundleAnalyzer(nextConfig)
