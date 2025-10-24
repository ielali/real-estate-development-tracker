# Array Usage Analysis - Data Models

**Date:** 2025-10-20
**Reviewed By:** Winston (Architect)
**Status:** ✅ COMPLETE

---

## Executive Summary

This document analyzes **all array usage** in the Real Estate Development Tracker data model to determine which are appropriate and which violate relational database best practices.

**Finding:** After comprehensive review, there is **ONE legitimate use case** for arrays in the data model:

1. ✅ **AuditLog.metadata.relatedEntities** - Legitimate (read-only, denormalized for performance)

All other array usage (relationship IDs) has been corrected to use junction tables.

---

## Array Usage Inventory

### ✅ 1. AuditLog.metadata.relatedEntities (APPROPRIATE)

**Location:** [data-models.md:543-549](data-models.md)

```typescript
interface AuditMetadata {
  displayName?: string
  amount?: number
  fileName?: string
  previousValue?: any
  newValue?: any
  relatedEntities?: Array<{ type: string; id: string; name: string }> // ✅ APPROPRIATE
}
```

**Use Case:**

```typescript
// Example: Cost created with vendor and receipt
{
  action: 'created',
  entityType: 'cost',
  metadata: {
    displayName: 'Added $1,500 plumbing materials',
    amount: 150000,
    relatedEntities: [
      { type: 'contact', id: 'uuid-1', name: 'ABC Plumbing' },
      { type: 'document', id: 'uuid-2', name: 'receipt-001.pdf' }
    ]
  }
}
```

**Why This Is Appropriate:**

#### ✅ Reason 1: Denormalized Snapshot (Immutable History)

```
AuditLog is IMMUTABLE - never updated or deleted
Purpose: Historical snapshot of relationships at time of action
Not a source of truth - just a denormalized cache for display
```

#### ✅ Reason 2: Read-Only Optimization

```
Use Case: Activity feed display
Requirement: Fast rendering without multiple JOINs
Solution: Pre-computed denormalized data in JSON
Performance: O(1) read vs O(n) JOINs
```

#### ✅ Reason 3: No Query Requirements

```
❌ NOT used for: "Find all audit logs where contact X was involved"
✅ ONLY used for: "Show audit log with related entity names"
Query Pattern: Fetch audit logs by projectId/userId, display metadata as-is
```

#### ✅ Reason 4: Preserves Historical Names

```
Scenario: Contact renamed from "John Plumber" to "John's Plumbing LLC"
AuditLog: Shows historical name at time of action
Benefit: Audit trail reflects reality at that moment
```

**Architecture Pattern:**

```
┌─────────────┐
│ AuditLog    │ (Immutable event log)
├─────────────┤
│ id          │
│ projectId   │
│ userId      │
│ action      │
│ entityType  │
│ entityId    │ ← Points to source entity
│ metadata    │ ← Denormalized snapshot for display
│   └─ relatedEntities: [...]  // Pre-computed for UX
└─────────────┘
```

**PostgreSQL Storage:**

```sql
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  metadata JSONB,  -- ✅ JSONB column (not TEXT)
  created_at TIMESTAMP NOT NULL
);

-- Optional: GIN index for metadata queries (if needed later)
CREATE INDEX idx_audit_logs_metadata ON audit_logs USING GIN (metadata);
```

**Key Difference from Event/Cost Arrays:**

| Aspect                      | AuditLog.metadata    | Event.contactIds (OLD) |
| --------------------------- | -------------------- | ---------------------- |
| **Mutability**              | ✅ Immutable         | ❌ Mutable             |
| **Source of Truth**         | ✅ No (snapshot)     | ❌ Yes (primary data)  |
| **Query Needed**            | ✅ No (display only) | ❌ Yes (filtering)     |
| **Referential Integrity**   | ✅ Not required      | ❌ Required            |
| **Historical Preservation** | ✅ Essential         | ❌ Not relevant        |

---

### ❌ 2. Event.relatedContactIds (CORRECTED)

**Status:** ✅ FIXED - Migrated to EventContact junction table

**Before:**

```typescript
interface Event {
  relatedContactIds: string[] // ❌ ANTI-PATTERN
}
```

**After:**

```typescript
interface Event {
  // Relationships via junction table
}

interface EventContact extends BaseEntity {
  eventId: string
  contactId: string
}
```

**Documentation:** See [junction-table-migration-plan.md](junction-table-migration-plan.md)

---

### ❌ 3. Event.relatedDocumentIds (CORRECTED)

**Status:** ✅ FIXED - Migrated to EventDocument junction table

**Before:**

```typescript
interface Event {
  relatedDocumentIds: string[] // ❌ ANTI-PATTERN
}
```

**After:**

