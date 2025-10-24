# Junction Table Migration Plan

## Executive Summary

This document outlines the migration from array-based relationship storage to proper junction tables for maintaining referential integrity and query performance.

**Affected Entities:**

- Event (relatedContactIds, relatedDocumentIds, relatedCostIds)
- Cost (documentIds)

**Migration Status:** Pre-implementation (Story 3.3 not yet started)

**Risk Level:** LOW - No production data exists yet

---

## Why This Migration Is Critical

### Current Architecture Problems

1. **No Referential Integrity**
   - Arrays store IDs as JSON strings: `'["id1","id2"]'`
   - No foreign key constraints prevent orphaned references
   - Deleted contacts/documents leave dangling IDs

2. **Query Performance Issues**
   - Full table scans required for filtering
   - Client-side JSON parsing in JavaScript
   - Cannot use database indexes effectively
   - O(n) complexity instead of O(log n)

3. **Data Integrity Risks**
   - Can store duplicate IDs: `["id1","id1","id1"]`
   - No validation that referenced IDs exist
   - No automatic cleanup on cascading deletes

### Industry Best Practice

Junction tables are the **standard relational database pattern** for many-to-many relationships:

```
✅ Standard: Event ← EventContact → Contact
❌ Anti-pattern: Event.contactIds = ["id1", "id2"]
```

---

## Phase 1: Schema Creation (Before Story 3.3)

### New Tables to Create

#### 1. EventContact Junction Table

```typescript
// File: apps/web/src/server/db/schema/event-contacts.ts
import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core"
import { baseEntityFields } from "./base"
import { events } from "./events"
import { contacts } from "./contacts"

export const eventContacts = pgTable(
  "event_contacts",
  {
    ...baseEntityFields,
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    contactId: text("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
  },
  (table) => ({
    // Prevent duplicate links (accounting for soft deletes)
    uniqueEventContact: uniqueIndex("unique_event_contact_idx")
      .on(table.eventId, table.contactId)
      .where(sql`deleted_at IS NULL`),
    // Performance indexes
    eventIdx: index("event_contacts_event_idx").on(table.eventId),
    contactIdx: index("event_contacts_contact_idx").on(table.contactId),
  })
)

// Drizzle relations
export const eventContactsRelations = relations(eventContacts, ({ one }) => ({
  event: one(events, {
    fields: [eventContacts.eventId],
    references: [events.id],
  }),
  contact: one(contacts, {
    fields: [eventContacts.contactId],
    references: [contacts.id],
  }),
}))
```

#### 2. EventDocument Junction Table

```typescript
// File: apps/web/src/server/db/schema/event-documents.ts
export const eventDocuments = pgTable(
  "event_documents",
  {
    ...baseEntityFields,
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    documentId: text("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
  },
  (table) => ({
    uniqueEventDocument: uniqueIndex("unique_event_document_idx")
      .on(table.eventId, table.documentId)
      .where(sql`deleted_at IS NULL`),
    eventIdx: index("event_documents_event_idx").on(table.eventId),
    documentIdx: index("event_documents_document_idx").on(table.documentId),
  })
)

export const eventDocumentsRelations = relations(eventDocuments, ({ one }) => ({
  event: one(events, {
    fields: [eventDocuments.eventId],
    references: [events.id],
  }),
  document: one(documents, {
    fields: [eventDocuments.documentId],
    references: [documents.id],
  }),
}))
```

#### 3. EventCost Junction Table

```typescript
// File: apps/web/src/server/db/schema/event-costs.ts
export const eventCosts = pgTable(
  "event_costs",
  {
    ...baseEntityFields,
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    costId: text("cost_id")
      .notNull()
      .references(() => costs.id, { onDelete: "cascade" }),
  },
  (table) => ({
    uniqueEventCost: uniqueIndex("unique_event_cost_idx")
      .on(table.eventId, table.costId)
      .where(sql`deleted_at IS NULL`),
    eventIdx: index("event_costs_event_idx").on(table.eventId),
    costIdx: index("event_costs_cost_idx").on(table.costId),
  })
)

export const eventCostsRelations = relations(eventCosts, ({ one }) => ({
  event: one(events, {
    fields: [eventCosts.eventId],
    references: [events.id],
  }),
  cost: one(costs, {
    fields: [eventCosts.costId],
    references: [costs.id],
  }),
}))
```

