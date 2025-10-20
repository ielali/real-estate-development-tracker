# ADR-001: Choose Neon PostgreSQL Over SQLite

**Status:** Accepted
**Date:** 2025-10-20
**Decision Makers:** Winston (Architect)
**Related Documents:**

- [Tech Stack](../architecture/tech-stack.md)
- [High-Level Architecture](../architecture/high-level-architecture.md)
- [Deployment Architecture](../architecture/deployment-architecture.md)

---

## Context

The Real Estate Development Tracker requires a database solution that balances:

- Rapid development and deployment
- Mobile-first performance
- Partner transparency features
- Data integrity and relationships
- Scalability for multi-project use cases

Initial architecture documentation proposed **SQLite** for its simplicity and portability. However, during implementation, the decision was made to use **Neon PostgreSQL** instead.

This ADR documents the rationale for choosing Neon PostgreSQL as the primary database platform.

---

## Decision

**We will use Neon PostgreSQL (serverless PostgreSQL) as the database platform for all environments (development, preview, and production).**

---

## Rationale

### Primary Drivers

#### 1. **Referential Integrity Requirements**

The application has complex many-to-many relationships:

- Events ↔ Contacts (EventContact junction table)
- Events ↔ Documents (EventDocument junction table)
- Events ↔ Costs (EventCost junction table)
- Costs ↔ Documents (CostDocument junction table)
- Projects ↔ Contacts (ProjectContact junction table)
- Users ↔ Projects (ProjectAccess junction table)

**PostgreSQL Advantage:**

```sql
-- Full foreign key constraint support with cascading deletes
CREATE TABLE event_contacts (
  event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
  contact_id TEXT REFERENCES contacts(id) ON DELETE CASCADE,
  UNIQUE(event_id, contact_id) WHERE deleted_at IS NULL
);
```

**SQLite Limitation:**

- Foreign keys must be explicitly enabled
- Less robust constraint checking
- Limited support for complex constraints

**Impact:** Junction table pattern (required for data integrity) is significantly better supported in PostgreSQL.

---

#### 2. **Concurrent Write Performance**

**SQLite Limitation:**

- Single writer at a time
- Write locks entire database
- Partner dashboards + developer cost entry = write contention

**PostgreSQL (Neon) Advantage:**

- Multiple concurrent writers
- Row-level locking
- MVCC (Multi-Version Concurrency Control)

**Use Case Impact:**

```
Scenario: Developer adding costs while partner views dashboard
SQLite: Dashboard queries blocked during cost insertion
Neon PostgreSQL: Both operations proceed simultaneously
```

**Real-World Example:**

- Developer enters 5 costs in 30 seconds (PRD requirement)
- Partner refreshes dashboard mid-entry
- SQLite: Dashboard load waits for cost inserts to complete
- Neon: Dashboard loads immediately with latest data

---

#### 3. **Serverless Architecture Alignment**

**Netlify Deployment:**

- Serverless functions (stateless)
- Multiple concurrent function invocations
- No persistent local storage

**SQLite Challenge:**

- Requires file system access
- Must be bundled with deployment
- Difficult to share state across serverless functions
- Requires Litestream for replication (additional complexity)

**Neon PostgreSQL Advantage:**

- Serverless-native (WebSocket connections)
- Centralized database accessible from all functions
- Auto-scaling compute and storage
- Built-in connection pooling
- Zero configuration on Netlify (via `NETLIFY_DATABASE_URL`)

---

#### 4. **Development Environment Consistency**

**With SQLite:**

- Local SQLite file per developer
- Different data in local vs production
- Difficult to share test data
- Manual backup/restore for collaboration

**With Neon PostgreSQL:**

- Each developer can have own Neon database instance (free tier)
- Easy to clone production data for debugging
- Database branching for feature development
- Preview deploys get isolated database branches

**Developer Experience:**

```bash
# SQLite approach (manual)
git clone repo
touch data.db
npm run migrate
npm run seed # Manual test data

# Neon approach (automatic)
git clone repo
# Netlify creates preview deploy with database branch automatically
# Database already has schema via automated migrations
```

---

#### 5. **Query Performance & Optimization**

**PostgreSQL Advantages:**

- Advanced query planner with cost-based optimization
- Partial indexes: `CREATE INDEX ... WHERE deleted_at IS NULL`
- Expression indexes for complex queries
- GIN/GiST indexes for JSONB and full-text search
- `EXPLAIN ANALYZE` with detailed query plans

