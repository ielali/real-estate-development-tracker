# Database Environment Variables Strategy

## Overview

This project uses a **single source of truth** approach for database connections via the `getDatabaseUrl()` helper function. Database URLs are environment-specific to eliminate ambiguity and ensure correct database selection.

## Environment Variables

### Development (Local)

- **Variable**: `NEON_DATABASE_URL`
- **Purpose**: Development database for local testing
- **Set in**: `.env` file
- **Example**: `postgresql://user:pass@shiny-meadow-12345.neon.tech/dev?sslmode=require`

### Test (Vitest)

- **Variable**: `NEON_TEST_DATABASE_URL`
- **Purpose**: Dedicated test database to avoid polluting development data
- **Set in**: `.env` file
- **Example**: `postgresql://user:pass@purple-heart-67890.neon.tech/test?sslmode=require`

### Production (Netlify)

- **Variable**: `NETLIFY_DATABASE_URL`
- **Purpose**: Production database
- **Set by**: Netlify Neon integration (automatic)
- **No manual configuration needed**

## Implementation

### Core Helper Function

All database connections use [`src/server/db/get-database-url.ts`](../src/server/db/get-database-url.ts):

```typescript
export function getDatabaseUrl(): string {
  const nodeEnv = process.env.NODE_ENV

  // Test environment: Use dedicated test database
  if (nodeEnv === "test") {
    const testUrl = process.env.NEON_TEST_DATABASE_URL
    if (!testUrl) {
      throw new Error("Test database not configured. Set NEON_TEST_DATABASE_URL in .env file")
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

  // Development environment: Use NEON_DATABASE_URL from .env
  const devUrl = process.env.NEON_DATABASE_URL
  if (!devUrl) {
    throw new Error("Development database not configured. Set NEON_DATABASE_URL in .env file")
  }
  return devUrl
}
```

### Files Using getDatabaseUrl()

1. **[`src/server/db/index.ts`](../src/server/db/index.ts)** - Main database connection
2. **[`src/server/db/migrate.ts`](../src/server/db/migrate.ts)** - Migration runner
3. **[`src/server/db/backup.ts`](../src/server/db/backup.ts)** - Backup script
4. **[`src/test/test-db.ts`](../src/test/test-db.ts)** - Test database helper
5. **[`drizzle.config.ts`](../../drizzle.config.ts)** - Drizzle Kit configuration

## Setup Instructions

### 1. Local Development Setup

Create `.env` file in `apps/web/`:

```bash
# Development database
NEON_DATABASE_URL="postgresql://user:pass@your-dev-db.neon.tech/database?sslmode=require"

# Test database
NEON_TEST_DATABASE_URL="postgresql://user:pass@your-test-db.neon.tech/test-database?sslmode=require"
```

### 2. Run Migrations

```bash
# Development database
bun run db:migrate

# Test database
NODE_ENV=test bun run db:migrate
```

### 3. Run Tests

```bash
# Tests automatically use NEON_TEST_DATABASE_URL (NODE_ENV=test)
bun test

# Run specific test suite
bun test src/server/api/routers/__tests__/documents.test.ts
```

### 4. Production Deployment (Netlify)

1. Install Netlify Neon integration from [Netlify dashboard](https://app.netlify.com/integrations/neon)
2. Netlify automatically sets `NETLIFY_DATABASE_URL`
3. No manual configuration needed!

## Benefits of This Approach

### ✅ Single Source of Truth

- All database connections use `getDatabaseUrl()`
- Consistent logic across entire codebase
- Easy to debug and maintain

### ✅ Environment-Specific

- Clear separation between dev/test/production databases
- No accidental cross-environment data pollution
- Variable names explicitly indicate their purpose

### ✅ Fail-Fast Error Messages

- Clear error messages tell you exactly what's missing
- No ambiguous fallback chains
- Easy to troubleshoot configuration issues

### ✅ Netlify-Compatible

- Works seamlessly with Netlify's auto-configuration
- No manual production database setup required
- Follows Netlify's naming conventions

### ✅ Test Isolation

- Tests always use dedicated test database
- No risk of corrupting development data
- Vitest automatically sets `NODE_ENV=test`

## Troubleshooting

### Error: "Development database not configured"

**Solution**: Add `NEON_DATABASE_URL` to your `.env` file

```bash
NEON_DATABASE_URL="postgresql://user:pass@host.neon.tech/db?sslmode=require"
```

### Error: "Test database not configured"

**Solution**: Add `NEON_TEST_DATABASE_URL` to your `.env` file

```bash
NEON_TEST_DATABASE_URL="postgresql://user:pass@host.neon.tech/test-db?sslmode=require"
```

### Error: "Production database not configured"

**Solution**: Ensure Netlify Neon integration is installed and enabled in your Netlify dashboard

### Tests Are Using Wrong Database

**Check**: Verify `NODE_ENV=test` is set. Vitest should set this automatically via [`vitest.config.ts`](../vitest.config.ts):

```typescript
env: {
  NODE_ENV: "test",
  NEON_TEST_DATABASE_URL: process.env.NEON_TEST_DATABASE_URL,
  // ...
}
```

### Migration Script Using Wrong Database

**Check**: Migrations respect `NODE_ENV`:

- `bun run db:migrate` → Development database (`NEON_DATABASE_URL`)
- `NODE_ENV=test bun run db:migrate` → Test database (`NEON_TEST_DATABASE_URL`)
- In Netlify → Production database (`NETLIFY_DATABASE_URL`)

## Migration from DATABASE_URL

If you have existing code using `DATABASE_URL`, update to use `getDatabaseUrl()`:

```typescript
// Before ❌
const dbUrl = process.env.DATABASE_URL
if (!dbUrl) throw new Error("DATABASE_URL not set")

// After ✅
import { getDatabaseUrl } from "@/server/db/get-database-url"
const dbUrl = getDatabaseUrl()
```

## Additional Resources

- [Neon Documentation](https://neon.tech/docs)
- [Netlify Neon Integration](https://docs.netlify.com/integrations/neon/)
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Vitest Configuration](https://vitest.dev/config/)
