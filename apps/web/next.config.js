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
  // Inject build-time environment variables for runtime access
  // DEPLOY_PRIME_URL is available at build time in Netlify and contains the actual deployment URL
  // (e.g., https://deploy-preview-123--site.netlify.app for previews)
  env: {
    NEXT_PUBLIC_SITE_URL:
      process.env.DEPLOY_PRIME_URL || process.env.URL || "http://localhost:3000",
    // Inject Netlify environment flags for runtime detection
    // These are captured at build time and made available at runtime
    NEXT_PUBLIC_IS_NETLIFY: process.env.NETLIFY || "false",
    NEXT_PUBLIC_NETLIFY_CONTEXT: process.env.CONTEXT || "",
  },
}

// Enable bundle analyzer when ANALYZE=true
// Using require for bundle analyzer config
// eslint-disable-next-line @typescript-eslint/no-var-requires
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
  openAnalyzer: true,
})

module.exports = withBundleAnalyzer(nextConfig)