**SQLite Limitations:**

- Simpler query planner
- Limited index types
- No partial indexes in older versions
- Less sophisticated optimization

**Performance Impact:**

```sql
-- Find all events for a contact (1000 events, 5 contacts each)

-- With junction table + PostgreSQL indexes
SELECT e.* FROM events e
JOIN event_contacts ec ON e.id = ec.event_id
WHERE ec.contact_id = $1 AND ec.deleted_at IS NULL;
-- PostgreSQL: ~50ms (index scan)
-- SQLite: ~200ms (full table scan more likely)
```

---

#### 6. **Data Type Support**

**PostgreSQL:**

- ✅ Native JSONB type (binary JSON with indexing)
- ✅ Array types with GIN indexes
- ✅ UUID type (better than TEXT)
- ✅ Rich date/time types with timezone support
- ✅ Custom types and enums

**SQLite:**

- ❌ JSON stored as text (no binary format)
- ❌ No array types
- ❌ UUIDs must be stored as TEXT or BLOB
- ❌ Limited date/time functions
- ❌ No enums (must use CHECK constraints)

**Use Case: Audit Logs**

```typescript
// PostgreSQL JSONB (efficient)
metadata JSONB -- Native indexing, querying

// SQLite (less efficient)
metadata TEXT -- JSON.parse() in application
```

---

#### 7. **Netlify Integration**

**Neon + Netlify:**

- ✅ Official integration
- ✅ Automatic `NETLIFY_DATABASE_URL` environment variable
- ✅ Database branching per deploy preview
- ✅ Zero configuration

**SQLite + Netlify:**

- ❌ Must use Turso (additional service)
- ❌ Manual configuration
- ❌ Additional costs for hosted SQLite
- ❌ More complex setup

**Simplicity Factor:** Neon is **first-class** on Netlify, SQLite is not.

---

### Cost Analysis

| Tier                 | Neon PostgreSQL            | SQLite (Turso)             |
| -------------------- | -------------------------- | -------------------------- |
| **Free Tier**        | 0.5GB storage, 1 branch    | 500MB storage, 3 databases |
| **Development**      | $0 (free tier sufficient)  | $0 (free tier sufficient)  |
| **Production (MVP)** | $19/month (Pro plan)       | $29/month (Starter plan)   |
| **Scaling**          | Auto-scale compute/storage | Fixed tiers                |

**Verdict:** Neon is more cost-effective and flexible.

---

### Migration Path Consideration

**Original Concern:** "Lock-in to PostgreSQL"

**Reality:**

- Drizzle ORM provides abstraction layer
- Standard SQL means portability
- PostgreSQL → Other databases easier than SQLite → PostgreSQL
- Industry-standard platform (low risk)

**If We Need to Migrate Later:**

```typescript
// Drizzle supports multiple databases
// Change dialect, re-generate migrations, deploy
// Application code unchanged (using Drizzle query API)
```

---

## Consequences

### Positive

1. **✅ Better Data Integrity**
   - Full foreign key support
   - Cascade deletes work properly
   - Complex constraints supported

2. **✅ Concurrent Access**
   - Multiple partners can view dashboards simultaneously
   - Developer cost entry doesn't block partner access
   - Better performance under load

3. **✅ Serverless-Native**
   - Perfect fit for Netlify architecture
   - No file system dependencies
   - Connection pooling built-in

4. **✅ Developer Experience**
   - Database branching for previews
   - Easy to share/clone data
   - Better tooling (pgAdmin, Postico, etc.)

5. **✅ Future-Proof**
   - Industry standard
   - Rich ecosystem
   - Advanced features available when needed

6. **✅ Cost-Effective**
   - Cheaper than hosted SQLite (Turso)
   - Free tier for development
   - Pay-as-you-grow pricing

### Negative

1. **❌ Slightly More Complex**
   - PostgreSQL has more features to learn
   - More configuration options (usually good, but can be overwhelming)

2. **❌ Platform Dependency**
   - Relying on Neon as a service
   - But: Standard PostgreSQL means easy migration if needed

3. **❌ Network Latency**
   - Remote database vs local file (SQLite)
   - Mitigated by: Connection pooling, Neon's edge network
   - In practice: Negligible for this use case

