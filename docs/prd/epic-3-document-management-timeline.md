# Epic 3: Document Management & Timeline

**Epic Goal:** Implement comprehensive document and photo storage with project timelines, solving the scattered files problem. This epic centralizes all project artifacts with proper organization and creates a chronological narrative of project progress.

## Story 3.1: Document Upload System

As a developer,
I want to upload documents and photos to projects,
so that all files are centralized.

### Acceptance Criteria
1: File upload with drag-and-drop or click-to-browse
2: Direct camera access for mobile photo capture
3: Multiple file selection supported
4: File type validation (images, PDFs, common documents)
5: Upload progress indication with cancel option
6: 10MB file size limit with clear error messaging

## Story 3.2: Document Storage and Organization

As a developer,
I want documents organized and easily retrievable,
so that I never waste time searching.

### Acceptance Criteria
1: Documents stored as blobs in SQLite initially
2: Automatic file type categorization (invoice, photo, contract, etc.)
3: Document thumbnail generation for preview
4: Chronological and categorical organization options
5: Document metadata (upload date, size, type) displayed
6: Download original file functionality

## Story 3.3: Timeline and Event Management

As a developer,
I want to log project events and milestones,
so that I can track project progression.

### Acceptance Criteria
1: Event creation with date, title, description
2: Events displayed in chronological timeline view
3: Events linkable to contacts (meeting with builder, etc.)
4: Timeline visualization with month/year markers
5: Filter timeline by event type or linked contact
6: Quick event entry from mobile with minimal fields

## Story 3.4: Document-Entity Relationships

As a developer,
I want to link documents to costs, contacts, and events,
so that everything has context.

### Acceptance Criteria
1: Link documents to specific costs (receipts, invoices)
2: Attach documents to events (permits, approvals)
3: Associate documents with contacts (contracts, quotes)
4: View all related documents from any entity
5: Bulk document association interface
6: Orphaned document report for cleanup
