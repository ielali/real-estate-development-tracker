/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@realestate-portfolio/shared", "@realestate-portfolio/ui"],
  // Enable typed routes
  typedRoutes: true,
  // Enhanced logging in development
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  // Exclude @react-pdf/renderer from Server Component bundling
  // This allows it to work properly in Node.js runtime API routes
  // See: https://github.com/diegomura/react-pdf/issues/2460
  // Note: In Next.js 15, this was renamed from serverComponentsExternalPackages
  serverExternalPackages: ["@react-pdf/renderer", "@react-pdf/reconciler", "@react-pdf/primitives"],
  // Note: Environment variables are injected via build command in netlify.toml
  // This follows Netlify's recommended approach for embedding build-time variables
  // See: https://docs.netlify.com/build/frameworks/use-environment-variables-with-frameworks/
}

// Enable bundle analyzer when ANALYZE=true
// Using require for bundle analyzer config
// eslint-disable-next-line @typescript-eslint/no-var-requires
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
  openAnalyzer: true,
})

module.exports = withBundleAnalyzer(nextConfig)