### Neutral

1. **Same Development Workflow**
   - Drizzle ORM works with both
   - Migrations work the same way
   - Application code unchanged

---

## Alternatives Considered

### Alternative 1: SQLite (Original Plan)

**Pros:**

- Simpler setup
- No network dependency
- Portable file format

**Cons:**

- Single writer limitation
- Weak referential integrity
- Poor serverless fit
- Limited concurrent access
- No native hosting on Netlify

**Verdict:** **REJECTED** - Concurrency and referential integrity issues outweigh simplicity

---

### Alternative 2: Supabase PostgreSQL

**Pros:**

- Managed PostgreSQL
- Real-time subscriptions
- Built-in authentication
- Open source

**Cons:**

- More expensive than Neon
- Overlaps with Better-auth (don't need Supabase auth)
- Heavier platform (features we don't need)

**Verdict:** **NOT SELECTED** - Neon is more focused (database only) and cost-effective

---

### Alternative 3: PlanetScale (MySQL)

**Pros:**

- Serverless MySQL
- Branching support
- Good performance

**Cons:**

- MySQL vs PostgreSQL ecosystem
- Less rich data types (no JSONB equivalent)
- Weaker JSON support
- Different SQL dialect

**Verdict:** **NOT SELECTED** - PostgreSQL ecosystem is stronger for this use case

---

### Alternative 4: Self-Hosted PostgreSQL

**Pros:**

- Full control
- No vendor lock-in
- Potentially cheaper at scale

**Cons:**

- Requires DevOps expertise
- Manual backups, monitoring, scaling
- Slower iteration speed
- Not suitable for MVP

**Verdict:** **DEFERRED** - Revisit if we outgrow Neon (unlikely)

---

## Decision Validation Criteria

We will know this decision is correct if:

- [ ] ✅ **Concurrent Access Works:** Multiple partners can access dashboards simultaneously without blocking
- [ ] ✅ **Data Integrity Maintained:** No orphaned references in junction tables
- [ ] ✅ **Performance Acceptable:** <500ms API response times maintained
- [ ] ✅ **Development Velocity:** Database doesn't slow down feature development
- [ ] ✅ **Cost Stays Reasonable:** Monthly database costs <$50 for MVP phase

**As of 2025-10-20:**

- ✅ All criteria met in current implementation
- ✅ No performance issues reported
- ✅ Junction tables working correctly
- ✅ Developer experience positive

---

## Implementation Notes

### Connection Configuration

```typescript
// apps/web/src/server/db/index.ts
import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"

const sql = neon(process.env.NETLIFY_DATABASE_URL!)
export const db = drizzle(sql)
```

### Migration Workflow

```bash
# Generate migration from schema changes
bun run db:generate

# Push migration to database
bun run db:push

# Automatic on Netlify deploy
# Build command includes: bun run db:migrate
```

### Environment Variables

```bash
# Automatically set by Netlify integration
NETLIFY_DATABASE_URL=postgresql://...@...neon.tech/...

# Local development
# Each developer gets their own Neon instance (free tier)
DATABASE_URL=postgresql://...@...neon.tech/dev_yourname
```

---

## Related Decisions

- **[ADR-002](002-netlify-deployment.md)** - Netlify Deployment Platform (TBD)
- **[ADR-003](003-junction-tables-pattern.md)** - Junction Tables for Relationships (TBD)

---

## References

- [Neon Documentation](https://neon.tech/docs)
- [PostgreSQL vs SQLite Comparison](https://www.sqlite.org/whentouse.html)
- [Drizzle ORM - Neon PostgreSQL](https://orm.drizzle.team/docs/get-started-postgresql#neon)
- [Netlify + Neon Integration](https://docs.netlify.com/integrations/databases/neon/)

---

## Approval

**Architect:** Winston - 2025-10-20 ✅ **APPROVED**

**Rationale:** The benefits of PostgreSQL (referential integrity, concurrent access, serverless fit) far outweigh the minor increase in complexity. Neon's integration with Netlify makes this a natural choice for the architecture.

---

## Change Log

| Date       | Version | Change                                         | Author              |
| ---------- | ------- | ---------------------------------------------- | ------------------- |
| 2025-10-20 | 1.0     | Initial ADR documenting Neon PostgreSQL choice | Winston (Architect) |
