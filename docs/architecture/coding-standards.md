# Coding Standards

This document defines the coding standards, UI/UX requirements, and development patterns that apply globally to all stories and implementations in the Real Estate Development Tracker project.

## Code Quality Standards

### TypeScript Standards

**Type Safety:**

- Use strict TypeScript mode (enabled in tsconfig.json)
- Avoid `any` type - use `unknown` or proper types instead
- Define explicit return types for all functions
- Use discriminated unions for complex state management
- Leverage type inference where it improves readability

**Naming Conventions:**

- Use PascalCase for components, types, interfaces, and classes
- Use camelCase for variables, functions, and methods
- Use SCREAMING_SNAKE_CASE for constants
- Prefix interfaces with descriptive names (no "I" prefix)
- Use descriptive names that indicate purpose (avoid abbreviations)

**File Organization:**

- One component per file (except tightly coupled helpers)
- Co-locate related files (component + styles + tests in same directory)
- Use index.ts for clean exports from directories
- Group imports: external libraries → internal modules → relative imports

### Code Documentation

**JSDoc Comments:**

- Required for all public functions and components
- Include @param, @returns, and @throws where applicable
- Document complex business logic with inline comments
- Explain "why" not "what" in comments

**Component Documentation:**

```typescript
/**
 * ProjectCreateForm - Form component for creating new projects
 *
 * Handles project creation with address autocomplete, validation,
 * and optimistic updates. Falls back to manual address entry if
 * autocomplete fails or user can't find their address.
 *
 * @param onSuccess - Callback fired after successful project creation
 * @param defaultValues - Optional initial form values
 */
```

## UI/UX Standards

### Responsive Design (Mobile-First)

**Viewport Requirements:**

- Design mobile-first, starting at 375px width minimum
- Test all features at: 375px (mobile), 768px (tablet), 1024px (desktop)
- Use Tailwind's mobile-first breakpoints (sm:, md:, lg:, xl:)
- All touch targets minimum 44x44px for mobile usability

**Layout Patterns:**

- Stack form fields vertically on mobile
- Consider 2-column layouts on tablet+ where appropriate
- Use responsive grids for card layouts
- Ensure proper spacing and padding scales with viewport

**Component Responsiveness:**

- All forms must be mobile-optimized
- Navigation adapts between mobile/desktop modes
- Tables should scroll horizontally or transform to cards on mobile
- Modals should be full-screen on mobile, centered on desktop

### Accessibility Standards (WCAG AA)

**Form Accessibility:**

- All inputs must have associated labels (use Shadcn/ui Form components)
- Provide clear error messages associated with fields
- Use aria-describedby for hint text and errors
- Mark required fields clearly (both visually and with aria-required)

**Keyboard Navigation:**

- Full keyboard navigation support (Tab, Shift+Tab, Enter, Escape)
- Logical tab order following visual flow
- Focus trapping in modals (focus stays within modal until closed)
- Focus restoration (return focus to trigger element on modal close)
- Skip links for main content navigation

**Screen Reader Support:**

- Use semantic HTML elements (nav, main, article, section, button)
- Add ARIA labels for icon-only buttons
- Announce dynamic content changes (use aria-live regions)
- Provide text alternatives for images and icons
- Error messages must be announced to screen readers

**Visual Accessibility:**

- Maintain WCAG AA color contrast ratios (4.5:1 for text)
- Don't rely on color alone to convey information
- Provide visible focus indicators
- Support browser text resizing up to 200%
- Respect prefers-reduced-motion for animations

### Loading States & User Feedback

**Loading State Patterns:**

**Page/List Loading:**

```typescript
// Initial load: Show skeleton components
if (isLoading) {
  return <ProjectListSkeleton count={4} />;
}

// Empty state: Friendly message with clear CTA
if (data?.length === 0) {
  return (
    <EmptyState
      title="No projects yet"
      description="Create your first project to get started"
      action={<Button onClick={handleCreate}>Create Project</Button>}
    />
  );
}

// Error state: Clear message with retry option
if (isError) {
  return (
    <ErrorState
      message="Failed to load projects"
      action={<Button onClick={refetch}>Try Again</Button>}
    />
  );
}
```

**Form Submission:**

```typescript
// Button loading state
<Button
  type="submit"
  disabled={isSubmitting || !isValid}
>
  {isSubmitting && <Spinner className="mr-2" />}
  {isSubmitting ? 'Creating...' : 'Create Project'}
</Button>

// Keep form disabled during submission
<Input
  {...field}
  disabled={isSubmitting}
/>
```

**Optimistic Updates:**

```typescript
// Delete operation: Remove immediately, rollback on error
const deleteMutation = api.projects.delete.useMutation({
  onMutate: async (projectId) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(["projects"])

    // Snapshot previous value
    const previous = queryClient.getQueryData(["projects"])

    // Optimistically update
    queryClient.setQueryData(["projects"], (old) => old.filter((p) => p.id !== projectId))

    return { previous }
  },
  onError: (err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(["projects"], context.previous)
    toast.error("Failed to delete project")
  },
  onSuccess: () => {
    toast.success("Project deleted successfully")
  },
})
```

