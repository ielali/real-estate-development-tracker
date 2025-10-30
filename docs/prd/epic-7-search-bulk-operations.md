# Epic 7: Search & Bulk Operations - Brownfield Enhancement

## Epic Goal

Dramatically improve user productivity by implementing global search across all project entities and bulk import/export capabilities for costs, enabling users to quickly find information and migrate from spreadsheets efficiently.

## Epic Description

### Existing System Context

- **Current functionality:** Manual navigation through projects, costs, vendors, contacts, documents
- **Database:** Neon PostgreSQL with Drizzle ORM
- **Technology stack:** Next.js 14 + TypeScript + tRPC + React Query
- **Data entities:** Projects, costs (with categories), vendors, contacts, documents, timeline events
- **UI framework:** Shadcn/ui components with Tailwind CSS

### Enhancement Details

**What's being added/changed:**

- Global search component accessible from main navigation
- Full-text search across projects, costs, vendors, contacts, documents
- CSV import for bulk cost entry
- CSV/Excel export for costs and financial reports

**How it integrates:**

- **Search:** New tRPC endpoint with PostgreSQL full-text search, accessible via command palette (Cmd+K)
- **Import:** CSV parser validates and bulk inserts costs to existing projects
- **Export:** Generates CSV/Excel files from cost data with filtering options

**Success criteria:**

- Users can search from any page and get results within 500ms
- Search returns relevant results from all entities
- Users can import 100+ cost entries from CSV in one operation
- Export generates properly formatted spreadsheets for existing reporting tools
- Validation prevents malformed data from imports

## Stories

### Story 7.1: Implement Global Search with Command Palette

**Objective:** Create fast, accessible search across all project data

**Tasks:**

- Create command palette UI (Cmd+K / Ctrl+K) using Shadcn/ui Command component
- Implement full-text search across projects, costs, vendors, contacts, documents
- Use PostgreSQL `to_tsvector` and `to_tsquery` for performant search:
  - Index on projects (name, description)
  - Index on costs (description, notes)
  - Index on vendors (name, company)
  - Index on contacts (name, email)
  - Index on documents (filename, title)
- Display categorized results with entity type indicators
- Add keyboard navigation and quick access to results
- Include search filters (by entity type, by project, by date range)
- Implement search result highlighting
- Add recent searches (stored in localStorage)
- Optimize query performance with GIN indexes

**Acceptance Criteria:**

- [ ] Command palette opens with Cmd+K (Mac) or Ctrl+K (Windows/Linux)
- [ ] Search queries return results within 500ms
- [ ] Results categorized by entity type (Projects, Costs, Vendors, etc.)
- [ ] Each result shows entity name + preview text + project context
- [ ] Clicking result navigates to entity detail page
- [ ] Keyboard navigation works (arrow keys, Enter to select, Esc to close)
- [ ] Empty state shows recent searches and suggestions
- [ ] Search filters work (entity type, project, date range)
- [ ] Search highlights matching text in results
- [ ] Recent searches stored and displayed (last 10)
- [ ] Search tested with 10,000+ records (performance acceptable)
- [ ] Search respects RBAC (users only see entities they have access to)

### Story 7.2: CSV Import for Bulk Cost Entry

**Objective:** Enable efficient migration from spreadsheets with bulk cost import

**Tasks:**

- Create CSV import UI in project cost management section
- Implement CSV parser with Zod validation:
  - Required fields: date, description, amount, category
  - Optional fields: vendor, notes
- Preview imported data before committing to database
- Show validation errors with line numbers for corrections
- Map CSV columns to existing cost categories (dropdown for unmapped categories)
- Support vendor matching by name (create if not found)
- Bulk insert validated costs using Drizzle ORM transactions (all-or-nothing)
- Add support for common date formats (MM/DD/YYYY, YYYY-MM-DD, DD/MM/YYYY)
- Generate import summary (X costs imported, Y errors)
- Download error report (CSV with error messages)
- Log import activity (who imported, when, how many costs)

**Acceptance Criteria:**

- [ ] "Import Costs" button visible in project cost list
- [ ] CSV upload accepts .csv and .txt files
- [ ] CSV parser handles common formats (comma, tab, semicolon delimited)
- [ ] Preview shows first 10 rows with column mapping interface
- [ ] User can map CSV columns to database fields
- [ ] Validation shows errors with line numbers
- [ ] Category dropdown shows existing categories for mapping
- [ ] Vendor matching works by name (case-insensitive)
- [ ] Option to create new vendors from import
- [ ] All-or-nothing import (transaction rolls back on any error)
- [ ] Success message shows count of imported costs
- [ ] Error report downloadable if validation fails
- [ ] Import tested with 500+ cost entries
- [ ] Import tested with various date formats
- [ ] Import tested with special characters and unicode
- [ ] Import activity logged for audit trail

