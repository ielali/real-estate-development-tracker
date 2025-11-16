# Component Specifications - Epic 10.3: Screen Design Improvements

**Version:** 1.0
**Date:** November 13, 2025
**Author:** Sally (UX Designer)
**Project:** Real Estate Development Tracker

---

## Purpose

This document provides detailed specifications for all custom components used in Epic 10.3 screens. Each specification includes purpose, data requirements, user actions, states, variants, behavior, and accessibility requirements to guide implementation.

---

## Table of Contents

1. [StatusBadge](#1-statusbadge)
2. [SummaryCard](#2-summarycard)
3. [DataTable](#3-datatable)
4. [TimelineView](#4-timelineview)
5. [ContactCard](#5-contactcard)
6. [SearchBar](#6-searchbar)
7. [FilterPanel](#7-filterpanel)
8. [ProjectCard](#8-projectcard)
9. [Button Components](#9-button-components)
10. [Form Input Components](#10-form-input-components)

---

## 1. StatusBadge

### Purpose & Value

Visual indicator for categorical status (project status, contact type, priority, etc.). Provides at-a-glance status recognition through color, icon, and text.

### Content/Data Displayed

- **Required:** Status text (string)
- **Optional:** Icon (Material Symbol name)
- **Optional:** Count (number)

**Example Data:**

```typescript
{
    status: "Active",
    variant: "success",
    icon: "check_circle",
    count: 18
}
```

### User Actions

- **Display only:** No direct user interaction
- **Optional hover:** Tooltip with additional info (future enhancement)
- **Optional click:** Filter by status (when used as filter control)

### All States

#### Visual States

1. **Default:** Badge displayed with appropriate variant color
2. **Hover:** Slight opacity increase (if interactive)
3. **Focus:** 2px ring (if interactive button)
4. **Disabled:** Reduced opacity (50%), grayscale

#### Data States

- **With count:** Shows count in parentheses
- **With icon:** Icon appears before text
- **Without text:** Icon only (requires aria-label)

### Variants

#### Size Variants

```typescript
type BadgeSize = "small" | "medium" | "large"

const sizeClasses = {
  small: "px-2 py-0.5 text-xs",
  medium: "px-3 py-1 text-sm",
  large: "px-4 py-2 text-base",
}
```

#### Style Variants

```typescript
type BadgeVariant = "success" | "warning" | "error" | "info" | "neutral"

const variantClasses = {
  success: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  warning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  error: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
}
```

#### Shape Variants

- **Pill:** `rounded-full` (default)
- **Rounded:** `rounded-lg`
- **Square:** `rounded`

### Behavior on Interaction

**Non-interactive (default):**

- No hover effect
- Not focusable
- Static display

**Interactive (as filter button):**

- Hover: Background darkens slightly
- Click: Toggles active state (aria-pressed)
- Keyboard: Space/Enter toggles

### Markup Example

**Static badge:**

```html
<span
  class="inline-flex items-center gap-1.5 px-3 py-1 text-sm font-semibold bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-full"
>
  <span class="material-symbols-outlined text-base" aria-hidden="true">check_circle</span>
  <span>Active</span>
</span>
```

**Interactive badge (filter):**

```html
<button
  type="button"
  class="inline-flex items-center gap-1.5 px-3 py-1 text-sm font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 transition focus:outline-none focus:ring-2 focus:ring-primary/50"
  aria-pressed="true"
>
  <span>Client</span>
  <span class="text-xs">(12)</span>
</button>
```

### Accessibility

**Static badge:**

- Text content readable by screen reader
- Icon decorative (aria-hidden="true")
- Color not sole indicator (text label required)
- Minimum 4.5:1 contrast for text

**Interactive badge:**

- Button semantics (`<button>` or `role="button"`)
- `aria-pressed="true/false"` for toggle state
- `aria-label` if text unclear (e.g., "Filter by Client, 12 items")
- Keyboard accessible (Tab + Space/Enter)
- Focus indicator visible (2px ring)
- Minimum 44px touch target (mobile)

### Usage Examples

**Projects List:**

- Status badges: Active, On Hold, Completed, At Risk

**Contacts Page:**

- Type badges: Client, Vendor, Partner, Team

**Project Timeline:**

- Phase status: Complete, In Progress, Upcoming

### Implementation Notes

**Props Interface:**

```typescript
interface StatusBadgeProps {
  text: string
  variant: "success" | "warning" | "error" | "info" | "neutral"
  size?: "small" | "medium" | "large"
  icon?: string // Material Symbol name
  count?: number
  interactive?: boolean
  pressed?: boolean // For toggle buttons
  onClick?: () => void
  ariaLabel?: string
}
```

**Semantic Meaning Mapping:**

- Green (success): Active, Complete, Approved, On Track
- Yellow (warning): On Hold, Pending, Review, Medium Priority
- Red (error): At Risk, Overdue, High Priority, Critical
- Blue (info): In Progress, Draft, Info, Low Priority
- Gray (neutral): Inactive, Unknown, Neutral

---

## 2. SummaryCard

### Purpose & Value

Display a single key metric with context (icon, label, value, change indicator). Used for dashboard-style summaries at top of pages.

### Content/Data Displayed

- **Required:** Label (string) - e.g., "Total Budget"
- **Required:** Value (string/number) - e.g., "$2,450,000" or "24"
- **Optional:** Icon (Material Symbol name)
- **Optional:** Change indicator (number + direction) - e.g., "+5.2%" or "-3 projects"
- **Optional:** Helper text (string) - e.g., "75% of budget"
- **Optional:** Trend (enum: 'up' | 'down' | 'neutral')

**Example Data:**

```typescript
{
    label: "Total Budget",
    value: "$2,450,000",
    icon: "payments",
    iconColor: "blue",
    helperText: "Original estimate"
}
```

```typescript
{
    label: "Variance",
    value: "+$127,320",
    icon: "trending_down",
    iconColor: "red",
    helperText: "5.2% over original",
    trend: "down"
}
```

### User Actions

- **Display only:** No direct interaction (default)
- **Optional click:** Navigate to detail view or filter
- **Optional hover:** Show tooltip with additional context

### All States

#### Visual States

1. **Default:** Card displayed with icon, label, value
2. **Hover:** Subtle shadow increase, cursor pointer (if clickable)
3. **Focus:** 2px ring (if clickable link)
4. **Loading:** Skeleton screen with pulsing animation
5. **Error:** Error icon + error message in place of value

#### Data States

- **With trend:** Shows up/down arrow + color coding
- **With helper text:** Additional context below value
- **Large value:** Font size adjusts for very large numbers
- **Negative value:** Red color for negative financial values

### Variants

#### Size Variants

```typescript
type CardSize = "compact" | "default" | "large"

const sizeClasses = {
  compact: "p-3",
  default: "p-4",
  large: "p-6",
}

const valueSizeClasses = {
  compact: "text-xl",
  default: "text-2xl",
  large: "text-3xl",
}
```

#### Icon Color Variants

- **Blue:** General metrics (total projects, etc.)
- **Green:** Positive metrics (active, completed)
- **Red:** Negative/at-risk metrics (errors, overdue)
- **Yellow:** Warning metrics (on hold, pending)
- **Purple:** Financial metrics (total value, budget)
- **Gray:** Neutral metrics

### Behavior on Interaction

**Static card (default):**

- No interaction
- Display only

**Clickable card:**

- Hover: Shadow increases, cursor pointer
- Click: Navigate to detail page or expand
- Keyboard: Tab to focus, Enter to activate
- Focus: 2px blue ring visible

### Markup Example

```html
<div
  class="bg-white dark:bg-background-dark rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-md transition"
>
  <div class="flex items-center justify-between">
    <div class="flex-1">
      <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Total Budget</p>
      <p class="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">$2,450,000</p>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-2">Original estimate</p>
    </div>
    <div
      class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0"
    >
      <span
        class="material-symbols-outlined text-2xl text-blue-600 dark:text-blue-400"
        aria-hidden="true"
      >
        payments
      </span>
    </div>
  </div>
</div>
```

**With trend indicator:**

```html
<div
  class="bg-white dark:bg-background-dark rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm"
>
  <div class="flex items-center justify-between">
    <div class="flex-1">
      <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Total Spent</p>
      <p class="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">$1,847,320</p>
      <p class="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
        <span class="inline-block w-2 h-2 bg-green-600 rounded-full"></span>
        <span>75.4% of budget</span>
      </p>
    </div>
    <div
      class="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center flex-shrink-0"
    >
      <span
        class="material-symbols-outlined text-2xl text-orange-600 dark:text-orange-400"
        aria-hidden="true"
      >
        account_balance_wallet
      </span>
    </div>
  </div>
</div>
```

### Accessibility

**Structure:**

- Semantic HTML (no `<table>` for layout)
- Label + value readable as single unit
- Icon decorative (aria-hidden="true")

**Screen Reader:**

- Card announces as: "Total Budget: $2,450,000. Original estimate."
- Trend announces as: "75.4% of budget. On track."
- Use `aria-label` on card if clickable: "View budget details. Total Budget: $2,450,000"

**Keyboard:**

- If clickable: Focusable with Tab, activated with Enter
- Focus indicator: 2px ring
- Skip links if many cards (future enhancement)

**Color:**

- Color not sole indicator of meaning
- Trend uses icon + color + text
- Red/green values also have symbol or text descriptor

**Contrast:**

- Text: 4.5:1 minimum (body), 3:1 (large)
- Icon: 3:1 minimum against background
- Helper text: 4.5:1 minimum

### Usage Examples

**Projects List:**

- Total Projects: 24
- Active: 18
- At Risk: 3
- Total Value: $42.5M

**Project Costs:**

- Total Budget: $2,450,000
- Total Spent: $1,847,320
- Remaining: $602,680
- Variance: +$127,320

**Contacts:**

- Total Contacts: 48
- Clients: 12
- Vendors: 18
- Partners: 10

### Implementation Notes

**Props Interface:**

```typescript
interface SummaryCardProps {
  label: string
  value: string | number
  icon?: string // Material Symbol name
  iconColor?: "blue" | "green" | "red" | "yellow" | "purple" | "gray"
  helperText?: string
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  size?: "compact" | "default" | "large"
  loading?: boolean
  error?: string
  clickable?: boolean
  onClick?: () => void
  href?: string // For link behavior
}
```

**Formatting Guidelines:**

- Currency: Use Intl.NumberFormat for localization
- Large numbers: Use abbreviations (K, M, B) for compact size
- Percentages: Always include % symbol
- Dates: Use relative format when appropriate ("2 days ago")

---

## 3. DataTable

### Purpose & Value

Display structured tabular data with sorting, filtering, and optional inline editing. Used for detailed data like cost breakdowns, vendor lists, or transaction histories.

### Content/Data Displayed

- **Required:** Column headers (array of strings)
- **Required:** Row data (array of objects)
- **Optional:** Row actions (edit, delete, view, etc.)
- **Optional:** Summary row (totals, averages)
- **Optional:** Pagination info
- **Optional:** Selection checkboxes

**Example Data:**

```typescript
interface TableColumn {
  key: string
  label: string
  sortable?: boolean
  width?: string // e.g., "200px" or "20%"
  align?: "left" | "center" | "right"
  format?: (value: any) => string // Currency, date formatting
}

interface TableRow {
  id: string
  [key: string]: any
}

const columns: TableColumn[] = [
  { key: "category", label: "Category", sortable: true },
  { key: "budgeted", label: "Budgeted", sortable: true, align: "right", format: formatCurrency },
  { key: "actual", label: "Actual", sortable: true, align: "right", format: formatCurrency },
  { key: "variance", label: "Variance", sortable: true, align: "right", format: formatCurrency },
]
```

### User Actions

**Sorting:**

- Click column header to sort ascending
- Click again to sort descending
- Click third time to remove sort (revert to default)

**Selection:**

- Click checkbox to select row
- Click header checkbox to select all/none
- Keyboard: Space to toggle selection

**Inline Editing:**

- Click cell to enter edit mode
- Type to change value
- Enter to save, Escape to cancel
- Tab to move to next cell

**Row Actions:**

- Click action button (edit, delete, view)
- Keyboard: Enter on focused button
- Confirm destructive actions (delete)

**Pagination:**

- Click page number to navigate
- Click next/previous arrows
- Keyboard: Arrow keys (optional)

### All States

#### Table States

1. **Default:** Data displayed in table
2. **Loading:** Skeleton rows with pulse animation
3. **Empty:** "No data" message with optional action
4. **Error:** Error message with retry button
5. **Sorted:** Column header shows sort direction (arrow icon)
6. **Filtered:** Some rows hidden, "X of Y items" shown

#### Row States

1. **Default:** Normal row styling
2. **Hover:** Background highlight (slate-50)
3. **Selected:** Checkmark, highlighted background (blue-50)
4. **Editing:** Input fields replace cell values
5. **Disabled:** Reduced opacity, non-interactive

#### Cell States

1. **Default:** Value displayed as text
2. **Editable hover:** Subtle background change, cursor pointer
3. **Editing:** Input field shown
4. **Invalid:** Red border, error icon
5. **Saved:** Brief green flash (success indicator)

### Variants

#### Display Density

```typescript
type TableDensity = "compact" | "default" | "comfortable"

const densityClasses = {
  compact: "px-3 py-2 text-sm",
  default: "px-4 py-3 text-base",
  comfortable: "px-6 py-4 text-base",
}
```

#### Borders

- **None:** No cell borders
- **Horizontal:** Rows separated by border
- **All:** Full grid borders
- **Outer only:** Border around table only

#### Zebra Striping

- **Enabled:** Alternating row background colors
- **Disabled:** Uniform background (hover only)

### Behavior on Interaction

**Sorting:**

1. Click header → Column sorts ascending
2. Arrow icon (↑) appears in header
3. `aria-sort="ascending"` added to header
4. Screen reader announces: "Sorted by Category, ascending"
5. Click again → Sort descending (↓)
6. Click again → Remove sort (default order)

**Inline Editing:**

1. Click cell → Input field appears
2. Cell background changes to white
3. Focus moves to input
4. Type to edit value
5. Enter → Save (API call), green flash, return to view mode
6. Escape → Cancel, return to original value
7. Error → Red border, error message below cell

**Selection:**

1. Click checkbox → Row highlighted (blue-50)
2. Checkbox checked, `aria-selected="true"`
3. Bulk action bar appears above table (if selections > 0)
4. Header checkbox updates to match selection state:
   - Unchecked: No rows selected
   - Indeterminate: Some rows selected
   - Checked: All rows selected

### Markup Example

```html
<div
  class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden"
>
  <!-- Table Header -->
  <div
    class="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between"
  >
    <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Cost Breakdown</h3>
    <div class="flex items-center gap-3">
      <select
        class="px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary"
      >
        <option>All Categories</option>
        <option>Construction</option>
        <option>Materials</option>
      </select>
    </div>
  </div>

  <!-- Table -->
  <div class="overflow-x-auto">
    <table class="w-full">
      <thead class="bg-slate-50 dark:bg-slate-800">
        <tr>
          <th
            scope="col"
            class="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
          >
            <button
              type="button"
              class="flex items-center gap-2 hover:text-slate-900 dark:hover:text-slate-100"
              aria-sort="ascending"
            >
              <span>Category</span>
              <span class="material-symbols-outlined text-base" aria-hidden="true"
                >arrow_upward</span
              >
            </button>
          </th>
          <th
            scope="col"
            class="px-6 py-3 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
          >
            Budgeted
          </th>
          <th
            scope="col"
            class="px-6 py-3 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
          >
            Actual
          </th>
          <th
            scope="col"
            class="px-6 py-3 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
          >
            Variance
          </th>
          <th
            scope="col"
            class="px-6 py-3 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
          >
            Actions
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900">
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800 transition">
          <td class="px-6 py-4 text-sm font-medium text-slate-900 dark:text-slate-100">
            Construction
          </td>
          <td class="px-6 py-4 text-sm text-right text-slate-600 dark:text-slate-400">$980,000</td>
          <td class="px-6 py-4 text-sm text-right text-slate-600 dark:text-slate-400">
            $1,050,200
          </td>
          <td class="px-6 py-4 text-sm text-right text-red-600 dark:text-red-400 font-medium">
            +$70,200
          </td>
          <td class="px-6 py-4 text-sm text-right">
            <button
              class="text-primary hover:text-primary-hover"
              aria-label="Edit construction costs"
            >
              <span class="material-symbols-outlined text-xl" aria-hidden="true">edit</span>
            </button>
          </td>
        </tr>
        <!-- More rows -->
      </tbody>
      <!-- Optional: Summary Footer -->
      <tfoot class="bg-slate-50 dark:bg-slate-800 font-semibold">
        <tr>
          <td class="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">Total</td>
          <td class="px-6 py-4 text-sm text-right text-slate-900 dark:text-slate-100">
            $2,450,000
          </td>
          <td class="px-6 py-4 text-sm text-right text-slate-900 dark:text-slate-100">
            $1,847,320
          </td>
          <td class="px-6 py-4 text-sm text-right text-red-600 dark:text-red-400">+$127,320</td>
          <td></td>
        </tr>
      </tfoot>
    </table>
  </div>

  <!-- Optional: Pagination -->
  <div
    class="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between"
  >
    <p class="text-sm text-slate-600 dark:text-slate-400">
      Showing <span class="font-medium">1-10</span> of <span class="font-medium">47</span> items
    </p>
    <div class="flex items-center gap-2">
      <button
        class="px-3 py-1 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
        disabled
      >
        Previous
      </button>
      <button class="px-3 py-1 text-sm bg-primary text-white rounded">1</button>
      <button
        class="px-3 py-1 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded"
      >
        2
      </button>
      <button
        class="px-3 py-1 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded"
      >
        3
      </button>
      <button
        class="px-3 py-1 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
      >
        Next
      </button>
    </div>
  </div>
</div>
```

### Accessibility

**Table Semantics:**

- Use proper `<table>`, `<thead>`, `<tbody>`, `<tfoot>` elements
- Column headers: `<th scope="col">`
- Row headers (if applicable): `<th scope="row">`
- Caption or visually hidden heading describes table

**Sorting:**

- Sortable headers are `<button>` elements
- `aria-sort="ascending"`, `aria-sort="descending"`, or `aria-sort="none"`
- Screen reader announces sort direction change

**Keyboard Navigation:**

- Tab through interactive elements (sort buttons, action buttons, edit cells)
- Enter/Space activates buttons
- Arrow keys navigate cells (optional enhancement)
- Escape exits edit mode

**Screen Reader:**

- Table announced with caption/heading
- Column headers announced before cell values
- Sort direction announced: "Category, sorted ascending"
- Row actions announced: "Edit construction costs button"

**Focus Management:**

- Sort button focus visible (2px ring)
- Edit mode: Focus moves to input field
- Save/Cancel: Focus returns to cell

**Empty State:**

```html
<tbody>
  <tr>
    <td colspan="5" class="px-6 py-12 text-center">
      <div class="flex flex-col items-center gap-3">
        <span class="material-symbols-outlined text-4xl text-slate-400" aria-hidden="true"
          >search_off</span
        >
        <p class="text-sm text-slate-600 dark:text-slate-400">No cost items found</p>
        <button class="text-sm text-primary hover:underline">Clear filters</button>
      </div>
    </td>
  </tr>
</tbody>
```

### Usage Examples

**Project Costs:**

- Detailed cost breakdown table
- Columns: Category, Budgeted, Actual, Variance, Actions
- Inline editing for cost values
- Sortable by all numeric columns

### Implementation Notes

**Props Interface:**

```typescript
interface DataTableProps {
  columns: TableColumn[]
  data: TableRow[]
  loading?: boolean
  error?: string
  sortable?: boolean
  defaultSort?: { column: string; direction: "asc" | "desc" }
  selectable?: boolean
  density?: "compact" | "default" | "comfortable"
  striped?: boolean
  editable?: boolean
  onSort?: (column: string, direction: "asc" | "desc" | null) => void
  onEdit?: (rowId: string, column: string, newValue: any) => Promise<void>
  onRowClick?: (row: TableRow) => void
  onSelectionChange?: (selectedIds: string[]) => void
  rowActions?: RowAction[]
  pagination?: PaginationConfig
  summary?: TableRow // Summary/footer row
}
```

**Performance:**

- Virtualization for tables with 100+ rows
- Debounced sorting/filtering
- Optimistic updates for inline editing
- Skeleton loading for perceived performance

---

## 4. TimelineView

### Purpose & Value

Visualize project schedule with phases, milestones, and progress over time. Provides clear view of timeline, dependencies, and current status.

### Content/Data Displayed

- **Required:** Phases (array of objects with name, start, end, status)
- **Required:** Date range (project start and end dates)
- **Optional:** Milestones (array of objects with name, date, description)
- **Optional:** Today marker
- **Optional:** Progress percentage
- **Optional:** Dependencies (lines showing phase relationships)

**Example Data:**

```typescript
interface Phase {
  id: string
  name: string
  startDate: Date
  endDate: Date
  status: "completed" | "in-progress" | "upcoming" | "at-risk"
  progress: number // 0-100
  color?: string
}

interface Milestone {
  id: string
  name: string
  date: Date
  description?: string
  status: "achieved" | "upcoming" | "missed"
}

const phases: Phase[] = [
  {
    id: "1",
    name: "Planning & Permits",
    startDate: new Date("2024-12-01"),
    endDate: new Date("2025-02-28"),
    status: "completed",
    progress: 100,
  },
  // ...
]
```

### User Actions

**Navigation:**

- Click phase → Show phase details (modal or side panel)
- Click milestone → Show milestone details
- Prev/Next buttons → Navigate months/quarters
- Zoom controls → Change time scale (daily, weekly, monthly)

**Filtering:**

- Filter by phase status
- Filter by assigned team
- Show/hide milestones

**Interaction:**

- Hover phase → Tooltip with details
- Hover milestone → Tooltip with description
- Drag phase bar → Reschedule (if editing enabled)

### All States

#### Timeline States

1. **Default:** All phases displayed across months
2. **Loading:** Skeleton timeline with pulsing bars
3. **Empty:** "No schedule defined" message with "Add Phase" button
4. **Error:** Error message with retry button
5. **Filtered:** Some phases hidden, "Showing X of Y phases"

#### Phase Bar States

1. **Default:** Colored bar spanning date range
2. **Hover:** Highlight, tooltip appears
3. **Selected:** Border highlight, detail panel shown
4. **Completed:** Solid fill, checkmark icon
5. **In Progress:** Partial fill (progress %), current date marker
6. **Upcoming:** Light opacity
7. **At Risk:** Red color, warning icon
8. **Disabled:** Grayscale, non-interactive

#### Milestone States

1. **Default:** Diamond/circle marker on date
2. **Hover:** Tooltip with description
3. **Achieved:** Green color, checkmark
4. **Upcoming:** Blue color, circle
5. **Missed:** Red color, alert icon

### Variants

#### Layout Variants

- **Horizontal:** Traditional Gantt chart (default)
- **Vertical:** Timeline flows top to bottom (mobile)
- **Compact:** Reduced height per phase

#### Time Scale Variants

- **Daily:** Each column = 1 day
- **Weekly:** Each column = 1 week
- **Monthly:** Each column = 1 month (default)
- **Quarterly:** Each column = 1 quarter

#### Color Scheme

- **Status-based:** Colors indicate phase status
- **Phase-based:** Each phase has unique color
- **Single-color:** All phases same color, status shown with icons

### Behavior on Interaction

**Hover Phase Bar:**

1. Bar highlights (brightness +10%)
2. Tooltip appears above bar
3. Tooltip content:
   - Phase name
   - Date range
   - Progress percentage
   - Status
4. Cursor changes to pointer

**Click Phase Bar:**

1. Phase highlighted (border)
2. Detail panel slides in from right OR modal opens
3. Panel/modal shows:
   - Full phase details
   - Tasks/subtasks
   - Assigned team
   - Notes
4. Focus moves to panel/modal

**Navigate Months:**

1. Click prev/next arrow
2. Timeline scrolls/slides to previous/next month
3. Month label updates
4. Animation: Smooth scroll (200ms)
5. Keyboard: Arrow keys also navigate

**Zoom Time Scale:**

1. Click zoom dropdown
2. Select: Daily, Weekly, Monthly, Quarterly
3. Timeline redraws with new scale
4. Maintains current date in viewport

**Today Marker:**

- Vertical line at today's date
- Pulsing red dot at top
- Label: "Today: May 15, 2025"
- Scrolls into view on page load

### Markup Example

```html
<div
  class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden"
>
  <!-- Header Controls -->
  <div
    class="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between"
  >
    <div class="flex items-center gap-4">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-slate-700 dark:text-slate-300"
          >Project Duration:</span
        >
        <span class="text-sm text-slate-900 dark:text-slate-100 font-semibold"
          >Dec 2024 - Oct 2025</span
        >
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-slate-700 dark:text-slate-300">Progress:</span>
        <div class="w-32 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div class="h-full bg-green-500" style="width: 62%"></div>
        </div>
        <span class="text-sm text-slate-900 dark:text-slate-100 font-semibold">62%</span>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <button
        class="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
        aria-label="Previous month"
      >
        <span class="material-symbols-outlined">chevron_left</span>
      </button>
      <span class="text-sm text-slate-700 dark:text-slate-300 min-w-[100px] text-center"
        >May 2025</span
      >
      <button
        class="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
        aria-label="Next month"
      >
        <span class="material-symbols-outlined">chevron_right</span>
      </button>
    </div>
  </div>

  <!-- Timeline Grid -->
  <div class="overflow-x-auto">
    <div class="inline-block min-w-full">
      <!-- Month Headers -->
      <div
        class="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
      >
        <div class="w-64 px-6 py-4 border-r border-slate-200 dark:border-slate-700 flex-shrink-0">
          <span class="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase"
            >Phase / Milestone</span
          >
        </div>
        <div class="flex flex-1">
          <div class="flex-1 px-4 py-4 border-r border-slate-200 dark:border-slate-700 text-center">
            <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">Dec 2024</span>
          </div>
          <div class="flex-1 px-4 py-4 border-r border-slate-200 dark:border-slate-700 text-center">
            <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">Jan 2025</span>
          </div>
          <!-- More months -->
          <div
            class="flex-1 px-4 py-4 border-r border-slate-200 dark:border-slate-700 text-center bg-blue-50 dark:bg-blue-900/20"
          >
            <span class="text-xs font-semibold text-blue-700 dark:text-blue-300">May 2025</span>
          </div>
          <!-- More months -->
        </div>
      </div>

      <!-- Phase Rows -->
      <div class="divide-y divide-slate-200 dark:divide-slate-700">
        <!-- Phase 1: Completed -->
        <div class="flex hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
          <div
            class="w-64 px-6 py-4 border-r border-slate-200 dark:border-slate-700 flex items-center gap-3 flex-shrink-0"
          >
            <span
              class="material-symbols-outlined text-green-600 dark:text-green-400 text-xl"
              aria-hidden="true"
              >check_circle</span
            >
            <div>
              <p class="text-sm font-medium text-slate-900 dark:text-slate-100">
                Planning & Permits
              </p>
              <p class="text-xs text-slate-600 dark:text-slate-400">Complete</p>
            </div>
          </div>
          <div class="flex-1 relative px-4 py-4">
            <!-- Phase bar spanning Dec - Feb -->
            <div
              class="absolute top-1/2 -translate-y-1/2 left-4 h-8 bg-green-500 dark:bg-green-600 rounded timeline-bar cursor-pointer"
              style="width: calc(27.27% * 3); /* 3 months */"
              role="button"
              tabindex="0"
              aria-label="Planning & Permits phase: December 2024 to February 2025, Status: Complete, Click for details"
            >
              <div class="h-full flex items-center justify-center text-white text-xs font-semibold">
                100%
              </div>
            </div>
          </div>
        </div>

        <!-- Phase 2: In Progress -->
        <div class="flex hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
          <div
            class="w-64 px-6 py-4 border-r border-slate-200 dark:border-slate-700 flex items-center gap-3 flex-shrink-0"
          >
            <span
              class="material-symbols-outlined text-blue-600 dark:text-blue-400 text-xl"
              aria-hidden="true"
              >pending</span
            >
            <div>
              <p class="text-sm font-medium text-slate-900 dark:text-slate-100">
                Foundation & Structure
              </p>
              <p class="text-xs text-slate-600 dark:text-slate-400">In Progress</p>
            </div>
          </div>
          <div class="flex-1 relative px-4 py-4">
            <!-- Phase bar spanning Mar - Jun, 62% complete -->
            <div
              class="absolute top-1/2 -translate-y-1/2 h-8 bg-blue-200 dark:bg-blue-900/50 rounded timeline-bar cursor-pointer"
              style="left: calc(27.27% * 3 + 16px); width: calc(27.27% * 4);"
              role="button"
              tabindex="0"
              aria-label="Foundation & Structure phase: March 2025 to June 2025, Status: In Progress, 62% complete, Click for details"
            >
              <div class="h-full bg-blue-500 dark:bg-blue-600 rounded" style="width: 62%">
                <div
                  class="h-full flex items-center justify-center text-white text-xs font-semibold"
                >
                  62%
                </div>
              </div>
            </div>
            <!-- Today marker (May = 5th month) -->
            <div
              class="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
              style="left: calc(27.27% * 5 + 16px);"
              aria-label="Today: May 15, 2025"
            >
              <div
                class="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full animate-pulse"
              ></div>
            </div>
          </div>
        </div>

        <!-- More phases -->
      </div>
    </div>
  </div>
</div>
```

### Accessibility

**Structure:**

- Timeline as `<table>` or ARIA grid
- Month headers: `<th scope="col">`
- Phase names: `<th scope="row">`
- Phase bars: `role="button"` with descriptive `aria-label`

**Screen Reader:**

- Table caption: "Project Timeline: December 2024 to October 2025"
- Phase announced: "Planning & Permits phase: December 2024 to February 2025, Status: Complete, 100% progress"
- Today marker: "Today: May 15, 2025" (announced once on load)
- Navigation: "Previous month, button" / "Next month, button"

**Keyboard Navigation:**

- Tab through phase bars
- Enter/Space on phase bar → Show details
- Arrow keys navigate months (prev/next buttons)
- Focus visible: 2px ring on phase bar

**Color:**

- Status not conveyed by color alone
- Icons indicate status (checkmark, pending, warning)
- Text labels for status (Complete, In Progress, At Risk)
- Patterns for color-blind users (future enhancement)

**Focus Management:**

- Page load: Timeline scrolls to today marker
- Navigate months: Focus remains on navigation button
- Open phase detail: Focus moves to detail panel
- Close detail: Focus returns to phase bar

**Alternative Format:**

- Data table view (all phase data in standard table)
- Screen reader accessible
- Linked from timeline view

### Usage Examples

**Project Timeline Screen:**

- Full project schedule with all phases
- Milestones for key deliverables
- Today marker showing current progress
- Navigate months to see full project span

### Implementation Notes

**Props Interface:**

```typescript
interface TimelineViewProps {
  phases: Phase[]
  milestones?: Milestone[]
  startDate: Date
  endDate: Date
  currentDate?: Date // For "today" marker
  viewMode?: "daily" | "weekly" | "monthly" | "quarterly"
  onPhaseClick?: (phase: Phase) => void
  onMilestoneClick?: (milestone: Milestone) => void
  editable?: boolean // Allow drag to reschedule
  onPhaseUpdate?: (phaseId: string, newStart: Date, newEnd: Date) => Promise<void>
  loading?: boolean
  error?: string
}
```

**Responsive Behavior:**

- Desktop: Horizontal timeline
- Mobile (< 768px): Vertical timeline OR horizontal scroll
- Touch: Swipe to navigate months
- Pinch to zoom (time scale)

**Performance:**

- Virtualize if 50+ phases
- Lazy load phase details on click
- Debounced drag updates (if editing enabled)

---

## 5. ContactCard

### Purpose & Value

Display individual contact information in a card format with quick actions. Used for browsing contacts, viewing key details at a glance, and accessing contact actions.

### Content/Data Displayed

- **Required:** Contact name (string)
- **Required:** Contact type (Client, Vendor, Partner, Team)
- **Optional:** Company/Organization (string)
- **Optional:** Phone number (string)
- **Optional:** Email address (string)
- **Optional:** Role/Title (string)
- **Optional:** Avatar/Photo (image URL or initials)
- **Optional:** Projects associated (count or list)

**Example Data:**

```typescript
interface Contact {
  id: string
  name: string
  type: "client" | "vendor" | "partner" | "team"
  company?: string
  role?: string
  email?: string
  phone?: string
  avatar?: string
  projectsCount?: number
}
```

### User Actions

**Primary Actions:**

- Click card → View full contact details
- Click phone → Initiate call (tel: link)
- Click email → Compose email (mailto: link)
- Click avatar → View contact profile

**Secondary Actions:**

- Edit contact (icon button)
- Delete contact (icon button)
- Add to project (icon button)
- View associated projects (badge click)

### All States

#### Card States

1. **Default:** Contact info displayed with type badge
2. **Hover:** Shadow increase, cursor pointer
3. **Focus:** 2px ring (if clickable)
4. **Selected:** Border highlight (for multi-select)
5. **Loading:** Skeleton with pulsing animation
6. **Error:** Error state with retry option

#### Action Button States

1. **Default:** Icon visible on hover (desktop)
2. **Hover:** Background highlight
3. **Focus:** 2px ring
4. **Disabled:** Reduced opacity, non-interactive

### Variants

#### Size Variants

```typescript
type ContactCardSize = "compact" | "default" | "expanded"

const sizeClasses = {
  compact: "p-4", // Name, type, one contact method
  default: "p-6", // Name, type, company, email, phone
  expanded: "p-8", // All fields including role, projects
}
```

#### Layout Variants

- **Grid:** Card in grid layout (default)
- **List:** Horizontal layout with more detail
- **Minimal:** Name and type only

#### Avatar Variants

- **Photo:** User-uploaded image
- **Initials:** Colored circle with initials
- **Icon:** Generic person icon (fallback)

### Behavior on Interaction

**Card Click:**

1. Card clickable area responds to click
2. Navigate to contact detail page OR
3. Open detail modal/panel
4. Focus moves to detail view

**Quick Actions:**

- Hover card → Action buttons appear (top right)
- Click email → Opens default email client
- Click phone → Triggers device tel: link
- Click edit → Opens edit form

**Type Badge Filter:**

- Badge clickable (optional)
- Click → Filter contacts by type
- Updates page URL/state

### Markup Example

```html
<div
  class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition cursor-pointer group"
>
  <div class="p-6">
    <!-- Header: Avatar + Actions -->
    <div class="flex items-start justify-between mb-4">
      <div
        class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0"
      >
        SM
      </div>
      <!-- Quick Actions (visible on hover) -->
      <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
        <button
          type="button"
          class="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"
          aria-label="Edit contact"
        >
          <span class="material-symbols-outlined text-lg">edit</span>
        </button>
        <button
          type="button"
          class="p-1.5 text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
          aria-label="Delete contact"
        >
          <span class="material-symbols-outlined text-lg">delete</span>
        </button>
      </div>
    </div>

    <!-- Contact Name + Type Badge -->
    <div class="mb-3">
      <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">Sarah Miller</h3>
      <span
        class="inline-flex items-center px-2.5 py-1 text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full"
      >
        Client
      </span>
    </div>

    <!-- Company + Role -->
    <div class="mb-4 space-y-1">
      <p class="text-sm font-medium text-slate-900 dark:text-slate-100">Skyline Properties</p>
      <p class="text-sm text-slate-600 dark:text-slate-400">Senior Project Manager</p>
    </div>

    <!-- Contact Methods -->
    <div class="space-y-2 mb-4">
      <a
        href="mailto:sarah.miller@skyline.com"
        class="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition"
      >
        <span class="material-symbols-outlined text-lg">mail</span>
        <span>sarah.miller@skyline.com</span>
      </a>
      <a
        href="tel:+15551234567"
        class="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition"
      >
        <span class="material-symbols-outlined text-lg">phone</span>
        <span>+1 (555) 123-4567</span>
      </a>
    </div>

    <!-- Projects Count -->
    <div class="pt-4 border-t border-slate-200 dark:border-slate-700">
      <span class="text-xs text-slate-600 dark:text-slate-400">
        Associated with
        <span class="font-semibold text-slate-900 dark:text-slate-100">3 projects</span>
      </span>
    </div>
  </div>
</div>
```

### Accessibility

**Structure:**

- Semantic HTML with proper heading hierarchy
- Card as clickable region: `<article>` or `<div role="article">`
- Main click target on card, secondary actions as buttons

**Links & Buttons:**

- Email/phone as `<a>` links with proper protocols
- Action buttons as `<button>` elements
- All interactive elements focusable
- `aria-label` on icon-only buttons

**Screen Reader:**

- Card announces: "Sarah Miller, Client, Skyline Properties, Senior Project Manager"
- Contact methods readable with context: "Email: sarah.miller@skyline.com"
- Actions announced: "Edit contact button", "Delete contact button"

**Keyboard Navigation:**

- Tab through card, links, buttons
- Enter/Space on card → Navigate to detail
- Enter on email/phone → Follow link
- Focus visible on all interactive elements

**Color Contrast:**

- Text: 4.5:1 minimum
- Type badge: 4.5:1 for text on colored background
- Action buttons: 3:1 minimum

### Usage Examples

**Contacts Page:**

- Grid of contact cards (3-4 columns on desktop)
- Filter by type: Client, Vendor, Partner, Team
- Search by name or company
- Sort by name, company, or type

### Implementation Notes

**Props Interface:**

```typescript
interface ContactCardProps {
  contact: Contact
  size?: "compact" | "default" | "expanded"
  layout?: "grid" | "list" | "minimal"
  onClick?: (contact: Contact) => void
  onEdit?: (contact: Contact) => void
  onDelete?: (contactId: string) => void
  showQuickActions?: boolean
  selectable?: boolean
  selected?: boolean
}
```

**Avatar Logic:**

- If avatar URL: Display image
- Else: Generate initials from name (first letter of first + last name)
- Background color: Hash contact ID to color palette

**Responsive:**

- Desktop: 3-4 columns (grid-cols-3 xl:grid-cols-4)
- Tablet: 2 columns (md:grid-cols-2)
- Mobile: 1 column (grid-cols-1)

---

## 6. SearchBar

### Purpose & Value

Enable users to quickly search and filter content by keywords. Provides instant feedback with autocomplete/suggestions and clear affordances for search actions.

### Content/Data Displayed

- **Required:** Search input field
- **Optional:** Placeholder text
- **Optional:** Search icon
- **Optional:** Clear button (when input has value)
- **Optional:** Results count (e.g., "Found 12 results")
- **Optional:** Autocomplete dropdown with suggestions

**Example Data:**

```typescript
interface SearchBarProps {
  value: string
  placeholder?: string
  suggestions?: string[]
  resultsCount?: number
  loading?: boolean
  onSearch: (query: string) => void
  onClear?: () => void
}
```

### User Actions

**Typing:**

- Type in input → Updates search query
- Debounced search triggers after 300ms
- Shows suggestions if available

**Autocomplete:**

- Arrow down → Highlight first suggestion
- Arrow up/down → Navigate suggestions
- Enter → Select highlighted suggestion
- Click suggestion → Select suggestion

**Clear:**

- Click X button → Clear input and results
- Keyboard: Escape → Clear input

**Search:**

- Enter key → Execute search (if not debounced)
- Click search icon → Execute search

### All States

#### Input States

1. **Default:** Empty with placeholder
2. **Focus:** Border highlight, ring visible
3. **Typing:** Value shown, debounce timer active
4. **Filled:** Value present, clear button visible
5. **Loading:** Spinner icon while searching
6. **Error:** Red border, error message
7. **Disabled:** Greyed out, non-interactive

#### Suggestions States

1. **Hidden:** No suggestions or not focused
2. **Loading:** "Loading suggestions..."
3. **Visible:** Dropdown with suggestions
4. **Empty:** "No suggestions found"
5. **Highlighted:** One suggestion highlighted (keyboard nav)

### Variants

#### Size Variants

```typescript
type SearchBarSize = "small" | "medium" | "large"

const sizeClasses = {
  small: "h-9 text-sm px-3",
  medium: "h-11 text-base px-4",
  large: "h-14 text-lg px-5",
}
```

#### Style Variants

- **Default:** White background, border
- **Filled:** Grey background, no border
- **Outlined:** Border only, transparent background

#### Position Variants

- **Standalone:** Full-width search bar
- **Navigation:** Integrated in top nav
- **Inline:** Within content area (e.g., table header)

### Behavior on Interaction

**Focus Input:**

1. Border changes to primary color
2. Ring appears (2px, primary/50)
3. Placeholder remains until typing
4. Suggestions dropdown appears (if available)

**Type Query:**

1. Characters entered into input
2. Debounce timer starts (300ms)
3. After debounce: onSearch callback fires
4. Loading spinner appears
5. Results update
6. Results count updates ("Found X results")

**Clear Input:**

1. Click X button
2. Input value clears
3. onClear callback fires
4. Results reset to default
5. Focus returns to input

**Select Suggestion:**

1. Click or Enter on suggestion
2. Input value updates to suggestion
3. Dropdown closes
4. Search executes with selected term
5. Focus returns to input

### Markup Example

```html
<div class="relative w-full max-w-md">
  <!-- Search Input -->
  <div class="relative">
    <span
      class="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-xl pointer-events-none"
    >
      search
    </span>
    <input
      type="search"
      placeholder="Search projects, contacts, or locations..."
      class="w-full h-11 pl-11 pr-10 text-base text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition placeholder:text-slate-500 dark:placeholder:text-slate-400"
      value=""
      aria-label="Search"
      aria-describedby="search-results-count"
    />
    <!-- Clear Button (shown when input has value) -->
    <button
      type="button"
      class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded transition"
      aria-label="Clear search"
    >
      <span class="material-symbols-outlined text-lg">close</span>
    </button>
  </div>

  <!-- Results Count (optional) -->
  <p
    id="search-results-count"
    class="mt-2 text-sm text-slate-600 dark:text-slate-400"
    role="status"
    aria-live="polite"
  >
    Found 12 results
  </p>

  <!-- Suggestions Dropdown (optional) -->
  <div
    class="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden z-50"
  >
    <ul role="listbox" class="max-h-64 overflow-y-auto">
      <li
        role="option"
        class="px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition"
        aria-selected="false"
      >
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-slate-400 text-lg">history</span>
          <span>Skyline Tower Project</span>
        </div>
      </li>
      <li
        role="option"
        class="px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition"
        aria-selected="false"
      >
        <div class="flex items-center gap-2">
          <span class="material-symbols-oriented text-slate-400 text-lg">search</span>
          <span>Skyline Properties (contact)</span>
        </div>
      </li>
      <!-- More suggestions -->
    </ul>
  </div>
</div>
```

### Accessibility

**Input Field:**

- Proper `<input type="search">` semantics
- `aria-label` or associated `<label>`
- `aria-describedby` for results count
- Placeholder text not sole instruction

**Clear Button:**

- `<button>` element (not icon in input)
- `aria-label="Clear search"`
- Only visible when input has value
- Accessible via keyboard (Tab)

**Suggestions Dropdown:**

- `role="listbox"` on container
- `role="option"` on each suggestion
- `aria-selected="true"` on highlighted item
- `aria-activedescendant` on input points to highlighted option
- Keyboard navigation (Arrow keys)

**Screen Reader:**

- Input announces: "Search, edit text"
- Results count: "Found 12 results" (aria-live="polite")
- Suggestion navigation: "Skyline Tower Project, 1 of 5"
- Clear action: "Search cleared" (status announcement)

**Keyboard:**

- Tab to focus input
- Type to search
- Arrow down to open/navigate suggestions
- Enter to select suggestion or execute search
- Escape to close suggestions or clear input
- Tab away to close suggestions

**Focus Management:**

- Focus visible on input (2px ring)
- Highlighted suggestion visible (background color)
- After clear: Focus returns to input
- After select: Focus returns to input

### Usage Examples

**Projects List:**

- Search by project name, location, or status
- Suggestions: Recent searches + matching projects

**Contacts Page:**

- Search by name, company, or email
- Suggestions: Contact names + companies

**Navigation Bar:**

- Global search across all content
- Suggestions: Projects, contacts, documents

### Implementation Notes

**Props Interface:**

```typescript
interface SearchBarProps {
  value: string
  placeholder?: string
  size?: "small" | "medium" | "large"
  suggestions?: Suggestion[]
  resultsCount?: number
  loading?: boolean
  error?: string
  debounceMs?: number // Default: 300
  minChars?: number // Minimum chars to trigger search, default: 2
  onSearch: (query: string) => void
  onClear?: () => void
  onSuggestionSelect?: (suggestion: Suggestion) => void
  disabled?: boolean
}

interface Suggestion {
  id: string
  text: string
  type?: string // e.g., 'project', 'contact', 'recent'
  icon?: string
}
```

**Debouncing:**

- Use debounce to avoid excessive API calls
- Default: 300ms
- Clear debounce timer on clear action

**Recent Searches:**

- Store in localStorage (client-side)
- Show as suggestions when input focused
- Icon: history icon
- Clear recent searches option

---

## 7. FilterPanel

### Purpose & Value

Allow users to refine displayed data using multiple filter criteria. Provides clear visual feedback on active filters and easy reset functionality.

### Content/Data Displayed

- **Required:** Filter controls (checkboxes, dropdowns, date pickers)
- **Required:** Filter labels
- **Optional:** Active filters count badge
- **Optional:** Clear all filters button
- **Optional:** Apply/Reset buttons (for batch filtering)
- **Optional:** Saved filter presets

**Example Data:**

```typescript
interface FilterPanelProps {
  filters: FilterGroup[]
  activeFilters: ActiveFilter[]
  onFilterChange: (filters: ActiveFilter[]) => void
  onClearAll?: () => void
}

interface FilterGroup {
  id: string
  label: string
  type: "checkbox" | "radio" | "select" | "daterange"
  options: FilterOption[]
  expanded?: boolean
}

interface FilterOption {
  id: string
  label: string
  count?: number // e.g., "Active (18)"
  value: any
}
```

### User Actions

**Toggle Filter:**

- Click checkbox → Enable/disable filter
- Select option → Apply filter
- Change date → Update date range filter

**Clear Filters:**

- Click "Clear all" → Remove all active filters
- Click X on individual filter chip → Remove that filter

**Expand/Collapse Groups:**

- Click group header → Toggle visibility of options
- Keyboard: Space/Enter to toggle

**Apply Filters:**

- Instant: Filters apply immediately on change (default)
- Batch: Click "Apply" button to apply all changes

### All States

#### Panel States

1. **Default:** All filters available, none active
2. **With Active Filters:** Badge shows count, some options selected
3. **Loading:** Skeleton or disabled state while data loads
4. **Collapsed:** Panel hidden, toggle button shows count
5. **Empty:** No filters available

#### Filter Group States

1. **Expanded:** Options visible (default)
2. **Collapsed:** Options hidden, arrow indicates state
3. **Disabled:** Non-interactive, greyed out

#### Filter Option States

1. **Unchecked:** Default state
2. **Checked:** Selected, checkmark visible
3. **Hover:** Background highlight
4. **Focus:** 2px ring visible
5. **Disabled:** Cannot be selected

### Variants

#### Layout Variants

- **Sidebar:** Vertical panel (left or right)
- **Dropdown:** Popover from button (mobile)
- **Inline:** Horizontal filter bar above content

#### Interaction Variants

- **Instant:** Filters apply immediately
- **Batch:** "Apply" button required
- **Live Count:** Shows result count as filters change

#### Style Variants

- **Minimal:** No borders, simple layout
- **Card:** Bordered sections for each group
- **Accordion:** Collapsible groups

### Behavior on Interaction

**Check Filter Option:**

1. User clicks checkbox
2. Checkbox animates to checked state
3. `aria-checked="true"` updated
4. Filter immediately applied (instant mode) OR added to pending (batch mode)
5. Content updates to show filtered results
6. Active filter badge count updates
7. Screen reader announces: "Status: Active, checked"

**Clear All Filters:**

1. User clicks "Clear all" button
2. All checkboxes uncheck
3. All dropdowns reset to default
4. Active filters badge clears
5. Content returns to unfiltered state
6. Focus remains on "Clear all" button
7. Screen reader announces: "All filters cleared"

**Expand/Collapse Group:**

1. User clicks group header
2. Arrow icon rotates (chevron_down → chevron_up)
3. Options slide in/out (200ms animation)
4. `aria-expanded` attribute toggles
5. State persists (localStorage or session)

### Markup Example

```html
<!-- Sidebar Filter Panel -->
<div
  class="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 p-6 space-y-6"
>
  <!-- Header -->
  <div class="flex items-center justify-between">
    <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Filters</h2>
    <!-- Active Filters Badge -->
    <span
      class="inline-flex items-center justify-center w-6 h-6 text-xs font-semibold text-white bg-primary rounded-full"
    >
      3
    </span>
  </div>

  <!-- Clear All Button -->
  <button
    type="button"
    class="text-sm text-primary hover:text-primary-hover font-medium transition"
    aria-label="Clear all filters"
  >
    Clear all
  </button>

  <!-- Filter Group 1: Status -->
  <div class="border-t border-slate-200 dark:border-slate-700 pt-4">
    <button
      type="button"
      class="w-full flex items-center justify-between text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3"
      aria-expanded="true"
      aria-controls="filter-status"
    >
      <span>Status</span>
      <span class="material-symbols-outlined text-lg transition-transform" aria-hidden="true">
        expand_more
      </span>
    </button>
    <div id="filter-status" class="space-y-2">
      <label class="flex items-center gap-2.5 cursor-pointer group">
        <input
          type="checkbox"
          class="w-4 h-4 text-primary bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 rounded focus:ring-2 focus:ring-primary/50 transition"
          checked
        />
        <span
          class="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100"
        >
          Active
          <span class="text-slate-500 dark:text-slate-400">(18)</span>
        </span>
      </label>
      <label class="flex items-center gap-2.5 cursor-pointer group">
        <input
          type="checkbox"
          class="w-4 h-4 text-primary bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 rounded focus:ring-2 focus:ring-primary/50 transition"
        />
        <span
          class="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100"
        >
          On Hold
          <span class="text-slate-500 dark:text-slate-400">(3)</span>
        </span>
      </label>
      <label class="flex items-center gap-2.5 cursor-pointer group">
        <input
          type="checkbox"
          class="w-4 h-4 text-primary bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 rounded focus:ring-2 focus:ring-primary/50 transition"
          checked
        />
        <span
          class="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100"
        >
          Completed
          <span class="text-slate-500 dark:text-slate-400">(12)</span>
        </span>
      </label>
      <label class="flex items-center gap-2.5 cursor-pointer group">
        <input
          type="checkbox"
          class="w-4 h-4 text-primary bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 rounded focus:ring-2 focus:ring-primary/50 transition"
        />
        <span
          class="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100"
        >
          At Risk
          <span class="text-slate-500 dark:text-slate-400">(3)</span>
        </span>
      </label>
    </div>
  </div>

  <!-- Filter Group 2: Size -->
  <div class="border-t border-slate-200 dark:border-slate-700 pt-4">
    <button
      type="button"
      class="w-full flex items-center justify-between text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3"
      aria-expanded="true"
      aria-controls="filter-size"
    >
      <span>Project Size</span>
      <span class="material-symbols-outlined text-lg transition-transform" aria-hidden="true">
        expand_more
      </span>
    </button>
    <div id="filter-size" class="space-y-2">
      <label class="flex items-center gap-2.5 cursor-pointer group">
        <input
          type="checkbox"
          class="w-4 h-4 text-primary bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 rounded focus:ring-2 focus:ring-primary/50 transition"
        />
        <span
          class="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100"
        >
          Small (&lt;$500K)
          <span class="text-slate-500 dark:text-slate-400">(8)</span>
        </span>
      </label>
      <label class="flex items-center gap-2.5 cursor-pointer group">
        <input
          type="checkbox"
          class="w-4 h-4 text-primary bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 rounded focus:ring-2 focus:ring-primary/50 transition"
          checked
        />
        <span
          class="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100"
        >
          Medium ($500K-$2M)
          <span class="text-slate-500 dark:text-slate-400">(15)</span>
        </span>
      </label>
      <label class="flex items-center gap-2.5 cursor-pointer group">
        <input
          type="checkbox"
          class="w-4 h-4 text-primary bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 rounded focus:ring-2 focus:ring-primary/50 transition"
        />
        <span
          class="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100"
        >
          Large (&gt;$2M)
          <span class="text-slate-500 dark:text-slate-400">(9)</span>
        </span>
      </label>
    </div>
  </div>

  <!-- Filter Group 3: Date Range -->
  <div class="border-t border-slate-200 dark:border-slate-700 pt-4">
    <h3 class="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Start Date</h3>
    <div class="space-y-2">
      <label class="block">
        <span class="text-xs text-slate-600 dark:text-slate-400">From</span>
        <input
          type="date"
          class="w-full mt-1 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
        />
      </label>
      <label class="block">
        <span class="text-xs text-slate-600 dark:text-slate-400">To</span>
        <input
          type="date"
          class="w-full mt-1 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
        />
      </label>
    </div>
  </div>
</div>
```

### Accessibility

**Structure:**

- Filter groups use `<fieldset>` or ARIA landmarks
- Group headers use proper heading level or `<legend>`
- Expand/collapse buttons: `aria-expanded` attribute
- Each filter option: accessible form control

**Checkboxes:**

- Native `<input type="checkbox">` elements
- Associated `<label>` with `for` attribute or wrapping
- `aria-checked` state (automatically managed)
- Focus visible (2px ring)

**Keyboard Navigation:**

- Tab through all interactive elements
- Space to check/uncheck checkbox
- Enter to toggle group expand/collapse
- Focus order: Clear all → Groups → Options → Next group

**Screen Reader:**

- Group announced: "Status, group" or "Status, fieldset"
- Option announced: "Active, checkbox, checked, 18 items"
- Clear all: "Clear all filters, button"
- Count announced: "3 active filters"

**Focus Management:**

- Clear all: Focus remains on button after action
- Filter change: Focus remains on checkbox/control
- Collapsible group: Focus remains on header button

**Live Regions:**

- Results count updates: `aria-live="polite"`
- Announces: "Showing 18 results" after filter change

### Usage Examples

**Projects List:**

- Filter by: Status, Size, Start Date, Team
- Sidebar layout on desktop
- Dropdown on mobile

**Contacts Page:**

- Filter by: Type (Client, Vendor, Partner, Team)
- Inline filter badges above cards

### Implementation Notes

**Props Interface:**

```typescript
interface FilterPanelProps {
  filters: FilterGroup[]
  activeFilters: { [groupId: string]: string[] } // groupId → selected option IDs
  mode?: "instant" | "batch" // Default: instant
  layout?: "sidebar" | "dropdown" | "inline"
  collapsible?: boolean // Allow groups to collapse
  defaultExpanded?: boolean // Groups expanded by default
  showCounts?: boolean // Show result counts per option
  onFilterChange: (activeFilters: any) => void
  onClearAll?: () => void
  loading?: boolean
}
```

**Performance:**

- Debounce filter changes (100-200ms) to avoid excessive API calls
- Optimistic UI updates for instant feedback
- Cache filter counts for better performance

**Persistence:**

- Save filter state to URL query params
- Allows bookmarking filtered views
- Restores filters on page load

---

## 8. ProjectCard

### Purpose & Value

Display project overview in a card format for browsing and quick access. Shows key project information at a glance with visual status indicators and quick actions.

### Content/Data Displayed

- **Required:** Project name (string)
- **Required:** Status (Active, On Hold, Completed, At Risk)
- **Optional:** Location (string)
- **Optional:** Budget (number, formatted as currency)
- **Optional:** Timeline (start and end dates)
- **Optional:** Progress percentage (0-100)
- **Optional:** Team member count or avatars
- **Optional:** Thumbnail image

**Example Data:**

```typescript
interface Project {
  id: string
  name: string
  status: "active" | "on-hold" | "completed" | "at-risk"
  location?: string
  budget?: number
  startDate?: Date
  endDate?: Date
  progress?: number
  teamCount?: number
  thumbnail?: string
}
```

### User Actions

**Primary Actions:**

- Click card → Navigate to project detail page
- Click status badge → Filter by status (optional)

**Secondary Actions:**

- Edit project (icon button)
- Archive/Delete project (icon button)
- View timeline (quick action)
- View costs (quick action)

### All States

#### Card States

1. **Default:** Project info displayed with status badge
2. **Hover:** Shadow increase, cursor pointer
3. **Focus:** 2px ring (if navigable)
4. **Loading:** Skeleton with pulsing animation
5. **At Risk:** Red accent border/indicator
6. **Completed:** Success state with checkmark

#### Progress States

1. **Not Started:** 0%, grey bar
2. **In Progress:** 1-99%, blue bar
3. **Completed:** 100%, green bar
4. **At Risk:** Red bar (any percentage)

### Variants

#### Size Variants

```typescript
type ProjectCardSize = "compact" | "default" | "large"

const sizeClasses = {
  compact: "p-4", // Name, status, budget only
  default: "p-6", // + location, timeline, progress
  large: "p-8", // + thumbnail, team, actions
}
```

#### Layout Variants

- **Grid:** Card in grid layout (default)
- **List:** Horizontal layout with more detail
- **Featured:** Large card with background image

### Behavior on Interaction

**Card Click:**

1. User clicks card
2. Navigate to project detail page
3. URL updates: /projects/{projectId}
4. Page transition animation

**Quick Actions:**

- Hover card → Action buttons appear
- Click action → Opens respective view/modal
- Keyboard: Tab to actions, Enter to activate

### Markup Example

```html
<div
  class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition cursor-pointer group"
>
  <!-- Thumbnail (optional) -->
  <div class="relative h-48 bg-slate-200 dark:bg-slate-800 rounded-t-xl overflow-hidden">
    <img src="/project-thumbnail.jpg" alt="" class="w-full h-full object-cover" />
    <!-- Status Badge Overlay -->
    <div class="absolute top-3 right-3">
      <span
        class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-green-600 text-white rounded-full shadow-sm"
      >
        <span class="material-symbols-outlined text-sm">check_circle</span>
        <span>Active</span>
      </span>
    </div>
  </div>

  <div class="p-6">
    <!-- Header: Name + Actions -->
    <div class="flex items-start justify-between mb-3">
      <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 flex-1 pr-2">
        Skyline Tower Development
      </h3>
      <!-- Quick Actions (visible on hover) -->
      <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
        <button
          type="button"
          class="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"
          aria-label="Edit project"
          onclick="event.stopPropagation()"
        >
          <span class="material-symbols-outlined text-lg">edit</span>
        </button>
      </div>
    </div>

    <!-- Location -->
    <div class="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-4">
      <span class="material-symbols-outlined text-lg">location_on</span>
      <span>San Francisco, CA</span>
    </div>

    <!-- Budget + Timeline -->
    <div class="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
      <div>
        <p class="text-xs text-slate-600 dark:text-slate-400 mb-1">Budget</p>
        <p class="text-sm font-semibold text-slate-900 dark:text-slate-100">$2.45M</p>
      </div>
      <div>
        <p class="text-xs text-slate-600 dark:text-slate-400 mb-1">Timeline</p>
        <p class="text-sm font-semibold text-slate-900 dark:text-slate-100">12 months</p>
      </div>
    </div>

    <!-- Progress Bar -->
    <div>
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-medium text-slate-700 dark:text-slate-300">Progress</span>
        <span class="text-xs font-semibold text-slate-900 dark:text-slate-100">62%</span>
      </div>
      <div class="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div class="h-full bg-blue-500 transition-all duration-300" style="width: 62%"></div>
      </div>
    </div>

    <!-- Team (optional) -->
    <div
      class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between"
    >
      <div class="flex items-center -space-x-2">
        <div
          class="w-8 h-8 bg-blue-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-white text-xs font-semibold"
        >
          JD
        </div>
        <div
          class="w-8 h-8 bg-green-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-white text-xs font-semibold"
        >
          SM
        </div>
        <div
          class="w-8 h-8 bg-purple-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-white text-xs font-semibold"
        >
          +3
        </div>
      </div>
      <span class="text-xs text-slate-600 dark:text-slate-400">5 team members</span>
    </div>
  </div>
</div>
```

### Accessibility

**Structure:**

- Card as `<article>` or `<div role="article">`
- Heading: `<h3>` for project name
- Semantic HTML for content sections

**Navigation:**

- Entire card clickable via wrapper link or button
- `aria-label` on card: "View Skyline Tower Development project"
- Secondary actions as separate focusable buttons

**Screen Reader:**

- Card announces: "Skyline Tower Development, Active, $2.45M budget, 62% complete"
- Progress announces: "Progress: 62%"
- Team announces: "5 team members"

**Keyboard:**

- Tab to card (if standalone link)
- Enter to navigate to project
- Tab to action buttons
- Focus visible on all interactive elements

**Status Indication:**

- Color not sole indicator
- Icon + text label for status
- At Risk: Additional warning icon + text

### Usage Examples

**Projects List:**

- Grid of project cards (3-4 columns)
- Filter by status
- Sort by name, budget, or start date

**Dashboard:**

- Featured project cards (larger size)
- Recent projects (compact size)

### Implementation Notes

**Props Interface:**

```typescript
interface ProjectCardProps {
  project: Project
  size?: "compact" | "default" | "large"
  layout?: "grid" | "list" | "featured"
  showThumbnail?: boolean
  showTeam?: boolean
  showActions?: boolean
  onClick?: (project: Project) => void
  onEdit?: (project: Project) => void
  onDelete?: (projectId: string) => void
}
```

**Status Color Mapping:**

- Active: Green (success)
- In Progress: Blue (info)
- On Hold: Yellow (warning)
- Completed: Green (success) with checkmark
- At Risk: Red (error) with warning icon

**Responsive:**

- Desktop: 3-4 columns (grid-cols-3 xl:grid-cols-4)
- Tablet: 2 columns (md:grid-cols-2)
- Mobile: 1 column (grid-cols-1)

---

## 9. Button Components

### Purpose & Value

Provide consistent, accessible buttons for all user actions throughout the application. Supports multiple variants, sizes, and states to handle diverse interaction patterns.

### Content/Data Displayed

- **Required:** Button text/label
- **Optional:** Icon (leading or trailing)
- **Optional:** Loading spinner
- **Optional:** Badge/count

### All Button Variants

#### 9.1 Primary Button

**Purpose:** Main call-to-action (CTA) for critical actions.

**Visual:**

- Background: Navy (#0A2540)
- Text: White
- Height: 44-48px (touch-friendly)
- Padding: 16-24px horizontal
- Border radius: 8px

**States:**

1. Default: Navy background
2. Hover: Slightly lighter navy
3. Focus: 2px ring, primary blue
4. Disabled: 50% opacity, non-interactive
5. Loading: Spinner replaces text, non-interactive

**Markup:**

```html
<button
  type="button"
  class="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold text-white bg-navy hover:bg-navy/90 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition"
>
  <span>Save Project</span>
</button>
```

**Usage:**

- Form submissions
- Primary page actions
- Confirmations in modals

---

#### 9.2 Secondary Button

**Purpose:** Supporting actions, less emphasis than primary.

**Visual:**

- Background: Transparent or light grey
- Border: 1-2px solid border
- Text: Navy or slate
- Height: 44-48px
- Padding: 16-24px horizontal
- Border radius: 8px

**States:**

1. Default: Border + text color
2. Hover: Light background fill
3. Focus: 2px ring
4. Disabled: 50% opacity
5. Loading: Spinner + text

**Markup:**

```html
<button
  type="button"
  class="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold text-navy dark:text-slate-100 bg-transparent border-2 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition"
>
  <span>Cancel</span>
</button>
```

**Usage:**

- Cancel actions
- Secondary form actions
- Alternative options

---

#### 9.3 Tertiary/Ghost Button

**Purpose:** Low-emphasis actions, minimal visual weight.

**Visual:**

- Background: Transparent
- Border: None
- Text: Primary blue or slate
- Height: 40-44px
- Padding: 12-16px horizontal
- Border radius: 6px

**States:**

1. Default: Text color only
2. Hover: Light background
3. Focus: 2px ring
4. Disabled: 50% opacity

**Markup:**

```html
<button
  type="button"
  class="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-base font-medium text-primary hover:text-primary-hover hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition"
>
  <span>Learn More</span>
</button>
```

**Usage:**

- Tertiary actions
- Link-style actions
- Inline actions

---

#### 9.4 Destructive Button

**Purpose:** Dangerous/irreversible actions (delete, remove, etc.).

**Visual:**

- Background: Red (#dc2626)
- Text: White
- Height: 44-48px
- Border: Optional red border
- Border radius: 8px

**States:**

1. Default: Red background
2. Hover: Darker red
3. Focus: 2px ring, red
4. Disabled: 50% opacity
5. Loading: Spinner

**Markup:**

```html
<button
  type="button"
  class="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition"
>
  <span class="material-symbols-outlined text-xl">delete</span>
  <span>Delete Project</span>
</button>
```

**Usage:**

- Delete actions
- Remove/archive actions
- Destructive confirmations
- MUST be confirmed (modal/dialog)

---

#### 9.5 Icon Button

**Purpose:** Action buttons with icon only, no text label.

**Visual:**

- Square or circle shape
- Size: 36-48px (square)
- Icon centered
- Background: Transparent or filled
- Border radius: 6-8px or full (circle)

**States:**

1. Default: Icon color
2. Hover: Background appears
3. Focus: 2px ring
4. Active/Pressed: Darker background
5. Disabled: 50% opacity

**Markup:**

```html
<!-- Square Icon Button -->
<button
  type="button"
  class="inline-flex items-center justify-center w-10 h-10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-lg transition"
  aria-label="Edit project"
>
  <span class="material-symbols-outlined text-xl">edit</span>
</button>

<!-- Circle Icon Button -->
<button
  type="button"
  class="inline-flex items-center justify-center w-12 h-12 text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-full shadow-lg transition"
  aria-label="Add new project"
>
  <span class="material-symbols-outlined text-2xl">add</span>
</button>
```

**Usage:**

- Edit, delete, view actions
- Toolbar actions
- Floating action buttons (FAB)
- Navigation controls

**Accessibility:**

- MUST have `aria-label` (no visible text)
- Minimum 44x44px touch target
- Tooltip on hover (recommended)

---

#### 9.6 Button with Icon

**Purpose:** Button with both text label and icon.

**Icon Position:**

- Leading (before text): Actions, directions
- Trailing (after text): Indicators, external links

**Markup:**

```html
<!-- Leading Icon -->
<button
  type="button"
  class="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold text-white bg-navy hover:bg-navy/90 focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-lg transition"
>
  <span class="material-symbols-outlined text-xl">add</span>
  <span>New Project</span>
</button>

<!-- Trailing Icon -->
<button
  type="button"
  class="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold text-primary hover:text-primary-hover hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-lg transition"
>
  <span>View Details</span>
  <span class="material-symbols-outlined text-xl">arrow_forward</span>
</button>
```

---

#### 9.7 Loading Button

**Purpose:** Button in loading state during async operations.

**Visual:**

- Spinner replaces icon OR displays before text
- Button disabled during loading
- Text may change (e.g., "Saving...")

**Markup:**

```html
<button
  type="button"
  class="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold text-white bg-navy focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-lg transition opacity-75 cursor-wait"
  disabled
>
  <svg
    class="animate-spin h-5 w-5 text-white"
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
  <span>Saving...</span>
</button>
```

**Usage:**

- Form submissions
- Data fetching
- File uploads
- Any async operation

---

### Size Variants

```typescript
type ButtonSize = "small" | "medium" | "large" | "xlarge"

const sizeClasses = {
  small: "px-3 py-1.5 text-sm", // Height: ~32px
  medium: "px-4 py-2.5 text-base", // Height: ~40px
  large: "px-6 py-3 text-base", // Height: ~48px (default)
  xlarge: "px-8 py-4 text-lg", // Height: ~56px
}
```

### Button Groups

**Purpose:** Group related buttons together.

**Markup:**

```html
<div
  class="inline-flex rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden"
  role="group"
  aria-label="View options"
>
  <button
    type="button"
    class="px-4 py-2 text-sm font-medium text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 focus:z-10 focus:ring-2 focus:ring-primary transition border-r border-slate-300 dark:border-slate-700"
    aria-pressed="true"
  >
    <span class="material-symbols-outlined text-lg">grid_view</span>
  </button>
  <button
    type="button"
    class="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 focus:z-10 focus:ring-2 focus:ring-primary transition"
    aria-pressed="false"
  >
    <span class="material-symbols-outlined text-lg">list</span>
  </button>
</div>
```

### Accessibility

**All Buttons:**

- Use `<button>` element (not `<div>` or `<a>` unless navigating)
- `type="button"` (prevents form submission)
- Visible focus indicator (2px ring)
- Minimum 44x44px touch target (mobile)

**Icon-only Buttons:**

- `aria-label` required
- Tooltip on hover (recommended)
- Icon decorative: `aria-hidden="true"`

**Loading State:**

- `disabled` attribute
- `aria-busy="true"` (optional)
- Screen reader announces: "Saving, button, busy"

**Button Groups:**

- `role="group"`
- `aria-label` on group
- `aria-pressed` on toggle buttons

### Implementation Notes

**Props Interface:**

```typescript
interface ButtonProps {
  variant: "primary" | "secondary" | "tertiary" | "destructive" | "ghost"
  size?: "small" | "medium" | "large" | "xlarge"
  icon?: string // Material Symbol name
  iconPosition?: "leading" | "trailing"
  loading?: boolean
  loadingText?: string
  disabled?: boolean
  fullWidth?: boolean
  onClick?: () => void
  type?: "button" | "submit" | "reset"
  ariaLabel?: string
  children: React.ReactNode
}
```

---

## 10. Form Input Components

### Purpose & Value

Provide consistent, accessible form inputs for data entry across the application. Supports validation, error states, help text, and various input types.

### 10.1 Text Input

**Purpose:** Single-line text entry.

**States:**

1. Default: Empty or with value
2. Focus: Blue border, ring visible
3. Filled: Value present
4. Error: Red border, error message
5. Success: Green border (optional)
6. Disabled: Greyed out

**Markup:**

```html
<div class="space-y-2">
  <label for="project-name" class="block text-sm font-medium text-slate-900 dark:text-slate-100">
    Project Name
    <span class="text-red-500" aria-label="required">*</span>
  </label>
  <input
    type="text"
    id="project-name"
    name="projectName"
    placeholder="Enter project name"
    class="w-full px-4 py-3 text-base text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition placeholder:text-slate-500 dark:placeholder:text-slate-400"
    aria-required="true"
    aria-invalid="false"
    aria-describedby="project-name-help"
  />
  <p id="project-name-help" class="text-sm text-slate-600 dark:text-slate-400">
    Choose a descriptive name for your project
  </p>
</div>
```

**Error State:**

```html
<div class="space-y-2">
  <label for="email" class="block text-sm font-medium text-slate-900 dark:text-slate-100">
    Email Address
    <span class="text-red-500">*</span>
  </label>
  <input
    type="email"
    id="email"
    class="w-full px-4 py-3 text-base text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 border-2 border-red-500 dark:border-red-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50 transition"
    aria-required="true"
    aria-invalid="true"
    aria-describedby="email-error"
    value="invalidemail"
  />
  <p id="email-error" class="text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5">
    <span class="material-symbols-outlined text-lg">error</span>
    <span>Please enter a valid email address</span>
  </p>
</div>
```

---

### 10.2 Textarea

**Purpose:** Multi-line text entry.

**Markup:**

```html
<div class="space-y-2">
  <label for="description" class="block text-sm font-medium text-slate-900 dark:text-slate-100">
    Project Description
  </label>
  <textarea
    id="description"
    name="description"
    rows="4"
    placeholder="Describe your project..."
    class="w-full px-4 py-3 text-base text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition resize-y placeholder:text-slate-500 dark:placeholder:text-slate-400"
    aria-describedby="description-help"
  ></textarea>
  <p id="description-help" class="text-sm text-slate-600 dark:text-slate-400">
    Maximum 500 characters
  </p>
</div>
```

---

### 10.3 Select Dropdown

**Purpose:** Choose one option from a list.

**Markup:**

```html
<div class="space-y-2">
  <label for="status" class="block text-sm font-medium text-slate-900 dark:text-slate-100">
    Project Status
  </label>
  <select
    id="status"
    name="status"
    class="w-full px-4 py-3 text-base text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition appearance-none bg-[url('data:image/svg+xml;base64,...')] bg-no-repeat bg-[right_1rem_center]"
  >
    <option value="">Select status...</option>
    <option value="active">Active</option>
    <option value="on-hold">On Hold</option>
    <option value="completed">Completed</option>
    <option value="at-risk">At Risk</option>
  </select>
</div>
```

---

### 10.4 Checkbox

**Purpose:** Boolean selection or multi-select.

**Markup:**

```html
<!-- Single Checkbox -->
<div class="flex items-start gap-3">
  <input
    type="checkbox"
    id="agree-terms"
    name="agreeTerms"
    class="w-5 h-5 mt-0.5 text-primary bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 rounded focus:ring-2 focus:ring-primary/50 transition"
  />
  <label for="agree-terms" class="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
    I agree to the <a href="/terms" class="text-primary hover:underline">terms and conditions</a>
  </label>
</div>

<!-- Checkbox Group -->
<fieldset class="space-y-3">
  <legend class="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
    Select Notifications
  </legend>
  <div class="flex items-center gap-3">
    <input
      type="checkbox"
      id="notify-email"
      name="notifications"
      value="email"
      class="w-5 h-5 text-primary bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 rounded focus:ring-2 focus:ring-primary/50"
      checked
    />
    <label for="notify-email" class="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
      Email notifications
    </label>
  </div>
  <div class="flex items-center gap-3">
    <input
      type="checkbox"
      id="notify-sms"
      name="notifications"
      value="sms"
      class="w-5 h-5 text-primary bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 rounded focus:ring-2 focus:ring-primary/50"
    />
    <label for="notify-sms" class="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
      SMS notifications
    </label>
  </div>
</fieldset>
```

---

### 10.5 Radio Buttons

**Purpose:** Choose one option from multiple choices.

**Markup:**

```html
<fieldset class="space-y-3">
  <legend class="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
    Project Size
    <span class="text-red-500">*</span>
  </legend>
  <div class="flex items-center gap-3">
    <input
      type="radio"
      id="size-small"
      name="projectSize"
      value="small"
      class="w-5 h-5 text-primary bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-primary/50"
    />
    <label for="size-small" class="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
      Small (&lt;$500K)
    </label>
  </div>
  <div class="flex items-center gap-3">
    <input
      type="radio"
      id="size-medium"
      name="projectSize"
      value="medium"
      class="w-5 h-5 text-primary bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-primary/50"
      checked
    />
    <label for="size-medium" class="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
      Medium ($500K-$2M)
    </label>
  </div>
  <div class="flex items-center gap-3">
    <input
      type="radio"
      id="size-large"
      name="projectSize"
      value="large"
      class="w-5 h-5 text-primary bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-primary/50"
    />
    <label for="size-large" class="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
      Large (&gt;$2M)
    </label>
  </div>
</fieldset>
```

---

### 10.6 Date Input

**Purpose:** Select a date.

**Markup:**

```html
<div class="space-y-2">
  <label for="start-date" class="block text-sm font-medium text-slate-900 dark:text-slate-100">
    Start Date
    <span class="text-red-500">*</span>
  </label>
  <input
    type="date"
    id="start-date"
    name="startDate"
    class="w-full px-4 py-3 text-base text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
    aria-required="true"
  />
</div>
```

---

### 10.7 File Upload

**Purpose:** Upload files.

**Markup:**

```html
<div class="space-y-2">
  <label for="file-upload" class="block text-sm font-medium text-slate-900 dark:text-slate-100">
    Upload Documents
  </label>
  <div class="relative">
    <input
      type="file"
      id="file-upload"
      name="fileUpload"
      multiple
      class="sr-only"
      aria-describedby="file-upload-help"
    />
    <label
      for="file-upload"
      class="flex flex-col items-center justify-center w-full px-6 py-8 text-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg cursor-pointer hover:border-primary hover:bg-blue-50 dark:hover:bg-blue-900/10 transition"
    >
      <span class="material-symbols-outlined text-4xl text-slate-400 mb-2">upload_file</span>
      <span class="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">
        Click to upload or drag and drop
      </span>
      <span class="text-xs text-slate-600 dark:text-slate-400"> PDF, DOC, DOCX up to 10MB </span>
    </label>
  </div>
  <p id="file-upload-help" class="text-sm text-slate-600 dark:text-slate-400">
    Accepted formats: PDF, DOC, DOCX (max 10MB)
  </p>
</div>
```

---

### Common Input Patterns

#### Input with Leading Icon

```html
<div class="relative">
  <span
    class="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-xl pointer-events-none"
  >
    search
  </span>
  <input type="text" class="w-full pl-11 pr-4 py-3 ..." placeholder="Search..." />
</div>
```

#### Input with Trailing Icon/Button

```html
<div class="relative">
  <input type="text" class="w-full pl-4 pr-11 py-3 ..." placeholder="Enter code" />
  <button
    type="button"
    class="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded"
  >
    <span class="material-symbols-outlined text-xl">visibility</span>
  </button>
</div>
```

#### Input Group (Addon)

```html
<div class="flex">
  <span
    class="inline-flex items-center px-4 text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-r-0 border-slate-300 dark:border-slate-700 rounded-l-lg"
  >
    https://
  </span>
  <input
    type="text"
    class="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
    placeholder="example.com"
  />
</div>
```

---

### Accessibility

**Labels:**

- Every input MUST have associated `<label>`
- Use `for` attribute or wrap input
- Labels visible (not placeholder-only)

**Required Fields:**

- `aria-required="true"` attribute
- Visual indicator (asterisk \*)
- Asterisk explained in form instructions

**Error States:**

- `aria-invalid="true"` when error
- `aria-describedby` points to error message
- Error message `id` matches
- Icon + text for errors (not color alone)

**Help Text:**

- `aria-describedby` points to help text
- Help text has unique `id`
- Not hidden from screen readers

**Disabled Inputs:**

- `disabled` attribute
- 50% opacity
- Not focusable
- Screen reader announces: "disabled"

### Implementation Notes

**Props Interface:**

```typescript
interface InputProps {
  type: "text" | "email" | "password" | "number" | "tel" | "url" | "date" | "textarea" | "select"
  name: string
  id: string
  label: string
  value: string
  placeholder?: string
  helpText?: string
  error?: string
  required?: boolean
  disabled?: boolean
  icon?: string // Material Symbol name
  iconPosition?: "leading" | "trailing"
  onChange: (value: string) => void
  onBlur?: () => void
}
```

**Validation:**

- Client-side validation for instant feedback
- Server-side validation for security
- Show errors after blur or submit attempt
- Clear errors on input change

---

## Conclusion

This document provides comprehensive specifications for all 10 component categories used in Epic 10.3:

1. ✅ **StatusBadge** - Status indicators with color coding
2. ✅ **SummaryCard** - Metric display cards
3. ✅ **DataTable** - Sortable, editable data tables
4. ✅ **TimelineView** - Gantt-style project timelines
5. ✅ **ContactCard** - Contact information cards
6. ✅ **SearchBar** - Search with autocomplete
7. ✅ **FilterPanel** - Multi-criteria filtering
8. ✅ **ProjectCard** - Project overview cards
9. ✅ **Button Components** - All button variants
10. ✅ **Form Input Components** - Complete form control library

Each component includes:

- Purpose & value proposition
- Content/data requirements
- User actions & interactions
- All states (visual & data)
- Variants (size, style, layout)
- Behavior specifications
- Complete markup examples
- Accessibility requirements
- Usage examples
- Implementation notes with TypeScript interfaces

These specifications provide everything needed for developers to implement Epic 10.3 screens with consistency, accessibility, and best practices.