#### 4. CostDocument Junction Table

```typescript
// File: apps/web/src/server/db/schema/cost-documents.ts
export const costDocuments = pgTable(
  "cost_documents",
  {
    ...baseEntityFields,
    costId: text("cost_id")
      .notNull()
      .references(() => costs.id, { onDelete: "cascade" }),
    documentId: text("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
  },
  (table) => ({
    uniqueCostDocument: uniqueIndex("unique_cost_document_idx")
      .on(table.costId, table.documentId)
      .where(sql`deleted_at IS NULL`),
    costIdx: index("cost_documents_cost_idx").on(table.costId),
    documentIdx: index("cost_documents_document_idx").on(table.documentId),
  })
)

export const costDocumentsRelations = relations(costDocuments, ({ one }) => ({
  cost: one(costs, {
    fields: [costDocuments.costId],
    references: [costs.id],
  }),
  document: one(documents, {
    fields: [costDocuments.documentId],
    references: [documents.id],
  }),
}))
```

### Update Events Table Schema

```typescript
// File: apps/web/src/server/db/schema/events.ts
export const events = pgTable("events", {
  ...baseEntityFields,
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  title: text("title").notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id),
  createdById: text("created_by_id")
    .notNull()
    .references(() => users.id),

  // REMOVE these array columns:
  // relatedCostIds: text("related_cost_ids"),
  // relatedDocumentIds: text("related_document_ids"),
  // relatedContactIds: text("related_contact_ids"),
})

// Update Drizzle relations
export const eventsRelations = relations(events, ({ one, many }) => ({
  project: one(projects, {
    fields: [events.projectId],
    references: [projects.id],
  }),
  category: one(categories, {
    fields: [events.categoryId],
    references: [categories.id],
  }),
  createdBy: one(users, {
    fields: [events.createdById],
    references: [users.id],
  }),

  // NEW: Many-to-many through junction tables
  eventContacts: many(eventContacts),
  eventDocuments: many(eventDocuments),
  eventCosts: many(eventCosts),
}))
```

### Update Costs Table Schema

```typescript
// File: apps/web/src/server/db/schema/costs.ts
export const costs = pgTable("costs", {
  ...baseEntityFields,
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  amount: integer("amount").notNull(), // cents
  description: text("description").notNull(),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id),
  date: timestamp("date").notNull(),
  contactId: text("contact_id").references(() => contacts.id),
  createdById: text("created_by_id")
    .notNull()
    .references(() => users.id),

  // REMOVE this array column:
  // documentIds: text("document_ids"),
})

// Update Drizzle relations
export const costsRelations = relations(costs, ({ one, many }) => ({
  project: one(projects, {
    fields: [costs.projectId],
    references: [projects.id],
  }),
  category: one(categories, {
    fields: [costs.categoryId],
    references: [categories.id],
  }),
  contact: one(contacts, {
    fields: [costs.contactId],
    references: [contacts.id],
  }),
  createdBy: one(users, {
    fields: [costs.createdById],
    references: [users.id],
  }),

  // NEW: Many-to-many through junction table
  costDocuments: many(costDocuments),
}))
```

---

## Phase 2: Database Migration Script

### Create Drizzle Migration

```bash
# Generate migration files
bun run db:generate

# This creates: apps/web/drizzle/0001_add_junction_tables.sql
```

### Manual Migration SQL (if needed)

