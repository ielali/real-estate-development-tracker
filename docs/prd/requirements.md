# Requirements

## Functional Requirements

- **FR1:** The system shall enable creation and management of multiple real estate development projects with metadata (name, address, dates, status)
- **FR2:** The system shall provide quick expense entry with amount, date, category, description, and vendor linkage for comprehensive cost tracking
- **FR3:** The system shall maintain a contact directory of project stakeholders (contractors, vendors, partners) with role categorization and relationship tracking
- **FR4:** The system shall support document and photo uploads directly from device camera or file system with automatic project association
- **FR5:** The system shall display chronological project timelines with events linked to relevant contacts and documents
- **FR6:** The system shall provide secure partner access via email invitation with role-based permissions (admin/read-only)
- **FR7:** The system shall calculate and display running cost totals per project with category breakdowns for tax reporting
- **FR8:** The system shall link all entities (costs to vendors, documents to events, photos to timeline) for complete relationship context
- **FR9:** The system shall work seamlessly on mobile browsers for on-site data entry and photo capture
- **FR10:** The system shall provide instant read-only dashboard views for partners without requiring data export or report generation

## Non-Functional Requirements

- **NFR1:** The system shall load pages in under 2 seconds on standard broadband connections
- **NFR2:** The system shall be fully responsive, supporting desktop, tablet, and mobile browsers (iOS Safari, Android Chrome priority)
- **NFR3:** The system shall secure all data transmission with HTTPS and implement session-based authentication via Better-auth
- **NFR4:** The system shall store all data in a portable SQLite database with regular automated backups
- **NFR5:** The system shall optimize images before storage to balance quality and loading performance
- **NFR6:** The system shall maintain data integrity with proper database constraints and relationship validations
- **NFR7:** The system shall provide intuitive navigation requiring no training for basic operations
- **NFR8:** The system shall support concurrent access by multiple partners viewing the same project data
- **NFR9:** The system shall handle document uploads up to 10MB per file with appropriate error messaging
- **NFR10:** The system shall operate within Vercel free tier limits initially while maintaining acceptable performance
