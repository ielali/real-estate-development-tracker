# UX Design Specification - Epic 10.3: Screen Design Improvements

**Version:** 1.0
**Date:** November 13, 2025
**Author:** Sally (UX Designer)
**Status:** Final
**Project:** Real Estate Development Tracker

---

## Document Purpose

This is the master UX specification for Epic 10.3: Screen Design Improvements. It consolidates all UX design decisions, patterns, components, and requirements into a single reference document for implementation.

**This document covers:**

- Login & 2FA Screen (Story 10.16)
- Projects List Screen (Story 10.19)
- Project Costs Screen (Story 10.17)
- Project Timeline Screen (Story 10.18)
- Contacts Page (Story 10.20)

---

## Supporting Documents

This specification is supported by detailed documentation:

1. **[UX Pattern Library](./epic-10.3-ux-pattern-library.md)** - All reusable patterns with implementation examples
2. **[Accessibility Requirements](./epic-10.3-accessibility-requirements.md)** - WCAG 2.1 AA compliance specifications
3. **[Component Specifications](./epic-10.3-component-specifications.md)** - Detailed component specs with states and behaviors
4. **[Design Rationale](./epic-10.3-design-rationale.md)** - Why design decisions were made
5. **[HTML Mockups](./epic-10.3-mockups/)** - Interactive prototypes of all 5 screens
6. **[Epic Document](../epics/EPIC-10.3-Screen-Design-Improvements.md)** - Requirements and technical approach

---

## Executive Summary

Epic 10.3 redesigns and enhances five critical application screens to improve user experience, visual design, data presentation, and workflow efficiency. The design follows a clean, modern, professional aesthetic with full accessibility compliance (WCAG 2.1 AA) and mobile-first responsive design.

**Key Design Decisions:**

