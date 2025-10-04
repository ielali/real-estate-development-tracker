# Test Database Setup

## Overview

Tests use a dedicated Neon PostgreSQL test database to ensure isolation from production data.

## Local Development

1. **Environment Variable**: Add the test database URL to your `.env` file:

   ```bash
   NEON_TEST_DATABASE_URL="postgresql://neondb_owner:npg_UcW7ZvSF1Gko@ep-purple-heart-aet8dac5-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
   ```

2. **Run Migrations** (first time only):

   ```bash
   NETLIFY_DATABASE_URL=$NEON_TEST_DATABASE_URL npx drizzle-kit push
   ```

3. **Run Tests**:
   ```bash
   bun run test:run
   ```

## GitHub Actions / CI

The test database URL is stored as a GitHub Actions secret:

- Secret name: `NEON_TEST_DATABASE_URL`
- The workflow automatically uses this secret when running tests

### Adding/Updating the Secret

1. Go to: `https://github.com/ielali/real-estate-development-tracker/settings/secrets/actions`
2. Click "New repository secret" or edit existing
3. Name: `NEON_TEST_DATABASE_URL`
4. Value: (the Neon test database connection string)
5. Click "Add secret" or "Update secret"

## Test Database Behavior

- **Isolation**: Each test file gets a fresh database connection
- **Cleanup**: Tests delete all data between runs (except categories)
- **Sequential**: Tests run sequentially to avoid race conditions
- **Same Schema**: Uses the same PostgreSQL schema as production

## Troubleshooting

### Tests fail with "tables already exist"

The test database has already been migrated. This is normal - tests will use the existing schema.

### Tests fail with "database not found"

Make sure `NEON_TEST_DATABASE_URL` is set in your `.env` file or GitHub Actions secrets.

### Slow test performance

First run may be slower due to initial connection setup. Subsequent runs should be faster.
