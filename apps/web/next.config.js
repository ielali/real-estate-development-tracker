/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@realestate-portfolio/shared", "@realestate-portfolio/ui"],
  // Enable typed routes
  typedRoutes: true,
}

// Enable bundle analyzer when ANALYZE=true
// Using require for bundle analyzer config
// eslint-disable-next-line @typescript-eslint/no-var-requires
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
  openAnalyzer: true,
})

module.exports = withBundleAnalyzer(nextConfig)
