# Real Estate Development Tracker - Complete UI/UX Design Brief

## Project Overview

**Application Name:** Real Estate Development Tracker  
**Platform:** Progressive Web App (Mobile-first, Desktop-responsive)  
**Target Users:** Real estate developers and their business partners  
**Design Tool:** To be designed in Google Stitches (or your preferred design tool)

## Application Purpose

A comprehensive project management platform for real estate developers to:

- Manage multiple development projects in one place
- Track all project costs with tax-ready categorization
- Maintain contact directories for contractors, vendors, and partners
- Store and organize project documents and photos
- Provide instant transparency to business partners via professional dashboards
- Replace fragmented tools (spreadsheets, folders, contact lists)
- Enable mobile-friendly on-site data entry and photo capture

**Key Business Goal:** Reduce partner update preparation time from 3-5 hours to under 30 minutes through instant dashboard access.

---

## Design System Requirements

### Visual Style

- **Aesthetic:** Clean, professional, modern, data-focused
- **Approach:** Mobile-first design that feels premium without complexity
- **Philosophy:** Emphasize data clarity over decorative elements
- **Quality:** Polished interactions with smooth animations

### Typography

- Modern, professional sans-serif font family
- Clear hierarchy with consistent scale
- Excellent legibility on mobile screens
- Consider: Inter, SF Pro, or similar system fonts

### Color Palette

- **Base:** Professional neutrals (grays, whites)
- **Accent:** Subtle, trustworthy colors (blues recommended for finance)
- **Success/Warning/Error:** Standard semantic colors
- **Contrast:** Must meet WCAG AA standards (4.5:1 minimum)
- **Charts:** Professional, distinguishable color palette for data visualization

### Spacing System

- Based on 4px/8px grid system
- Consistent padding and margins
- Adequate white space for clarity
- Thumb-friendly touch targets on mobile (minimum 44x44px)

### Animations & Transitions

- Smooth, subtle animations (not excessive)
- Duration: 200-300ms for most transitions
- Effects: Fade-ins, smooth scrolling, gentle transitions
- Card hover effects and micro-interactions
- Respect `prefers-reduced-motion` setting
- Purpose: Enhance perceived performance and professionalism

---

## Core Screen Designs Needed

### 1. Authentication Screens

#### 1.1 Login Page

- Email and password fields
- "Remember me" checkbox
- "Forgot password" link
- Login button (primary CTA)
- Registration link for new users
- Clean, centered layout
- Optional: Social login (future enhancement)

#### 1.2 Registration Page

- Name, email, password fields
- Password strength indicator
- Terms acceptance checkbox
- Create account button
- Link back to login

#### 1.3 Two-Factor Authentication Setup

- QR code display for authenticator apps
- Backup codes list (10 codes)
- Instructions for setup
- "Enable 2FA" button
- "Skip for now" option

#### 1.4 2FA Login Challenge

- 6-digit code input field
- "Use backup code" link
- "Remember this device" checkbox
- Submit button

---

### 2. Main Dashboard (Project Overview)

#### Layout Components:

- **Header/Navigation Bar:**
  - App logo/name
  - Global search icon (triggers Cmd+K command palette)
  - Quick actions dropdown (+ Create Project, Add Cost)
  - Notifications bell icon with unread badge
  - User profile menu

- **Project Cards Grid:**
  - Responsive grid (1 column mobile, 2-3 columns desktop)
  - Each card shows:
    - Project name and address
    - Status badge (Active/On Hold/Completed)
    - Key metrics: Total cost, days elapsed, last activity
    - Progress indicators
    - Recent activity preview (last 2-3 items)
    - Subtle hover effects
    - Click to open project detail

- **Empty State:**
  - Illustration or icon
  - "No projects yet" message
  - "Create your first project" button
  - Helpful getting started tips

- **Filters/Sorting:**
  - Status filter chips (All, Active, Completed, On Hold)
  - Sort dropdown (Recent, A-Z, Cost High-Low)

---

### 3. Project Detail View (Tabbed Interface)

#### Header Section:

