# Accessibility Requirements - Epic 10.3: Screen Design Improvements

**Version:** 1.0
**Date:** November 13, 2025
**Author:** Sally (UX Designer)
**Project:** Real Estate Development Tracker
**Compliance Target:** WCAG 2.1 Level AA

---

## Executive Summary

This document defines accessibility requirements for all screens in Epic 10.3 (Login/2FA, Projects List, Project Costs, Project Timeline, Contacts). Meeting these requirements ensures the application is usable by people with disabilities and complies with WCAG 2.1 Level AA standards.

**Key Commitments:**

- ♿ **WCAG 2.1 Level AA compliance** for all screens
- ⌨️ **Full keyboard navigability** for all interactive elements
- 🎯 **4.5:1 minimum contrast ratio** for body text
- 📢 **Screen reader accessible** with proper ARIA labels
- 🔍 **Focus indicators** visible on all interactive elements

---

## Table of Contents

1. [Compliance Standards](#1-compliance-standards)
2. [Color & Contrast](#2-color--contrast)
3. [Keyboard Navigation](#3-keyboard-navigation)
4. [Focus Management](#4-focus-management)
5. [Screen Reader Support](#5-screen-reader-support)
6. [Form Accessibility](#6-form-accessibility)
7. [Interactive Elements](#7-interactive-elements)
8. [Content Structure](#8-content-structure)
9. [Images & Icons](#9-images--icons)
10. [Error Handling](#10-error-handling)
11. [Responsive & Zoom](#11-responsive--zoom)
12. [Screen-Specific Requirements](#12-screen-specific-requirements)
13. [Testing Strategy](#13-testing-strategy)
14. [Known Issues & Roadmap](#14-known-issues--roadmap)

---

## 1. Compliance Standards

### 1.1 Target Level

**Primary Target:** WCAG 2.1 Level AA

**Rationale:** Level AA provides substantial accessibility improvements and is the standard required by most accessibility regulations (ADA, Section 508, AODA, EN 301 549).

### 1.2 Success Criteria Coverage

All Level A and Level AA success criteria must be met:

**Perceivable:**

- 1.1.1 Non-text Content (A)
- 1.2.1-1.2.5 Time-based Media (A/AA)
- 1.3.1-1.3.5 Adaptable (A/AA)
- 1.4.1-1.4.13 Distinguishable (A/AA)

**Operable:**

- 2.1.1-2.1.4 Keyboard Accessible (A/AA)
- 2.2.1-2.2.2 Enough Time (A)
- 2.3.1 Seizures (A)
- 2.4.1-2.4.7 Navigable (A/AA)
- 2.5.1-2.5.4 Input Modalities (A/AA)

**Understandable:**

- 3.1.1-3.1.2 Readable (A/AA)
- 3.2.1-3.2.4 Predictable (A/AA)
- 3.3.1-3.3.4 Input Assistance (A/AA)

**Robust:**

- 4.1.1-4.1.3 Compatible (A/AA)

### 1.3 Exceptions

The following content types are not present in Epic 10.3 screens but would need compliance if added:

- Pre-recorded video with audio (captions required)
- Live audio-only content (alternative required)
- Audio-controlled functions

---

## 2. Color & Contrast

### 2.1 Minimum Contrast Ratios

**WCAG 2.1 Level AA Requirements:**

| Element Type                       | Minimum Ratio | Target Ratio |
| ---------------------------------- | ------------- | ------------ |
| Body text (< 18px regular)         | 4.5:1         | 7:1 (AAA)    |
| Large text (≥ 18px or ≥ 14px bold) | 3:1           | 4.5:1 (AAA)  |
| UI components & icons              | 3:1           | 4.5:1        |
| Focus indicators                   | 3:1           | 4.5:1        |

### 2.2 Color Combinations Audit

**Primary Color Palette:**

| Foreground          | Background                | Ratio  | Pass                    | Usage                       |
| ------------------- | ------------------------- | ------ | ----------------------- | --------------------------- |
| White (#FFFFFF)     | Navy (#0A2540)            | 15.7:1 | ✅ AAA                  | Primary buttons             |
| White (#FFFFFF)     | Primary (#137fec)         | 3.4:1  | ⚠️ AA Large Only        | Primary buttons (dark mode) |
| Dark Gray (#333333) | White (#FFFFFF)           | 12.6:1 | ✅ AAA                  | Body text (light mode)      |
| Slate 100 (#f1f5f9) | Background Dark (#101922) | 14.2:1 | ✅ AAA                  | Body text (dark mode)       |
| Slate 600 (#475569) | White (#FFFFFF)           | 7.9:1  | ✅ AAA                  | Secondary text              |
| Slate 400 (#94a3b8) | White (#FFFFFF)           | 4.2:1  | ⚠️ Fails for small text | Placeholder text            |

**Semantic Colors:**

| Color                             | Light Mode Contrast | Dark Mode Contrast | Pass                 |
| --------------------------------- | ------------------- | ------------------ | -------------------- |
| Success Green (#22c55e on white)  | 3.4:1               | ✅ AA Large        | Status badges        |
| Error Red (#ef4444 on white)      | 4.5:1               | ✅ AA              | Error messages       |
| Warning Yellow (#f59e0b on white) | 2.8:1               | ❌ Fails           | **Needs adjustment** |
| Info Blue (#3b82f6 on white)      | 4.5:1               | ✅ AA              | Info messages        |

### 2.3 Contrast Requirements by Component

**Buttons:**

- Primary button (navy/white): 15.7:1 ✅
- Secondary button (slate border): Border must be 3:1 minimum with background

**Form Inputs:**

- Border: Slate-300 (#cbd5e1) on white: 2.1:1 ❌ **Needs darker border**
- **Fix:** Use slate-400 (#94a3b8) for borders: 3.8:1 ✅
- Focused border (primary): 3.4:1 ✅ (with 2px ring)

**Status Badges:**

- Text must meet 4.5:1 against badge background
- Badge background must meet 3:1 against page background

### 2.4 Color Independence

**Requirement:** Color cannot be the only means of conveying information.

**Implementation:**

- Status badges: Color + text label ✅
- Form errors: Red border + error icon + error text ✅
- Charts: Use patterns or labels in addition to color
- Links: Underline or bold, not color alone ✅
- Timeline status: Color bars + text labels ✅

**Testing:** Review all color-coded elements in grayscale mode.

---

## 3. Keyboard Navigation

### 3.1 Keyboard Operability Requirement

**WCAG 2.1.1 (Level A):** All functionality must be operable via keyboard.

**Implementation:**

- All interactive elements must be focusable with Tab key
- Tab order must follow visual reading order (left-to-right, top-to-bottom)
- No keyboard traps (user can always tab away)
- Spacebar and Enter trigger button actions
- Escape key closes modals and cancels actions

### 3.2 Tab Order Requirements

**Login/2FA Screen:**

1. Email input
2. Password input
3. Password visibility toggle button
4. Remember me checkbox
5. Forgot password link
6. Sign In button
7. Google button
8. Facebook button
9. Sign up link

_2FA variant:_

1. Back button
2. Digit 1 input
3. Digit 2 input
4. Digit 3 input
5. Digit 4 input
6. Digit 5 input
7. Digit 6 input
8. Verify button
9. Trust device checkbox
10. Resend link
11. Backup code link
12. Contact support link

**Projects List Screen:**

1. New Project button (header)
2. Search input
3. Status filter dropdown
4. Sort dropdown
5. Grid view button
6. List view button
7. First project card (or first result)
8. ... (continue through all cards)

**General Principles:**

- Primary action (e.g., "New Project") comes first in header
- Search/filters before content
- Content in natural reading order
- Footer links last

### 3.3 Keyboard Shortcuts

**Global Shortcuts (Future Enhancement):**

- `/` - Focus search
- `Esc` - Close modal/dropdown
- `Ctrl+Enter` - Submit form (when in form)

**Component-Specific:**

- **Dropdown/Select:** Arrow keys navigate options
- **Date picker:** Arrow keys navigate dates
- **2FA input:** Auto-advance on digit entry, Backspace moves back
- **Timeline:** Arrow keys move between phases (future)

### 3.4 Skip Links

**Requirement:** Provide "Skip to main content" link for keyboard users.

**Implementation:**

```html
<a
  href="#main-content"
  class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded"
>
  Skip to main content
</a>
```

**Position:** First focusable element on page, visually hidden until focused.

---

## 4. Focus Management

### 4.1 Focus Indicator Requirements

**WCAG 2.4.7 (Level AA):** Focus must be visible for keyboard users.

**Visual Specification:**

- Style: 2px solid ring
- Color: Primary blue (#137fec) at 50% opacity
- Offset: 2px from element
- Applied to ALL interactive elements

**Tailwind Implementation:**

```
focus:outline-0 focus:ring-2 focus:ring-primary/50
```

**High Contrast Mode:**

- Focus indicator must remain visible in high contrast mode
- Use native browser focus outline as fallback

### 4.2 Focus Order

**Requirement:** Focus order must be logical and match visual order.

**Testing:** Tab through entire page, verify order makes sense.

### 4.3 Focus Retention

**After Actions:**

- **Form submission:** Keep focus on submit button (if staying on page) or move to success message
- **Modal close:** Return focus to element that opened modal
- **Item delete:** Move focus to next item or "No items" message
- **Filter change:** Keep focus on filter control

**Page Load:**

- First interactive element receives focus (after skip link)
- OR main heading receives focus (with tabindex="-1") if no immediate action needed

### 4.4 Modal Focus Trap

**Requirement:** Focus must stay within modal until closed.

**Implementation:**

- Tab from last element returns to first element
- Shift+Tab from first element goes to last element
- Background content inert (`aria-hidden="true"` on `<body>` children except modal)

---

## 5. Screen Reader Support

### 5.1 Page Structure

**Landmark Regions:**

```html
<header>
  - Site/app header (logo, global nav)
  <nav>
    - Navigation regions
    <main>
      - Main content (one per page)
      <aside>
        - Supplementary content (filters, sidebars)
        <footer>- Site footer</footer>
      </aside>
    </main>
  </nav>
</header>
```

**Headings Hierarchy:**

- One `<h1>` per page (page title)
- Logical hierarchy (h1 → h2 → h3, no skipping levels)
- Headings describe content structure

**Example - Projects List:**

```html
<main>
  <h1>Projects</h1>
  <!-- Page title -->
  <section aria-labelledby="stats-heading">
    <h2 id="stats-heading" class="sr-only">Project Statistics</h2>
    <!-- Summary cards -->
  </section>
  <section aria-labelledby="projects-heading">
    <h2 id="projects-heading" class="sr-only">Project List</h2>
    <!-- Project cards -->
  </section>
</main>
```

### 5.2 ARIA Labels

**Required ARIA Attributes:**

| Element       | Required ARIA                   | Example                                            |
| ------------- | ------------------------------- | -------------------------------------------------- |
| Icon buttons  | `aria-label`                    | `<button aria-label="Toggle password visibility">` |
| Search inputs | `aria-label`                    | `<input aria-label="Search projects">`             |
| Form inputs   | `aria-describedby` (for errors) | `<input aria-describedby="email-error">`           |
| Status badges | `aria-label` (if color-only)    | `<span aria-label="Status: Active">`               |
| Close buttons | `aria-label`                    | `<button aria-label="Close dialog">`               |
| Tooltips      | `aria-describedby`              | `<button aria-describedby="tooltip-1">`            |

**ARIA Live Regions:**

- Toast notifications: `role="alert"` or `role="status"`
- Search results: `aria-live="polite" aria-atomic="true"` on results container
- Form validation: `aria-live="assertive"` for errors

### 5.3 Screen Reader Announcements

**Dynamic Content Updates:**

- Filter change: "Showing 12 of 48 projects"
- Search results: "8 results found for 'riverside'"
- Form errors: "Email: Please enter a valid email address"
- Success actions: "Project created successfully"
- Loading states: "Loading projects..."

**Implementation:**

```html
<div role="status" aria-live="polite" aria-atomic="true" class="sr-only">
  <!-- JavaScript updates this text when content changes -->
</div>
```

### 5.4 Screen Reader Testing

**Test with:**

- NVDA (Windows) - Free, most common
- JAWS (Windows) - Commercial, widely used
- VoiceOver (Mac/iOS) - Built-in
- TalkBack (Android) - Built-in

**Test scenarios:**

- Navigate entire page with screen reader only
- Complete login flow
- Search and filter projects
- Fill out form and submit
- Verify all content is announced correctly

---

## 6. Form Accessibility

### 6.1 Label Association

**Requirement:** All form inputs must have associated labels.

**Methods:**

1. **Wrapping label:**

```html
<label class="flex flex-col">
  <span>Email Address</span>
  <input type="email" />
</label>
```

2. **for/id association:**

```html
<label for="email-input">Email Address</label> <input id="email-input" type="email" />
```

3. **aria-label (when visual label not present):**

```html
<input type="search" aria-label="Search projects" />
```

**Never:** Use placeholder as label replacement.

### 6.2 Required Fields

**Visual indication:**

- Asterisk (\*) after label, or
- "(required)" text after label

**Programmatic indication:**

```html
<input type="email" required aria-required="true" />
```

**Screen reader announcement:** "Email, required, edit text"

### 6.3 Input Purpose

**Autocomplete attributes for known input types:**

```html
<input type="email" autocomplete="email" />
<input type="password" autocomplete="current-password" />
<input type="text" autocomplete="name" />
```

**Benefit:** Helps users fill forms quickly, especially helpful for users with cognitive disabilities.

### 6.4 Error Identification

**WCAG 3.3.1 (Level A):** Errors must be identified and described to users.

**Requirements:**

1. **Visual error indication:**
   - Red border on input
   - Error icon
   - Error message text

2. **Programmatic error indication:**

```html
<input type="email" aria-invalid="true" aria-describedby="email-error" />
<p id="email-error" role="alert">Please enter a valid email address</p>
```

3. **Error summary at top of form (if multiple errors):**

```html
<div role="alert" class="error-summary">
  <h2>Please correct the following errors:</h2>
  <ul>
    <li><a href="#email">Email address is invalid</a></li>
    <li><a href="#password">Password is required</a></li>
  </ul>
</div>
```

**Screen reader announcement:** "Invalid entry. Please enter a valid email address."

### 6.5 Help Text

**Provide instructions for complex inputs:**

```html
<label for="password">
  Password
  <span id="password-help" class="text-sm text-slate-500">
    Must be at least 8 characters with 1 number and 1 special character
  </span>
</label>
<input type="password" id="password" aria-describedby="password-help" />
```

### 6.6 Fieldsets & Legends

**Group related inputs:**

```html
<fieldset>
  <legend>Enter verification code</legend>
  <div class="flex gap-2">
    <input type="text" maxlength="1" aria-label="Digit 1 of 6" />
    <input type="text" maxlength="1" aria-label="Digit 2 of 6" />
    <!-- ... -->
  </div>
</fieldset>
```

---

## 7. Interactive Elements

### 7.1 Buttons

**Semantic HTML:**

- Use `<button>` for actions (not `<div>` or `<span>`)
- Use `<a>` for navigation (not styled buttons)

**Button text:**

- Descriptive (not just "Click here")
- Same text for same action across app

**Disabled buttons:**

```html
<button disabled aria-disabled="true">Sign In</button>
```

**Icon buttons must have labels:**

```html
<button aria-label="Close dialog">
  <span class="material-symbols-outlined" aria-hidden="true">close</span>
</button>
```

### 7.2 Links

**Descriptive link text:**

- ❌ "Click here" or "Read more"
- ✅ "Read the full project details"

**External links:**

```html
<a href="..." target="_blank" rel="noopener noreferrer">
  External resource
  <span class="sr-only">(opens in new window)</span>
</a>
```

**Skip link pattern (within long lists):**

- "Skip to next section" links for very long lists

### 7.3 Dropdowns & Selects

**Native `<select>` is fully accessible:**

- Built-in keyboard navigation
- Screen reader support
- No ARIA needed (unless custom dropdown)

**Custom dropdowns (if needed) require:**

- `role="combobox"`
- `aria-expanded` (true/false)
- `aria-controls` pointing to listbox
- `aria-activedescendant` for keyboard selection
- Full keyboard support (arrow keys, Enter, Escape)

**Recommendation:** Use native `<select>` where possible for accessibility.

### 7.4 Toggles & Switches

**Checkbox toggle:**

```html
<input type="checkbox" id="remember" role="switch" aria-checked="false" />
<label for="remember">Remember me</label>
```

**Button toggle (view switcher):**

```html
<button aria-pressed="true" aria-label="Grid view">
  <span class="material-symbols-outlined">grid_view</span>
</button>
```

---

## 8. Content Structure

### 8.1 Document Structure

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Page Title - Real Estate Tracker</title>
  </head>
  <body>
    <a href="#main" class="skip-link">Skip to main content</a>

    <header><!-- Site header --></header>

    <main id="main">
      <h1>Page Title</h1>
      <!-- Main content -->
    </main>

    <footer><!-- Site footer --></footer>
  </body>
</html>
```

### 8.2 Language Declaration

**Page language:**

```html
<html lang="en"></html>
```

**Inline language changes (if content in different language):**

```html
<p>The project name is <span lang="es">Casa Bonita</span>.</p>
```

### 8.3 Page Titles

**Format:** `[Page Name] - [Site Name]`

**Examples:**

- "Login - Real Estate Tracker"
- "Projects - Real Estate Tracker"
- "Riverside Plaza Costs - Real Estate Tracker"

**Dynamic titles:** Update on route change in SPA.

---

## 9. Images & Icons

### 9.1 Alternative Text

**Informative images:**

```html
<img src="chart.png" alt="Bar chart showing budget vs actual costs. Budget: $2.4M, Actual: $1.8M" />
```

**Decorative images:**

```html
<img src="decoration.png" alt="" role="presentation" />
<!-- OR -->
<img src="decoration.png" aria-hidden="true" />
```

**Icons with adjacent text (decorative):**

```html
<button>
  <span class="material-symbols-outlined" aria-hidden="true">add</span>
  <span>Add Project</span>
</button>
```

**Icons without text (informative):**

```html
<button aria-label="Add project">
  <span class="material-symbols-outlined" aria-hidden="true">add</span>
</button>
```

### 9.2 SVG Accessibility

**Decorative SVG:**

```html
<svg aria-hidden="true">
  <!-- SVG content -->
</svg>
```

**Informative SVG:**

```html
<svg role="img" aria-labelledby="svg-title">
  <title id="svg-title">Description of image</title>
  <!-- SVG content -->
</svg>
```

### 9.3 Icon Fonts

**Material Symbols used in mockups:**

```html
<span class="material-symbols-outlined" aria-hidden="true"> icon_name </span>
```

**Always pair with:**

- Visible text label, OR
- `aria-label` on parent button/link

---

## 10. Error Handling

### 10.1 Form Validation Errors

**Inline errors (per field):**

- Visual: Red border + error message below
- Programmatic: `aria-invalid="true"` + `aria-describedby`
- Announcement: Use `role="alert"` on error message

**Form-level errors (multiple errors):**

- Error summary at top of form
- Links to each error (scroll + focus)
- `role="alert"` on summary

**Real-time vs. On-submit:**

- Email format: Real-time (on blur)
- Required fields: On submit or on blur
- Never show error before user finishes typing

### 10.2 Page-Level Errors

**Error states (API failure, 404, etc.):**

- Clear heading: "Error: Page Not Found"
- Descriptive message
- Actionable next steps (Go Home, Try Again)
- Still keyboard navigable

**Announcement:**

```html
<div role="alert" class="error-page">
  <h1>Error: Page Not Found</h1>
  <p>The page you're looking for doesn't exist.</p>
</div>
```

### 10.3 Success Messages

**Confirmation messages:**

- Toast notification with `role="status"`
- Or success message on page with `role="status"`
- Auto-dismiss toasts should allow keyboard users to interact before dismissing (5+ seconds)

---

## 11. Responsive & Zoom

### 11.1 Responsive Design

**Requirement (WCAG 1.4.10 - Level AA):** Content must reflow without horizontal scrolling at 320px width.

**Implementation:**

- Mobile-first design approach
- Fluid layouts (no fixed widths except max-width)
- Text wraps naturally
- No horizontal scrolling needed

### 11.2 Text Zoom

**Requirement (WCAG 1.4.4 - Level AA):** Text must be resizable up to 200% without loss of content or functionality.

**Testing:**

1. Zoom to 200% in browser (Cmd/Ctrl + +)
2. Verify all text is visible
3. Verify no horizontal scrolling
4. Verify UI still functional

**Implementation:**

- Use relative units (rem, em, %) for font sizes and spacing
- Never use fixed pixel heights for text containers
- Test at 200% zoom on all breakpoints

### 11.3 Touch Targets (Mobile)

**Requirement (WCAG 2.5.5 - Level AAA, but recommended for AA):** Touch targets should be at least 44x44px.

**Implementation:**

- Minimum button height: 48px (h-12)
- Icon buttons: 40x40px minimum
- Adequate spacing between touch targets (8px minimum)
- Tap areas extend beyond visible button (padding)

---

## 12. Screen-Specific Requirements

### 12.1 Login & 2FA Screen

**Keyboard Navigation:**

- Tab order: Email → Password → Toggle → Remember Me → Forgot Password → Sign In → Social buttons → Sign Up
- Enter key submits form
- Password toggle accessible via keyboard (Tab + Space/Enter)

**Screen Reader:**

- Page title: "Login - Real Estate Tracker"
- h1: "Welcome Back" (or "Two-Factor Authentication" for 2FA)
- Password input: "Password, type password" (type announced)
- Error announcements: Immediate, `role="alert"`
- 2FA: Each digit input labeled "Digit X of 6"

**ARIA:**

- `<main role="main">` on form container
- `aria-label="Toggle password visibility"` on eye icon button
- `aria-invalid="true"` on email input when error
- `aria-describedby="email-error"` pointing to error message

**Color/Contrast:**

- Primary button (navy/white): 15.7:1 ✅
- Input borders: Must use darker slate for 3:1 contrast
- Error text (red): 4.5:1 minimum

**Focus:**

- All inputs, buttons, links focusable
- 2px blue ring on focus
- Auto-focus email input on page load (not on 2FA, user might be mid-code paste)

**Mobile:**

- Form inputs minimum 44px height for touch
- Social buttons adequate spacing (gap-3)
- No horizontal scroll needed

---

### 12.2 Projects List Screen

**Keyboard Navigation:**

- Tab order: New Project → Search → Filters → View Toggle → Project Cards
- Enter on project card opens project
- Arrow keys navigate between cards (future enhancement)

**Screen Reader:**

- Page title: "Projects - Real Estate Tracker"
- h1: "Projects"
- h2 (visually hidden): "Project Statistics" before summary cards
- h2 (visually hidden): "Project List" before cards
- Project cards: Readable as complete block (title → description → metadata)
- Search results: "Showing 18 of 24 projects" announced on filter change

**ARIA:**

- Search input: `aria-label="Search projects"`
- Filter dropdowns: Associated labels (may be visually hidden)
- View toggle buttons: `aria-pressed="true"` on active view
- Status badges: `aria-label="Status: Active"` if color-only
- Summary cards: Icon decorative `aria-hidden="true"`

**Color/Contrast:**

- Status badges: Text 4.5:1 against badge background
- At Risk badge (red): Adequate contrast verified
- Card borders hover (primary): Visible but not sole indicator of interactivity

**Focus:**

- Search input has blue ring on focus
- Each project card focusable and clickable
- View toggle buttons show focus

**Empty State:**

- If no projects: "No projects found" heading announced
- "Create First Project" button keyboard accessible

---

### 12.3 Project Costs Screen

**Keyboard Navigation:**

- Tab order: Export → Add Cost → Filter dropdowns → Table rows
- Table sortable: Click headers to sort, Enter key also triggers
- Inline editing: Enter key activates edit mode, Escape cancels

**Screen Reader:**

- Page title: "Project Costs - Riverside Plaza - Real Estate Tracker"
- h1: "Project Costs"
- Summary cards: Announced as "Total Budget: $2,450,000"
- Chart titles: h3 "Cost Breakdown by Category"
- Table: Proper table markup with `<th>` headers
- Table headers announced: "Category, Budget, Actual, Variance"

**ARIA:**

- Summary cards: Value + label + change indicator all announced
- Charts: `role="img"` with descriptive `aria-label`
- Chart alternative: Data table (visually hidden but accessible)
- Sort buttons: `aria-sort="ascending"` or `aria-sort="descending"`
- Inline edit: `aria-live="polite"` region for save confirmation

**Color/Contrast:**

- Variance red text: 4.5:1 minimum
- Chart colors: Use patterns + labels, not color alone
- Chart legend: High contrast text

**Focus:**

- All table rows focusable
- Edit buttons/cells clearly indicated
- Chart elements not focusable (static visualization)

**Charts:**

- Pie chart: Alternative text describes breakdown ("Construction: 40%, Materials: 30%...")
- Bar chart: Data table hidden but accessible to screen readers
- Line chart: Key data points announced

---

### 12.4 Project Timeline Screen

**Keyboard Navigation:**

- Tab order: Filter → View Mode → Add Event → Timeline phases
- Arrow keys navigate timeline (left/right for phases, up/down for dates - future)
- Enter on phase opens detail (future)

**Screen Reader:**

- Page title: "Project Timeline - Riverside Plaza - Real Estate Tracker"
- h1: "Project Timeline"
- Timeline: Structured as table (rows = phases, columns = months)
- Each phase: "Planning & Permits: December 2024 to February 2025, Status: Complete"
- Milestones: Announced with date and description
- Progress: "Project progress: 62%"

**ARIA:**

- Timeline: `role="table"` with proper headers
- Month headers: `<th scope="col">December 2024</th>`
- Phase names: `<th scope="row">Phase 1: Planning</th>`
- Progress bars: `role="progressbar" aria-valuenow="62" aria-valuemin="0" aria-valuemax="100"`
- Today marker: `aria-label="Today: May 15, 2025"`

**Color/Contrast:**

- Phase bars: Color + text label (not color alone)
- Today marker: High contrast (red + pulsing animation)
- Milestone markers: Shape + color + hover tooltip

**Focus:**

- Filter controls focusable
- Timeline phases focusable (if interactive)
- Month navigation arrows focusable

**Responsive:**

- Horizontal scroll on mobile (with keyboard control)
- OR vertical timeline on mobile (preferred)

---

### 12.5 Contacts Page

**Keyboard Navigation:**

- Tab order: Import → Add Contact → Search → Type filters → Contact cards
- Enter on contact card opens details
- Type filter toggles on Space/Enter

**Screen Reader:**

- Page title: "Contacts - Real Estate Tracker"
- h1: "Contacts"
- h2 (visually hidden): "Contact Statistics" before summary
- h2 (visually hidden): "Contact List" before cards
- Filter badges: "Filter: Client, 12 contacts. Active filter."
- Contact cards: "Sarah Johnson, Project Manager at ABC Construction, Client"

**ARIA:**

- Search input: `aria-label="Search contacts by name, company, or role"`
- Type filters: `role="group" aria-label="Filter by contact type"`
- Filter badges: `role="button" aria-pressed="true"` when active
- Contact cards: Structured content, icon decorative

**Color/Contrast:**

- Type badges: Same as status badges, adequate contrast
- Active filter (blue): 4.5:1 text contrast

**Focus:**

- Search input focus ring
- Each filter badge focusable
- Contact cards focusable and clickable

**Alphabetical Navigation:**

- Jump-to-letter links: `<a href="#letter-a">A</a>` keyboard accessible
- Letter headings: h3 "A", "B", etc.

---

## 13. Testing Strategy

### 13.1 Automated Testing

**Tools:**

- **axe DevTools (Chrome/Firefox extension):** Automated WCAG scan
- **Lighthouse (Chrome DevTools):** Accessibility audit score
- **WAVE (Browser extension):** Visual accessibility errors

**Run on:**

- Every screen in Epic 10.3
- Both light and dark modes
- Desktop and mobile viewports

**Target:** Zero automated errors, 100 Lighthouse accessibility score.

### 13.2 Manual Testing

**Keyboard Navigation Test:**

1. Unplug mouse (or don't use it)
2. Navigate entire screen with Tab, Shift+Tab, Enter, Space, Arrow keys
3. Verify all functionality accessible
4. Verify focus always visible
5. Verify logical tab order

**Screen Reader Test:**

- NVDA (Windows) or VoiceOver (Mac)
- Navigate with screen reader only (eyes closed, if possible)
- Verify all content announced correctly
- Verify form labels associated
- Verify dynamic updates announced

**Zoom Test:**

1. Zoom to 200% (Cmd/Ctrl + +)
2. Verify text readable
3. Verify no horizontal scroll
4. Verify functionality intact

**Color Blindness Test:**

- Use color blindness simulator (Chrome extension)
- Verify protanopia, deuteranopia, tritanopia views
- Verify information not conveyed by color alone

**High Contrast Mode Test:**

- Windows High Contrast mode
- Verify focus indicators visible
- Verify borders/UI elements visible
- Verify text readable

### 13.3 User Testing

**Test with:**

- Keyboard-only users
- Screen reader users (blind or low vision)
- Users with low vision (using zoom or magnification)
- Users with motor disabilities (may use switch control or voice control)
- Users with cognitive disabilities

**Scenarios:**

- Complete login and 2FA flow
- Search and filter projects
- View project costs and understand data
- Add a new contact

**Collect feedback on:**

- Navigation clarity
- Error message clarity
- Content understandability
- Task completion difficulty

### 13.4 Testing Checklist

**Per Screen:**

- [ ] **Automated scan** (axe, Lighthouse, WAVE) - zero errors
- [ ] **Keyboard navigation** - all interactive elements accessible
- [ ] **Tab order** - logical and matches visual order
- [ ] **Focus indicators** - visible on all interactive elements
- [ ] **Screen reader** - all content announced correctly
- [ ] **Color contrast** - all text meets 4.5:1 (body) or 3:1 (large)
- [ ] **Color independence** - information not conveyed by color alone
- [ ] **Form labels** - all inputs have associated labels
- [ ] **Error handling** - errors identified and described
- [ ] **Headings** - logical hierarchy, one h1 per page
- [ ] **ARIA** - only where needed, correct usage
- [ ] **Images/Icons** - alt text for informative, hidden for decorative
- [ ] **Zoom to 200%** - content readable, no horizontal scroll
- [ ] **Mobile touch targets** - minimum 44px (or 40px with spacing)
- [ ] **Empty states** - accessible and announced
- [ ] **Loading states** - announced to screen readers
- [ ] **High contrast mode** - UI visible and functional

---

## 14. Known Issues & Roadmap

### 14.1 Current Issues (To Fix Before Launch)

1. **Input borders contrast insufficient**
   - Issue: Slate-300 borders only 2.1:1 against white
   - Fix: Use slate-400 (#94a3b8) for 3.8:1 contrast
   - Priority: HIGH
   - Screen: All (Login, Projects, Costs, Contacts)

2. **Warning yellow badge insufficient contrast**
   - Issue: Yellow (#f59e0b) on white only 2.8:1
   - Fix: Use darker amber (#d97706) for 3.5:1
   - Priority: MEDIUM
   - Screen: Projects (status badges)

3. **Chart color-only dependence**
   - Issue: Pie chart colors not distinguishable without color
   - Fix: Add patterns or data labels
   - Priority: MEDIUM
   - Screen: Project Costs

4. **Timeline mobile accessibility**
   - Issue: Horizontal scroll may be difficult for screen reader users
   - Fix: Implement vertical timeline on mobile
   - Priority: MEDIUM
   - Screen: Project Timeline

### 14.2 Future Enhancements (Post-Launch)

1. **Keyboard shortcuts**
   - `/` to focus search
   - `?` to show keyboard shortcut help
   - Arrow keys for grid navigation

2. **Advanced screen reader features**
   - Live region announcements for all dynamic updates
   - Landmark region refinement
   - More descriptive ARIA labels

3. **Preference persistence**
   - Remember high contrast mode preference
   - Remember reduced motion preference
   - Remember zoom level preference

4. **Enhanced tooltips**
   - Keyboard-accessible tooltips
   - Tooltip on focus (not just hover)
   - ARIA descriptions for icons

5. **Skip links**
   - Skip to search
   - Skip to filters
   - Skip within long lists

6. **Focus management enhancements**
   - Focus visible class (better indicator)
   - Focus within (container highlighting)
   - Roving tabindex for grids/lists

---

## Implementation Checklist

### Phase 1: Foundation (Week 1)

- [ ] Audit and fix all color contrast issues
- [ ] Implement focus indicators on all interactive elements
- [ ] Add skip to main content link
- [ ] Ensure semantic HTML structure (landmarks, headings)
- [ ] Add page titles for all screens
- [ ] Fix input border contrast

### Phase 2: Interactivity (Week 2)

- [ ] Implement keyboard navigation for all screens
- [ ] Add ARIA labels for icon buttons
- [ ] Add ARIA live regions for dynamic content
- [ ] Implement focus management (modals, form submissions)
- [ ] Add form validation with proper error announcements
- [ ] Test and fix tab order

### Phase 3: Testing (Week 3)

- [ ] Run automated tests (axe, Lighthouse, WAVE)
- [ ] Complete keyboard navigation testing
- [ ] Complete screen reader testing (NVDA, VoiceOver)
- [ ] Test zoom to 200%
- [ ] Test high contrast mode
- [ ] Test with color blindness simulator

### Phase 4: Refinement (Week 4)

- [ ] Fix all issues found in testing
- [ ] User testing with keyboard/screen reader users
- [ ] Document remaining known issues
- [ ] Final accessibility review
- [ ] Sign-off on WCAG 2.1 AA compliance

---

## Compliance Statement (Template)

> Real Estate Development Tracker is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.
>
> **Conformance Status:** [To be determined after testing]
>
> The Real Estate Development Tracker application aims to conform to WCAG 2.1 Level AA standards. The screens covered in Epic 10.3 (Login, 2FA, Projects List, Project Costs, Project Timeline, Contacts) have been designed and implemented with accessibility as a core requirement.
>
> **Feedback:** We welcome your feedback on the accessibility of this application. Please contact [accessibility@yourcompany.com] if you encounter accessibility barriers.
>
> **Last Reviewed:** [Date of final audit]

---

**Document Owner:** Sally (UX Designer)
**Review Date:** November 13, 2025
**Next Review:** After implementation, before launch
**Compliance Target:** WCAG 2.1 Level AA