### Story 7.3: CSV/Excel Export for Costs and Reports

**Objective:** Enable data export for external reporting and analysis

**Tasks:**

- Add export button to cost list views
- Generate CSV export with all cost fields:
  - Date, Description, Amount, Category, Vendor, Notes, Created By, Created Date
- Generate Excel export with formatted sheets:
  - **Sheet 1 (Summary):** Project totals by category with chart
  - **Sheet 2 (Detailed Costs):** All cost entries with formatting
  - **Sheet 3 (Vendors):** Vendor summary with totals
- Include filtering options (date range, categories, vendors)
- Implement server-side generation to handle large datasets
- Provide download with descriptive filename:
  - CSV: `project-name-costs-YYYY-MM-DD.csv`
  - Excel: `project-name-costs-YYYY-MM-DD.xlsx`
- Add export button to vendor list (vendor report)
- Add export history (last 10 exports with download links)
- Implement rate limiting (max 10 exports per hour per user)

**Acceptance Criteria:**

- [ ] "Export Costs" button visible in cost list view
- [ ] Export menu offers CSV and Excel formats
- [ ] Filter dialog allows date range, category, vendor selection
- [ ] CSV export includes all cost fields with headers
- [ ] Excel export has three sheets (Summary, Costs, Vendors)
- [ ] Excel summary sheet includes category totals and chart
- [ ] Excel formatting applied (headers bold, currency format, borders)
- [ ] Generated files download with descriptive filenames
- [ ] Large exports (1000+ costs) complete successfully (<10s)
- [ ] Export history shows last 10 exports with re-download links
- [ ] Vendor report export includes vendor totals and project count
- [ ] Rate limiting enforced (10 exports/hour/user)
- [ ] Export respects RBAC (users only export data they can view)
- [ ] Export tested with special characters and unicode
- [ ] Exported files open correctly in Excel, Google Sheets, Numbers

## Compatibility Requirements

- [x] Existing cost entry workflows remain unchanged
- [x] Database schema unchanged for core tables (add search indexes)
- [x] UI changes follow Shadcn/ui patterns (Command palette component)
- [x] Performance: Search indexed with PostgreSQL GIN indexes
- [x] Import validates all data before database writes (no partial failures)
- [x] Export operations are read-only (no data modification risk)

## Risk Mitigation

**Primary Risk:** Import could corrupt data with malformed CSV or incorrect category mappings

**Mitigation:** Preview before commit, transaction-based import (all-or-nothing), extensive Zod validation, error reporting with line numbers

**Rollback Plan:** Import operations logged; can identify and delete imported batches by timestamp; exports are read-only (no risk); search can be disabled via feature flag if performance issues

## Definition of Done

- [ ] All stories completed with acceptance criteria met
- [ ] Existing cost entry and display flows verified (unchanged)
- [ ] Search performance tested with 10,000+ records (sub-500ms response)
- [ ] Search tested across all entity types with various queries
- [ ] Import tested with various CSV formats and edge cases
- [ ] Import tested with validation errors and correction workflow
- [ ] Export tested with large datasets (1000+ costs)
- [ ] Export files tested in Excel, Google Sheets, and Numbers
- [ ] Rate limiting tested for import and export
- [ ] RBAC tested (users only search/import/export their accessible data)
- [ ] Documentation: CSV format guide, import troubleshooting, export options
- [ ] No regression in existing cost management features

## Story Manager Handoff

**Story Manager Handoff:**

"Please develop detailed user stories for this brownfield epic. Key considerations:

- This is an enhancement to an existing system running Next.js 14 + TypeScript + tRPC + Drizzle ORM
- Integration points: Neon PostgreSQL full-text search, existing cost/vendor/project data models
- Existing patterns to follow: Shadcn/ui Command component, Zod validation, Drizzle transactions
- Critical compatibility requirements: No changes to existing cost entry flows, all imports must be validated and atomic
- Each story must include verification that existing functionality remains intact
- Performance is critical: search must be <500ms, imports/exports must handle large datasets

The epic should dramatically improve productivity while maintaining data integrity and system stability."
