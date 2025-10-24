/**
 * Get database URL based on environment
 * Single source of truth for database connection string resolution
 *
 * Environment Variables:
 * - NETLIFY_TEST_DATABASE_URL: Test database (NODE_ENV=test)
 * - NETLIFY_DATABASE_URL: Production database (NODE_ENV=production, auto-set by Netlify)
 * - NETLIFY_DATABASE_URL: Development database (local development)
 */
export function getDatabaseUrl(): string {
  const nodeEnv = process.env.NODE_ENV

  // Test environment: Use dedicated test database
  if (nodeEnv === "test") {
    const testUrl = process.env.NETLIFY_TEST_DATABASE_URL
    if (!testUrl) {
      throw new Error("Test database not configured. Set NETLIFY_TEST_DATABASE_URL in .env file")
    }
    return testUrl
  }

  // Production environment: Netlify auto-sets NETLIFY_DATABASE_URL
  if (nodeEnv === "production") {
    const prodUrl = process.env.NETLIFY_DATABASE_URL
    if (!prodUrl) {
      throw new Error(
        "Production database not configured. Ensure Netlify Neon integration is enabled"
      )
    }
    return prodUrl
  }

  // Development environment: Use NETLIFY_DATABASE_URL from .env
  const devUrl = process.env.NETLIFY_DATABASE_URL
  if (!devUrl) {
    throw new Error("Development database not configured. Set NETLIFY_DATABASE_URL in .env file")
  }
  return devUrl
}

/**
 * Get database environment label for logging
 */
export function getDatabaseEnvironment(): string {
  const url = getDatabaseUrl()

  if (url.includes("purple-heart")) return "TEST DATABASE"
  if (url.includes("shiny-meadow")) return "DEVELOPMENT DATABASE"
  return "PRODUCTION DATABASE"
}