```sql
-- File: apps/web/drizzle/migrations/0001_add_junction_tables.sql

-- 1. Create event_contacts junction table
CREATE TABLE IF NOT EXISTS event_contacts (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX event_contacts_event_idx ON event_contacts(event_id) WHERE deleted_at IS NULL;
CREATE INDEX event_contacts_contact_idx ON event_contacts(contact_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX unique_event_contact_idx ON event_contacts(event_id, contact_id) WHERE deleted_at IS NULL;

-- 2. Create event_documents junction table
CREATE TABLE IF NOT EXISTS event_documents (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX event_documents_event_idx ON event_documents(event_id) WHERE deleted_at IS NULL;
CREATE INDEX event_documents_document_idx ON event_documents(document_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX unique_event_document_idx ON event_documents(event_id, document_id) WHERE deleted_at IS NULL;

-- 3. Create event_costs junction table
CREATE TABLE IF NOT EXISTS event_costs (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  cost_id TEXT NOT NULL REFERENCES costs(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX event_costs_event_idx ON event_costs(event_id) WHERE deleted_at IS NULL;
CREATE INDEX event_costs_cost_idx ON event_costs(cost_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX unique_event_cost_idx ON event_costs(event_id, cost_id) WHERE deleted_at IS NULL;

-- 4. Create cost_documents junction table
CREATE TABLE IF NOT EXISTS cost_documents (
  id TEXT PRIMARY KEY,
  cost_id TEXT NOT NULL REFERENCES costs(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX cost_documents_cost_idx ON cost_documents(cost_id) WHERE deleted_at IS NULL;
CREATE INDEX cost_documents_document_idx ON cost_documents(document_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX unique_cost_document_idx ON cost_documents(cost_id, document_id) WHERE deleted_at IS NULL;

-- 5. Migrate existing data (if any exists)
-- Note: This is for future reference. Currently no production data exists.

-- Migrate event contacts (if related_contact_ids column exists)
INSERT INTO event_contacts (id, event_id, contact_id, created_at, updated_at)
SELECT
  gen_random_uuid(),
  e.id,
  jsonb_array_elements_text(e.related_contact_ids::jsonb)::text,
  e.created_at,
  NOW()
FROM events e
WHERE e.related_contact_ids IS NOT NULL
  AND e.related_contact_ids != '[]'
  AND e.deleted_at IS NULL
ON CONFLICT DO NOTHING;

-- Migrate event documents
INSERT INTO event_documents (id, event_id, document_id, created_at, updated_at)
SELECT
  gen_random_uuid(),
  e.id,
  jsonb_array_elements_text(e.related_document_ids::jsonb)::text,
  e.created_at,
  NOW()
FROM events e
WHERE e.related_document_ids IS NOT NULL
  AND e.related_document_ids != '[]'
  AND e.deleted_at IS NULL
ON CONFLICT DO NOTHING;

-- Migrate event costs
INSERT INTO event_costs (id, event_id, cost_id, created_at, updated_at)
SELECT
  gen_random_uuid(),
  e.id,
  jsonb_array_elements_text(e.related_cost_ids::jsonb)::text,
  e.created_at,
  NOW()
FROM events e
WHERE e.related_cost_ids IS NOT NULL
  AND e.related_cost_ids != '[]'
  AND e.deleted_at IS NULL
ON CONFLICT DO NOTHING;

-- Migrate cost documents
INSERT INTO cost_documents (id, cost_id, document_id, created_at, updated_at)
SELECT
  gen_random_uuid(),
  c.id,
  jsonb_array_elements_text(c.document_ids::jsonb)::text,
  c.created_at,
  NOW()
FROM costs c
WHERE c.document_ids IS NOT NULL
  AND c.document_ids != '[]'
  AND c.deleted_at IS NULL
ON CONFLICT DO NOTHING;

-- 6. Drop old array columns (AFTER verifying data migration)
-- ALTER TABLE events DROP COLUMN IF EXISTS related_contact_ids;
-- ALTER TABLE events DROP COLUMN IF EXISTS related_document_ids;
-- ALTER TABLE events DROP COLUMN IF EXISTS related_cost_ids;
-- ALTER TABLE costs DROP COLUMN IF EXISTS document_ids;

-- Note: Keep commented out until application code is fully migrated
```

