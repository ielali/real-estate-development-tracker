# Utility Scripts

This directory contains utility scripts for database management, testing, and other development tasks.

## Purpose

The `scripts/` folder keeps utility scripts organized and separate from the main application code. This prevents repository pollution and makes it easier to find and maintain development tools.

## Script Organization Guidelines

### DO:

- ✅ Place all utility scripts in `scripts/` folder
- ✅ Use descriptive names that indicate the script's purpose (e.g., `drop-all-tables.ts`, `check-tables.ts`)
- ✅ Add comments at the top of each script explaining what it does
- ✅ Document any dependencies or environment variables required
- ✅ Run scripts from the project root using: `bun scripts/<script-name>.ts`

### DON'T:

- ❌ Create utility scripts at the repository root level
- ❌ Create temporary test files outside of `__tests__` directories
- ❌ Leave debugging scripts uncommitted in the root
- ❌ Create one-off scripts without proper naming or documentation

## Running Scripts

All scripts should be run from the `apps/web` directory:

```bash
# From apps/web directory
bun scripts/<script-name>.ts

# Example
bun scripts/check-tables.ts
bun scripts/drop-all-tables.ts
```

## Current Utility Scripts

### Database Management

#### `check-tables.ts`

Verifies that all expected tables exist in the database.

```bash
bun scripts/check-tables.ts
```

#### `drop-all-tables.ts`

Drops all tables from both DEVELOPMENT and TEST databases, including the Drizzle migration tracking schema. **Use with caution!**

```bash
bun scripts/drop-all-tables.ts
```

#### `run-migrations-directly.ts` (Legacy)

Manually runs SQL migrations. This was created during debugging when standard migrations weren't working. **Prefer using `bun run db:migrate` instead.**

#### `run-all-migrations.ts` (Legacy)

Runs all migration files sequentially. This was created during debugging. **Prefer using `bun run db:migrate` instead.**

## Git Ignore Rules

The `.gitignore` file includes patterns to prevent accidental commits of temporary utility scripts at the root level:

```gitignore
# Temporary utility scripts at root level (should be in scripts/ folder)
/*-tables.ts
/*-migrations*.ts
/check-*.ts
/test-*.ts
/debug-*.ts
```

If you create a utility script at the root by mistake, move it to `scripts/` before committing:

```bash
mv your-script.ts scripts/
```

## Best Practices

1. **Document Your Scripts**: Add a comment block at the top of each script explaining:
   - What the script does
   - When to use it
   - Any prerequisites or warnings
   - Example usage

2. **Use Descriptive Names**: Script names should clearly indicate their purpose
   - Good: `check-tables.ts`, `seed-test-data.ts`, `cleanup-database.ts`
   - Bad: `script1.ts`, `test.ts`, `temp.ts`

3. **Handle Errors Gracefully**: Include try-catch blocks and meaningful error messages

4. **Use Environment Variables**: Follow the project's pattern of using `getDatabaseUrl()` for database connections

5. **Clean Up After Yourself**: Delete scripts that are no longer needed, or move them to a `legacy/` subdirectory with a README explaining why they're kept

## Adding New Scripts

When creating a new utility script:

1. Create the file in `scripts/` directory
2. Add a descriptive comment at the top
3. Test the script thoroughly
4. Update this README with a description of the script
5. Commit the script along with your changes

## Example Script Template

```typescript
/**
 * Script Name: do-something.ts
 *
 * Purpose: Brief description of what this script does
 *
 * Usage: bun scripts/do-something.ts
 *
 * Prerequisites:
 * - Environment variables must be set in .env
 * - Database must be accessible
 *
 * Warning: Any important warnings or cautions
 */

import { db } from "../src/server/db"
// ... rest of your script
```
