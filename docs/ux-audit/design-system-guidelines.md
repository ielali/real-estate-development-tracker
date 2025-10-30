# Design System Guidelines

## Real Estate Development Tracker

**Version:** 1.0
**Last Updated:** October 30, 2025
**Purpose:** Define consistent design tokens, component patterns, and usage guidelines for all UI development

---

## 1. Design Principles

### Core Principles

1. **Professional & Investor-Grade** - Design should inspire confidence in real estate professionals and partners
2. **Mobile-First & Accessible** - Every component works on small screens and meets WCAG AA standards
3. **Clarity Over Cleverness** - Prioritize usability and comprehension over visual tricks
4. **Consistent & Predictable** - Same patterns solve same problems throughout the app
5. **Performance-Conscious** - Lightweight, fast-loading, optimized for field use on slower connections

---

## 2. Color Palette

### Primary Colors

**Brand Primary (Blue)**

- Used for: Primary actions, links, active states, brand elements
- `--primary: 217 91% 60%` → `#3B82F6` (Tailwind `blue-500`)
- `--primary-foreground: 0 0% 98%` → `#FAFAFA` (White text on primary)

**Usage:**

```tsx
<Button className="bg-primary text-primary-foreground">Create Project</Button>
```

**Shades:**

- Light: `blue-50` #EFF6FF (backgrounds)
- Default: `blue-500` #3B82F6 (primary actions)
- Dark: `blue-700` #1D4ED8 (hover states)

---

### Semantic Colors

**Success (Green)**

- Used for: Positive feedback, success states, completed status
- `--success: 142 71% 45%` → `#10B981` (Tailwind `green-600`)
- Examples: "Project created successfully", active project status, completed tasks

**Warning (Amber)**

- Used for: Caution states, pending actions, on-hold status
- `--warning: 38 92% 50%` → `#F59E0B` (Tailwind `amber-500`)
- Examples: "Unsaved changes", on-hold projects, missing information

**Error (Red)**

- Used for: Errors, destructive actions, failed states
- `--error: 0 84% 60%` → `#EF4444` (Tailwind `red-500`)
- Examples: Form validation errors, "Delete project" action, failed uploads

**Info (Blue)**

- Used for: Informational messages, neutral notifications
- `--info: 199 89% 48%` → `#0EA5E9` (Tailwind `sky-500`)
- Examples: "Partner invited", informational tooltips, help messages

---

### Neutral Colors (Grayscale)

**Backgrounds:**

- `--background: 0 0% 100%` → `#FFFFFF` (White - main background)
- `--muted: 210 40% 96%` → `#F8FAFC` (Tailwind `slate-50` - card backgrounds, subtle sections)
- `--border: 214 32% 91%` → `#E2E8F0` (Tailwind `slate-200` - borders, dividers)

**Text:**

- `--foreground: 222 47% 11%` → `#0F172A` (Tailwind `slate-900` - primary text)
- `--muted-foreground: 215 16% 47%` → `#64748B` (Tailwind `slate-600` - secondary text, labels)

**CRITICAL:** Change muted text from `gray-500` to `gray-700` (or `slate-600`) to meet WCAG AA contrast ratio of 4.5:1.

**Contrast Ratios (against white background):**