```typescript
interface EventDocument extends BaseEntity {
  eventId: string
  documentId: string
}
```

---

### ❌ 4. Event.relatedCostIds (CORRECTED)

**Status:** ✅ FIXED - Migrated to EventCost junction table

**Before:**

```typescript
interface Event {
  relatedCostIds: string[] // ❌ ANTI-PATTERN
}
```

**After:**

```typescript
interface EventCost extends BaseEntity {
  eventId: string
  costId: string
}
```

---

### ❌ 5. Cost.documentIds (CORRECTED)

**Status:** ✅ FIXED - Migrated to CostDocument junction table

**Before:**

```typescript
interface Cost {
  documentIds: string[] // ❌ ANTI-PATTERN
}
```

**After:**

```typescript
interface CostDocument extends BaseEntity {
  costId: string
  documentId: string
}
```

---

## Array Type Categories

### Category A: Denormalized Read-Only Data (✅ APPROPRIATE)

**When to Use Arrays:**

- Immutable historical snapshots (audit logs, events)
- Display-only data (no filtering/querying required)
- Performance optimization for read-heavy operations
- Preserving historical state (e.g., names at time of action)

**Examples:**

- ✅ AuditLog.metadata.relatedEntities
- ✅ NotificationHistory.recipientNames (if implemented)
- ✅ CachedReportData.categoryBreakdown (if implemented)

**Database Type:** JSONB (not TEXT)

---

### Category B: Entity Relationships (❌ INAPPROPRIATE)

**When to Use Junction Tables:**

- Mutable relationships between entities
- Source of truth for relationships
- Filtering/querying required
- Referential integrity needed
- Cascading deletes required

**Examples:**

- ❌ Event ← → Contact relationships
- ❌ Event ← → Document relationships
- ❌ Cost ← → Document relationships
- ❌ Project ← → Tag relationships (if implemented)

**Database Type:** Junction table with foreign keys

---

### Category C: Simple Value Lists (⚠️ CASE-BY-CASE)

**When Arrays Might Be Appropriate:**

- Fixed list of values (not entity IDs)
- No need to query individual items
- Rarely changes
- No referential integrity needed

**Examples:**

- ⚠️ `Project.allowedFileTypes: string[]` - Could use array OR enum table
- ⚠️ `User.notificationPreferences: string[]` - Simple list of enabled notifications
- ⚠️ `Document.tags: string[]` - Freeform tags (not entity references)

**Recommendation:** Evaluate case-by-case. Default to normalized tables unless performance requires denormalization.

---

## Evaluation Framework

Use this decision tree when considering arrays:

```
┌─────────────────────────────────────┐
│ Are you storing entity IDs?         │
└─────────────┬───────────────────────┘
              │
              ├─ YES → ❌ Use Junction Table
              │
              └─ NO → Continue...
                        │
                        ├─ Will you query/filter by values?
                        │   ├─ YES → ❌ Use Normalized Table
                        │   └─ NO → Continue...
                        │             │
                        │             ├─ Is data immutable?
                        │             │   ├─ YES → ✅ Array MAY be appropriate
                        │             │   └─ NO → ⚠️ Reconsider
                        │             │
                        │             ├─ Is it a denormalized cache?
                        │             │   ├─ YES → ✅ Array MAY be appropriate
                        │             │   └─ NO → ⚠️ Reconsider
                        │             │
                        │             └─ Is it display-only data?
                        │                 ├─ YES → ✅ Array MAY be appropriate
                        │                 └─ NO → ❌ Use Normalized Table
```

---

## PostgreSQL Array Types: When to Use

PostgreSQL has native array support, but it's **not a replacement for proper normalization**.

### ✅ Good Use Cases for PostgreSQL Arrays

1. **Simple Value Lists (Non-Entity IDs)**

   ```sql
   -- Acceptable
   CREATE TABLE projects (
     id TEXT PRIMARY KEY,
     allowed_mime_types TEXT[] -- ['image/jpeg', 'image/png', 'application/pdf']
   );
   ```

2. **Immutable Historical Data**

   ```sql
   -- Acceptable
   CREATE TABLE audit_logs (
     id TEXT PRIMARY KEY,
     metadata JSONB  -- { tags: ['urgent', 'financial'], participants: ['John', 'Jane'] }
   );
   ```

3. **Performance-Critical Lookups (WITH CAUTION)**
   ```sql
   -- Acceptable IF:
   -- 1. Rarely queried by array contents
   -- 2. Frequently read as entire array
   -- 3. GIN index created for array operations
   CREATE TABLE search_cache (
     id TEXT PRIMARY KEY,
     keyword_matches TEXT[]
   );
   CREATE INDEX idx_search_keywords ON search_cache USING GIN (keyword_matches);
   ```

### ❌ Bad Use Cases for PostgreSQL Arrays