- Breadcrumb navigation
- Project name (editable inline)
- Project switcher dropdown
- Quick actions menu (Add Cost, Upload Document, Add Event)
- Edit project button
- More options menu (Share, Generate Report, Settings, Archive)

#### Tab Navigation:

- Overview
- Costs
- Timeline
- Documents
- Contacts
- Settings

#### 3.1 Overview Tab

- **Key Metrics Cards:**
  - Total costs
  - Budget vs. actual (if budget set)
  - Number of vendors
  - Days elapsed
  - Recent activity count

- **Cost Breakdown Chart:**
  - Pie chart showing spending by category
  - Legend with percentages
  - Interactive segments

- **Spending Trend:**
  - Line chart over time
  - Date range selector

- **Recent Activity Feed:**
  - Chronological list of recent costs, documents, events
  - Icons for each type
  - Timestamps
  - "View all" link

- **Google Maps Display:**
  - Project location with marker
  - Street view button
  - Directions link

#### 3.2 Costs Tab

- **Filters Bar:**
  - Date range picker
  - Category filter (multi-select)
  - Vendor filter (searchable dropdown)
  - Search box for description
  - Applied filters as dismissible chips
  - "Clear all filters" button

- **Action Buttons:**
  - "Add Cost" (primary button)
  - "Import from CSV"
  - "Export" dropdown (CSV, Excel)
  - Templates menu

- **Costs Table/List:**
  - Desktop: Table with columns (Date, Description, Amount, Category, Vendor, Actions)
  - Mobile: Card view with same information
  - Sortable columns
  - Row actions (Edit, Delete, Comment)
  - Running total at bottom
  - Pagination or infinite scroll

- **Cost Templates Widget:**
  - Saved templates panel (collapsible)
  - Apply template button
  - Manage templates link

- **Empty State:**
  - "No costs yet" message
  - "Click 'Add Cost' to get started" button

#### 3.3 Timeline Tab

- **Visual Timeline:**
  - Chronological vertical timeline
  - Month/year markers
  - Event cards with:
    - Date
    - Title
    - Description
    - Linked contacts (avatars)
    - Attached documents (count)
    - Comment count

- **Add Event Button:**
  - Floating action button (mobile)
  - Primary button (desktop)

- **Filters:**
  - Event type filter
  - Date range
  - Linked contact filter

#### 3.4 Documents Tab

- **Upload Area:**
  - Drag-and-drop zone
  - "Browse files" button
  - "Take photo" button (mobile)
  - Upload progress indicators
  - Multiple file support

- **Document Grid/List:**
  - Thumbnail view for images
  - File type icons for documents
  - File name, size, upload date
  - Category tags
  - Actions (Download, Delete, View)

- **Filters:**
  - By type (Photos, Invoices, Contracts, etc.)
  - By date range
  - By uploader

- **Document Preview Modal:**
  - Large preview
  - Download button
  - Delete button (if owner)
  - Metadata display
  - Comment thread below

#### 3.5 Contacts Tab

- **Contacts List:**
  - Searchable
  - Filter by category (hierarchical)
  - Contact cards showing:
    - Name and company
    - Role/category
    - Phone, email
    - Total spent on this project
    - Last interaction date
    - Quick actions (Call, Email, View)

- **Add Contact Button:**
  - Primary CTA
  - Quick add from cost entry

- **Contact Detail View:**
  - Full contact information
  - Related costs list
  - Related projects list
  - Activity timeline
  - Performance rating (if available)
  - Edit/Delete buttons

#### 3.6 Settings Tab

- Project information form
- Team members/partners list
- Access control settings
- Budget settings
- Notification preferences
- Archive project button

---

### 4. Cost Entry Form (Quick Add)

#### Optimized for Mobile:

- Large, thumb-friendly input fields
- Amount field (numeric keyboard)
- Date picker (defaults to today)
- Category dropdown with icons
- Description textarea
- Vendor/contact selection:
  - Searchable dropdown
  - Recent contacts quick-select
  - "Create new vendor" quick button
- Optional fields (collapsible):
  - Notes
  - Receipt photo upload
- Template options:
  - "Save as template" checkbox
  - Apply existing template button
