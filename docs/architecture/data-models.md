# Data Models

Define the core data models/entities that will be shared between frontend and backend. These models form the foundation of the Real Estate Development Tracker's data architecture.

## Base Types

### BaseEntity

**Purpose:** Common fields for all database entities ensuring consistency

```typescript
interface BaseEntity {
  id: string // UUID
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null // Soft delete
}
```

### Address

**Purpose:** Standardized Australian address format used across multiple entities

```typescript
interface Address {
  streetNumber: string
  streetName: string
  streetType: string | null // Street, Road, Avenue, etc.
  suburb: string
  state: AustralianState
  postcode: string
  country: string // Default: 'Australia'
  formatted?: string // Full formatted address for display
}

type AustralianState = "NSW" | "VIC" | "QLD" | "WA" | "SA" | "TAS" | "ACT" | "NT"
```

## Category (Unified Type)

**Purpose:** Unified hierarchical category system used across contacts, costs, documents, and events

### TypeScript Interface

```typescript
interface Category {
  id: string // e.g., 'plumber', 'materials', 'photo'
  type: CategoryType // Which entity type this category belongs to
  displayName: string // e.g., 'Plumber', 'Building Materials'
  parentId: string | null // e.g., 'trades' for 'plumber'
}

type CategoryType = "contact" | "cost" | "document" | "event"

// Predefined category hierarchies
const CATEGORIES: Category[] = [
  // Contact Categories
  { id: "construction_team", type: "contact", displayName: "Construction Team", parentId: null },
  {
    id: "builder",
    type: "contact",
    displayName: "Builder/General Contractor",
    parentId: "construction_team",
  },
  {
    id: "supervisor",
    type: "contact",
    displayName: "Site Supervisor",
    parentId: "construction_team",
  },
  { id: "trades", type: "contact", displayName: "Trades", parentId: null },
  { id: "electrician", type: "contact", displayName: "Electrician", parentId: "trades" },
  { id: "plumber", type: "contact", displayName: "Plumber", parentId: "trades" },
  { id: "carpenter", type: "contact", displayName: "Carpenter", parentId: "trades" },

  // Cost Categories
  { id: "materials", type: "cost", displayName: "Materials", parentId: null },
  { id: "labor", type: "cost", displayName: "Labor", parentId: null },
  { id: "permits", type: "cost", displayName: "Permits & Fees", parentId: null },
  { id: "professional", type: "cost", displayName: "Professional Services", parentId: null },

  // Document Categories
  { id: "photo", type: "document", displayName: "Photo", parentId: null },
  { id: "receipt", type: "document", displayName: "Receipt", parentId: null },
  { id: "contract", type: "document", displayName: "Contract", parentId: null },
  { id: "permit", type: "document", displayName: "Permit", parentId: null },

  // Event Categories
  { id: "milestone", type: "event", displayName: "Milestone", parentId: null },
  { id: "meeting", type: "event", displayName: "Meeting", parentId: null },
  { id: "inspection", type: "event", displayName: "Inspection", parentId: null },
  // ... etc
]

// Helper function to get categories by type
function getCategoriesByType(type: CategoryType): Category[] {
  return CATEGORIES.filter((cat) => cat.type === type)
}
```

## User

**Purpose:** Represents authenticated users who can manage projects and invite partners

**Key Attributes:**

- Extends BaseEntity (id, createdAt, updatedAt, deletedAt)
- email: string - Primary email for authentication
- firstName: string - User's first name
- lastName: string - User's last name
- role: enum('admin', 'partner') - System-wide role

### TypeScript Interface

```typescript
interface User extends BaseEntity {
  email: string
  firstName: string
  lastName: string
  role: "admin" | "partner"
}
```

### Relationships

- Has many Projects (as owner)
- Has many ProjectAccess records (as partner)
- Has many Costs (as creator)

## Project

**Purpose:** Core entity representing a real estate development project

**Key Attributes:**

- Extends BaseEntity (id, createdAt, updatedAt, deletedAt)
- name: string - Project name
- description: string | null - Project overview and scope
- address: Address - Physical property address (structured)
- projectType: enum - Type of real estate project
- status: enum('active', 'on-hold', 'completed') - Current project state
- startDate: Date - Project commencement
- endDate: Date | null - Expected/actual completion
- ownerId: string - Reference to User who created project
- totalBudget: number | null - Optional budget cap

### TypeScript Interface

```typescript
interface Project extends BaseEntity {
  name: string
  description: string | null
  address: Address
  projectType: ProjectType
  status: "active" | "on-hold" | "completed"
  startDate: Date
  endDate: Date | null
  ownerId: string
  totalBudget: number | null
}

type ProjectType = "renovation" | "new_build" | "development" | "maintenance"
```

### Relationships

- Belongs to User (owner)
- Has many Costs
- Has many Documents
- Has many Events
- Has many ProjectAccess records
- Has many ProjectContacts (through junction table)

## Contact

**Purpose:** Manages all project stakeholders including contractors, vendors, and service providers

**Key Attributes:**