- `slate-900` (#0F172A): **15.5:1** ✅ (Primary text)
- `slate-700` (#334155): **9.5:1** ✅ (Secondary text)
- `slate-600` (#64748B): **4.9:1** ✅ (Muted text - WCAG AA compliant)
- `gray-500` (#6B7280): **3.2:1** ❌ (FAILS WCAG AA - do not use for text)

---

### Status Colors

**Project Status:**

- Planning: `blue-500` (#3B82F6)
- Active: `green-500` (#10B981)
- On Hold: `amber-500` (#F59E0B)
- Completed: `slate-500` (#64748B)
- Archived: `slate-400` (#94A3B8)

**Cost Categories:** (8-color palette for charts/visualizations)

- Materials: `blue-500` (#3B82F6)
- Labor: `emerald-500` (#10B981)
- Permits: `amber-500` (#F59E0B)
- Equipment: `purple-500` (#A855F7)
- Professional Fees: `rose-500` (#F43F5E)
- Utilities: `cyan-500` (#06B6D4)
- Insurance: `indigo-500` (#6366F1)
- Other: `slate-500` (#64748B)

---

### Accessibility Requirements

**Minimum Contrast Ratios (WCAG AA):**

- Normal text (< 18pt): **4.5:1**
- Large text (≥ 18pt or ≥14pt bold): **3:1**
- UI components and graphics: **3:1**

**Testing Tool:** Use WebAIM Contrast Checker or Chrome DevTools

**Examples:**

```tsx
// ✅ CORRECT: Meets WCAG AA
<p className="text-slate-600">Secondary information</p>

// ❌ INCORRECT: Fails WCAG AA
<p className="text-gray-400">Secondary information</p>
```

---

## 3. Typography

### Font Families

**Sans Serif (Body & Headings):**

- Primary: `Inter` (Google Fonts)
- Fallback: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- Usage: All text throughout application

**Monospace (Code & Numbers):**

- Primary: `'JetBrains Mono'` or `'Fira Code'`
- Fallback: `Menlo, Monaco, Consolas, monospace`
- Usage: Currency amounts, IDs, technical data

---

### Type Scale

**Headings:**

| Element | Size (Desktop)  | Size (Mobile)   | Weight         | Line Height | Usage             |
| ------- | --------------- | --------------- | -------------- | ----------- | ----------------- |
| **h1**  | 32px (2rem)     | 28px (1.75rem)  | 700 (Bold)     | 1.2         | Page titles       |
| **h2**  | 24px (1.5rem)   | 22px (1.375rem) | 600 (SemiBold) | 1.3         | Section titles    |
| **h3**  | 20px (1.25rem)  | 18px (1.125rem) | 600 (SemiBold) | 1.4         | Subsection titles |
| **h4**  | 18px (1.125rem) | 16px (1rem)     | 600 (SemiBold) | 1.5         | Card titles       |

**Body Text:**

| Element   | Size            | Weight        | Line Height | Usage                            |
| --------- | --------------- | ------------- | ----------- | -------------------------------- |
| **Large** | 18px (1.125rem) | 400 (Regular) | 1.6         | Intro paragraphs, important info |
| **Base**  | 16px (1rem)     | 400 (Regular) | 1.6         | Default body text, form fields   |
| **Small** | 14px (0.875rem) | 400 (Regular) | 1.5         | Labels, captions, metadata       |
| **Tiny**  | 12px (0.75rem)  | 400 (Regular) | 1.4         | Timestamps, badges, tooltips     |

**Tailwind Classes:**

```tsx
// Headings
<h1 className="text-3xl sm:text-4xl font-bold">Page Title</h1>
<h2 className="text-xl sm:text-2xl font-semibold">Section Title</h2>
<h3 className="text-lg sm:text-xl font-semibold">Subsection</h3>
<h4 className="text-base sm:text-lg font-semibold">Card Title</h4>

// Body
<p className="text-lg leading-relaxed">Large body text</p>
<p className="text-base leading-relaxed">Default body text</p>
<span className="text-sm">Label or caption</span>
<span className="text-xs">Timestamp or badge</span>
```

---

### Font Weights

- **Regular (400):** Default body text, paragraphs
- **Medium (500):** Emphasized text, selected items
- **SemiBold (600):** Headings, buttons, labels
- **Bold (700):** Page titles, critical information

**Do NOT use:**

- Light (300) or Thin (100) - poor readability, fails accessibility on low-quality displays
- ExtraBold (800) or Black (900) - too heavy, overwhelming

---

### Text Colors

```tsx
// Primary text (dark, high contrast)
<p className="text-slate-900">Primary content</p>

// Secondary text (medium contrast)
<p className="text-slate-600">Secondary information</p>

// Muted text (lower contrast, still WCAG compliant)
<p className="text-slate-500">Tertiary or disabled text</p>

// On colored backgrounds
<p className="text-white">Text on primary button</p>
```

---

## 4. Spacing System

### Base Unit: 4px

All spacing should be multiples of **4px** for consistency and visual rhythm.

### Spacing Scale (Tailwind)

| Token | Value | Tailwind Class           | Usage                             |
| ----- | ----- | ------------------------ | --------------------------------- |
| `xs`  | 4px   | `p-1`, `m-1`, `gap-1`    | Icon padding, badge padding       |
| `sm`  | 8px   | `p-2`, `m-2`, `gap-2`    | Small component padding           |
| `md`  | 16px  | `p-4`, `m-4`, `gap-4`    | Default component padding         |
| `lg`  | 24px  | `p-6`, `m-6`, `gap-6`    | Card padding, section spacing     |
| `xl`  | 32px  | `p-8`, `m-8`, `gap-8`    | Large card padding, page sections |
| `2xl` | 48px  | `p-12`, `m-12`, `gap-12` | Page margins, major sections      |

---

### Component Spacing Guidelines

**Buttons:**

- Padding: `px-4 py-2` (horizontal 16px, vertical 8px)
- Gap between buttons: `gap-2` (8px)
- Icon + text gap: `gap-2` (8px)

**Forms:**

- Field spacing: `gap-4` (16px between fields)
- Label to input: `gap-1.5` (6px)
- Form section spacing: `gap-6` (24px between sections)
- Field padding: `px-3 py-2` (horizontal 12px, vertical 8px)

**Cards:**

- Card padding: `p-6` (24px all sides)
- Card spacing in grid: `gap-4 md:gap-6` (16px mobile, 24px desktop)
- Card header to content: `gap-4` (16px)

**Sections:**

- Section padding: `py-8` (32px top/bottom)
- Section margin: `mb-8` (32px between sections)
- Page container padding: `px-4 sm:px-6 lg:px-8` (responsive)

**Lists:**

- List item spacing: `gap-2` (8px between items)
- List item padding: `p-3` (12px)
- Nested list indent: `ml-6` (24px)

---

### Layout Grid

**Container Widths:**

- Mobile: Full width with `px-4` (16px side padding)
- Tablet: Full width with `px-6` (24px side padding)
- Desktop: Max width `max-w-7xl` (1280px) with `px-8` (32px side padding)

**Grid Columns:**

- Mobile: 1 column (default)
- Tablet: 2 columns (`md:grid-cols-2`)
- Desktop: 3-4 columns (`lg:grid-cols-3` or `lg:grid-cols-4`)

**Responsive Pattern:**

```tsx
<div className="container mx-auto px-4 sm:px-6 lg:px-8">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">{/* Cards */}</div>
</div>
```

---

## 5. Component Patterns

### Buttons

**Variants:**

1. **Primary** - Main actions (Create, Save, Submit)

```tsx
<Button className="bg-primary text-primary-foreground hover:bg-primary/90">Create Project</Button>
```

2. **Secondary** - Secondary actions (Cancel, Back)

```tsx
<Button variant="secondary">Cancel</Button>
```

3. **Ghost** - Tertiary actions (Edit, View)

```tsx
<Button variant="ghost">Edit</Button>
```

4. **Destructive** - Dangerous actions (Delete, Remove)

```tsx
<Button variant="destructive">Delete Project</Button>
```

5. **Outline** - Alternative secondary actions

```tsx
<Button variant="outline">Learn More</Button>
```

**Sizes:**

- Small: `size="sm"` - Height 36px (mobile actions)
- Default: `size="default"` - Height 40px
- Large: `size="lg"` - Height 48px (CTAs, mobile-friendly)

**States:**

- Loading: Show spinner + "Creating..." text
- Disabled: `disabled={true}` with reduced opacity
- Icon + Text: Icon on left, 8px gap

**Accessibility:**

- Minimum touch target: 44x44px (use `size="lg"` or padding)
- Focus indicator: `focus-visible:ring-2 focus-visible:ring-primary`
- Disabled state: `aria-disabled="true"`

---

### Forms

**Field Pattern:**

```tsx
<FormField
  control={form.control}
  name="fieldName"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Field Label *</FormLabel>
      <FormControl>
        <Input placeholder="Placeholder text" {...field} />
      </FormControl>
      <FormDescription>Optional help text</FormDescription>
      <FormMessage /> {/* Error message */}
    </FormItem>
  )}
/>
```

**Field Spacing:**

- Between fields: `gap-4` (16px)
- Between sections: `gap-6` (24px)
- Form to buttons: `mt-6` (24px)

**Validation:**

- Error message appears below field
- Red border on invalid field: `border-red-500`
- Error icon (AlertCircle) before message
- ARIA live region: `aria-live="polite"` on error container

**Required Fields:**

- Visual: Red asterisk `*` in label
- Semantic: `aria-required="true"` on input

**Mobile Optimization:**

- Input height: `h-12` (48px) on mobile for easy tapping
- Appropriate input types: `type="email"`, `type="tel"`, `type="number"`
- Large touch targets for radio/checkbox: min 44x44px

---

### Cards

**Standard Card:**

```tsx
<Card className="p-6">
  <CardHeader className="pb-4">
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Optional description</CardDescription>
  </CardHeader>
  <CardContent>{/* Card content */}</CardContent>
  <CardFooter className="pt-4">{/* Card actions */}</CardFooter>
</Card>
```

**Interactive Card (Clickable):**

```tsx
<Card className="p-6 cursor-pointer transition-shadow hover:shadow-lg">{/* Content */}</Card>
```

**Card Variants:**

- Default: White background, subtle border
- Elevated: `shadow-sm` with border
- Flat: No shadow or border (on colored backgrounds)

---

### Loading States

**Page Loading:**

```tsx
{
  isLoading && <Spinner className="mx-auto" />
}
```

**Component Loading:**

```tsx
{
  isLoading ? <ProjectListSkeleton count={6} /> : <ProjectList projects={data} />
}
```

**Button Loading:**

```tsx
<Button disabled={isSubmitting}>
  {isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
  {isSubmitting ? "Creating..." : "Create Project"}
</Button>
```

**Skeleton Screens:**

- Match actual content layout (same number of items, same structure)
- Use `animate-pulse` for loading animation
- Provide semantic height/width for realistic preview

---

### Empty States

**Pattern:**

```tsx
<EmptyState
  icon={<Box className="h-12 w-12 text-gray-400" />}
  title="No projects yet"
  description="Create your first project to get started tracking costs and progress"
  action={
    <Button onClick={handleCreate}>
      <Plus className="mr-2 h-4 w-4" />
      Create Project
    </Button>
  }
/>
```

**Guidelines:**

- Center content vertically and horizontally
- Use neutral icon (not red/error icon)
- Friendly, encouraging copy
- Clear call-to-action button
- Optional: Show "Learn how" link

---

### Error States

**Pattern:**

```tsx
<ErrorState
  icon={<AlertCircle className="h-12 w-12 text-red-500" />}
  title="Failed to load projects"
  message="We couldn't load your projects. Check your internet connection and try again."
  action={<Button onClick={handleRetry}>Try Again</Button>}
/>
```

**Guidelines:**

- Use red alert icon (AlertCircle, XCircle)
- Plain language error message (not technical)
- Provide actionable recovery step
- Include "Try Again" button
- Optional: "Contact Support" link for persistent errors

---

### Toast Notifications

**Usage:**

```tsx
import { toast } from "sonner"

// Success
toast.success("Project created successfully")

// Error
toast.error("Failed to create project. Please try again.")

// With action (Undo)
toast.success("Cost deleted", {
  action: {
    label: "Undo",
    onClick: handleUndo,
  },
})
```

**Guidelines:**

- Position: Bottom-center on mobile, top-right on desktop
- Duration: 3 seconds (success), 5 seconds (error), 10 seconds (with action)
- Limit: Max 3 toasts visible at once
- Dismissible: User can swipe away on mobile, click X on desktop
- Accessibility: Announced to screen readers via `aria-live="polite"`

---

### Tooltips

**Usage:**

```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="ghost" size="icon">
      <Info className="h-4 w-4" />
    </Button>
  </TooltipTrigger>
  <TooltipContent>
    <p>This is a tooltip explaining a complex feature</p>
  </TooltipContent>
</Tooltip>
```

**Guidelines:**

- Use for explaining complex fields, icons, or features
- Keep text concise (1-2 sentences max)
- Show on hover (desktop) or tap (mobile)
- Position intelligently (avoid covering content)
- Dark background, white text for readability

---

### Badges

**Status Badges:**

```tsx
<Badge variant="default">Planning</Badge>
<Badge variant="success">Active</Badge>
<Badge variant="warning">On Hold</Badge>
<Badge variant="secondary">Completed</Badge>
<Badge variant="outline">Archived</Badge>
```

**Guidelines:**

- Use semantic colors matching status
- Small text size: `text-xs` (12px)
- Padding: `px-2.5 py-0.5`
- Rounded: `rounded-full` for pill shape
- Uppercase: `uppercase` for emphasis

---

### Modals/Dialogs

**Pattern:**

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="sm:max-w-[600px]">
    <DialogHeader>
      <DialogTitle>Modal Title</DialogTitle>
      <DialogDescription>Optional description</DialogDescription>
    </DialogHeader>
    {/* Content */}
    <DialogFooter>
      <Button variant="secondary" onClick={handleCancel}>
        Cancel
      </Button>
      <Button onClick={handleConfirm}>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Guidelines:**

- Max width: 600px on desktop, full width on mobile
- Focus trap: Tab cycles through modal content only
- Escape key: Closes modal
- Backdrop: Semi-transparent dark overlay
- Animation: Fade in with scale up
- Mobile: Full-screen on small devices (<640px)

---

## 6. Responsive Breakpoints

### Tailwind Breakpoints

| Breakpoint     | Min Width | Devices                      | Usage                             |
| -------------- | --------- | ---------------------------- | --------------------------------- |
| `xs` (default) | 0px       | Small phones                 | Mobile-first base styles          |
| `sm`           | 640px     | Large phones (landscape)     | Increase padding, 2-column grids  |
| `md`           | 768px     | Tablets (portrait)           | 2-3 column grids, side navigation |
| `lg`           | 1024px    | Tablets (landscape), laptops | 3-4 column grids, show more data  |
| `xl`           | 1280px    | Desktops                     | Max content width, 4+ columns     |
| `2xl`          | 1536px    | Large desktops               | Rare, mostly centering content    |

---

### Mobile-First Approach

**Always design for mobile first, then enhance for larger screens:**

```tsx
<div className="
  p-4 sm:p-6 lg:p-8          {/* Padding increases with screen size */}
  grid grid-cols-1           {/* 1 column on mobile */}
  md:grid-cols-2             {/* 2 columns on tablet */}
  lg:grid-cols-3             {/* 3 columns on desktop */}
  gap-4 md:gap-6             {/* Gap increases on larger screens */}
">
```

---

### Touch Targets (Mobile)

**WCAG Requirement:** Minimum 44x44px for all interactive elements

**Implementation:**

```tsx
// Button touch targets
<Button size="lg" className="min-h-12 min-w-12">Action</Button>

// Form field touch targets
<Input className="h-12 px-4" />

// Checkbox/Radio touch targets
<Checkbox className="h-6 w-6" />

// Icon button touch targets
<Button size="icon" className="h-12 w-12">
  <Icon className="h-6 w-6" />
</Button>
```

---

### Responsive Typography

**Scale down on mobile, scale up on desktop:**

```tsx
<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
  Responsive Heading
</h1>

<p className="text-sm sm:text-base lg:text-lg">
  Responsive body text
</p>
```

---

### Responsive Navigation

**Mobile (< 768px):**

- Hamburger menu or bottom tab navigation
- Collapsible menu drawer
- Thumb-friendly zones (bottom third of screen)

**Desktop (≥ 768px):**

- Horizontal navigation bar
- All links visible
- Dropdown menus on hover

**Pattern:**

```tsx
<nav
  className="
  fixed bottom-0 left-0 right-0     {/* Fixed bottom on mobile */}
  md:static                          {/* Static position on desktop */}
  flex justify-around                {/* Even spacing on mobile */}
  md:justify-start md:gap-4          {/* Left-aligned with gap on desktop */}
"
>
  {/* Nav items */}
</nav>
```

---

## 7. Accessibility Standards

### WCAG AA Compliance Checklist

- [ ] **Color contrast:** Text meets 4.5:1 ratio (3:1 for large text)
- [ ] **Focus indicators:** Visible on all interactive elements
- [ ] **Keyboard navigation:** All actions accessible via keyboard
- [ ] **ARIA labels:** All icons, buttons have descriptive labels
- [ ] **Form labels:** All inputs have associated labels
- [ ] **Error announcements:** Form errors announced to screen readers (`aria-live`)
- [ ] **Semantic HTML:** Use proper elements (`nav`, `main`, `button`, `label`)
- [ ] **Alt text:** All images have descriptive alt attributes
- [ ] **Skip links:** "Skip to main content" for keyboard users
- [ ] **Focus trap:** Modal dialogs trap focus within

---

### Focus Indicators

**Required on all interactive elements:**

```tsx
<Button className="
  focus-visible:outline-none       {/* Remove default outline */}
  focus-visible:ring-2             {/* Add 2px ring */}
  focus-visible:ring-primary       {/* Primary color ring */}
  focus-visible:ring-offset-2      {/* 2px offset from element */}
">
```

**Don't use:** `outline-none` without replacing with visible focus indicator

---

### Screen Reader Text

**Hide visually but keep for screen readers:**

```tsx
<span className="sr-only">Descriptive text for screen readers</span>
```

**Example:**

```tsx
<button>
  <Trash2 className="h-4 w-4" />
  <span className="sr-only">Delete project</span>
</button>
```

---

### ARIA Labels

**For icon-only buttons:**

```tsx
<Button variant="ghost" size="icon" aria-label="Delete project">
  <Trash2 className="h-4 w-4" />
</Button>
```

**For complex interactions:**

```tsx
<div role="region" aria-label="Cost breakdown chart">
  <PieChart data={costs} />
</div>
```

---

### Live Regions

**Announce dynamic changes:**

```tsx
<div aria-live="polite" aria-atomic="true">
  {errorMessage && <p>{errorMessage}</p>}
</div>
```

**Use cases:**

- Form validation errors
- Loading status updates
- Dynamic content changes
- Toast notifications (handled by library)

---

## 8. Animation & Transitions

### Principles

1. **Purposeful:** Animations should clarify, not decorate
2. **Subtle:** Prefer quick, understated transitions
3. **Consistent:** Same duration/easing for similar interactions
4. **Respectful:** Honor `prefers-reduced-motion` setting

---

### Duration Guidelines

| Type                  | Duration  | Usage                      |
| --------------------- | --------- | -------------------------- |
| Micro-interactions    | 100-200ms | Button hover, focus states |
| Component transitions | 200-300ms | Modal open/close, dropdown |
| Page transitions      | 300-500ms | Route changes, slide-ins   |

**Tailwind Classes:**

- Fast: `transition-all duration-150`
- Default: `transition-all duration-200`
- Smooth: `transition-all duration-300`

---

### Common Patterns

**Hover Effects:**

```tsx
<Card className="transition-shadow duration-200 hover:shadow-lg">
```

**Button Press:**

```tsx
<Button className="transition-transform active:scale-95">
```

**Fade In:**

```tsx
<div className="animate-in fade-in duration-300">
```

**Slide In:**

```tsx
<Sheet className="animate-in slide-in-from-right duration-300">
```

---

### Reduced Motion

**Always respect user preferences:**

```tsx
<div className="
  motion-safe:transition-all motion-safe:duration-300
  motion-reduce:transition-none
">
```

**Media query:**

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 9. Iconography

### Icon Library: Lucide React

**Size Guidelines:**

| Size   | Pixels | Tailwind Class | Usage                            |
| ------ | ------ | -------------- | -------------------------------- |
| Small  | 16px   | `h-4 w-4`      | Inline with text, small buttons  |
| Medium | 20px   | `h-5 w-5`      | Default button icons, navigation |
| Large  | 24px   | `h-6 w-6`      | Large buttons, headings          |
| XLarge | 32px   | `h-8 w-8`      | Empty states, error states       |

**Icon + Text Spacing:**

```tsx
<Button>
  <Plus className="mr-2 h-4 w-4" />
  Add Cost
</Button>
```

**Icon-Only Buttons:**

```tsx
<Button size="icon" aria-label="Delete">
  <Trash2 className="h-4 w-4" />
</Button>
```

---

### Icon Usage Guidelines

**Do:**

- Use icons to reinforce meaning (not replace text)
- Keep icon style consistent (all outline or all filled)
- Use semantic icons (Trash for delete, Plus for add)
- Include aria-label for icon-only buttons

**Don't:**

- Mix icon styles (outline + filled)
- Use obscure icons (users should recognize instantly)
- Use icons without labels on primary actions
- Use too many icons (visual clutter)

---

## 10. Implementation Checklist

### For Every New Component

- [ ] Uses design system color tokens (no hardcoded hex values)
- [ ] Follows typography scale (correct font sizes)
- [ ] Uses spacing system (4px multiples)
- [ ] Mobile-responsive (tested at 375px, 768px, 1024px)
- [ ] Touch targets ≥44px on mobile
- [ ] Focus indicator visible on all interactive elements
- [ ] ARIA labels on icon-only buttons
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Semantic HTML elements used
- [ ] Loading state implemented
- [ ] Error state implemented
- [ ] Empty state implemented (if applicable)
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Respects `prefers-reduced-motion`

---

## 11. Design Tokens (Tailwind Config)

### Recommended Tailwind Config Extensions

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#3B82F6", // blue-500
          foreground: "#FAFAFA",
        },
        success: "#10B981", // green-600
        warning: "#F59E0B", // amber-500
        error: "#EF4444", // red-500
        info: "#0EA5E9", // sky-500
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Menlo", "monospace"],
      },
      spacing: {
        // Already includes 4px-based scale
      },
      fontSize: {
        xs: "0.75rem", // 12px
        sm: "0.875rem", // 14px
        base: "1rem", // 16px
        lg: "1.125rem", // 18px
        xl: "1.25rem", // 20px
        "2xl": "1.5rem", // 24px
        "3xl": "1.875rem", // 30px
        "4xl": "2.25rem", // 36px
      },
      minHeight: {
        12: "3rem", // 48px (mobile touch targets)
      },
      minWidth: {
        12: "3rem", // 48px (mobile touch targets)
      },
    },
  },
}
```

---

## 12. Resources & Tools

### Design Tools

- **Figma:** https://figma.com (wireframes, mockups)
- **Coolors:** https://coolors.co (color palette generator)
- **Type Scale:** https://typescale.com (typography scale calculator)

### Accessibility Tools

- **WebAIM Contrast Checker:** https://webaim.org/resources/contrastchecker/
- **axe DevTools:** Chrome/Firefox extension
- **Lighthouse:** Built into Chrome DevTools
- **WAVE:** https://wave.webaim.org

### Component Libraries

- **Shadcn/ui:** https://ui.shadcn.com (component source)
- **Radix UI:** https://radix-ui.com (primitives documentation)
- **Lucide Icons:** https://lucide.dev (icon search)

### Learning Resources

- **WCAG Guidelines:** https://www.w3.org/WAI/WCAG21/quickref/
- **Tailwind CSS Docs:** https://tailwindcss.com/docs
- **Inclusive Components:** https://inclusive-components.design

---

## Version History

| Version | Date       | Changes                                  | Author   |
| ------- | ---------- | ---------------------------------------- | -------- |
| 1.0     | 2025-10-30 | Initial design system guidelines created | Dev Team |

---

**Next Steps:**

1. Review and approve design system with product owner
2. Implement design tokens in Tailwind config
3. Audit existing components against guidelines
4. Update components to meet standards
5. Create Storybook or component gallery for reference