**Feedback Timing:**

- Provide visual feedback within 100ms of user action
- Show loading spinner for operations taking >300ms
- Display success/error toasts for completed actions
- Never leave user wondering if their action was received

### Component Patterns

**Address Input Component:**

```typescript
// Default: Autocomplete with Australian address lookup API
// Recommended: Google Places API (Autocomplete) or Australia Post API

interface AddressInputProps {
  value: Address | null
  onChange: (address: Address) => void
  error?: string
}

// Pattern:
// 1. User types in autocomplete field (debounced 300ms)
// 2. API returns Australian address suggestions
// 3. User selects address → auto-populates Address structure
// 4. "Can't find your address?" link toggles manual input mode
// 5. Manual mode: Individual fields (streetNumber, streetName, suburb, state, postcode)
// 6. State field uses dropdown with AustralianState enum values

// Implementation requirements:
// - Graceful API error handling (fallback to manual entry)
// - Format address into Address structure matching data model
// - Store formatted string in address.formatted for display
// - Validate all required fields before submission
```

**Select/Dropdown Pattern:**

```typescript
// Always use Shadcn/ui Select component for consistency
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

<Select onValueChange={field.onChange} defaultValue={field.value}>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    {options.map(option => (
      <SelectItem key={option.value} value={option.value}>
        {option.label}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

**Form Pattern:**

```typescript
// Standard pattern: React Hook Form + Zod + Shadcn/ui
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

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

// Always use Shadcn/ui Form components for consistency
```

## API & Backend Standards

### tRPC Patterns

**Procedure Definitions:**

- Use `protectedProcedure` for authenticated routes
- Use `publicProcedure` only for login/registration
- Always validate inputs with Zod schemas
- Return consistent error codes and messages

**Error Handling:**

```typescript
import { TRPCError } from "@trpc/server"

// Throw standardized errors
throw new TRPCError({
  code: "FORBIDDEN", // Use appropriate tRPC error code
  message: "You do not have permission to access this project",
})
```

**Access Control:**

```typescript
// Always verify ownership for protected resources
const project = await ctx.db.projects.findUnique({
  where: { id: input.projectId, ownerId: ctx.user.id },
})

if (!project) {
  throw new TRPCError({ code: "FORBIDDEN" })
}
```

### Database Standards

**Query Patterns:**

- Use Drizzle ORM for all database operations
- Use transactions for multi-step operations
- Always exclude soft-deleted records (WHERE deletedAt IS NULL)
- Use prepared statements (Drizzle handles this automatically)

**Soft Delete:**

```typescript
// Never hard delete - always use soft delete
await db.update(projects).set({ deletedAt: new Date() }).where(eq(projects.id, projectId))
```

**Data Validation:**

- Server-side Zod validation required on all mutations
- Validate UUIDs, email formats, date ranges
- Enforce unique constraints at database level
- Validate foreign key relationships exist

**Array Usage Guidelines:**

Arrays and JSON columns should be used sparingly and only for specific use cases. Follow this decision framework:

**❌ NEVER Use Arrays For:**

- **Entity ID relationships** - Always use junction tables with foreign keys

  ```typescript
  // ❌ ANTI-PATTERN
  interface Event {
    contactIds: string[] // BAD: No referential integrity
  }

  // ✅ CORRECT PATTERN
  interface EventContact extends BaseEntity {
    eventId: string // FK to events.id (CASCADE)
    contactId: string // FK to contacts.id (CASCADE)
  }
  ```

- **Data requiring referential integrity** - Use proper foreign key constraints
- **Frequently queried/filtered data** - Full table scans are expensive
- **Mutable source-of-truth data** - Use normalized tables

**✅ Arrays ARE Acceptable For:**

1. **Immutable Audit Trail Snapshots**

   ```typescript
   // ✅ APPROPRIATE: Display-only historical snapshot
   interface AuditMetadata {
     relatedEntities?: Array<{ type: string; id: string; name: string }>
   }
   // Stored as JSONB, never queried, preserves historical names
   ```

2. **Simple Non-Entity Value Lists**

   ```typescript
   // ✅ APPROPRIATE: Fixed list of values (not entity IDs)
   interface Project {
     allowedMimeTypes: string[] // ['image/jpeg', 'image/png', 'application/pdf']
   }
   // With GIN index if querying: CREATE INDEX USING GIN (allowed_mime_types)
   ```

3. **Denormalized Performance Caches** (with caution)
   ```typescript
   // ⚠️ USE CAREFULLY: Only if source of truth exists elsewhere
   interface ReportCache {
     categoryBreakdown: Array<{ category: string; total: number }>
   }
   ```

**Database Type Selection:**

- **JSONB** (preferred) - For arrays/objects with native PostgreSQL support

  ```typescript
  // ✅ Use JSONB for JSON data
  export const auditLogs = pgTable("audit_logs", {
    metadata: jsonb("metadata").$type<AuditMetadata>(),
  })
  ```

- **TEXT** (anti-pattern) - Avoid storing JSON as strings
  ```typescript
  // ❌ NEVER DO THIS
  relatedIds: text("related_ids") // Storing '["id1","id2"]' as string
  ```

**Decision Checklist:**

Before using an array, verify:

- [ ] NOT storing entity IDs → Use junction table instead
- [ ] NOT requiring referential integrity → Use foreign keys instead
- [ ] NOT frequently querying individual values → Use normalized table instead
- [ ] IS immutable/display-only OR simple value list → Array may be appropriate
- [ ] Using JSONB (not TEXT) for storage
- [ ] GIN index created if querying array contents

**Performance Considerations:**

```typescript
// ❌ BAD: Client-side filtering (O(n))
const events = await db.query.events.findMany()
const filtered = events.filter((e) => JSON.parse(e.contactIds).includes(targetId))