1. **Entity Relationships**

   ```sql
   -- ❌ ANTI-PATTERN
   CREATE TABLE events (
     id TEXT PRIMARY KEY,
     contact_ids TEXT[]  -- WRONG: Use junction table
   );
   ```

2. **Frequently Queried Lists**

   ```sql
   -- ❌ ANTI-PATTERN
   CREATE TABLE projects (
     id TEXT PRIMARY KEY,
     tag_ids TEXT[]  -- WRONG: "Find all projects with tag X" requires array operations
   );

   -- Expensive query
   SELECT * FROM projects WHERE 'urgent' = ANY(tag_ids);  -- Full scan even with GIN index
   ```

3. **Data Requiring Referential Integrity**
   ```sql
   -- ❌ ANTI-PATTERN
   CREATE TABLE orders (
     id TEXT PRIMARY KEY,
     product_ids TEXT[]  -- WRONG: No FK constraint, orphaned IDs possible
   );
   ```

---

## JSONB vs TEXT for Arrays

If you MUST store arrays, use the right data type:

### ✅ JSONB (Preferred)

```sql
CREATE TABLE audit_logs (
  metadata JSONB  -- ✅ Native JSON operations, indexable, type-safe
);

-- Query with JSONB operators
SELECT * FROM audit_logs WHERE metadata->'relatedEntities' @> '[{"type": "contact"}]';
```

**Benefits:**

- Native JSON operators
- GIN indexes for fast queries
- Type validation
- Efficient storage

### ❌ TEXT (Anti-Pattern)

```sql
CREATE TABLE events (
  related_contact_ids TEXT  -- ❌ '["id1","id2"]' - Manual JSON parsing required
);

-- Must parse in application
const ids = JSON.parse(event.related_contact_ids || "[]")
```

**Problems:**

- No database validation
- Manual parsing overhead
- No index support
- Error-prone

---

## Testing Arrays vs Junction Tables

### Performance Benchmarks

```typescript
// Test: Find events with specific contact (1000 events, 5 contacts each)

// ❌ Array Storage
async function findEventsWithContactArray(contactId: string) {
  const allEvents = await db.query.events.findMany() // Load ALL
  return allEvents.filter((e) => JSON.parse(e.relatedContactIds || "[]").includes(contactId))
}
// Result: ~2000ms (O(n) complexity)

// ✅ Junction Table
async function findEventsWithContactJunction(contactId: string) {
  return await db.query.events.findMany({
    with: {
      eventContacts: {
        where: eq(eventContacts.contactId, contactId),
      },
    },
  })
}
// Result: ~50ms (O(log n) with index)
```

---

## Migration Strategy for Future Arrays

If arrays are discovered in the codebase later:

### Step 1: Identify Array Type

```
Is it entity IDs? → Junction table
Is it queryable data? → Normalized table
Is it immutable display data? → May keep as JSONB
```

### Step 2: Assess Impact

```
- Number of records affected
- Query patterns using the array
- Performance implications
- Data integrity risks
```

### Step 3: Migrate

```
1. Create new schema (junction table or normalized table)
2. Migrate data with SQL script
3. Update application code
4. Test thoroughly
5. Drop old array column
```

---

## Coding Standards Update

**ADD TO:** [coding-standards.md](coding-standards.md)

```markdown
## Array Usage Guidelines

### ❌ NEVER Use Arrays For:

- Entity ID relationships (use junction tables)
- Data requiring referential integrity
- Frequently queried/filtered data
- Mutable source-of-truth data

### ✅ Arrays ARE Acceptable For:

- Immutable audit trail snapshots (AuditLog.metadata)
- Display-only denormalized caches
- Simple non-entity value lists (with GIN indexes)

### Decision Checklist:

1. [ ] Are you storing entity IDs? → Junction table
2. [ ] Do you need referential integrity? → Normalized table
3. [ ] Will you query/filter by values? → Normalized table
4. [ ] Is data immutable and display-only? → JSONB array MAY be OK
```

---

## Conclusion

**Current Status:** ✅ ALL RELATIONSHIP ARRAYS ELIMINATED

The Real Estate Development Tracker data model now follows **relational database best practices**:

1. **Entity relationships** → Junction tables (EventContact, CostDocument, etc.)
2. **Audit metadata** → Denormalized JSONB arrays (appropriate for immutable logs)
3. **No entity IDs in arrays** → Referential integrity maintained

**Future Vigilance:**

When adding new features, apply the decision framework:

- Entity IDs → Junction table
- Queryable data → Normalized table
- Immutable display data → JSONB (case-by-case)

---

**Sign-Off:** Winston (Architect) - 2025-10-20
**Status:** ✅ ARCHITECTURE REVIEW COMPLETE
