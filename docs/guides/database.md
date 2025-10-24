# Database Management Guide

This guide covers database operations, migrations, and maintenance for the Real Estate Development Tracker.

## Database Scripts Overview

The project includes several database management scripts, each serving a specific purpose:

| Script       | Command               | Purpose                                              | Drops Drizzle Schema? | Use When                           |
| ------------ | --------------------- | ---------------------------------------------------- | --------------------- | ---------------------------------- |
| **Generate** | `npm run db:generate` | Generate new migration files from schema changes     | No                    | After modifying schema files       |
| **Migrate**  | `npm run db:migrate`  | Apply pending migrations to database                 | No                    | Deploying schema changes           |
| **Seed**     | `npm run db:seed`     | Populate database with initial/test data             | No                    | Setting up new database or testing |
| **Reset**    | `npm run db:reset`    | Clear all data and re-seed (keeps migration history) | **No**                | Resetting data during development  |
| **Rebuild**  | `npm run db:rebuild`  | Complete database recreation from scratch            | **Yes**               | Migration issues or fresh start    |

## Common Workflows

### 1. Creating a New Migration

After modifying schema files in `apps/web/src/server/db/schema/`:

```bash
# Generate migration SQL files
npm run db:generate

# Review generated migration in apps/web/drizzle/
# Then apply to database
npm run db:migrate
```

### 2. Resetting Development Data

When you need fresh data but want to keep migration history intact:

```bash
npm run db:reset
```

This will:

- Drop all tables in the `public` schema
- Re-run migrations (which should already be marked as applied)
- Re-seed the database with initial data

### 3. Complete Database Rebuild

**⚠️ WARNING: This deletes ALL data and migration history!**

Use this when:

- Migrations are out of sync with the database
- You need to completely reset migration tracking
- Database schema is corrupted or inconsistent

```bash
npm run db:rebuild
```

This will:

1. Drop the `drizzle` migration tracking schema (CASCADE)
2. Drop all tables in the `public` schema (CASCADE)
3. Run ALL migrations from the beginning
4. Seed the database with initial data

## Script Details

### db:reset vs db:rebuild

**Key Difference:** `db:reset` preserves migration history, `db:rebuild` does not.

**db:reset** (Data-only reset):

```typescript
// Keeps: drizzle.__drizzle_migrations table
// Drops: All tables in public schema
// Result: Migrations are already "applied" in tracking
```

**db:rebuild** (Complete recreation):

```typescript
// Drops: drizzle schema AND public schema tables
// Result: Migrations run fresh from 0000_initial.sql onwards
```

### When to Use Which

| Scenario                                 | Use                      | Reason                      |
| ---------------------------------------- | ------------------------ | --------------------------- |
| Testing with fresh data                  | `db:reset`               | Fast, keeps migration state |
| Migration tracking corrupted             | `db:rebuild`             | Rebuilds from scratch       |
| New developer setup                      | `db:migrate` + `db:seed` | Clean initial setup         |
| Schema change deployed                   | `db:migrate`             | Apply new migrations only   |
| Drizzle showing "already applied" errors | `db:rebuild`             | Re-sync migration tracking  |

## Migration Best Practices

### Creating Safe Migrations

1. **Always use transactions** - Drizzle handles this automatically
2. **Test migrations** - Run on development database first
3. **Review generated SQL** - Check the `.sql` file in `drizzle/` folder
4. **Handle data migration** - Use custom SQL for data transformations

### Example: Adding a Column with Default Value

```typescript
// In schema file
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull().default("user"), // New column
})
```

Generated migration will include:

```sql
ALTER TABLE "users" ADD COLUMN "role" text DEFAULT 'user' NOT NULL;
```

### Example: Junction Table Migration (from Story 3.4)

```sql
-- Create table
CREATE TABLE "cost_documents" (
  "id" text PRIMARY KEY NOT NULL,
  "cost_id" text NOT NULL,
  "document_id" text NOT NULL
);

-- Add foreign keys
ALTER TABLE "cost_documents"
  ADD CONSTRAINT "cost_documents_cost_id_fk"
  FOREIGN KEY ("cost_id") REFERENCES "costs"("id")
  ON DELETE cascade;

-- Add unique constraint
CREATE UNIQUE INDEX "unique_cost_document_idx"
  ON "cost_documents" ("cost_id","document_id")
  WHERE deleted_at IS NULL;
```

## Troubleshooting

### "Migration already applied" error

**Cause:** Drizzle tracking table shows migration as applied, but tables don't exist.

**Solution:**

```bash
npm run db:rebuild
```

### Seeding fails with "relation does not exist"

**Cause:** Migrations didn't run or failed silently.

**Solution:**

```bash
# Check what migrations are applied
psql $NETLIFY_DATABASE_URL -c "SELECT * FROM drizzle.__drizzle_migrations ORDER BY created_at"

# If empty or wrong, rebuild
npm run db:rebuild
```

### Schema changes not appearing

**Cause:** Migration not generated or not applied.

**Solution:**

```bash
# 1. Generate migration from schema changes
npm run db:generate

# 2. Review the .sql file in drizzle/ folder

# 3. Apply migration
npm run db:migrate
```

## Database Connection

The project uses **Neon PostgreSQL** for all environments (development and production).

### Connection Details

- **Environment Variable:** `NETLIFY_DATABASE_URL`
- **Format:** `postgresql://user:pass@host.neon.tech/dbname?sslmode=require`
- **Driver:** `@neondatabase/serverless` with WebSocket support
- **ORM:** Drizzle ORM with Neon serverless adapter

### Accessing the Database

```bash
# Via psql
psql $NETLIFY_DATABASE_URL

# Via Drizzle Studio (web UI)
npx drizzle-kit studio
```

## Migration Files

Migration files are stored in `apps/web/drizzle/`:

```
drizzle/
├── 0000_initial_schema.sql
├── 0001_add_categories.sql
├── 0002_add_documents.sql
├── 0003_junction_tables_for_events.sql
├── 0004_document_entity_relationships.sql
└── meta/
    ├── _journal.json          # Migration history
    └── 0004_snapshot.json     # Schema snapshots
```

### Migration Naming Convention

Drizzle auto-generates names:

- `0000_adjective_noun.sql` - Sequential numbering
- Timestamp tracked in `_journal.json`

## Related Documentation

- [Local Development Setup](./local-development.md)
- [Deployment Guide](./deployment.md)
- [Testing Guide](./testing.md)
- [Architecture: Data Models](../architecture/data-models.md)

## Emergency Procedures

### Complete Database Wipe (Production)

**⚠️ EXTREME CAUTION - Only for disaster recovery!**

```bash
# 1. Backup first!
npm run db:backup

# 2. Confirm you're in the right environment
echo $NETLIFY_DATABASE_URL

# 3. Rebuild database
npm run db:rebuild

# 4. Restore from backup if needed
```

### Rollback a Migration

Drizzle doesn't support automatic rollbacks. Manual process:

1. Write reverse migration SQL manually
2. Execute against database
3. Update `drizzle.__drizzle_migrations` table
4. Or use `db:rebuild` to start fresh

## Summary

- Use `db:reset` for quick data refresh during development
- Use `db:rebuild` when migration tracking is corrupted
- Always review generated migration SQL before applying
- Test migrations on development database first
- Keep backups before major schema changes

---

**Last Updated:** 2025-10-24
**Related Stories:** Story 3.4 (Document-Entity Relationships)