- Auto-save indicator (drafts saved every 1 second)
- Submit button (disabled during save)
- Cancel button

#### Desktop Version:

- Same fields in compact layout
- Side-by-side where appropriate
- Keyboard shortcuts noted

---

### 5. Global Search / Command Palette (Cmd+K)

#### Modal Design:

- Full-width overlay on mobile
- Centered modal on desktop
- Search input at top
- Search results categorized:
  - Projects
  - Costs
  - Vendors/Contacts
  - Documents
  - Timeline Events
- Each result shows:
  - Entity name/description
  - Preview text
  - Project context
  - Icon for type
- Keyboard navigation support
- Shortcuts reference at bottom
- Recent searches (if no query)
- Empty state with suggestions

---

### 6. Partner Dashboard (Read-Only View)

#### Professional, Clean Design:

- Simplified navigation (limited options)
- Project selector (if multiple projects)
- "Partner View" indicator
- Key metrics dashboard:
  - Project status
  - Total investment
  - Cost breakdown
  - Timeline milestones
- Visualizations:
  - Professional charts
  - Smooth animations
  - Interactive tooltips
- Documents gallery (view only)
- Timeline view
- Contact information
- Export/print options
- No edit capabilities (all buttons hidden)

---

### 7. Contact Directory (Global View)

- All contacts across all projects
- Hierarchical category filters:
  - Construction Team
  - Trades (Electrician, Plumber, etc.)
  - Design & Planning
  - Consultants
  - Legal & Financial
  - Government & Compliance
  - Suppliers & Vendors
  - Real Estate
  - Investment Partners
  - Other Services
- Search and sort options
- Contact cards in grid
- Quick actions on each card
- Add contact button

---

### 8. Notification Center

#### Bell Icon Dropdown:

- Unread count badge
- Dropdown panel with:
  - "Mark all as read" button
  - Notifications grouped by date
    - Today
    - Yesterday
    - This Week
    - Older
- Each notification:
  - Icon for type
  - Message text
  - Timestamp
  - Read/unread indicator
  - Click to navigate
- Notification preferences link
- Empty state when no notifications

---

### 9. Notification Settings Page

- Toggle switches for each type:
  - Email on new costs
  - Email on large expenses (>$10k)
  - Email on documents uploaded
  - Email on timeline events
  - Email on comments/mentions
- Digest frequency radio buttons:
  - Immediate
  - Daily digest
  - Weekly digest
  - Never
- Time zone selector
- Save button with optimistic updates

---

### 10. Portfolio Analytics Dashboard

_(Only visible if user has 2+ projects)_

#### Layout:

- Project multi-select filter
- Date range filter
- Key portfolio metrics:
  - Total portfolio value
  - Number of projects
  - Average project cost
  - Total vendors used

#### Visualizations:

- **Category Spend Comparison:**
  - Grouped bar chart
  - Projects side-by-side
  - Color-coded by project

- **Cost Trends Over Time:**
  - Multi-line chart
  - One line per project
  - Interactive legend

- **Vendor Usage Across Portfolio:**
  - Table with sorting
  - Vendor name, project count, total spend

- **Timeline Duration Comparison:**
  - Horizontal bar chart
  - Project names with durations

#### Export Options:

- Export portfolio data (CSV/Excel)
- Export chart as image (PNG)

---

### 11. Report Generation Interface

#### Modal/Page Design:

- Report type selection:
  - PDF (Investor Report)
  - Excel (Detailed Export)
- Date range picker
- Sections to include (checkboxes):
  - Executive summary
  - Cost breakdown
  - Vendor summary
  - Timeline
  - Documents inventory
- Preview button (optional)
- Generate button
- Progress indicator during generation
- Download link when ready

---

### 12. Vendor Performance & Rating

#### Vendor Profile Page:

- Vendor information
- Performance metrics cards:
  - Total projects
  - Total spent
  - Average cost
  - Last used date
- Star rating display (average)
- Rating count
- Rating & review section:
  - User's rating per project
  - Star input component
  - Review textarea (500 char limit)
  - Submit button