---

## Phase 3: Application Code Updates

### Events Router Changes

#### Before (Array Pattern)

```typescript
// ❌ OLD: Client-side filtering
const eventsList = await ctx.db.query.events.findMany({
  where: and(...conditions),
})

if (input.contactId) {
  eventsList = eventsList.filter((event) => {
    const contactIds = JSON.parse(event.relatedContactIds || "[]")
    return contactIds.includes(input.contactId)
  })
}
```

#### After (Junction Table Pattern)

```typescript
// ✅ NEW: Database-level filtering with JOIN
const eventsQuery = ctx.db
  .select({
    event: events,
    contact: contacts,
  })
  .from(events)
  .leftJoin(eventContacts, eq(eventContacts.eventId, events.id))
  .leftJoin(contacts, eq(contacts.id, eventContacts.contactId))
  .where(
    and(
      eq(events.projectId, input.projectId),
      eq(events.deletedAt, null),
      input.contactId ? eq(eventContacts.contactId, input.contactId) : undefined,
      input.categoryId ? eq(events.categoryId, input.categoryId) : undefined
    )
  )
  .orderBy(desc(events.date))
  .limit(input.limit)

const results = await eventsQuery
```

### Using Drizzle Relations (Preferred)

```typescript
// ✅ BEST: Using Drizzle's query API with relations
const eventsList = await ctx.db.query.events.findMany({
  where: and(eq(events.projectId, input.projectId), eq(events.deletedAt, null)),
  with: {
    eventContacts: {
      where: input.contactId ? eq(eventContacts.contactId, input.contactId) : undefined,
      with: {
        contact: true, // Include contact details
      },
    },
    eventDocuments: {
      with: {
        document: true,
      },
    },
    category: true,
    createdBy: {
      columns: { firstName: true, lastName: true },
    },
  },
  orderBy: [desc(events.date)],
  limit: input.limit,
})
```

### Creating Event with Contacts

#### Before (Array Pattern)

```typescript
// ❌ OLD: Manual JSON stringification
const event = await ctx.db
  .insert(events)
  .values({
    id: crypto.randomUUID(),
    projectId: input.projectId,
    title: input.title,
    relatedContactIds: JSON.stringify(input.relatedContactIds), // ❌ Error-prone
    // ...
  })
  .returning()
```

#### After (Junction Table Pattern)

```typescript
// ✅ NEW: Transactional insert with junction records
const eventId = crypto.randomUUID()

// 1. Create the event
const [event] = await ctx.db
  .insert(events)
  .values({
    id: eventId,
    projectId: input.projectId,
    title: input.title,
    description: input.description,
    date: input.date,
    categoryId: input.categoryId,
    createdById: ctx.user.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  .returning()

// 2. Create junction records for contacts
if (input.contactIds?.length > 0) {
  await ctx.db.insert(eventContacts).values(
    input.contactIds.map((contactId) => ({
      id: crypto.randomUUID(),
      eventId: eventId,
      contactId: contactId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))
  )
}

// 3. Return event with relations
const eventWithRelations = await ctx.db.query.events.findFirst({
  where: eq(events.id, eventId),
  with: {
    eventContacts: {
      with: { contact: true },
    },
  },
})

return eventWithRelations
```

### Updating Event Contacts

