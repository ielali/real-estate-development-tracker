# Quick Reference Guide for Developers

## Real Estate Development Tracker - Design System & UX Standards

**Version:** 1.0 | **Last Updated:** October 30, 2025

---

## Color Palette

### Primary Colors

```tsx
bg - primary // #3B82F6 (blue-500)
text - primary - foreground // White on primary
```

### Semantic Colors

```tsx
text - green - 600 // Success
text - amber - 500 // Warning
text - red - 500 // Error
text - sky - 500 // Info
```

### Text Colors (WCAG AA Compliant)

```tsx
text - slate - 900 // Primary text (15.5:1 contrast) ✅
text - slate - 600 // Secondary/muted text (4.9:1 contrast) ✅
// ❌ NEVER USE: text-gray-500 (3.2:1 - fails WCAG AA)
```

---

## Typography

### Headings

```tsx
<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">     // Page titles
<h2 className="text-xl sm:text-2xl font-semibold">              // Section titles
<h3 className="text-lg sm:text-xl font-semibold">               // Subsections
<h4 className="text-base sm:text-lg font-semibold">             // Card titles
```

### Body Text

```tsx
<p className="text-lg">      // Large (18px)
<p className="text-base">    // Default (16px)
<span className="text-sm">   // Small (14px)
<span className="text-xs">   // Tiny (12px)
```

---

## Spacing (4px Base Unit)

### Common Patterns

```tsx
gap - 1 // 4px  - Icon padding, badge padding
gap - 2 // 8px  - Between buttons, icon + text
gap - 4 // 16px - Between form fields, card spacing
gap - 6 // 24px - Between sections, card padding
gap - 8 // 32px - Page sections, large margins
```

### Component Padding

```tsx
// Buttons
px-4 py-2         // Default (16px x 8px)

// Form Fields
px-3 py-2 h-10    // Desktop (12px x 8px, 40px height)
px-4 py-3 h-12    // Mobile (16px x 12px, 48px height)

// Cards
p-6               // Standard card padding (24px)
```

---

## Component Patterns

### Button Variants

```tsx
<Button>Primary</Button>                           // Blue, white text
<Button variant="secondary">Secondary</Button>      // Gray, dark text
<Button variant="ghost">Ghost</Button>              // Transparent
<Button variant="destructive">Delete</Button>       // Red
<Button variant="outline">Outline</Button>          // Border only
```

### Button Sizes

```tsx
<Button size="sm">Small</Button>       // 36px height
<Button size="default">Default</Button> // 40px height
<Button size="lg">Large</Button>        // 48px height (mobile-friendly)
```

### Form Pattern

```tsx
<FormField
  control={form.control}
  name="fieldName"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Label *</FormLabel>
      <FormControl>
        <Input placeholder="Placeholder" {...field} />
      </FormControl>
      <FormDescription>Help text (optional)</FormDescription>
      <FormMessage /> {/* Error message */}
    </FormItem>
  )}
/>
```

### Loading States

```tsx
// Page loading
{
  isLoading && <Spinner className="mx-auto" />
}

// List loading
{
  isLoading ? <ProjectListSkeleton count={6} /> : <ProjectList />
}

// Button loading
;<Button disabled={isSubmitting}>
  {isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
  {isSubmitting ? "Creating..." : "Create Project"}
</Button>
```

### Empty States

```tsx
<EmptyState
  icon={<Box className="h-12 w-12 text-gray-400" />}
  title="No projects yet"
  description="Create your first project to get started"
  action={<Button onClick={handleCreate}>Create Project</Button>}
/>
```

### Error States

```tsx
<ErrorState
  icon={<AlertCircle className="h-12 w-12 text-red-500" />}
  title="Failed to load"
  message="Check your connection and try again."
  action={<Button onClick={refetch}>Try Again</Button>}
/>
```

### Toast Notifications

```tsx
import { toast } from "sonner"

toast.success("Project created") // Success
toast.error("Failed to create project") // Error
toast.info("Partner invited") // Info
toast.success("Cost deleted", {
  // With undo
  action: { label: "Undo", onClick: handleUndo },
})
```

---

## Responsive Design

### Breakpoints

```tsx
// Default (< 640px)   - Mobile
sm: (≥ 640px)         - Large phones
md: (≥ 768px)         - Tablets
lg: (≥ 1024px)        - Small laptops
xl: (≥ 1280px)        - Desktops
```

### Mobile-First Pattern

```tsx
<div className="
  p-4 sm:p-6 lg:p-8              // Padding increases
  grid grid-cols-1               // 1 column mobile
  md:grid-cols-2 lg:grid-cols-3  // 2-3 columns larger screens
  gap-4 md:gap-6                 // Gap increases
">
```

### Touch Targets (Mobile)

```tsx
// Minimum 44x44px (WCAG requirement)
<Button size="lg" className="min-h-12 min-w-12">  // 48px (recommended)
<Input className="h-12" />                         // 48px height
```

---

## Accessibility Checklist

### Focus Indicators