- Other users' ratings list (if multi-user project)

#### Vendor Comparison View:

- Select up to 5 vendors
- Side-by-side comparison table
- Metrics for each vendor
- Highlight best in each category

---

### 13. Comments Component (Reusable)

#### Design:

- Comment list (chronological)
- Each comment:
  - User avatar
  - User name
  - Timestamp
  - Comment content (markdown support)
  - "Edited" indicator if modified
  - Reply button
  - Edit/Delete (own comments)
- Nested replies (one level deep):
  - Indented
  - Visual connector
- Comment form at bottom:
  - Textarea with character counter (2000 max)
  - @mention autocomplete
  - Submit button
  - Cancel (for replies)
- Empty state: "No comments yet"

---

### 14. Import/Export Interfaces

#### CSV Import Modal:

- File upload area
- Instructions for CSV format
- Preview table (first 10 rows)
- Column mapping interface:
  - CSV columns on left
  - Database fields on right
  - Drag to map
- Category dropdown for mapping
- Vendor matching options
- Validation error display (with line numbers)
- Import button
- Cancel button
- Progress indicator
- Success/error summary

#### Export Options Menu:

- Format selection (CSV, Excel, PDF)
- Date range picker
- Filter options
- Section selection (for reports)
- Generate/Download button

---

## Responsive Breakpoints

### Mobile (< 768px)

- Single column layouts
- Bottom navigation (optional)
- Hamburger menu for secondary navigation
- Full-width forms
- Card-based lists (not tables)
- Swipe gestures for actions
- FABs for primary actions

### Tablet (768px - 1024px)

- 2-column grids where appropriate
- Side navigation or tab bar
- Hybrid of mobile and desktop patterns
- Touch-optimized controls

### Desktop (> 1024px)

- Multi-column layouts
- Persistent side navigation
- Data tables (not cards)
- Hover states prominent
- Keyboard shortcuts indicated
- More information density

---

## Accessibility Requirements (WCAG AA)

### Must Include:

- Semantic HTML equivalent indicators
- Proper heading hierarchy
- ARIA labels for interactive elements
- Keyboard navigation for all workflows
- Focus indicators (visible and clear)
- Skip links for navigation
- Alt text for images
- Color contrast ratios ≥ 4.5:1
- Touch targets ≥ 44x44px
- Screen reader friendly labels
- Form error associations
- Loading and error states clearly communicated

---

## Interaction Patterns

### Key Behaviors:

- **One-tap actions:** Quick add cost, upload photo
- **Progressive disclosure:** Summary views with drill-down
- **Smart defaults:** Pre-filled dates, recent contacts
- **Inline editing:** Update information without page transitions
- **Optimistic updates:** Show changes immediately
- **Loading states:** Skeletons, spinners, progress bars
- **Error handling:** Toast notifications, inline validation
- **Empty states:** Helpful guidance and CTAs
- **Confirmation dialogs:** For destructive actions
- **Context menus:** Right-click/long-press options
- **Drag and drop:** File uploads, reordering

---

## Components Library to Design

### Navigation Components:

- Top navigation bar
- Breadcrumbs
- Tabs
- Side navigation (desktop)
- Bottom navigation (mobile)
- Command palette

### Data Display:

- Project cards
- Metric cards/stats
- Data tables (desktop)
- Card lists (mobile)
- Timeline visualization
- Charts (pie, bar, line)

### Forms:

- Text inputs
- Textareas
- Dropdowns/Select
- Date pickers
- File upload zones
- Toggle switches
- Radio buttons
- Checkboxes
- Star rating input

### Buttons:

- Primary buttons
- Secondary buttons
- Tertiary/ghost buttons
- Icon buttons
- FABs (Floating Action Buttons)
- Split buttons / dropdowns
- Button groups

### Feedback:

- Toast notifications
- Inline validation errors
- Loading spinners
- Skeleton screens
- Progress bars
- Empty states
- Error states
- Success confirmations

### Overlays:

- Modals
- Drawers (mobile)
- Dropdowns
- Tooltips
- Popovers
- Command palette

### Misc:

- Badge/pill components
- Avatar components
- Image thumbnails
- Document preview cards
- Comment threads
- Filter chips
- Action menus

---

## User Flows to Visualize

### 1. New User Onboarding

Login → Create First Project → Add First Cost → View Dashboard

### 2. Daily Site Visit (Developer)

Open App → Select Project → Add Cost (photo + amount) → Upload Photo → Done

### 3. Partner Review

Login → View Dashboard → Review Cost Breakdown → View Timeline → Check Documents

### 4. Monthly Reporting

Select Project → Generate Report → Choose Format → Download → Share with Partners

### 5. Vendor Management

View Contacts → Select Vendor → Review Performance → Rate Vendor → Decide on Rehire

---

## Priority Screen Order for Design

**Phase 1 (MVP Core):**

1. Login/Registration
2. Main Dashboard (Project Cards)
3. Project Detail - Costs Tab
4. Cost Entry Form
5. Project Detail - Overview Tab
6. Partner Dashboard (Read-only)

**Phase 2 (Essential Features):** 7. Project Detail - Documents Tab 8. Project Detail - Timeline Tab 9. Project Detail - Contacts Tab 10. Contact Directory 11. Document Upload Interface 12. Global Search / Command Palette

**Phase 3 (Enhanced Features):** 13. Notification Center 14. Notification Settings 15. CSV Import/Export Interfaces 16. Comments Component 17. 2FA Setup Screens

**Phase 4 (Advanced Features):** 18. Portfolio Analytics Dashboard 19. Report Generation Interface 20. Vendor Performance Pages 21. Project Settings

---

## Branding Notes

- Clean, trustworthy, professional
- Not overly corporate or stuffy
- Approachable but serious (handling real money)
- Mobile-friendly feeling (not just responsive)
- Australian market focus (consider local conventions)
- Emphasizes transparency and clarity

---

## Technical Context for Designers

**Framework:** Next.js 14 with React  
**UI Library:** Shadcn/ui components (customizable Radix UI primitives)  
**Styling:** Tailwind CSS (utility-first)  
**Charts:** Recharts library  
**Icons:** Lucide icons (or similar)  
**Fonts:** System fonts for performance

**Note:** Designs should be achievable with Shadcn/ui component patterns. Review Shadcn/ui documentation for component capabilities.

---

## Deliverables

### What to Create in Design Tool:

1. **Design System / Style Guide**
   - Color palette
   - Typography scale
   - Spacing system
   - Component library
   - Icon set
   - Animation examples

2. **Screen Designs (Desktop & Mobile)**
   - All screens listed above
   - Both states (empty, populated with data)
   - Interactive states (hover, focus, active, disabled)
   - Error states
   - Loading states

3. **User Flow Diagrams**
   - Key user journeys visualized
   - Navigation architecture
   - Modal/overlay behavior

4. **Interactive Prototype**
   - Clickable prototype demonstrating key flows
   - Transitions and animations indicated
   - Mobile and desktop versions

5. **Developer Handoff**
   - Annotated designs with spacing
   - Component specifications
   - Asset exports
   - Animation timing/easing notes

---

## Success Criteria

The designs are successful if they:

- ✅ Enable quick data entry on mobile (especially cost entry)
- ✅ Present financial information clearly and professionally
- ✅ Work seamlessly across mobile, tablet, and desktop
- ✅ Meet WCAG AA accessibility standards
- ✅ Feel polished with smooth animations
- ✅ Inspire confidence for managing real money
- ✅ Provide instant transparency to partners
- ✅ Reduce cognitive load through clear visual hierarchy
- ✅ Support the goal of sub-30-minute partner updates

---

## Final Notes

This platform consolidates scattered tools into one cohesive system for real estate developers. The design should reflect:

- **Efficiency:** Fast data entry, clear information architecture
- **Trust:** Professional appearance suitable for investors/lenders
- **Transparency:** Clear visualization of costs and progress
- **Mobile-First:** On-site usability is critical
- **Simplicity:** No training needed for basic operations

Think of this as a "mission control" for development projects - providing a comprehensive view while remaining intuitive and accessible.