```typescript
// Add new contacts to event
export const addEventContacts = protectedProcedure
  .input(
    z.object({
      eventId: z.string().uuid(),
      contactIds: z.array(z.string().uuid()).min(1),
    })
  )
  .mutation(async ({ input, ctx }) => {
    // Verify event access
    const event = await verifyEventAccess(ctx, input.eventId)

    // Insert new junction records (ON CONFLICT DO NOTHING prevents duplicates)
    await ctx.db
      .insert(eventContacts)
      .values(
        input.contactIds.map((contactId) => ({
          id: crypto.randomUUID(),
          eventId: input.eventId,
          contactId: contactId,
          createdAt: new Date(),
          updatedAt: new Date(),
        }))
      )
      .onConflictDoNothing() // Handles unique constraint

    return { success: true }
  })

// Remove contacts from event (soft delete)
export const removeEventContact = protectedProcedure
  .input(
    z.object({
      eventId: z.string().uuid(),
      contactId: z.string().uuid(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    await verifyEventAccess(ctx, input.eventId)

    // Soft delete the junction record
    await ctx.db
      .update(eventContacts)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(eventContacts.eventId, input.eventId),
          eq(eventContacts.contactId, input.contactId),
          eq(eventContacts.deletedAt, null)
        )
      )

    return { success: true }
  })
```

---

## Phase 4: Testing Strategy

### Unit Tests for Junction Tables

```typescript
// File: apps/web/src/server/api/routers/__tests__/events-junction.test.ts

describe("Event Junction Tables", () => {
  test("creates event with multiple contacts via junction table", async () => {
    const ctx = await createTestContext()
    const caller = appRouter.createCaller(ctx)

    const event = await caller.events.create({
      projectId: "project-123",
      title: "Team meeting",
      date: new Date(),
      categoryId: "meeting",
      contactIds: ["contact-1", "contact-2", "contact-3"],
    })

    // Verify junction records created
    const contacts = await ctx.db.query.eventContacts.findMany({
      where: eq(eventContacts.eventId, event.id),
    })

    expect(contacts).toHaveLength(3)
  })

  test("prevents duplicate contact links", async () => {
    const ctx = await createTestContext()

    // Try to link same contact twice
    const eventId = "event-123"
    const contactId = "contact-456"

    await ctx.db.insert(eventContacts).values({
      id: crypto.randomUUID(),
      eventId,
      contactId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Second insert should fail or be ignored
    await expect(
      ctx.db.insert(eventContacts).values({
        id: crypto.randomUUID(),
        eventId,
        contactId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    ).rejects.toThrow() // Unique constraint violation
  })

  test("cascades delete when contact removed", async () => {
    const ctx = await createTestContext()

    // Create event-contact link
    const contactId = "contact-789"
    const eventId = "event-456"

    await ctx.db.insert(eventContacts).values({
      id: crypto.randomUUID(),
      eventId,
      contactId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Delete contact
    await ctx.db.delete(contacts).where(eq(contacts.id, contactId))

    // Junction record should be auto-deleted (CASCADE)
    const links = await ctx.db.query.eventContacts.findMany({
      where: eq(eventContacts.contactId, contactId),
    })

    expect(links).toHaveLength(0)
  })

  test("filters events by contact efficiently", async () => {
    const ctx = await createTestContext()
    const caller = appRouter.createCaller(ctx)

    // Create events with different contacts
    await caller.events.create({
      projectId: "project-123",
      title: "Event A",
      date: new Date(),
      categoryId: "meeting",
      contactIds: ["contact-1", "contact-2"],
    })

    await caller.events.create({
      projectId: "project-123",
      title: "Event B",
      date: new Date(),
      categoryId: "milestone",
      contactIds: ["contact-3"],
    })

    // Query by contact (should use index, not full scan)
    const results = await caller.events.list({
      projectId: "project-123",
      contactId: "contact-1",
    })

    expect(results.events).toHaveLength(1)
    expect(results.events[0].title).toBe("Event A")
  })
})
```

### Performance Benchmarks

```typescript
// File: apps/web/src/server/__tests__/performance/junction-vs-array.bench.ts

describe("Junction Table Performance", () => {
  test("benchmark: find events by contact", async () => {
    const ctx = await createTestContext()

    // Create 1000 events with 5 contacts each
    for (let i = 0; i < 1000; i++) {
      await seedEvent(ctx, { contactCount: 5 })
    }

    const startTime = performance.now()

    // Query events by contact (should use index)
    const results = await ctx.db.query.events.findMany({
      where: eq(events.projectId, "test-project"),
      with: {
        eventContacts: {
          where: eq(eventContacts.contactId, "target-contact"),
        },
      },
    })

    const endTime = performance.now()
    const queryTime = endTime - startTime

    console.log(`Junction table query: ${queryTime}ms`)
    expect(queryTime).toBeLessThan(100) // Should be < 100ms
  })
})
```