// ✅ GOOD: Database-level JOIN (O(log n))
const events = await db.query.events.findMany({
  with: {
    eventContacts: {
      where: eq(eventContacts.contactId, targetId),
    },
  },
})
```

**Additional Resources:**

- See [array-usage-analysis.md](array-usage-analysis.md) for detailed evaluation framework
- See [junction-table-migration-plan.md](junction-table-migration-plan.md) for migration patterns

## Testing Standards

### Test Organization

**File Location:**

- Backend unit tests: `apps/web/src/server/__tests__/`
- Component tests: Co-located with components in `__tests__/` subfolder
- Integration tests: `apps/web/integration/api/__tests__/`
- E2E tests: `apps/web/e2e/tests/`

**Test File Naming:**

- Unit/Integration: `{component-name}.test.ts(x)`
- E2E: `{feature-name}.spec.ts`

### Test Coverage Requirements

**Minimum Coverage:**

- Unit tests for all tRPC procedures
- Component tests for all forms and interactive components
- Integration tests for complete CRUD workflows
- E2E tests for critical user journeys

**What to Test:**

- Happy paths (successful operations)
- Validation errors (invalid inputs)
- Access control (unauthorized attempts)
- Edge cases (empty states, boundaries)
- Error handling (network failures, conflicts)

### Test Patterns

**Backend Testing:**

```typescript
import { appRouter } from "../api/root"
import { createTestContext } from "@/test/test-db"

test("creates project with valid input", async () => {
  const ctx = await createTestContext()
  const caller = appRouter.createCaller(ctx)

  const result = await caller.projects.create({
    name: "Test Project",
    address: {
      /* ... */
    },
    startDate: new Date(),
    projectType: "renovation",
  })

  expect(result).toMatchObject({
    name: "Test Project",
    ownerId: ctx.user.id,
  })
})
```

**Component Testing:**

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProjectCreateForm } from '../ProjectCreateForm';

test('submits project creation with valid data', async () => {
  const onSuccess = vi.fn();
  render(<ProjectCreateForm onSuccess={onSuccess} />);

  fireEvent.change(screen.getByLabelText(/name/i), {
    target: { value: 'New Project' }
  });
  // Fill other fields...

  fireEvent.click(screen.getByRole('button', { name: /create/i }));

  await waitFor(() => expect(onSuccess).toHaveBeenCalled());
});
```

## Security Standards

### Authentication & Authorization

**Session Validation:**

- All protected routes use Better-auth session validation
- Never trust client-provided user IDs
- Always use `ctx.user.id` from authenticated session

**Access Control:**

- Verify resource ownership before mutations
- Check project access for partners (read/write permissions)
- Validate user has required permissions before operations

**Input Validation:**

- Never trust client input - always validate server-side
- Use Zod schemas for runtime validation
- Sanitize inputs to prevent injection attacks
- Validate file uploads (type, size, content)

### Data Protection

**Sensitive Data:**

- Use environment variables for secrets (never commit)
- Hash passwords (handled by Better-auth)
- Use UUID primary keys (prevent enumeration attacks)
- Implement soft delete (preserve data for audit/recovery)

**API Security:**

- Rate limiting on authentication endpoints (future enhancement)
- CSRF protection (Next.js provides defaults)
- Secure session cookies (httpOnly, secure, sameSite)

## Performance Standards

### Frontend Performance

**Code Splitting:**

- Use dynamic imports for large components
- Lazy load routes with React.lazy()
- Split vendor bundles appropriately

**Data Fetching:**

- Use React Query for server state management
- Implement proper caching strategies
- Prefetch data for predictable navigation
- Debounce search/autocomplete inputs (300ms)

**Asset Optimization:**

- Optimize images (use Next.js Image component)
- Minimize bundle size (analyze with next/bundle-analyzer)
- Lazy load non-critical assets

### Backend Performance

**Database Optimization:**

- Use appropriate indexes on frequently queried columns
- Limit query results (pagination)
- Use selective includes (only fetch needed relations)
- Batch queries where possible

**Caching:**

- Cache expensive computations
- Use React Query cache on frontend
- Consider server-side caching for static data (future enhancement)

---

**Note:** These standards apply to all stories and implementations. Deviations should be documented with clear justification. When in doubt, prioritize user experience, accessibility, and security.