- Extends BaseEntity (id, createdAt, updatedAt, deletedAt)
- firstName: string - Contact's first name
- lastName: string - Contact's last name
- company: string | null - Company name
- email: string | null - Email address
- phone: string | null - Phone number
- website: string | null - Website URL
- address: Address | null - Business/service address
- categoryId: string - Category ID from unified category system
- notes: string | null - Additional information

### TypeScript Interface

```typescript
interface Contact extends BaseEntity {
  firstName: string
  lastName: string
  company: string | null
  email: string | null
  phone: string | null
  website: string | null
  address: Address | null
  categoryId: string // References Category.id
  notes: string | null
}
```

### Relationships

- Has many Costs (as vendor)
- Has many Events (as participant)
- Has many Documents (as related party)
- Belongs to many Projects (through ProjectContact junction)

## Cost

**Purpose:** Tracks all financial transactions and expenses for projects

**Key Attributes:**

- Extends BaseEntity (id, createdAt, updatedAt, deletedAt)
- projectId: string - Associated project
- amount: number - Cost amount in cents (stored as integer)
- description: string - Cost description
- categoryId: string - Category ID from unified category system
- date: Date - Transaction date
- contactId: string | null - Optional vendor reference
- createdById: string - User who entered the cost

**Note:** Linked documents (receipts/invoices) are stored in the CostDocument junction table to maintain referential integrity and enable efficient document management.

### TypeScript Interface

```typescript
interface Cost extends BaseEntity {
  projectId: string
  amount: number // in cents
  description: string
  categoryId: string // References Category.id
  date: Date
  contactId: string | null
  createdById: string
}
```

### Relationships

- Belongs to Project
- Belongs to Contact (optional, as vendor)
- Has many Documents through CostDocument junction table
- Belongs to User (creator)

## CostDocument

**Purpose:** Junction table linking costs to supporting documents (receipts, invoices, proof of payment)

**Key Attributes:**

- Extends BaseEntity (id, createdAt, updatedAt, deletedAt)
- costId: string - Associated cost
- documentId: string - Associated document

### TypeScript Interface

```typescript
interface CostDocument extends BaseEntity {
  costId: string
  documentId: string
}
```

### Relationships

- Belongs to Cost (CASCADE on delete)
- Belongs to Document (CASCADE on delete)

### Database Constraints

```sql
-- Prevent duplicate document links
UNIQUE(cost_id, document_id) WHERE deleted_at IS NULL

-- Composite index for efficient queries
CREATE INDEX idx_cost_documents_cost ON cost_documents(cost_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_cost_documents_document ON cost_documents(document_id) WHERE deleted_at IS NULL;
```

## Document

**Purpose:** Stores metadata for all project files including photos, contracts, and receipts

**Key Attributes:**

- Extends BaseEntity (id, createdAt, updatedAt, deletedAt)
- projectId: string - Associated project
- fileName: string - Original file name
- fileSize: number - Size in bytes
- mimeType: string - File MIME type
- blobUrl: string - Netlify Blobs storage URL
- thumbnailUrl: string | null - Generated thumbnail for images
- categoryId: string - Category ID from unified category system
- uploadedById: string - User who uploaded

### TypeScript Interface

```typescript
interface Document extends BaseEntity {
  projectId: string
  fileName: string
  fileSize: number
  mimeType: string
  blobUrl: string
  thumbnailUrl: string | null
  categoryId: string // References Category.id
  uploadedById: string
}
```

### Relationships

- Belongs to Project
- Belongs to User (uploader)
- Can be linked to Costs
- Can be linked to Events
- Can be linked to Contacts

## Event

**Purpose:** Timeline entries tracking project milestones, meetings, and significant occurrences

**Key Attributes:**

- Extends BaseEntity (id, createdAt, updatedAt, deletedAt)
- projectId: string - Associated project
- title: string - Event title
- description: string | null - Detailed description
- date: Date - Event date/time
- categoryId: string - Category ID from unified category system
- createdById: string - User who created event

**Note:** Related contacts, documents, and costs are stored in separate junction tables (EventContact, EventDocument, EventCost) to maintain referential integrity and enable efficient querying.

### TypeScript Interface

```typescript
interface Event extends BaseEntity {
  projectId: string
  title: string
  description: string | null
  date: Date
  categoryId: string // References Category.id
  createdById: string
}
```

### Relationships

- Belongs to Project
- Has many Contacts through EventContact junction table
- Has many Documents through EventDocument junction table
- Has many Costs through EventCost junction table
- Belongs to User (creator)

## EventContact

**Purpose:** Junction table linking events to contacts (e.g., meeting attendees, inspection participants)

**Key Attributes:**

- Extends BaseEntity (id, createdAt, updatedAt, deletedAt)
- eventId: string - Associated event
- contactId: string - Associated contact

### TypeScript Interface

```typescript
interface EventContact extends BaseEntity {
  eventId: string
  contactId: string
}
```

### Relationships

- Belongs to Event (CASCADE on delete)
- Belongs to Contact (CASCADE on delete)

### Database Constraints

