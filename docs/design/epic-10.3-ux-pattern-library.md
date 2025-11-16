# UX Pattern Library - Epic 10.3: Screen Design Improvements

**Version:** 1.0
**Date:** November 13, 2025
**Author:** Sally (UX Designer)
**Project:** Real Estate Development Tracker

---

## Purpose

This pattern library documents all UX patterns used across Epic 10.3 screens (Login/2FA, Projects List, Project Costs, Project Timeline, Contacts). These patterns ensure consistency across the application and provide clear implementation guidance.

**Principle:** Consistent patterns reduce cognitive load and create a cohesive user experience.

---

## Table of Contents

1. [Button Patterns](#1-button-patterns)
2. [Form Input Patterns](#2-form-input-patterns)
3. [Feedback & Status Patterns](#3-feedback--status-patterns)
4. [Navigation Patterns](#4-navigation-patterns)
5. [Search Patterns](#5-search-patterns)
6. [Filter & Sort Patterns](#6-filter--sort-patterns)
7. [Card Patterns](#7-card-patterns)
8. [Table Patterns](#8-table-patterns)
9. [Chart & Visualization Patterns](#9-chart--visualization-patterns)
10. [Modal & Dialog Patterns](#10-modal--dialog-patterns)
11. [Empty State Patterns](#11-empty-state-patterns)
12. [Loading State Patterns](#12-loading-state-patterns)
13. [Error State Patterns](#13-error-state-patterns)
14. [Date & Time Patterns](#14-date--time-patterns)
15. [Badge & Label Patterns](#15-badge--label-patterns)

---

## 1. Button Patterns

### 1.1 Primary Button

**Purpose:** Main call-to-action for critical actions.

**Visual:**

- Background: `#0A2540` (navy) in light mode, `#137fec` (primary) in dark mode
- Text: White, font-semibold
- Height: `h-12` (48px)
- Padding: `px-6` (24px horizontal)
- Border radius: `rounded-lg` (8px)
- Hover: Slightly darker background with transition

**Markup:**

```html
<button
  class="flex items-center justify-center whitespace-nowrap rounded-lg h-12 px-6 text-sm font-semibold text-white bg-navy hover:bg-navy-hover dark:bg-primary dark:hover:bg-primary-hover transition-colors"
>
  Button Text
</button>
```

**When to Use:**

- Main action on a page (e.g., "Sign In", "Create Account", "New Project")
- Form submission buttons
- Confirmation actions in dialogs

**Examples:**

- Login page: "Sign In" button
- Projects List: "New Project" button
- Project Costs: "Add Cost" button
- Contacts: "Add Contact" button

**Accessibility:**

- Minimum touch target: 48x48px ✓
- Color contrast: 8.4:1 (AAA) ✓
- Focus indicator: 2px ring with primary color

---

### 1.2 Secondary Button

**Purpose:** Alternative or less critical actions.

**Visual:**

- Background: White/transparent
- Border: `border border-slate-300 dark:border-slate-700`
- Text: `text-slate-700 dark:text-slate-300`, font-medium
- Height: `h-12` (48px)
- Padding: `px-4` (16px horizontal)
- Border radius: `rounded-lg` (8px)
- Hover: Light gray background

**Markup:**

```html
<button
  class="flex items-center justify-center px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition text-sm font-medium text-slate-700 dark:text-slate-300"
>
  Button Text
</button>
```

**When to Use:**

- Secondary actions alongside primary button
- Cancel actions
- Export/Import buttons

**Examples:**

- Project Costs: "Export" button
- Contacts: "Import" button
- Timeline: "Filter" button

**Accessibility:**

- Minimum touch target: 48x48px ✓
- Color contrast: 4.8:1 (AA) ✓
- Focus indicator: 2px ring

---

### 1.3 Icon Button

**Purpose:** Actions represented by icons only (with tooltip).

**Visual:**

- Size: `w-10 h-10` or `p-2`
- Background: Transparent
- Icon color: `text-slate-600 dark:text-slate-400`
- Hover: `hover:bg-slate-100 dark:hover:bg-slate-800`
- Border radius: `rounded-lg`

**Markup:**

```html
<button
  class="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition"
  aria-label="Go back"
>
  <span class="material-symbols-outlined text-xl">arrow_back</span>
</button>
```

**When to Use:**

- Space-constrained contexts
- Toolbar actions
- Navigation controls (back, next, close)

**Examples:**

- Login: Password visibility toggle
- 2FA: Back button
- Timeline: Previous/Next month navigation

**Accessibility:**

- MUST include `aria-label` describing the action
- Minimum touch target: 40x40px
- Focus indicator: 2px ring
- Tooltip on hover (future enhancement)

---

### 1.4 Social Login Button

**Purpose:** Third-party authentication.

**Visual:**

- Background: White with border
- Border: `border border-slate-300 dark:border-slate-700`
- Height: `h-12` (48px)
- Padding: `px-4 py-3`
- Icon + text layout
- Hover: Light background

**Markup:**

```html
<button
  type="button"
  class="flex items-center justify-center px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition"
>
  <svg class="w-5 h-5 mr-2"><!-- Icon SVG --></svg>
  <span class="text-sm font-medium text-slate-700 dark:text-slate-300">Google</span>
</button>
```

**When to Use:**

- Social authentication options
- Always present in pairs or groups

**Examples:**

- Login page: Google and Facebook buttons

**Accessibility:**

- Clear text label with provider name
- Icon is decorative (alt="" on svg)
- Focus indicator: 2px ring

---

## 2. Form Input Patterns

### 2.1 Text Input

**Purpose:** Single-line text entry.

**Visual:**

- Height: `h-12` (48px)
- Padding: `px-4` (16px horizontal)
- Border: `border border-slate-300 dark:border-slate-700`
- Background: `bg-white dark:bg-background-dark`
- Text: `text-[#333333] dark:text-slate-100`
- Placeholder: `text-slate-400 dark:text-slate-500`
- Border radius: `rounded-lg` (8px)
- Focus: `focus:ring-2 focus:ring-primary/50 focus:outline-0`

**Markup:**

```html
<label class="flex flex-col w-full">
  <p class="text-[#333333] dark:text-slate-300 text-sm font-medium leading-normal pb-2">
    Label Text
  </p>
  <input
    type="text"
    class="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#333333] dark:text-slate-100 focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-300 dark:border-slate-700 bg-white dark:bg-background-dark h-12 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-4 text-base font-normal leading-normal"
    placeholder="Placeholder text"
  />
</label>
```

**When to Use:**

- Email, name, text data entry
- Any single-line input field

**States:**

- **Default:** Border slate-300
- **Focus:** 2px blue ring, no outline
- **Error:** Red border (`border-red-500`), error message below
- **Disabled:** Reduced opacity, cursor not-allowed
- **Read-only:** Gray background, no interaction

**Examples:**

- Login: Email and Password fields
- Search bars across all screens

**Accessibility:**

- Label associated with input via `<label>` wrapper or `for`/`id`
- Placeholder is NOT a replacement for label
- Error messages announced to screen readers
- Focus indicator clearly visible

---

### 2.2 Password Input with Toggle

**Purpose:** Secure password entry with visibility toggle.

**Visual:**

- Same as text input
- Icon button positioned absolute right
- Icon: Material Symbols `visibility` / `visibility_off`

**Markup:**

```html
<label class="flex flex-col w-full">
  <p class="text-[#333333] dark:text-slate-300 text-sm font-medium leading-normal pb-2">Password</p>
  <div class="relative w-full">
    <input
      id="password"
      type="password"
      class="form-input flex w-full min-w-0 flex-1 rounded-lg text-[#333333] dark:text-slate-100 focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-300 dark:border-slate-700 bg-white dark:bg-background-dark h-12 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-4 pr-12 text-base font-normal"
      placeholder="Enter your password"
    />
    <button
      type="button"
      onclick="togglePassword()"
      class="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
      aria-label="Toggle password visibility"
    >
      <span class="material-symbols-outlined text-xl">visibility</span>
    </button>
  </div>
</label>
```

**When to Use:**

- Password entry fields
- Any sensitive data that should be masked

**Behavior:**

- Click icon: Toggle between `type="password"` and `type="text"`
- Icon updates: eye open ↔ eye closed
- Button has `aria-label` for accessibility

**Examples:**

- Login page: Password field

**Accessibility:**

- Toggle button has descriptive `aria-label`
- Keyboard accessible (tab to button, enter to toggle)
- Screen reader announces when password is visible/hidden (future enhancement: add live region)

---

### 2.3 Checkbox

**Purpose:** Binary choice or multi-select options.

**Visual:**

- Size: `h-4 w-4` (16x16px)
- Border: `border-slate-300 dark:border-slate-600`
- Checked color: `text-navy dark:text-primary`
- Focus ring: `focus:ring-navy/50 dark:focus:ring-primary/50`
- Background: `bg-slate-100 dark:bg-slate-800`
- Border radius: `rounded` (4px)

**Markup:**

```html
<div class="flex items-center gap-2">
  <input
    class="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-navy dark:text-primary focus:ring-navy/50 dark:focus:ring-primary/50 bg-slate-100 dark:bg-slate-800"
    id="checkbox-id"
    type="checkbox"
  />
  <label class="text-sm text-slate-600 dark:text-slate-400" for="checkbox-id"> Label text </label>
</div>
```

**When to Use:**

- Remember me option
- Trust device option
- Terms of service acceptance
- Multi-select filters

**States:**

- **Unchecked:** Empty box
- **Checked:** Checkmark in primary color
- **Focus:** Ring visible
- **Disabled:** Reduced opacity

**Examples:**

- Login: "Remember me" checkbox
- 2FA: "Trust this device for 30 days"

**Accessibility:**

- Label associated via `for`/`id`
- Keyboard accessible (space to toggle)
- Focus indicator visible
- Checked state announced to screen readers

---

### 2.4 Search Input

**Purpose:** Text search with icon.

**Visual:**

- Same as text input
- Search icon positioned left: `pl-10`
- Icon: Material Symbols `search` in slate-400
- Placeholder: "Search..." text

**Markup:**

```html
<div class="flex-1 relative max-w-md">
  <input
    type="text"
    placeholder="Search projects..."
    class="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-background-dark text-[#333333] dark:text-slate-100 placeholder:text-slate-400"
  />
  <svg
    class="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    ></path>
  </svg>
</div>
```

**When to Use:**

- List filtering (projects, contacts)
- Global search
- Data table search

**Behavior:**

- Search typically filters on keyup (debounced)
- Clear button appears when text entered (future enhancement)
- Results update live or on submit

**Examples:**

- Projects List: Project search
- Contacts: Contact search

**Accessibility:**

- Label provided (can be visually hidden)
- `aria-label="Search projects"` on input
- Search icon is decorative (aria-hidden="true")

---

### 2.5 Select Dropdown

**Purpose:** Single selection from predefined options.

**Visual:**

- Height: `h-10` or `h-12` depending on context
- Padding: `px-3 py-2`
- Border: `border border-slate-300 dark:border-slate-700`
- Background: `bg-white dark:bg-background-dark`
- Text: `text-sm` or `text-base`
- Border radius: `rounded-lg`
- Focus: `focus:ring-2 focus:ring-primary`

**Markup:**

```html
<select
  class="px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-background-dark text-slate-700 dark:text-slate-300"
>
  <option>All Status</option>
  <option>Active</option>
  <option>On Hold</option>
  <option>Completed</option>
</select>
```

**When to Use:**

- Filter options
- Sort options
- View mode selection
- Any single-choice selection

**Examples:**

- Projects List: Status filter, Sort dropdown
- Project Costs: Category filter
- Timeline: View mode (Monthly, Weekly, Quarterly)

**Accessibility:**

- Native `<select>` is fully accessible
- Label associated (can be visually hidden if context is clear)
- Keyboard navigable (arrow keys)
- Screen reader announces options

---

### 2.6 2FA Code Input

**Purpose:** 6-digit verification code entry.

**Visual:**

- 6 individual input boxes
- Size: `w-12 h-14` (48x56px)
- Gap: `gap-2`
- Text: `text-2xl font-bold text-center`
- Border: `border-2 border-slate-300 dark:border-slate-700`
- Focus: `focus:ring-2 focus:ring-primary/50 focus:border-primary`

**Markup:**

```html
<div class="flex justify-center gap-2">
  <input
    type="text"
    maxlength="1"
    class="w-12 h-14 text-center text-2xl font-bold border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-background-dark text-[#333333] dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition"
    oninput="moveFocus(this, 1)"
  />
  <!-- Repeat 5 more times -->
</div>
```

**Behavior:**

- Auto-advance to next box on digit entry
- Backspace moves to previous box
- Paste support: auto-distribute 6-digit code across boxes (future enhancement)
- First box auto-focused when screen appears

**When to Use:**

- Two-factor authentication
- Verification code entry
- PIN entry

**Examples:**

- 2FA screen: 6-digit code input

**Accessibility:**

- Group wrapped in fieldset with legend "Enter verification code"
- Each input has `aria-label` with position (e.g., "Digit 1 of 6")
- Auto-advance announced to screen readers

---

## 3. Feedback & Status Patterns

### 3.1 Status Badges

**Purpose:** Visual status indicators.

**Visual Variants:**

- **Active/Success:** `bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400`
- **Warning/Medium Priority:** `bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400`
- **Error/At Risk:** `bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400`
- **Info/On Hold:** `bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400`
- **Neutral:** `bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300`

**Sizes:**

- Small: `px-2 py-0.5 text-xs`
- Medium: `px-3 py-1 text-sm`

**Markup:**

```html
<span
  class="px-3 py-1 text-xs font-semibold bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-full"
>
  Active
</span>
```

**When to Use:**

- Project status indicators
- Contact type labels
- Priority indicators
- Any categorical status

**Semantic Color Mapping:**

- 🟢 **Green:** Active, Success, Complete, Approved, On Track
- 🟡 **Yellow:** Warning, Medium Priority, On Hold, Pending, Review
- 🔴 **Red:** Error, High Priority, At Risk, Overdue, Critical
- 🔵 **Blue:** Info, Low Priority, In Progress, Draft
- ⚪ **Gray:** Neutral, Inactive, Disabled, Unknown

**Examples:**

- Projects List: Status badges (Active, On Hold, At Risk, Completed)
- Contacts: Type badges (Client, Vendor, Partner, Team)
- Timeline: Milestone status

**Accessibility:**

- Color is NOT the only indicator (text label required)
- Consider adding icon for additional clarity (future enhancement)
- Sufficient contrast ratio (AA minimum)

---

### 3.2 Inline Validation Messages

**Purpose:** Real-time feedback on form input.

**Visual:**

- Position: Below input field
- Text size: `text-sm`
- Color: `text-red-600` for errors, `text-green-600` for success
- Margin: `mt-1` (4px from input)

**Markup:**

```html
<!-- Error -->
<p class="mt-1 text-sm text-red-600">Please enter a valid email address</p>

<!-- Success -->
<p class="mt-1 text-sm text-green-600">Email is available</p>

<!-- Helper Text -->
<p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Must be at least 8 characters</p>
```

**When to Use:**

- Form validation (email format, required fields, etc.)
- Password strength indicators
- Availability checks (username, email)
- Helper text for complex inputs

**States:**

- **Error:** Red text, red border on input
- **Success:** Green text (optional)
- **Helper:** Gray text (always visible or on focus)

**Examples:**

- Login: Email validation error

**Accessibility:**

- Message associated with input via `aria-describedby`
- Error announced to screen reader when appears
- Input has `aria-invalid="true"` when error present

---

### 3.3 Toast Notifications

**Purpose:** Temporary feedback messages (not yet implemented in mockups, but documented for consistency).

**Visual:**

- Position: Top-right corner, `fixed top-4 right-4`
- Width: `max-w-md`
- Padding: `px-4 py-3`
- Background: White with border
- Shadow: `shadow-lg`
- Border radius: `rounded-lg`
- Icon + message layout
- Auto-dismiss after 3-5 seconds

**Variants:**

- **Success:** Green border-left, checkmark icon
- **Error:** Red border-left, alert icon
- **Warning:** Yellow border-left, warning icon
- **Info:** Blue border-left, info icon

**Markup (Specification):**

```html
<div
  class="fixed top-4 right-4 max-w-md bg-white dark:bg-slate-800 border-l-4 border-green-500 shadow-lg rounded-lg px-4 py-3 flex items-start gap-3"
>
  <span class="material-symbols-outlined text-green-500">check_circle</span>
  <div class="flex-1">
    <p class="font-medium text-slate-900 dark:text-slate-100">Success</p>
    <p class="text-sm text-slate-600 dark:text-slate-400">Your changes have been saved.</p>
  </div>
  <button class="text-slate-400 hover:text-slate-600" aria-label="Close">
    <span class="material-symbols-outlined text-xl">close</span>
  </button>
</div>
```

**When to Use:**

- Action confirmations (saved, deleted, etc.)
- Non-blocking errors
- System status updates
- Background process completion

**Behavior:**

- Slide in from right
- Stack if multiple toasts
- Auto-dismiss or manual close
- Newest on top

**Accessibility:**

- Use `role="alert"` for errors
- Use `role="status"` for success/info
- Auto-announced to screen readers
- Close button keyboard accessible

---

### 3.4 Progress Indicators

**Purpose:** Visual representation of completion or loading.

**Linear Progress Bar:**

```html
<div class="flex items-center gap-2">
  <div class="w-32 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
    <div class="h-full bg-green-500" style="width: 62%"></div>
  </div>
  <span class="text-sm text-slate-900 dark:text-slate-100 font-semibold">62%</span>
</div>
```

**When to Use:**

- Project completion percentage
- Budget spent visualization
- Task progress
- Multi-step form progress

**Examples:**

- Timeline: Overall project progress
- Projects List: Project progress (if shown in cards)

**Accessibility:**

- Percentage value visible in text
- `aria-valuenow`, `aria-valuemin`, `aria-valuemax` on progress element
- `role="progressbar"` if using div

---

### 3.5 Loading Spinner

**Purpose:** Indicate background processing (not yet in mockups, documented for consistency).

**Visual:**

- Size: Small (16px), Medium (24px), Large (32px)
- Color: Primary blue
- Animation: Spin

**When to Use:**

- Button loading state (disable button, show spinner)
- Page loading (full-page spinner)
- Component loading (skeleton screens preferred)

**Markup (Specification):**

```html
<svg
  class="animate-spin h-5 w-5 text-primary"
  xmlns="http://www.w3.org/2000/svg"
  fill="none"
  viewBox="0 0 24 24"
>
  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
  <path
    class="opacity-75"
    fill="currentColor"
    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
  ></path>
</svg>
```

**Accessibility:**

- `aria-label="Loading"` on spinner container
- Live region to announce loading state to screen readers
- Button should be disabled during loading

---

## 4. Navigation Patterns

### 4.1 Page Header

**Purpose:** Page title and primary actions.

**Visual:**

- Background: White
- Border bottom: `border-b border-gray-200`
- Padding: `px-6 py-4`
- Layout: Flex justify-between

**Structure:**

- Left: Title + subtitle
- Right: Action buttons

**Markup:**

```html
<div class="bg-white border-b border-gray-200">
  <div class="px-6 py-4">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Page Title</h1>
        <p class="text-sm text-gray-600 mt-1">Page description</p>
      </div>
      <button
        class="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover"
      >
        Primary Action
      </button>
    </div>
  </div>
</div>
```

**When to Use:**

- Every main content page
- Consistent header across application

**Examples:**

- Projects List: "Projects" + "New Project" button
- Project Costs: "Project Costs" + "Export" + "Add Cost" buttons
- Contacts: "Contacts" + "Import" + "Add Contact" buttons

**Accessibility:**

- `<h1>` tag for page title (one per page)
- Descriptive subtitle provides context
- Landmark: `<header>` tag (if applicable)

---

### 4.2 Back Button

**Purpose:** Return to previous screen.

**Visual:**

- Icon + text layout
- Icon: Material Symbols `arrow_back`
- Text: "Back to [location]"
- Color: `text-slate-600 dark:text-slate-400`
- Hover: Darker color

**Markup:**

```html
<button
  onclick="backToLogin()"
  class="flex items-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 mb-6 transition"
>
  <span class="material-symbols-outlined text-xl mr-2">arrow_back</span>
  <span class="text-sm font-medium">Back to login</span>
</button>
```

**When to Use:**

- Modal/overlay navigation
- Multi-step flows
- Detail views

**Examples:**

- 2FA screen: Back to login

**Accessibility:**

- Descriptive text (not just "Back")
- Keyboard accessible
- Focus visible

---

### 4.3 Tab Navigation

**Purpose:** Switch between related views (not in mockups, but common pattern).

**When to Use:**

- Related content sections
- Different views of same data
- Settings categories

**Specification (for consistency):**

- Horizontal tabs below header
- Active tab: Bold, bottom border in primary color
- Inactive tabs: Normal weight, no border
- Hover: Background highlight

---

### 4.4 Breadcrumbs

**Purpose:** Show navigation hierarchy (not in mockups, may be needed).

**When to Use:**

- Deep navigation hierarchies
- Multi-level content

**Specification:**

- Format: Home / Level 1 / Level 2 / Current
- Separator: `/` or `>` icon
- Current page: Bold, no link
- Previous levels: Links

---

## 5. Search Patterns

### 5.1 Simple Search Bar

**Purpose:** Text-based filtering of lists.

**Visual:**

- Max width: `max-w-md` (448px)
- Icon position: Left
- Full width on mobile

**Behavior:**

- Search on keyup (debounced 300ms)
- Case-insensitive
- Matches across multiple fields (name, company, role, etc.)
- Clear button appears when text present (future enhancement)
- No results state when query returns empty

**Examples:**

- Projects List: Search projects by name
- Contacts: Search by name, company, or role

**Accessibility:**

- `aria-label="Search projects"` on input
- Results count announced to screen reader
- "No results" message visible and announced

---

### 5.2 Search with Filters

**Purpose:** Combined text search + faceted filters.

**Layout:**

- Search bar (left or full-width on mobile)
- Filter controls (dropdowns, toggles) alongside

**Behavior:**

- Filters combine with AND logic (Status=Active AND Budget>1M)
- Search text adds additional AND condition
- Real-time filtering
- Filter count badge (e.g., "3 filters applied")

**Examples:**

- Projects List: Search + Status filter + Sort dropdown

---

## 6. Filter & Sort Patterns

### 6.1 Dropdown Filter

**Purpose:** Single-select categorical filter.

**Visual:**

- See Select Dropdown in Form Patterns
- Label: "All [Category]" for no filter applied
- Count in parentheses (future enhancement)

**Behavior:**

- "All" option clears filter
- Selection updates immediately
- Can combine multiple filters

**Examples:**

- Projects List: "All Status", "Active", "On Hold", etc.

---

### 6.2 Sort Dropdown

**Purpose:** Change list ordering.

**Visual:**

- Prefix label: "Sort: " or "Sort by: "
- Options: Natural language (e.g., "Name", "Budget", "Start Date")

**Behavior:**

- Default sort clearly indicated
- Selection updates immediately
- Some sorts may have direction (ascending/descending) - consider adding arrow icon

**Examples:**

- Projects List: "Sort: Name", "Sort: Budget", etc.

---

### 6.3 Badge Filters

**Purpose:** Multi-select categorical filters with visual badges.

**Visual:**

- Badge style buttons in a row
- Active: Primary background
- Inactive: Gray background
- Count in badge: "(12)" or "12"

**Markup:**

```html
<div class="flex items-center gap-2">
  <span class="text-sm text-gray-600">Filter:</span>
  <button
    class="px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200"
  >
    All (48)
  </button>
  <button
    class="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
  >
    Client (12)
  </button>
  <!-- More filters -->
</div>
```

**Behavior:**

- Click to toggle filter on/off
- Multiple filters can be active (OR logic within category)
- "All" is exclusive (deselects others)

**Examples:**

- Contacts: Type filters (Client, Vendor, Partner, Team)

---

### 6.4 View Toggle

**Purpose:** Switch between different layout modes.

**Visual:**

- Toggle button group
- Active button: Primary background
- Inactive button: Transparent/gray
- Icons: Grid icon, List icon

**Markup:**

```html
<div class="flex items-center border border-gray-300 dark:border-slate-700 rounded-lg">
  <button
    id="gridView"
    class="px-3 py-2 text-sm bg-primary text-white rounded-l-lg"
    onclick="toggleView('grid')"
  >
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
      ></path>
    </svg>
  </button>
  <button
    id="listView"
    class="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-r-lg"
    onclick="toggleView('list')"
  >
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M4 6h16M4 12h16M4 18h16"
      ></path>
    </svg>
  </button>
</div>
```

**When to Use:**

- Collections with multiple view options (grid vs list)
- Data tables with card alternative
- Gallery views

**Examples:**

- Projects List: Grid view (cards) vs List view (compact)

**Accessibility:**

- Buttons have `aria-label` (e.g., "Grid view", "List view")
- Active state indicated with `aria-pressed="true"`
- Keyboard accessible (tab + enter)

---

## 7. Card Patterns

### 7.1 Summary Card (Metric)

**Purpose:** Display a single key metric.

**Visual:**

- Background: White
- Border: `border border-gray-200 dark:border-slate-700`
- Border radius: `rounded-lg` or `rounded-xl`
- Padding: `p-4` or `p-6`
- Shadow: `shadow-sm`
- Layout: Icon + Label + Value + Change indicator

**Markup:**

```html
<div
  class="bg-white dark:bg-background-dark rounded-lg border border-gray-200 dark:border-slate-700 p-4 shadow-sm"
>
  <div class="flex items-center justify-between">
    <div>
      <p class="text-sm text-gray-600 dark:text-slate-400">Metric Label</p>
      <p class="text-2xl font-bold text-gray-900 dark:text-slate-100 mt-1">$2.4M</p>
    </div>
    <div
      class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center"
    >
      <svg class="w-6 h-6 text-blue-600 dark:text-blue-400"><!-- Icon --></svg>
    </div>
  </div>
</div>
```

**When to Use:**

- Dashboard metrics
- Summary statistics at top of page
- Financial data display

**Variants:**

- With change indicator: "+ 5.2%" in green or red
- With sparkline (future enhancement)
- Color-coded by status (variance red if over budget)

**Examples:**

- Projects List: Total Projects, Active, At Risk, Total Value
- Project Costs: Total Budget, Total Spent, Remaining, Variance

**Accessibility:**

- Semantic HTML (no tables for layout)
- Icon is decorative (aria-hidden="true")
- Color not sole indicator of meaning (text + icon)

---

### 7.2 Project Card

**Purpose:** Display project summary in grid layout.

**Visual:**

- Background: White
- Border: `border border-gray-200 dark:border-slate-700`
- Border radius: `rounded-2xl`
- Shadow: `shadow-lg`, hover: `shadow-2xl`
- Transition: `transition-all duration-300`
- Hover: `hover:border-primary`

**Structure:**

- Top: Color gradient header (unique per project/status)
- Status badge (top-right of header)
- Priority badge (bottom-left of header)
- Body: Title, description, metadata
- Footer: Time estimate, CTA link

**Markup Example:**

```html
<a
  href="#"
  class="group bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-primary"
>
  <!-- Header with gradient -->
  <div class="h-48 bg-gradient-to-br from-purple-500 to-indigo-600 relative overflow-hidden">
    <!-- Status badge -->
    <div class="absolute top-4 right-4">
      <span class="px-3 py-1 text-xs font-semibold bg-white/90 text-purple-700 rounded-full"
        >Story 10.16</span
      >
    </div>
    <!-- Priority badge -->
    <div class="absolute bottom-4 left-4">
      <span class="px-3 py-1 text-xs font-semibold bg-red-500 text-white rounded-full"
        >High Priority</span
      >
    </div>
    <!-- Icon -->
    <div class="absolute inset-0 flex items-center justify-center">
      <svg class="w-24 h-24 text-white opacity-20"><!-- Icon --></svg>
    </div>
  </div>
  <!-- Body -->
  <div class="p-6">
    <h4
      class="text-xl font-bold text-gray-900 dark:text-slate-100 group-hover:text-primary transition-colors mb-2"
    >
      Card Title
    </h4>
    <p class="text-sm text-gray-600 dark:text-slate-400 mb-4">Description text goes here</p>
    <div class="flex items-center justify-between text-sm">
      <span class="text-gray-500 dark:text-slate-500">2-3 days</span>
      <span class="text-primary font-medium group-hover:underline">View Mockup →</span>
    </div>
  </div>
</a>
```

**When to Use:**

- Project listings
- Portfolio displays
- Content galleries

**Examples:**

- Projects List: Project cards (not fully shown in mockup snippet, but pattern defined in epic)
- Index page: Epic mockup cards

---

### 7.3 Contact Card

**Purpose:** Display contact information in list or grid.

**Visual:**

- Background: White
- Border: `border border-gray-200`
- Border radius: `rounded-lg`
- Padding: `p-4`

**Structure:**

- Avatar (left or top)
- Name + role
- Company
- Contact type badge
- Quick action buttons (email, phone icons)

**When to Use:**

- Contact lists
- Team member displays
- User directories

**Examples:**

- Contacts page: Contact cards (pattern defined but not fully visible in snippet)

---

## 8. Table Patterns

### 8.1 Data Table

**Purpose:** Display structured tabular data.

**Visual:**

- Background: White
- Border: `border border-gray-200`
- Border radius: `rounded-xl`
- Header: `bg-gray-50`, bold text
- Rows: Hover background `hover:bg-gray-50`
- Cell padding: `px-4 py-3` or `px-6 py-4`

**Structure:**

```html
<div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
  <!-- Header -->
  <div class="px-6 py-4 border-b border-gray-200">
    <h3 class="text-lg font-semibold text-gray-900">Table Title</h3>
  </div>

  <!-- Table -->
  <table class="w-full">
    <thead class="bg-gray-50">
      <tr>
        <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Column 1</th>
        <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Column 2</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-gray-200">
      <tr class="hover:bg-gray-50">
        <td class="px-6 py-4 text-sm text-gray-900">Data</td>
        <td class="px-6 py-4 text-sm text-gray-600">Data</td>
      </tr>
    </tbody>
  </table>
</div>
```

**Features:**

- Sortable columns (click header to sort)
- Selectable rows (checkboxes in first column)
- Row actions (kebab menu or inline buttons)
- Pagination (bottom)
- Responsive: Horizontal scroll or card view on mobile

**Examples:**

- Project Costs: Detailed cost breakdown table

**Accessibility:**

- Proper table semantics (`<table>`, `<thead>`, `<tbody>`, `<th>`, `<td>`)
- Column headers associated with cells
- Sort direction announced (aria-sort)
- Keyboard navigation (tab through rows, enter to select)

---

### 8.2 Inline Editing Table

**Purpose:** Edit data directly in table cells.

**Behavior:**

- Click cell to enter edit mode
- Input appears in cell
- Save on blur or Enter key
- Cancel on Escape key
- Visual indicator for dirty cells

**When to Use:**

- Quick data updates
- Spreadsheet-like interfaces

**Examples:**

- Project Costs: Inline editing for cost values (mentioned in epic)

---

## 9. Chart & Visualization Patterns

### 9.1 Pie Chart

**Purpose:** Show part-to-whole relationships.

**When to Use:**

- Cost breakdown by category
- Distribution percentages
- Limited number of categories (5-7 max)

**Visual:**

- Library: Chart.js
- Size: Responsive, max height 64 (256px)
- Colors: Semantic (match status badge colors)
- Legend: Below or right

**Examples:**

- Project Costs: Cost breakdown by category

**Accessibility:**

- Chart title in `<h3>` above
- Data table alternative (hidden but available to screen readers)
- Color contrast sufficient
- Legend text readable

---

### 9.2 Bar Chart

**Purpose:** Compare values across categories.

**When to Use:**

- Budget vs Actual comparison
- Comparing multiple projects
- Time series (vertical bars)

**Visual:**

- Library: Chart.js
- Horizontal or vertical bars
- Color: Primary for single series, semantic for multiple
- Value labels on bars (future enhancement)

**Examples:**

- Project Costs: Budget vs Actual comparison

---

### 9.3 Line Chart

**Purpose:** Show trends over time.

**When to Use:**

- Spending trend over time
- Progress over time
- Any time-series data

**Visual:**

- Library: Chart.js
- Line color: Primary or semantic
- Grid lines: Subtle gray
- Points: Show on hover
- Tooltip: Show exact values

**Examples:**

- Project Costs: Spending trend over time

---

### 9.4 Timeline/Gantt Chart

**Purpose:** Visualize project schedule with phases and milestones.

**Visual:**

- Horizontal timeline with date scale
- Phases: Colored bars spanning date range
- Milestones: Diamond or circle markers
- Today marker: Vertical line (red, pulsing dot)
- Hover: Tooltip with details

**Structure:**

- Header: Month labels
- Rows: Phase names (left) + timeline bars (right)
- Color-coded by status (on track, at risk, complete)

**Examples:**

- Project Timeline: Gantt-style timeline

**Accessibility:**

- Timeline data also in table format (hidden but accessible)
- Keyboard navigation (arrow keys to move between phases)
- Tooltips keyboard-accessible
- Color not sole indicator (patterns or text also)

---

## 10. Modal & Dialog Patterns

### 10.1 Modal Dialog

**Purpose:** Focused task or confirmation (not shown in mockups, but standard pattern).

**Visual:**

- Overlay: `bg-black/50` backdrop blur
- Modal: White card, centered, shadow-2xl
- Max width: `max-w-md` for simple, `max-w-2xl` for complex
- Border radius: `rounded-2xl`
- Padding: `p-6` or `p-8`

**Structure:**

- Header: Title + close button (X icon, top-right)
- Body: Content
- Footer: Cancel + Primary action buttons (right-aligned)

**Markup (Specification):**

```html
<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
  onclick="closeModal(event)"
>
  <div
    class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6"
    onclick="event.stopPropagation()"
  >
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-bold text-gray-900 dark:text-slate-100">Modal Title</h2>
      <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600" aria-label="Close">
        <span class="material-symbols-outlined">close</span>
      </button>
    </div>

    <!-- Body -->
    <div class="mb-6">
      <p class="text-gray-600 dark:text-slate-400">Modal content goes here.</p>
    </div>

    <!-- Footer -->
    <div class="flex items-center justify-end gap-3">
      <button
        class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
      >
        Cancel
      </button>
      <button
        class="px-4 py-2 text-sm font-semibold text-white bg-navy dark:bg-primary hover:bg-navy-hover dark:hover:bg-primary-hover rounded-lg"
      >
        Confirm
      </button>
    </div>
  </div>
</div>
```

**When to Use:**

- Confirmations (delete, destructive actions)
- Forms (add/edit item)
- Contextual information

**Behavior:**

- Trap focus within modal
- Close on Escape key
- Close on backdrop click (optional)
- Return focus to trigger element on close

**Accessibility:**

- `role="dialog"` on modal container
- `aria-labelledby` pointing to title
- `aria-modal="true"`
- Focus trap (tab cycles within modal)
- Close button keyboard accessible
- Escape key closes modal
- Background content inert (aria-hidden="true")

---

### 10.2 Confirmation Dialog

**Purpose:** Confirm destructive or important actions.

**Visual:**

- Same as modal
- Icon indicating action type (warning, delete, etc.)
- Concise question as title
- Explanation in body
- Cancel (secondary) + Destructive action (red button)

**When to Use:**

- Delete operations
- Irreversible actions
- Data loss warnings

**Markup (Specification):**

- Same as modal but with warning icon and red primary button for destructive action

---

## 11. Empty State Patterns

### 11.1 No Results (Search/Filter)

**Purpose:** Indicate no items match current criteria.

**Visual:**

- Centered in content area
- Icon (search with slash or empty box)
- Heading: "No results found"
- Description: "Try adjusting your search or filters"
- Action: "Clear filters" button (if filters applied)

**Markup (Specification):**

```html
<div class="flex flex-col items-center justify-center py-12 px-4">
  <div
    class="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4"
  >
    <span class="material-symbols-outlined text-3xl text-slate-400">search_off</span>
  </div>
  <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">No results found</h3>
  <p class="text-sm text-slate-600 dark:text-slate-400 mb-4 text-center max-w-sm">
    We couldn't find any projects matching your search. Try adjusting your filters.
  </p>
  <button class="px-4 py-2 text-sm font-medium text-primary hover:underline">
    Clear all filters
  </button>
</div>
```

**When to Use:**

- Search returns no results
- Filter combination returns empty set

**Examples:**

- Projects List: No projects match search/filter
- Contacts: No contacts match search

---

### 11.2 First Use (No Data Yet)

**Purpose:** Guide new users to create first item.

**Visual:**

- Centered in content area
- Illustration or large icon
- Heading: "Get started by creating your first [item]"
- Description: Brief value proposition
- Primary action: "Create [item]" button

**Markup (Specification):**

```html
<div class="flex flex-col items-center justify-center py-16 px-4">
  <div class="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
    <span class="material-symbols-outlined text-5xl text-primary">add_circle</span>
  </div>
  <h3 class="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
    Create your first project
  </h3>
  <p class="text-sm text-slate-600 dark:text-slate-400 mb-6 text-center max-w-md">
    Projects help you organize and track your real estate development work. Get started by creating
    your first project.
  </p>
  <button
    class="px-6 py-3 text-sm font-semibold text-white bg-navy dark:bg-primary hover:bg-navy-hover dark:hover:bg-primary-hover rounded-lg"
  >
    Create First Project
  </button>
</div>
```

**When to Use:**

- First time user views empty list
- Onboarding flow

**Examples:**

- Projects List: No projects created yet (mentioned in epic line 224)
- Contacts: No contacts yet

---

## 12. Loading State Patterns

### 12.1 Skeleton Screen

**Purpose:** Show content structure while loading data.

**Visual:**

- Gray placeholder blocks matching content layout
- Pulsing animation: `animate-pulse`
- Same card/table structure as actual content

**When to Use:**

- Page load with known layout
- Better UX than spinner for content-heavy pages

**Markup (Specification):**

```html
<div class="bg-white rounded-lg border border-slate-200 p-6 animate-pulse">
  <div class="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
  <div class="h-3 bg-slate-200 rounded w-full mb-2"></div>
  <div class="h-3 bg-slate-200 rounded w-5/6"></div>
</div>
```

**Examples:**

- Projects List: Loading project cards
- Project Costs: Loading table data

---

### 12.2 Button Loading State

**Purpose:** Indicate button action in progress.

**Visual:**

- Button disabled
- Spinner replaces text or appears before text
- Slightly reduced opacity

**Markup (Specification):**

```html
<button
  disabled
  class="flex items-center justify-center whitespace-nowrap rounded-lg h-12 px-6 text-sm font-semibold text-white bg-navy/70 cursor-not-allowed"
>
  <svg
    class="animate-spin h-4 w-4 mr-2 text-white"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      class="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      stroke-width="4"
    ></circle>
    <path
      class="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
  Processing...
</button>
```

**When to Use:**

- Form submission
- API calls triggered by button
- Any async button action

---

## 13. Error State Patterns

### 13.1 Inline Field Error

**Purpose:** Show validation error on specific field.

**Visual:**

- Red border on input: `border-red-500`
- Error message below: `text-red-600 text-sm`
- Error icon (optional)

**When to Use:**

- Form validation errors
- Real-time validation feedback

**Examples:**

- Login: Email validation error (shown in mockup)

_See Form Input Patterns section for detailed markup._

---

### 13.2 Page-Level Error

**Purpose:** Show error when page/data fails to load.

**Visual:**

- Centered in content area
- Error icon (alert triangle)
- Heading: "Something went wrong"
- Description: Error message (user-friendly)
- Action: "Try again" button or "Go back" button

**Markup (Specification):**

```html
<div class="flex flex-col items-center justify-center py-16 px-4">
  <div
    class="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4"
  >
    <span class="material-symbols-outlined text-3xl text-red-600 dark:text-red-400">error</span>
  </div>
  <h3 class="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Something went wrong</h3>
  <p class="text-sm text-slate-600 dark:text-slate-400 mb-6 text-center max-w-md">
    We couldn't load this page. Please try again or contact support if the problem persists.
  </p>
  <div class="flex gap-3">
    <button
      class="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
    >
      Go Back
    </button>
    <button
      class="px-4 py-2 text-sm font-semibold text-white bg-navy dark:bg-primary hover:bg-navy-hover dark:hover:bg-primary-hover rounded-lg"
    >
      Try Again
    </button>
  </div>
</div>
```

**When to Use:**

- API request failure
- Page not found (404)
- Permission denied (403)
- Server error (500)

---

## 14. Date & Time Patterns

### 14.1 Date Display Format

**Purpose:** Consistent date formatting across application.

**Formats:**

- **Full date:** "November 13, 2025"
- **Short date:** "Nov 13, 2025"
- **Numeric:** "11/13/2025" (US format)
- **Relative:** "2 days ago", "In 3 weeks"
- **Date range:** "Dec 2024 - Oct 2025"

**When to Use:**

- Full: Formal contexts (contracts, reports)
- Short: Space-constrained (cards, tables)
- Numeric: Data entry, sortable columns
- Relative: Recent activity, timestamps

**Examples:**

- Timeline: "Dec 2024 - Oct 2025", "May 15, 2025"
- Index page: "November 12, 2025"

---

### 14.2 Date Picker (Not in mockups, specification for consistency)

**Visual:**

- Calendar popup
- Month/year navigation
- Today highlighted
- Selected date in primary color
- Date range selection (if applicable)

**When to Use:**

- Date input fields
- Filter by date range

**Accessibility:**

- Keyboard navigation (arrow keys to move between days)
- Date format announced to screen readers
- Today, selected, and disabled dates clearly indicated

---

## 15. Badge & Label Patterns

### 15.1 Status Badge

_See Section 3.1 Feedback & Status Patterns for detailed specification._

---

### 15.2 Count Badge

**Purpose:** Show count of items (notifications, filters, etc.).

**Visual:**

- Small circle or pill
- Background: Red for alerts, gray for neutral
- Text: White, small font
- Position: Top-right of icon or at end of text

**Markup:**

```html
<button class="relative">
  <span class="material-symbols-outlined">notifications</span>
  <span
    class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-semibold rounded-full flex items-center justify-center"
  >
    3
  </span>
</button>
```

**When to Use:**

- Unread notifications
- Active filter count
- Shopping cart items
- Any count indicator

**Accessibility:**

- Count announced to screen readers
- Use `aria-label` on parent: "Notifications (3 unread)"

---

### 15.3 Priority Badge

**Purpose:** Visual priority indicator.

**Visual:**

- Similar to status badge
- Colors match semantic meaning (red=high, yellow=medium, green=low)

**Examples:**

- Index cards: "High Priority", "Medium Priority" badges

---

## Pattern Usage Matrix

| Pattern          | Login/2FA | Projects | Costs | Timeline | Contacts |
| ---------------- | --------- | -------- | ----- | -------- | -------- |
| Primary Button   | ✓         | ✓        | ✓     | ✓        | ✓        |
| Secondary Button | ✓         |          | ✓     | ✓        | ✓        |
| Text Input       | ✓         |          |       |          |          |
| Search Input     |           | ✓        |       |          | ✓        |
| Select Dropdown  |           | ✓        | ✓     | ✓        |          |
| Status Badge     |           | ✓        |       | ✓        | ✓        |
| Summary Card     |           | ✓        | ✓     |          | ✓        |
| Data Table       |           |          | ✓     |          |          |
| Chart            |           |          | ✓     |          |          |
| Timeline         |           |          |       | ✓        |          |

---

## Implementation Notes

### Design System Integration

All patterns use the following design tokens:

**Colors:**

- Primary: `#137fec`
- Navy: `#0A2540`
- Background Light: `#f6f7f8`
- Background Dark: `#101922`
- Semantic: Green (success), Red (error), Yellow (warning), Blue (info)
- Neutrals: Slate scale (50-900)

**Typography:**

- Font: Inter
- Scale: text-xs (12px), text-sm (14px), text-base (16px), text-lg (18px), text-xl (20px), text-2xl (24px), text-3xl (30px), text-4xl (36px)
- Weights: font-normal (400), font-medium (500), font-semibold (600), font-bold (700), font-black (900)

**Spacing:**

- Base: 4px (0.25rem)
- Scale: 0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 64

**Border Radius:**

- Default: 4px
- lg: 8px
- xl: 12px
- 2xl: 16px
- full: 9999px (circular)

**Shadows:**

- sm: subtle
- DEFAULT: normal
- lg: elevated
- xl: prominent
- 2xl: dramatic

### Responsive Breakpoints

- **sm:** 640px (small tablets)
- **md:** 768px (tablets)
- **lg:** 1024px (desktops)
- **xl:** 1280px (large desktops)

### Dark Mode

All patterns support dark mode using Tailwind's `dark:` prefix. Follow these principles:

- Reduce brightness, not just invert colors
- Maintain sufficient contrast (WCAG AA minimum)
- Use slate scale for neutrals in dark mode
- Adjust opacity for depth (e.g., borders at 70%)

---

## Maintenance & Evolution

**Version History:**

- v1.0 (Nov 13, 2025): Initial pattern library extracted from Epic 10.3 mockups

**Contributing:**

- New patterns must be documented before implementation
- Update existing patterns when design evolves
- Include examples and accessibility notes
- Maintain consistency with design tokens

**Review Cadence:**

- Quarterly review of pattern usage
- Remove unused patterns
- Consolidate similar patterns
- Update based on user feedback and usability testing

---

**Document Maintained By:** Sally (UX Designer)
**Last Updated:** November 13, 2025
**Next Review:** February 2026
