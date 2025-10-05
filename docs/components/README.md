# Component Documentation

This directory contains documentation for UI components in the Real Estate Development Tracker.

## Overview

The application uses [Shadcn/ui](https://ui.shadcn.com/) components built on top of [Radix UI](https://www.radix-ui.com/) with [Tailwind CSS](https://tailwindcss.com/) for styling.

## Component Structure

### UI Components (Shadcn/ui)

- **Location:** `apps/web/src/components/ui/`
- **Purpose:** Base UI primitives (Button, Input, Dialog, etc.)
- **Customization:** Configured via Tailwind theme

### Feature Components

- **Location:** `apps/web/src/components/`
- **Purpose:** Business logic components (forms, lists, dashboards)
- **Examples:** ProjectCreateForm, CostList, ProjectDashboard

### Layout Components

- **Location:** `apps/web/src/app/` (App Router layouts)
- **Purpose:** Page layouts, navigation, shell components

## Documentation Standards

### Component Documentation Format

All components should include JSDoc comments following this pattern:

```typescript
/**
 * ProjectCreateForm - Form component for creating new projects
 *
 * Handles project creation with address autocomplete, validation,
 * and optimistic updates. Falls back to manual address entry if
 * autocomplete fails or user can't find their address.
 *
 * Features:
 * - Australian address autocomplete (Google Places API)
 * - Manual address entry fallback
 * - Real-time validation with Zod
 * - Optimistic UI updates on submission
 * - Accessible form with WCAG AA compliance
 *
 * @param props.onSuccess - Callback fired after successful project creation
 * @param props.defaultValues - Optional initial form values
 * @param props.className - Optional CSS classes for styling
 *
 * @example
 * <ProjectCreateForm
 *   onSuccess={(project) => router.push(`/projects/${project.id}`)}
 *   defaultValues={{ projectType: "renovation" }}
 * />
 */
export function ProjectCreateForm({ onSuccess, defaultValues, className }: ProjectCreateFormProps) {
  // Implementation...
}
```

### Props Documentation

Document all props with TypeScript interfaces:

```typescript
interface ProjectCreateFormProps {
  /** Callback fired when project is successfully created */
  onSuccess?: (project: Project) => void

  /** Initial form values */
  defaultValues?: Partial<ProjectFormData>

  /** Additional CSS classes */
  className?: string
}
```

### State Management

Document component state and data flow:

```typescript
/**
 * State Management:
 * - Form state: React Hook Form with Zod validation
 * - Server state: React Query via tRPC hooks
 * - Optimistic updates: React Query mutation callbacks
 * - Address autocomplete: Local state with debounced API calls
 */
```

### Accessibility Notes

Document accessibility features:

```typescript
/**
 * Accessibility:
 * - All inputs have associated labels (Shadcn/ui Form)
 * - Error messages announced to screen readers (aria-describedby)
 * - Required fields marked with aria-required
 * - Full keyboard navigation support
 * - Focus trapping in modal dialogs
 * - WCAG AA color contrast ratios
 */
```

## Component Patterns

### Form Components

Forms use React Hook Form + Zod + Shadcn/ui:

```typescript
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  // ... other fields
})

const form = useForm<z.infer<typeof formSchema>>({
  resolver: zodResolver(formSchema),
  defaultValues: {
    /* ... */
  },
})
```

See [Coding Standards](../architecture/coding-standards.md#form-pattern) for full pattern.

### Address Input Component

Custom component with autocomplete and manual fallback:

```typescript
<AddressInput
  value={address}
  onChange={setAddress}
  error={errors.address}
/>
```

See [Coding Standards](../architecture/coding-standards.md#address-input-component) for implementation details.

### Loading States

All components implement proper loading states:

```typescript
if (isLoading) return <Skeleton />;
if (isError) return <ErrorState retry={refetch} />;
if (data?.length === 0) return <EmptyState />;
```

See [Coding Standards](../architecture/coding-standards.md#loading-states--user-feedback) for patterns.

## Testing Components

Component tests use Vitest + Testing Library:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';

test('submits form with valid data', async () => {
  const onSuccess = vi.fn();
  render(<ProjectCreateForm onSuccess={onSuccess} />);

  // Test implementation...
});
```

See [Testing Guide](../guides/testing.md) for comprehensive examples.

## Related Documentation

- [Coding Standards](../architecture/coding-standards.md)
- [UI/UX Standards](../architecture/coding-standards.md#uiux-standards)
- [Testing Guide](../guides/testing.md)
- [Tech Stack](../architecture/tech-stack.md)