```sql
-- Prevent duplicate contact links
UNIQUE(event_id, contact_id) WHERE deleted_at IS NULL

-- Composite index for efficient queries
CREATE INDEX idx_event_contacts_event ON event_contacts(event_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_event_contacts_contact ON event_contacts(contact_id) WHERE deleted_at IS NULL;
```

## EventDocument

**Purpose:** Junction table linking events to documents (e.g., meeting notes, inspection photos)

**Key Attributes:**

- Extends BaseEntity (id, createdAt, updatedAt, deletedAt)
- eventId: string - Associated event
- documentId: string - Associated document

### TypeScript Interface

```typescript
interface EventDocument extends BaseEntity {
  eventId: string
  documentId: string
}
```

### Relationships

- Belongs to Event (CASCADE on delete)
- Belongs to Document (CASCADE on delete)

### Database Constraints

```sql
-- Prevent duplicate document links
UNIQUE(event_id, document_id) WHERE deleted_at IS NULL

-- Composite index for efficient queries
CREATE INDEX idx_event_documents_event ON event_documents(event_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_event_documents_document ON event_documents(document_id) WHERE deleted_at IS NULL;
```

## EventCost

**Purpose:** Junction table linking events to costs (e.g., expenses incurred during an event)

**Key Attributes:**

- Extends BaseEntity (id, createdAt, updatedAt, deletedAt)
- eventId: string - Associated event
- costId: string - Associated cost

### TypeScript Interface

```typescript
interface EventCost extends BaseEntity {
  eventId: string
  costId: string
}
```

### Relationships

- Belongs to Event (CASCADE on delete)
- Belongs to Cost (CASCADE on delete)

### Database Constraints

```sql
-- Prevent duplicate cost links
UNIQUE(event_id, cost_id) WHERE deleted_at IS NULL

-- Composite index for efficient queries
CREATE INDEX idx_event_costs_event ON event_costs(event_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_event_costs_cost ON event_costs(cost_id) WHERE deleted_at IS NULL;
```

## ProjectAccess

**Purpose:** Junction table managing partner access permissions to specific projects

**Key Attributes:**

- Extends BaseEntity (id, createdAt, updatedAt, deletedAt)
- projectId: string - Project being shared
- userId: string - Partner user with access
- permission: enum('read', 'write') - Access level
- invitedAt: Date - Invitation timestamp
- acceptedAt: Date | null - Acceptance timestamp

### TypeScript Interface

```typescript
interface ProjectAccess extends BaseEntity {
  projectId: string
  userId: string
  permission: "read" | "write"
  invitedAt: Date
  acceptedAt: Date | null
}
```

### Relationships

- Belongs to Project
- Belongs to User (partner)

## AuditLog

**Purpose:** Comprehensive audit trail of all user actions for activity feeds and partner transparency

**Key Attributes:**

- id: string (UUID) - Unique identifier
- projectId: string - Associated project
- userId: string - User who performed the action
- action: string - Action type (e.g., 'cost.created', 'document.uploaded')
- entityType: string - Type of entity affected ('cost', 'contact', 'document', 'event')
- entityId: string - ID of the affected entity
- changes: JSON | null - Optional change details (for updates)
- metadata: JSON | null - Additional context (e.g., amount for costs, filename for documents)
- createdAt: Date - When the action occurred

**Note:** AuditLog does NOT extend BaseEntity as it's immutable (no updates or deletes)

### TypeScript Interface

```typescript
interface AuditLog {
  id: string
  projectId: string
  userId: string
  action: AuditAction
  entityType: EntityType
  entityId: string
  changes: Record<string, any> | null
  metadata: AuditMetadata | null
  createdAt: Date
}

type AuditAction =
  | "created"
  | "updated"
  | "deleted"
  | "uploaded"
  | "linked"
  | "unlinked"
  | "invited"
  | "accessed"

type EntityType = "cost" | "contact" | "document" | "event" | "project" | "user"

interface AuditMetadata {
  displayName?: string // Human-readable description
  amount?: number // For cost-related actions
  fileName?: string // For document uploads
  previousValue?: any // For updates
  newValue?: any // For updates
  relatedEntities?: Array<{ type: string; id: string; name: string }>
}

// Example audit log entries:
// {
//   action: 'created',
//   entityType: 'cost',
//   metadata: { displayName: 'Added $1,500 for plumbing materials', amount: 150000 }
// }
// {
//   action: 'uploaded',
//   entityType: 'document',
//   metadata: { fileName: 'kitchen-progress.jpg', displayName: 'Uploaded kitchen progress photo' }
// }
```

### Relationships

- Belongs to Project
- Belongs to User (performer)
- References any entity type through entityType/entityId combination

## ProjectContact

**Purpose:** Junction table linking contacts to specific projects

**Key Attributes:**

- Extends BaseEntity (id, createdAt, updatedAt, deletedAt)
- projectId: string - Associated project
- contactId: string - Associated contact

### TypeScript Interface

```typescript
interface ProjectContact extends BaseEntity {
  projectId: string
  contactId: string
}
```

### Relationships

- Belongs to Project
- Belongs to Contact