- Design System: Tailwind CSS + shadcn/ui
- Color Palette: Navy (#0A2540) + Primary Blue (#137fec)
- Typography: Inter font family
- Layout: Split-screen auth, card-based content layouts
- Compliance: WCAG 2.1 Level AA
- Responsive: Mobile-first, breakpoints at 640/768/1024/1280px

**Deliverables:**

- 5 screen designs (mockups + specifications)
- Pattern library with 15+ reusable patterns
- Component library with 10+ custom components
- Full accessibility compliance documentation
- Implementation-ready specifications

---

## Table of Contents

1. [Design Foundation](#1-design-foundation)
2. [User Journeys](#2-user-journeys)
3. [Screen Specifications](#3-screen-specifications)
4. [Component Library](#4-component-library)
5. [UX Patterns](#5-ux-patterns)
6. [Accessibility](#6-accessibility)
7. [Responsive Design](#7-responsive-design)
8. [Implementation Guide](#8-implementation-guide)
9. [Testing Criteria](#9-testing-criteria)
10. [Launch Checklist](#10-launch-checklist)

---

## 1. Design Foundation

### 1.1 Design System

**Framework:** Tailwind CSS v3.x
**Component Library:** shadcn/ui
**Icons:** Material Symbols Outlined
**Charts:** Chart.js (Recharts in React)

**Rationale:** See [Design Rationale](./epic-10.3-design-rationale.md#1-design-system-selection)

### 1.2 Color Palette

**Primary Colors:**

```css
--primary: #137fec; /* Primary Blue */
--primary-hover: #0d6bc9; /* Primary Blue (hover) */
--navy: #0a2540; /* Navy (dark mode alt primary) */
--navy-hover: #0a2540e6; /* Navy (hover) */
```

**Background Colors:**

```css
--background-light: #f6f7f8; /* Light mode background */
--background-dark: #101922; /* Dark mode background */
--white: #ffffff; /* Cards, inputs (light mode) */
```

**Semantic Colors:**

```css
--success: #22c55e; /* Green - Active, Complete, Success */
--warning: #f59e0b; /* Amber - Warning, On Hold, Medium Priority */
--error: #ef4444; /* Red - Error, At Risk, High Priority */
--info: #3b82f6; /* Blue - Info, In Progress, Low Priority */
```

**Neutral Scale (Slate):**

```css
--slate-50: #f8fafc;
--slate-100: #f1f5f9;
--slate-200: #e2e8f0;
--slate-300: #cbd5e1;
--slate-400: #94a3b8;
--slate-500: #64748b;
--slate-600: #475569;
--slate-700: #334155;
--slate-800: #1e293b;
--slate-900: #0f172a;
```

**Color Usage Rules:**

- **Primary**: Main actions, links, focus indicators
- **Navy**: Primary buttons (light mode), text emphasis
- **Semantic colors**: Status indicators, feedback, alerts
- **Neutral scale**: Text (900/600/400), borders (300/700), backgrounds (50/800)

**Accessibility:**

- All text meets 4.5:1 contrast minimum (body) or 3:1 (large text, UI components)
- Color never sole indicator of meaning (always paired with text/icons)
- See full contrast audit in [Accessibility Requirements](./epic-10.3-accessibility-requirements.md#2-color--contrast)

### 1.3 Typography

**Font Family:**

```css
font-family:
  "Inter",
  system-ui,
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  sans-serif;
```

**Type Scale:**
| Size | Rem | Px | Usage |
|------|-----|----| ------|
| xs | 0.75rem | 12px | Captions, helper text, labels |
| sm | 0.875rem | 14px | Secondary text, table cells, badges |
| base | 1rem | 16px | Body text, form inputs |
| lg | 1.125rem | 18px | Large body text, card descriptions |
| xl | 1.25rem | 20px | Subheadings, card titles |
| 2xl | 1.5rem | 24px | Section headings (h2, h3) |
| 3xl | 1.875rem | 30px | Page titles (h1) |
| 4xl | 2.25rem | 36px | Hero headings |

**Font Weights:**
| Weight | Value | Usage |
|--------|-------|-------|
| normal | 400 | Body text, secondary text |
| medium | 500 | Labels, button text, emphasis |
| semibold | 600 | Subheadings, metrics |
| bold | 700 | Headings (h2-h6), key information |
| black | 900 | Page titles (h1), hero headings |

**Line Heights:**

- Body text: 1.5 (24px for 16px text)
- Headings: 1.2 (tighter for larger text)
- Inputs/buttons: 1 (exact height control)

**Rationale:** See [Design Rationale](./epic-10.3-design-rationale.md#3-typography)

### 1.4 Spacing System

**Base Unit:** 4px (0.25rem)

**Scale (Tailwind):**

```
0:  0px
1:  4px   (0.25rem)
2:  8px   (0.5rem)
3:  12px  (0.75rem)
4:  16px  (1rem)    [Common: Component padding]
5:  20px  (1.25rem)
6:  24px  (1.5rem)  [Common: Section spacing]
8:  32px  (2rem)
10: 40px  (2.5rem)
12: 48px  (3rem)    [Common: Page section gaps]
16: 64px  (4rem)
20: 80px  (5rem)
24: 96px  (6rem)
```

**Usage Guidelines:**

- **Micro spacing (1-2)**: Icon-text gaps, badge padding
- **Component spacing (3-4)**: Card padding, input padding, button padding
- **Layout spacing (6-8)**: Between sections, card gaps
- **Page spacing (12-16)**: Major page sections, hero padding

### 1.5 Border Radius

```css
--radius-sm: 0.125rem; /* 2px - Subtle rounding */
--radius: 0.25rem; /* 4px - Default */
--radius-lg: 0.5rem; /* 8px - Cards, buttons, inputs */
--radius-xl: 0.75rem; /* 12px - Large cards */
--radius-2xl: 1rem; /* 16px - Modal, page cards */
--radius-full: 9999px; /* Circular - Badges, avatars */
```

**Usage:**

- Buttons, inputs, dropdowns: `rounded-lg` (8px)
- Cards: `rounded-xl` (12px) or `rounded-2xl` (16px)
- Badges: `rounded-full` (pill shape)
- Icons: `rounded-lg` (8px) for icon backgrounds

### 1.6 Shadows

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
```

**Usage:**

- Summary cards, tables: `shadow-sm`
- Floating cards: `shadow-lg`
- Modals, dropdowns: `shadow-2xl`
- Hover states: Increase shadow depth

---

## 2. User Journeys

### 2.1 Login & 2FA Journey

**Goal:** Securely authenticate user and establish session.

**Steps:**

1. **Land on Login Page**
   - User sees split-screen layout (image left, form right on desktop)
   - Logo and "Welcome Back" heading visible
   - Email and password inputs, "Remember me" checkbox, "Forgot password" link, "Sign In" button

2. **Enter Credentials**
   - User types email → Real-time validation (format check)
   - User types password → Password visibility toggle available
   - If invalid email: Red border + error message below

3. **Submit Form**
   - User clicks "Sign In" or presses Enter
   - Button shows loading spinner
   - If invalid credentials: Error message at top of form
   - If valid + 2FA disabled: Redirect to dashboard
   - If valid + 2FA enabled: Proceed to 2FA screen

4. **Two-Factor Authentication** (if enabled)
   - Screen transitions to 2FA input
   - "Back to login" button visible
   - 6 digit input boxes displayed
   - User enters code from authenticator app
   - Auto-advance between boxes on digit entry
   - "Trust this device" checkbox available

5. **Verify 2FA Code**
   - User clicks "Verify Code" or presses Enter
   - Button shows loading spinner
   - If invalid: Error message, allow retry
   - If valid: Redirect to dashboard, session established

**Error Scenarios:**

- Invalid email format: Show inline error, prevent submission
- Wrong credentials: Show form-level error, focus email
- Expired 2FA code: Show error, offer "Resend code" link
- Account locked: Show message, link to support

**Accessibility:**

- All inputs keyboard accessible (Tab navigation)
- Errors announced to screen readers
- Password toggle accessible via keyboard
- 2FA inputs announce "Digit X of 6"

**Mockup:** [login-2fa.html](./epic-10.3-mockups/login-2fa.html)

---

### 2.2 Browse Projects Journey

**Goal:** Find and open a specific project.

**Steps:**

1. **Land on Projects List**
   - User sees page header "Projects" with "New Project" button
   - Summary cards show: Total Projects, Active, At Risk, Total Value
   - Search bar and filters below summaries
   - Project cards in grid (3 columns on desktop)

2. **Scan Projects** (Optional)
   - User reviews project cards visually
   - Each card shows: Title, status badge, budget, progress
   - Hover effect highlights clickable cards

3. **Search/Filter** (Optional)
   - User types in search box → Results filter instantly (debounced)
   - User selects status filter → "Active" only shown
   - User changes sort → Projects re-order
   - User toggles list view → Cards become compact list

4. **Open Project**
   - User clicks project card
   - Navigation to project detail page (costs, timeline, etc.)

**Alternative Flows:**

- No projects yet: "Create your first project" empty state shown
- No search results: "No results found" message with "Clear filters" button
- Filter combination returns empty: Message suggests broadening filters

**Accessibility:**

- Search has `aria-label="Search projects"`
- Results count announced to screen reader: "Showing 18 of 24 projects"
- All cards keyboard accessible (Tab + Enter to open)
- Status badges not color-only (text labels present)

**Mockup:** [projects-list.html](./epic-10.3-mockups/projects-list.html)

---

### 2.3 View Project Costs Journey

**Goal:** Understand project budget and cost breakdown.

**Steps:**

1. **Land on Project Costs**
   - User sees page header "Project Costs - [Project Name]"
   - Summary cards display: Total Budget, Total Spent, Remaining, Variance
   - User immediately sees if over/under budget (variance card red/green)

2. **Review Summary Metrics**
   - User scans summary cards for key numbers
   - Variance indicator shows +$127K over budget (red, attention needed)
   - Spent percentage shows 75% of budget used

3. **View Charts**
   - Pie chart shows cost breakdown by category (Construction 40%, Materials 30%, etc.)
   - Bar chart compares Budget vs Actual per category
   - Line chart shows spending trend over time
   - User hovers chart elements for exact values

4. **Examine Detailed Table**
   - Scrolls down to cost breakdown table
   - Sortable columns (click header to sort)
   - Filter dropdown to show specific categories
   - Each row shows: Category, Budgeted, Actual, Variance
   - Variance values color-coded (green under budget, red over)

5. **Export Data** (Optional)
   - User clicks "Export" button
   - Chooses format (CSV, PDF)
   - Download initiated

**Alternative Flows:**

- No costs yet: Empty state suggests "Add your first cost"
- Table filters: "Showing 5 of 15 items" when filtered

**Accessibility:**

- Summary metrics announced clearly by screen reader
- Charts have text alternatives (data table)
- Table properly structured with `<th>` headers
- Sort direction announced (ascending/descending)

**Mockup:** [project-costs.html](./epic-10.3-mockups/project-costs.html)

---

### 2.4 View Project Timeline Journey

**Goal:** Understand project schedule and current progress.

**Steps:**

1. **Land on Timeline**
   - User sees "Project Timeline - [Project Name]" header
   - Progress summary at top: "Dec 2024 - Oct 2025, 62% complete"
   - Horizontal Gantt-style timeline below
   - Today marker visible (red vertical line with pulsing dot)

2. **Orient to Schedule**
   - Month headers across top (Dec 2024 → Oct 2025)
   - Phase names down left side
   - Colored bars show phase duration
   - Today marker shows current position in schedule

3. **Review Phase Status**
   - Completed phases: Green bars, 100% filled, checkmark icon
   - Current phase: Blue bar, partially filled (62%), in progress icon
   - Upcoming phases: Light gray, 0% filled
   - At-risk phases: Red bar, warning icon

4. **Examine Phase Details** (Hover/Click)
   - Hover phase bar: Tooltip shows name, dates, progress
   - Click phase bar: Detail panel opens with full info

5. **Navigate Timeline** (Optional)
   - Click prev/next arrows to scroll through months
   - Change view mode (monthly → weekly → quarterly)
   - Filter by phase status (show completed, hide upcoming)

**Alternative Flows:**

- No schedule yet: Empty state suggests "Add your first phase"
- Mobile view: Vertical timeline or horizontal scroll

**Accessibility:**

- Timeline structured as data table (screen reader friendly)
- Each phase announced with full details
- Today marker announced: "Today: May 15, 2025"
- Keyboard navigation: Tab through phases, Enter for details

**Mockup:** [project-timeline.html](./epic-10.3-mockups/project-timeline.html)

---

### 2.5 Find Contact Journey

**Goal:** Locate contact information for a specific person.

**Steps:**

1. **Land on Contacts**
   - User sees "Contacts" header with "Add Contact" button
   - Summary cards show: Total Contacts, by type breakdown (Clients, Vendors, etc.)
   - Search bar and type filter badges below

2. **Search for Contact**
   - User types name in search box: "Sarah Johnson"
   - Results filter instantly (searches name, company, role)
   - Matching contacts remain visible, others hidden

3. **Or Filter by Type**
   - User clicks "Client" badge filter
   - Only client contacts shown (12 contacts)
   - Badge changes to active state (blue background)

4. **Locate Contact**
   - User finds contact card in results
   - Card shows: Avatar, name, role, company, type badge
   - Quick action icons (email, phone) visible

5. **View/Contact**
   - Click card to view full details
   - Or click email icon to open email client
   - Or click phone icon to initiate call (on mobile)

**Alternative Flows:**

- No contacts yet: Empty state suggests "Add your first contact"
- No search results: "No contacts found" with "Clear search" button
- Multiple filters active: Combine with AND logic

**Accessibility:**

- Search has `aria-label="Search contacts by name, company, or role"`
- Filter badges: `aria-pressed="true"` when active
- Results count announced: "Showing 12 of 48 contacts"
- Contact cards keyboard accessible

**Mockup:** [contacts-page.html](./epic-10.3-mockups/contacts-page.html)

---

## 3. Screen Specifications

### 3.1 Login & 2FA Screen

**URL:** `/login` (and `/login/2fa` for 2FA step)

**Layout:**

- **Desktop:** Split-screen (image 50% left, form 50% right)
- **Mobile:** Single column (logo top, form below)

**Components:**

- Logo (top-left on desktop, centered on mobile)
- Page heading: "Welcome Back" (h1)
- Subtitle: "Sign in to continue to your projects"
- Email input (required, validation)
- Password input (required, visibility toggle)
- Remember me checkbox
- Forgot password link
- Sign In button (primary)
- Social login buttons (Google, Facebook)
- Sign up link
- (2FA variant) 6-digit code input, verify button, trust device checkbox

**Visual Assets:**

- Background image: Unsplash architectural photo (1920x1080)
- Logo: Material Symbol `domain_add` + "Real Estate Tracker" text

**Interactions:**

- Email validation on blur (format check)
- Password toggle on click (eye icon)
- Form submit on Enter key
- Transition to 2FA screen (fade, focus first input)
- Back button returns to login (preserves email)

**States:**

- Default, Loading (button spinner), Error (inline/form-level), Success (redirect)

**Accessibility:**

- WCAG 2.1 AA compliant (contrast, keyboard, screen reader)
- See full requirements: [Accessibility Requirements](./epic-10.3-accessibility-requirements.md#121-login--2fa-screen)

**Mockup:** [login-2fa.html](./epic-10.3-mockups/login-2fa.html)

---

### 3.2 Projects List Screen

**URL:** `/projects`

**Layout:**

- Header: Title + New Project button
- Summary cards: 4 columns (1 column mobile)
- Filters: Search + dropdowns + view toggle (inline, wraps on mobile)
- Content: Card grid (3 columns desktop, 2 tablet, 1 mobile)

**Components:**

- Page header (h1: "Projects")
- 4 Summary cards (Total, Active, At Risk, Total Value)
- Search bar
- Status filter dropdown
- Sort dropdown
- View toggle (grid/list)
- Project cards (multiple)

**Project Card Contents:**

- Title, description
- Status badge
- Budget, progress
- Metadata (dates, team, etc.)

**Interactions:**

- Search: Instant filter (debounced 300ms)
- Filters: Apply immediately, combine with AND
- Sort: Re-order results
- View toggle: Switch card layout
- Card click: Navigate to project detail

**States:**

- Default, Loading (skeleton cards), Empty (first use), No results (search/filter)

**Empty State:**

- Heading: "Create your first project"
- Description: Value proposition
- CTA: "Create First Project" button (primary)

**Accessibility:**

- All filters keyboard accessible
- Results count announced on change
- Cards focusable (Tab + Enter to open)
- Status badges not color-only

**Mockup:** [projects-list.html](./epic-10.3-mockups/projects-list.html)

---

### 3.3 Project Costs Screen

**URL:** `/projects/:id/costs`

**Layout:**

- Header: Title + Export + Add Cost buttons
- Summary cards: 4 columns (stack on mobile)
- Charts: 2 columns (stack on mobile)
- Table: Full width (horizontal scroll on mobile)

**Components:**

- Page header (h1: "Project Costs", subtitle: project name)
- 4 Summary cards (Budget, Spent, Remaining, Variance)
- Pie chart (Cost Breakdown by Category)
- Bar chart (Budget vs Actual)
- Line chart (Spending Trend Over Time)
- Data table (detailed breakdown)

**Table Columns:**

- Category (text, sortable)
- Budgeted (currency, sortable, right-aligned)
- Actual (currency, sortable, right-aligned)
- Variance (currency, sortable, right-aligned, color-coded)
- Actions (edit button)

**Interactions:**

- Chart hover: Tooltip with exact values
- Table sort: Click column header
- Table filter: Dropdown to show specific categories
- Export: Download CSV or PDF

**States:**

- Default, Loading (skeleton), Empty (no costs), Error (API fail)

**Accessibility:**

- Charts have text alternatives (data table)
- Table properly structured (`<th>` headers)
- Sort direction announced
- Variance not color-only (+ / - symbols)

**Mockup:** [project-costs.html](./epic-10.3-mockups/project-costs.html)

---

### 3.4 Project Timeline Screen

**URL:** `/projects/:id/timeline`

**Layout:**

- Header: Title + Filter + View Mode + Add Event buttons
- Timeline controls: Duration, progress, navigation, today indicator
- Timeline: Horizontal Gantt (vertical on mobile)

**Components:**

- Page header (h1: "Project Timeline", subtitle: project name)
- Timeline controls (duration, progress bar, month navigation)
- Timeline grid (month headers, phase rows, bars, milestones, today marker)

**Timeline Structure:**

- Rows: Phases (name on left, bar on right)
- Columns: Months (Dec 2024 → Oct 2025)
- Bars: Colored spans showing phase duration and progress
- Milestones: Diamond markers at specific dates
- Today marker: Red vertical line with pulsing dot

**Interactions:**

- Hover phase bar: Tooltip (name, dates, progress)
- Click phase bar: Open detail panel/modal
- Navigate months: Prev/next arrows
- Change view mode: Monthly, weekly, quarterly
- Filter: Show/hide phases by status

**States:**

- Default, Loading (skeleton timeline), Empty (no schedule)

**Accessibility:**

- Timeline as data table (screen reader)
- Phase bars focusable, descriptive `aria-label`
- Today marker announced
- Keyboard navigation (Tab + Enter)

**Mockup:** [project-timeline.html](./epic-10.3-mockups/project-timeline.html)

---

### 3.5 Contacts Page

**URL:** `/contacts`

**Layout:**

- Header: Title + Import + Add Contact buttons
- Summary cards: 4 columns (stack on mobile)
- Filters: Search + type badges (inline, wrap on mobile)
- Content: Contact cards grid (3 columns desktop, 2 tablet, 1 mobile)

**Components:**

- Page header (h1: "Contacts")
- 4 Summary cards (Total, by type breakdown)
- Search bar
- Type filter badges (Client, Vendor, Partner, Team)
- Contact cards (multiple)

**Contact Card Contents:**

- Avatar (initial or photo)
- Name, role, company
- Type badge
- Quick action icons (email, phone)

**Interactions:**

- Search: Instant filter on name, company, role (debounced)
- Type filters: Toggle on/off, combine with OR
- Card click: View contact details
- Quick actions: Email (mailto link), phone (tel link)

**States:**

- Default, Loading (skeleton cards), Empty (first use), No results

**Accessibility:**

- Search has descriptive `aria-label`
- Filter badges: `aria-pressed="true"` when active
- Results count announced
- Cards keyboard accessible

**Mockup:** [contacts-page.html](./epic-10.3-mockups/contacts-page.html)

---

## 4. Component Library

For detailed specifications, see [Component Specifications](./epic-10.3-component-specifications.md).

**Custom Components:**

1. **StatusBadge** - Categorical status indicators (success, warning, error, info, neutral)
2. **SummaryCard** - Metric cards with icon, label, value, trend
3. **DataTable** - Sortable, filterable tables with inline editing
4. **TimelineView** - Gantt-style project timeline
5. **ContactCard** - Contact information cards
6. **SearchBar** - Search input with icon
7. **FilterPanel** - Filter controls (dropdowns, badges)
8. **ProjectCard** - Project summary cards

**shadcn/ui Components:**

- Button, Input, Checkbox, Select, Dialog, Dropdown, Toast, etc.

**Usage:**

- See component specs for props, states, variants, accessibility
- Maintain consistency: Same component for same purpose across all screens

---

## 5. UX Patterns

For detailed patterns and implementation, see [UX Pattern Library](./epic-10.3-ux-pattern-library.md).

**Key Patterns:**

1. **Button Patterns** - Primary, secondary, icon, social login buttons
2. **Form Input Patterns** - Text input, password with toggle, checkbox, search, select, 2FA code
3. **Feedback & Status Patterns** - Status badges, inline validation, toasts, progress indicators
4. **Navigation Patterns** - Page header, back button, tabs, breadcrumbs
5. **Search Patterns** - Simple search, search with filters
6. **Filter & Sort Patterns** - Dropdown filters, sort dropdown, badge filters, view toggle
7. **Card Patterns** - Summary cards, project cards, contact cards
8. **Table Patterns** - Data table, inline editing
9. **Chart & Visualization Patterns** - Pie, bar, line, timeline/Gantt
10. **Modal & Dialog Patterns** - Modal dialog, confirmation dialog
11. **Empty State Patterns** - No results, first use
12. **Loading State Patterns** - Skeleton screen, button loading
13. **Error State Patterns** - Inline field error, page-level error
14. **Date & Time Patterns** - Date display formats, date picker
15. **Badge & Label Patterns** - Status, count, priority badges

**Consistency Rule:** Same problem → Same pattern. Always use established patterns before creating new ones.

---

## 6. Accessibility

**Compliance Target:** WCAG 2.1 Level AA

For full requirements, see [Accessibility Requirements](./epic-10.3-accessibility-requirements.md).

**Key Requirements Summary:**

**Color & Contrast:**

- Body text: 4.5:1 minimum
- Large text: 3:1 minimum
- UI components: 3:1 minimum
- Focus indicators: 3:1 minimum

**Keyboard Navigation:**

- All functionality keyboard accessible
- Logical tab order
- Visible focus indicators (2px blue ring)
- No keyboard traps

**Screen Reader Support:**

- Semantic HTML (landmarks, headings)
- ARIA labels for icon buttons
- ARIA live regions for dynamic updates
- Descriptive link text

**Form Accessibility:**

- Associated labels for all inputs
- Error identification and description
- Required fields marked programmatically
- Help text for complex inputs

**Testing:**

- Automated: axe DevTools, Lighthouse (100 score target)
- Manual: Keyboard navigation, screen reader, zoom to 200%
- User testing: With users with disabilities

---

## 7. Responsive Design

**Strategy:** Mobile-first, fluid layouts, no horizontal scrolling.

**Breakpoints (Tailwind):**

- **sm:** 640px (small tablets)
- **md:** 768px (tablets)
- **lg:** 1024px (desktops)
- **xl:** 1280px (large desktops)

**Responsive Patterns:**

**Login/2FA:**

- Mobile: Single column, full-width form
- Desktop: Split-screen (image 50%, form 50%)

**Projects/Contacts:**

- Mobile: 1 column cards, search full-width, filters stack
- Tablet: 2 columns
- Desktop: 3 columns, filters inline

**Project Costs:**

- Mobile: Cards stack, charts full-width, table scrolls horizontally
- Desktop: Cards 4 columns, charts side-by-side, full table

**Timeline:**

- Mobile: Horizontal scroll OR vertical timeline
- Desktop: Full horizontal Gantt

**Touch Targets:**

- Minimum 44px height (mobile)
- 8px minimum spacing between targets

**Testing:**

- Test all screens at 320px, 768px, 1024px, 1920px widths
- Test zoom to 200%
- Test on real devices (iOS, Android)

---

## 8. Implementation Guide

### 8.1 Technology Stack

**Frontend:**

- React (TypeScript)
- Tailwind CSS
- shadcn/ui
- React Router (navigation)
- React Hook Form (forms)
- Chart.js or Recharts (charts)
- date-fns (date formatting)

**Icons:**

- Material Symbols (web font or React component)

**Fonts:**

- Inter via Google Fonts

### 8.2 File Structure

```
src/
├── components/
│   ├── ui/                     # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   └── ...
│   ├── custom/                 # Custom components
│   │   ├── StatusBadge.tsx
│   │   ├── SummaryCard.tsx
│   │   ├── DataTable.tsx
│   │   └── ...
│   └── patterns/               # Reusable patterns
│       ├── SearchBar.tsx
│       ├── FilterPanel.tsx
│       └── ...
├── screens/
│   ├── auth/
│   │   ├── LoginScreen.tsx
│   │   ├── TwoFactorScreen.tsx
│   ├── projects/
│   │   ├── ProjectsListScreen.tsx
│   │   ├── ProjectCostsScreen.tsx
│   │   ├── ProjectTimelineScreen.tsx
│   └── contacts/
│       └── ContactsScreen.tsx
├── styles/
│   └── globals.css             # Tailwind imports
└── ...
```

### 8.3 Development Workflow

**Phase 1: Setup (Day 1)**

- Install dependencies (Tailwind, shadcn/ui, icons, charts)
- Configure Tailwind (colors, fonts, breakpoints)
- Setup dark mode (class-based)
- Import Inter font
- Create base styles

**Phase 2: Components (Days 2-5)**

- Build custom components (StatusBadge, SummaryCard, etc.)
- Build pattern components (SearchBar, FilterPanel, etc.)
- Test components in isolation (Storybook recommended)
- Document component APIs

**Phase 3: Screens (Days 6-12)**

- Implement screens one by one
- Week 1: Login/2FA (Story 10.16) + Projects List (Story 10.19)
- Week 2: Project Costs (Story 10.17) + Contacts (Story 10.20)
- Week 3: Timeline (Story 10.18) - most complex

**Phase 4: Integration (Days 13-15)**

- Connect to API
- Add loading states
- Add error handling
- Form validation
- Navigation flow

**Phase 5: Polish (Days 16-18)**

- Accessibility audit and fixes
- Responsive testing and fixes
- Cross-browser testing
- Performance optimization
- Final QA

### 8.4 Code Quality

**Standards:**

- TypeScript strict mode
- ESLint + Prettier
- Husky pre-commit hooks
- Component prop types documented
- Accessibility attributes required

**Testing:**

- Unit tests for components (Jest + React Testing Library)
- Integration tests for screens (key user flows)
- E2E tests (Playwright) for critical paths (login, create project)
- Accessibility tests (axe-core)

---

## 9. Testing Criteria

### 9.1 Functional Testing

**Login/2FA:**

- [ ] Email validation works (format check)
- [ ] Password toggle works
- [ ] Remember me persists session
- [ ] Forgot password link navigates correctly
- [ ] Social login buttons trigger OAuth
- [ ] 2FA code auto-advances between boxes
- [ ] 2FA back button returns to login
- [ ] Trust device checkbox works
- [ ] Invalid credentials show error
- [ ] Valid login redirects to dashboard

**Projects List:**

- [ ] Summary cards display correct counts
- [ ] Search filters results instantly
- [ ] Status filter works
- [ ] Sort re-orders correctly
- [ ] View toggle switches layout
- [ ] Card click navigates to project
- [ ] Empty state shows for no projects
- [ ] No results message for empty search

**Project Costs:**

- [ ] Summary cards calculate correctly
- [ ] Variance color matches over/under budget
- [ ] Charts display data accurately
- [ ] Chart hover shows tooltips
- [ ] Table sorts correctly
- [ ] Table filter works
- [ ] Export button downloads data

**Project Timeline:**

- [ ] Timeline displays all phases
- [ ] Today marker shows current date
- [ ] Phase bars show correct duration
- [ ] Progress percentages correct
- [ ] Hover tooltips show phase details
- [ ] Month navigation works
- [ ] View mode switches work

**Contacts:**

- [ ] Summary cards count correctly
- [ ] Search filters results
- [ ] Type filter badges toggle on/off
- [ ] Multiple filters combine correctly
- [ ] Card click shows contact details
- [ ] Email/phone quick actions work

### 9.2 Accessibility Testing

**Automated (axe DevTools):**

- [ ] Zero errors on all screens
- [ ] Lighthouse accessibility score: 100

**Keyboard Navigation:**

- [ ] All interactive elements focusable
- [ ] Tab order logical
- [ ] Focus indicators visible
- [ ] Enter/Space activate buttons
- [ ] Escape closes modals/dropdowns

**Screen Reader (NVDA/VoiceOver):**

- [ ] All content announced correctly
- [ ] Form labels associated with inputs
- [ ] Status badges announced with text
- [ ] Dynamic updates announced (live regions)
- [ ] Tables properly structured

**Color & Contrast:**

- [ ] All text meets 4.5:1 or 3:1 minimum
- [ ] Focus indicators meet 3:1
- [ ] Color not sole indicator of meaning

### 9.3 Responsive Testing

**Breakpoints:**

- [ ] 320px (smallest mobile) - content readable, no horizontal scroll
- [ ] 640px (sm) - cards start adapting
- [ ] 768px (md) - tablet layout
- [ ] 1024px (lg) - desktop layout
- [ ] 1920px (xl) - large desktop, content not stretched

**Devices:**

- [ ] iPhone SE (375x667)
- [ ] iPhone 14 Pro (393x852)
- [ ] iPad (768x1024)
- [ ] Desktop (1920x1080)

**Features:**

- [ ] Touch targets minimum 44px (mobile)
- [ ] No horizontal scroll on any screen
- [ ] Content reflows naturally
- [ ] Images/charts scale appropriately

**Zoom:**

- [ ] 200% zoom - text readable, no horizontal scroll
- [ ] UI still functional at 200%

### 9.4 Browser Testing

**Required Browsers:**

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS 15+)
- [ ] Mobile Chrome (Android 10+)

**Features to Test:**

- [ ] Layout consistent across browsers
- [ ] Interactions work (hover, click, form submission)
- [ ] Fonts load correctly
- [ ] Icons display correctly
- [ ] Charts render correctly
- [ ] Dark mode works

### 9.5 Performance Testing

**Metrics:**

- [ ] Lighthouse Performance score: > 90
- [ ] First Contentful Paint: < 1.5s
- [ ] Largest Contentful Paint: < 2.5s
- [ ] Time to Interactive: < 3.5s
- [ ] Cumulative Layout Shift: < 0.1

**Optimizations:**

- [ ] Images optimized (WebP, lazy loading)
- [ ] Fonts subset and preloaded
- [ ] CSS purged (unused Tailwind removed)
- [ ] JavaScript code-split (per route)
- [ ] API calls cached appropriately

---

## 10. Launch Checklist

### 10.1 Pre-Launch (T-1 week)

**Design Review:**

- [ ] All 5 screens match mockups
- [ ] Patterns consistent across screens
- [ ] Typography, colors, spacing correct
- [ ] Animations smooth (60fps)
- [ ] Dark mode works on all screens

**Accessibility Audit:**

- [ ] Automated tests pass (axe, Lighthouse)
- [ ] Manual keyboard testing complete
- [ ] Screen reader testing complete
- [ ] Color contrast verified
- [ ] Focus indicators visible
- [ ] WCAG 2.1 AA compliance documented

**Functional Testing:**

- [ ] All user journeys tested end-to-end
- [ ] Edge cases handled (empty states, errors, loading)
- [ ] Form validation works
- [ ] API integration complete
- [ ] Error handling robust

**Cross-Browser Testing:**

- [ ] Chrome, Firefox, Safari, Edge tested
- [ ] Mobile browsers tested
- [ ] No critical issues

**Responsive Testing:**

- [ ] All breakpoints tested
- [ ] Mobile devices tested
- [ ] Tablet devices tested
- [ ] Desktop sizes tested
- [ ] 200% zoom tested

**Performance Audit:**

- [ ] Lighthouse score > 90
- [ ] Load times under targets
- [ ] No performance regressions

**Documentation:**

- [ ] Component documentation complete
- [ ] Pattern library up to date
- [ ] Code comments for complex logic
- [ ] README with setup instructions

### 10.2 Launch Day

- [ ] Feature flag enabled (10% users)
- [ ] Monitoring enabled (error tracking, analytics)
- [ ] Support team briefed
- [ ] Rollback plan ready
- [ ] Watch for issues (first 2 hours critical)

### 10.3 Post-Launch (Week 1)

- [ ] Monitor error rates (< 1% target)
- [ ] Monitor performance metrics (no regressions)
- [ ] Collect user feedback (surveys, interviews)
- [ ] Address critical bugs immediately
- [ ] Document issues for future improvements

### 10.4 Post-Launch (Month 1)

- [ ] Accessibility audit refresh (catch any regressions)
- [ ] User testing with 5-10 real users
- [ ] Analytics review (usage patterns, drop-offs)
- [ ] Feature flag to 100% (if stable)
- [ ] Retrospective meeting (what went well, what didn't)
- [ ] Roadmap for next improvements

---

## Document Maintenance

**Owner:** Sally (UX Designer)
**Review Cadence:** Quarterly or after major changes
**Next Review:** February 2026

**Change Log:**
| Date | Version | Changes | Author |
|------|---------|---------|--------|
| Nov 13, 2025 | 1.0 | Initial specification | Sally |

**Stakeholder Approvals:**

- [ ] Product Manager: ******\_****** Date: **\_\_\_**
- [ ] Engineering Lead: ****\_\_\_\_**** Date: **\_\_\_**
- [ ] Design Lead: ******\_\_\_\_****** Date: **\_\_\_**

---

## Conclusion

This UX specification provides comprehensive design guidance for implementing Epic 10.3 Screen Design Improvements. All screens follow consistent patterns, meet accessibility standards, and deliver a modern, professional user experience.

**Key Success Factors:**

1. Follow the specification closely
2. Maintain pattern consistency
3. Test accessibility at every step
4. Prioritize mobile experience
5. Validate with real users
6. Iterate based on feedback

**Questions or Clarifications:**
Contact Sally (UX Designer) or refer to supporting documentation.

---

**End of Specification**