```tsx
// Always add focus indicators
className =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
```

### ARIA Labels

```tsx
// Icon-only buttons
<Button aria-label="Delete project">
  <Trash2 className="h-4 w-4" />
</Button>

// Complex interactions
<div role="region" aria-label="Cost breakdown chart">
  <PieChart data={costs} />
</div>
```

### Screen Reader Text

```tsx
<span className="sr-only">Descriptive text for screen readers</span>
```

### Form Accessibility

```tsx
<FormItem>
  <FormLabel>Field Label *</FormLabel> // Visual label
  <FormControl>
    <Input aria-required="true" {...field} /> // Required indicator
  </FormControl>
  <FormMessage aria-live="polite" /> // Error announcements
</FormItem>
```

---

## Common Mistakes to Avoid

### ❌ DON'T

```tsx
// Low contrast text (fails WCAG)
<p className="text-gray-400">Important information</p>

// Hardcoded colors (not using design system)
<div style={{ color: '#888888' }}>

// Missing focus indicators
<button className="outline-none">

// Small touch targets on mobile
<button className="h-8 w-8">Icon</button>

// Icon-only buttons without labels
<button><Trash2 /></button>

// Missing loading states
{data && <DataTable data={data} />}
```

### ✅ DO

```tsx
// WCAG AA compliant text
<p className="text-slate-600">Important information</p>

// Design system colors
<div className="text-slate-600">

// Visible focus indicators
<button className="focus-visible:ring-2 focus-visible:ring-primary">

// Mobile-friendly touch targets
<button className="h-12 w-12 md:h-10 md:w-10">Icon</button>

// Accessible icon-only buttons
<button aria-label="Delete"><Trash2 /></button>

// Loading states
{isLoading ? <Spinner /> : data && <DataTable data={data} />}
```

---

## Icon Usage

### Icon Sizes

```tsx
<Icon className="h-4 w-4" />   // 16px - Inline with text, small buttons
<Icon className="h-5 w-5" />   // 20px - Default buttons, navigation
<Icon className="h-6 w-6" />   // 24px - Large buttons, headings
<Icon className="h-8 w-8" />   // 32px - Empty states, hero sections
```

### Icon + Text Pattern

```tsx
<Button>
  <Plus className="mr-2 h-4 w-4" />
  Add Cost
</Button>
```

---

## Animation

### Transitions

```tsx
// Hover effects
className = "transition-shadow duration-200 hover:shadow-lg"

// Button press
className = "transition-transform active:scale-95"

// Fade in
className = "animate-in fade-in duration-300"
```

### Reduced Motion

```tsx
// Always respect user preferences
className = "motion-safe:transition-all motion-safe:duration-300 motion-reduce:transition-none"
```

---

## Performance

### Code Splitting

```tsx
// Lazy load heavy components
const ChartsVisualization = lazy(() => import("./ChartsVisualization"))

;<Suspense fallback={<Spinner />}>
  <ChartsVisualization data={data} />
</Suspense>
```

### Image Optimization

```tsx
// Always use Next.js Image component
import Image from "next/image"

;<Image
  src="/document.jpg"
  alt="Document description"
  width={400}
  height={300}
  className="rounded-lg"
/>
```

---

## Testing Checklist

Before submitting PR, verify:

- [ ] **Mobile responsive** (tested at 375px, 768px, 1024px)
- [ ] **Touch targets ≥44px** on mobile
- [ ] **Color contrast** meets WCAG AA (4.5:1 for text)
- [ ] **Focus indicators** visible on all interactive elements
- [ ] **ARIA labels** on icon-only buttons
- [ ] **Loading states** implemented
- [ ] **Error states** implemented
- [ ] **Empty states** implemented (if applicable)
- [ ] **Keyboard navigation** works
- [ ] **Screen reader** compatible (test with VoiceOver/NVDA)
- [ ] **Uses design system** colors, typography, spacing

---

## Quick Commands

### Run Tests

```bash
npm run test              # Unit tests
npm run test:e2e          # E2E tests
npm run lint              # ESLint
npm run type-check        # TypeScript
```

### Accessibility Testing

```bash
# Use axe DevTools browser extension
# Or run Lighthouse audit in Chrome DevTools
```

---

## Resources

- **Design System:** [design-system-guidelines.md](./design-system-guidelines.md)
- **Audit Report:** [audit-report.md](./audit-report.md)
- **Shadcn/ui:** https://ui.shadcn.com
- **Tailwind CSS:** https://tailwindcss.com/docs
- **WCAG Guidelines:** https://www.w3.org/WAI/WCAG21/quickref/
- **WebAIM Contrast Checker:** https://webaim.org/resources/contrastchecker/

---

## Need Help?

1. Check [design-system-guidelines.md](./design-system-guidelines.md) for detailed patterns
2. Review existing components in `/components/ui/`
3. Test with real devices and assistive technologies
4. Ask for design review before implementing major changes

---

**Last Updated:** October 30, 2025 | **Version:** 1.0
