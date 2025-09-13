# Epic 2: Financial Tracking & Contact Management

**Epic Goal:** Complete the financial tracking system with full contact linkage and management capabilities. This epic transforms the platform into a complete spreadsheet replacement by establishing relationships between costs and contacts (vendors, contractors, partners, etc.) with proper categorization for tax purposes.

## Story 2.1: Contact Management System

As a developer,
I want to maintain a directory of project contacts,
so that I can track who is involved in each project.

### Acceptance Criteria
1: Contact creation with name, company, role, phone, email, and website fields
2: **Comprehensive hierarchical contact categorization system:**
   - **Construction Team**
     - Builder/General Contractor
     - Site Supervisor
     - Project Manager
     - Subcontractors (Framing, Roofing, etc.)
   - **Trades**
     - Electrician
     - Plumber
     - HVAC Specialist
     - Carpenter
     - Tiler
     - Painter
     - Landscaper
     - Concreter
     - Bricklayer
     - Glazier
     - Roofer
     - Flooring Specialist
   - **Design & Planning**
     - Architect
     - Draftsperson
     - Interior Designer
     - Structural Engineer
     - Civil Engineer
     - Surveyor
     - Town Planner
     - Landscape Architect
   - **Consultants**
     - Building Inspector
     - Energy Assessor
     - Quantity Surveyor
     - Geotechnical Engineer
     - Environmental Consultant
     - Heritage Consultant
     - Acoustic Consultant
   - **Legal & Financial**
     - Lawyer/Solicitor
     - Conveyancer
     - Accountant
     - Mortgage Broker
     - Bank/Lender
     - Insurance Broker
     - Financial Advisor
   - **Government & Compliance**
     - Council Officer
     - Building Certifier
     - Fire Safety Inspector
     - Development Assessment Officer
   - **Suppliers & Vendors**
     - Building Supplies
     - Hardware Store
     - Timber Supplier
     - Steel Supplier
     - Appliance Supplier
     - Fixture Supplier
     - Equipment Rental
   - **Real Estate**
     - Real Estate Agent
     - Property Manager
     - Buyer's Agent
     - Valuer
     - Auctioneer
     - Marketing/Staging Consultant
   - **Investment Partners**
     - Silent Partner
     - Joint Venture Partner
     - Private Investor
     - Investment Group
   - **Other Services**
     - Demolition Contractor
     - Waste Removal
     - Cleaning Service
     - Security Service
     - Photography/Videography
     - Marketing Agency
     - Custom/Other
3: Parent-child category filtering (e.g., select "Trades" to see all trade contacts)
4: Contact list view with search and filter capabilities by category hierarchy
5: Contact detail page showing related costs and projects
6: Edit and delete functionality for contacts
7: Validation prevents duplicate contacts
8: Ability to add custom subcategories under main parents

## Story 2.2: Cost-Contact Linkage

As a developer,
I want to link costs to specific contacts,
so that I can track spending by contractor/vendor.

### Acceptance Criteria
1: Cost entry form includes optional contact selection dropdown
2: Quick contact creation available from cost entry form
3: Contact spending summary visible on contact detail page
4: Costs grouped by contact in project view
5: Orphaned costs (no linked contact) clearly indicated
6: Bulk contact assignment for existing unlinked costs

## Story 2.3: Advanced Cost Categorization

As a developer,
I want detailed cost categories aligned with tax requirements,
so that year-end reporting is simplified.

### Acceptance Criteria
1: Comprehensive category list for Australian tax compliance
2: Categories include tax deductibility indicators
3: Custom category creation with parent-child relationships
4: Category spending breakdown in project dashboard
5: Export-ready category report for accountants
6: Historical category data preserved even if category deleted

## Story 2.4: Cost Filtering and Search

As a developer,
I want to search and filter costs across projects,
so that I can quickly find specific expenses.

### Acceptance Criteria
1: Search costs by description, amount range, or contact name
2: Filter by date range, category, or project
3: Sort options for date, amount, contact, category
4: Persistent filter preferences per session
5: Clear visual indication of active filters
6: Quick filter presets for common queries

## Story 2.5: Performance Benchmarks & Testing

As a developer,
I want to establish performance benchmarks and testing,
so that the application meets speed requirements.

### Acceptance Criteria
1: Performance benchmarks:
   - Page load time targets documented
   - Lighthouse CI configured with thresholds
   - Bundle size budgets established
   - Core Web Vitals targets defined
2: Performance testing:
   - Lighthouse CI integrated in GitHub Actions
   - Bundle size analysis on each build
   - Performance regression alerts
   - Mobile performance specifically tested
3: Accessibility testing:
   - Automated a11y testing with axe-core
   - WCAG AA compliance checks in CI
   - Keyboard navigation testing checklist
   - Screen reader testing documented