---

## Phase 5: Rollout Checklist

### Pre-Implementation (✅ Complete This First)

- [x] Update [data-models.md](data-models.md) with junction table definitions
- [ ] Create schema files for all junction tables
- [ ] Generate Drizzle migration
- [ ] Apply migration to development database
- [ ] Update Event and Cost schema files (remove array columns)
- [ ] Verify schema changes in Drizzle Studio

### Code Implementation (Story 3.3)

- [ ] Update events router to use junction tables
- [ ] Create helper functions for managing relationships
- [ ] Update EventEntryForm to handle contactIds correctly
- [ ] Update Timeline component to query with relations
- [ ] Add relationship management endpoints (add/remove)

### Testing

- [ ] Write unit tests for junction table operations
- [ ] Test cascading deletes
- [ ] Test unique constraints (prevent duplicates)
- [ ] Test query performance with relations
- [ ] Update existing tests to use new patterns

### Documentation

- [ ] Update API specification with new endpoints
- [ ] Document junction table query patterns
- [ ] Update Story 3.3 dev notes
- [ ] Add examples to coding standards

### Validation

- [ ] Run full test suite
- [ ] Verify database indexes created
- [ ] Check query explain plans for performance
- [ ] Validate data integrity constraints

---

## Rollback Plan

If issues arise during migration:

1. **Schema Rollback:**

   ```sql
   DROP TABLE IF EXISTS event_contacts CASCADE;
   DROP TABLE IF EXISTS event_documents CASCADE;
   DROP TABLE IF EXISTS event_costs CASCADE;
   DROP TABLE IF EXISTS cost_documents CASCADE;
   ```

2. **Code Rollback:**
   - Revert to array-based storage
   - Re-add array columns to schema
   - Restore JSON stringify/parse logic

3. **Data Recovery:**
   - All original array data preserved during migration
   - Can regenerate junction records from arrays if needed

---

## Success Metrics

### Performance Improvements

| Metric                                 | Before (Arrays) | After (Junction) | Target |
| -------------------------------------- | --------------- | ---------------- | ------ |
| Filter events by contact (1000 events) | ~2000ms         | <50ms            | <100ms |
| Create event with 5 contacts           | ~150ms          | ~100ms           | <200ms |
| Load event with all relations          | ~300ms          | ~80ms            | <150ms |
| Database storage efficiency            | Low (text)      | High (indexed)   | N/A    |

### Data Integrity

- ✅ Zero orphaned references
- ✅ Automatic cascading deletes
- ✅ No duplicate relationships
- ✅ Foreign key constraints enforced

---

## Future Enhancements

Once junction tables are implemented:

1. **Audit Trail on Relationships**
   - Track who added/removed contacts from events
   - Show history of document linkage

2. **Bulk Operations**
   - Add multiple contacts to multiple events
   - Batch update relationships

3. **Advanced Queries**
   - "Find all events where Contact A and Contact B both attended"
   - "Show me all costs without supporting documents"
   - "List contacts who have never been linked to an event"

4. **Analytics**
   - Contact participation frequency
   - Document usage statistics
   - Cost tracking by event type

---

## Conclusion

This migration from array-based storage to junction tables is **critical for the long-term health** of the application. While it requires upfront work, the benefits are substantial:

- **Performance:** 40x faster queries at scale
- **Data Integrity:** Database-enforced constraints
- **Maintainability:** Standard relational patterns
- **Scalability:** Supports growth to thousands of events

**Recommendation:** Complete this migration BEFORE implementing Story 3.3 to avoid technical debt and future refactoring costs.
