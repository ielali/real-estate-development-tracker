/**
 * Blob Store Service
 *
 * Centralized blob store configuration for Netlify Blobs.
 * Provides environment-aware store selection for different contexts.
 *
 * Environment Detection:
 * - Uses build-time injected NEXT_PUBLIC_* variables for reliability
 * - These are set via netlify.toml build commands
 * - Available at runtime in serverless functions
 *
 * Storage Strategy:
 * - Production: Global store with strong consistency
 * - Deploy Previews: Deploy-specific store (isolated per preview)
 * - Branch Deploys: Deploy-specific store (isolated per branch)
 * - Local Development: Local store with fallback configuration
 * - Tests: Mocked store with test credentials
 */

import { getStore, getDeployStore } from "@netlify/blobs"

/**
 * Get environment-appropriate blob store
 *
 * Detects environment using build-time injected variables and returns
 * the appropriate Netlify Blobs store instance.
 *
 * @param storeName - Name of the store (e.g., "documents", "reports")
 * @param options - Optional configuration
 * @returns Blob store instance
 *
 * @example
 * ```typescript
 * const store = getBlobStore("documents")
 * await store.set(key, data, { metadata })
 * ```
 */
export function getBlobStore(
  storeName: string,
  options?: {
    /** Force test mode (overrides environment detection) */
    isTest?: boolean
    /** Fallback site ID for local development */
    localSiteId?: string
  }
) {
  const isTest = options?.isTest ?? process.env.NODE_ENV === "test"

  // Use build-time injected environment variables for reliable detection
  // NEXT_PUBLIC_IS_NETLIFY and NEXT_PUBLIC_NETLIFY_CONTEXT are captured at build time
  // and available at runtime in serverless functions
  const isNetlify = process.env.NEXT_PUBLIC_IS_NETLIFY === "true"
  const context = process.env.NEXT_PUBLIC_NETLIFY_CONTEXT || ""
  const isProduction = context === "production"

  // Test environment: Use mocked store
  if (isTest) {
    return getStore({
      name: storeName,
      consistency: "strong",
      siteID: "test-site-id",
      token: "test-token",
    })
  }

  // Netlify environments (production, deploy-preview, branch-deploy)
  if (isNetlify) {
    if (isProduction) {
      // Production: Use global store with strong consistency
      return getStore({ name: storeName, consistency: "strong" })
    }
    // Deploy previews and branch deploys: Use deploy-specific store (isolated)
    return getDeployStore(storeName)
  }

  // Local development: Use getStore with explicit configuration
  // This works locally without requiring Netlify environment variables
  return getStore({
    name: storeName,
    consistency: "strong",
    siteID: options?.localSiteId ?? process.env.NETLIFY_SITE_ID ?? "local-dev-site",
  })
}

/**
 * Log blob store environment detection details
 *
 * Useful for debugging blob store issues in different environments.
 *
 * @param storeName - Name of the store being accessed
 */
export function logBlobStoreEnvironment(storeName: string): void {
  const isTest = process.env.NODE_ENV === "test"
  const isNetlify = process.env.NEXT_PUBLIC_IS_NETLIFY === "true"
  const context = process.env.NEXT_PUBLIC_NETLIFY_CONTEXT || ""
  const isProduction = context === "production"

  console.log(`📦 Blob Store [${storeName}] environment:`, {
    NEXT_PUBLIC_IS_NETLIFY: process.env.NEXT_PUBLIC_IS_NETLIFY,
    NEXT_PUBLIC_NETLIFY_CONTEXT: process.env.NEXT_PUBLIC_NETLIFY_CONTEXT,
    NODE_ENV: process.env.NODE_ENV,
    isNetlify,
    isProduction,
    isTest,
    storeType: isTest
      ? "TEST (mocked)"
      : isNetlify
        ? isProduction
          ? "PRODUCTION (global)"
          : "DEPLOY-SPECIFIC (isolated)"
        : "LOCAL (development)",
  })
}
