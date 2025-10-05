# Testing Guide

This guide covers testing practices, patterns, and examples for the Real Estate Development Tracker.

## Table of Contents

- [Testing Philosophy](#testing-philosophy)
- [Test Organization](#test-organization)
- [Unit Testing](#unit-testing)
- [Component Testing](#component-testing)
- [Integration Testing](#integration-testing)
- [E2E Testing](#e2e-testing)
- [Running Tests](#running-tests)
- [Writing Good Tests](#writing-good-tests)
- [Test Coverage](#test-coverage)

## Testing Philosophy

### Testing Pyramid

We follow the testing pyramid approach:

```
        ▲
       / \      E2E Tests (Few)
      /   \     - Critical user journeys
     /     \    - Complete workflows
    /-------\
   /         \  Integration Tests (Some)
  /           \ - Complete CRUD workflows
 /             \- API + Database
/---------------\
    Unit Tests    (Many)
    - tRPC procedures
    - Utility functions
    - Component logic
```

### Test Types

1. **Unit Tests** (70%)
   - Fast, isolated, numerous
   - Test individual functions/components
   - Mock external dependencies

2. **Integration Tests** (20%)
   - Test multiple components together
   - Real database interactions
   - API workflow validation

3. **E2E Tests** (10%)
   - Full user workflows
   - Browser automation
   - Critical paths only

### Testing Stack

- **Unit/Integration:** Vitest + Testing Library
- **E2E:** Playwright
- **Mocking:** Vitest mock utilities
- **Test Database:** Neon test instance

## Test Organization

### Directory Structure

```
apps/web/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   └── button.tsx
│   │   ├── ProjectCard/
│   │   │   ├── ProjectCard.tsx
│   │   │   └── __tests__/
│   │   │       └── ProjectCard.test.tsx
│   │   └── forms/
│   │       ├── ProjectCreateForm.tsx
│   │       └── __tests__/
│   │           └── ProjectCreateForm.test.tsx
│   │
│   ├── server/
│   │   ├── api/
│   │   │   └── routers/
│   │   │       ├── projects.ts
│   │   │       └── __tests__/
│   │   │           └── projects.test.ts
│   │   └── __tests__/
│   │       └── helpers.test.ts
│   │
│   └── lib/
│       ├── utils.ts
│       └── __tests__/
│           └── utils.test.ts
│
├── integration/
│   └── api/
│       └── __tests__/
│           └── projects-workflow.test.ts
│
└── e2e/
    └── tests/
        ├── auth.spec.ts
        ├── projects.spec.ts
        └── costs.spec.ts
```

### File Naming Conventions

- **Unit/Integration:** `{name}.test.ts` or `{name}.test.tsx`
- **E2E:** `{feature}.spec.ts`
- **Test Utilities:** `test-utils.ts`, `test-db.ts`

## Unit Testing

### Testing tRPC Procedures

```typescript
// apps/web/src/server/api/routers/__tests__/projects.test.ts

import { describe, test, expect, beforeEach } from "vitest"
import { appRouter } from "../../root"
import { createTestContext } from "@/test/test-db"

describe("projects router", () => {
  describe("create", () => {
    test("creates project with valid input", async () => {
      const ctx = await createTestContext()
      const caller = appRouter.createCaller(ctx)

      const result = await caller.projects.create({
        name: "Test Project",
        address: {
          streetNumber: "123",
          streetName: "Test St",
          suburb: "Sydney",
          state: "NSW",
          postcode: "2000",
          formatted: "123 Test St, Sydney NSW 2000",
        },
        startDate: new Date("2025-01-01"),
        projectType: "renovation",
      })

      expect(result).toMatchObject({
        name: "Test Project",
        ownerId: ctx.user.id,
        projectType: "renovation",
      })
      expect(result.id).toBeDefined()
    })

    test("throws error for invalid input", async () => {
      const ctx = await createTestContext()
      const caller = appRouter.createCaller(ctx)

      await expect(
        caller.projects.create({
          name: "", // Invalid: empty name
          address: {} as any,
          startDate: new Date(),
          projectType: "renovation",
        })
      ).rejects.toThrow()
    })

    test("throws UNAUTHORIZED for unauthenticated user", async () => {
      const ctx = await createTestContext({ authenticated: false })
      const caller = appRouter.createCaller(ctx)

      await expect(
        caller.projects.create({
          name: "Test Project",
          address: {
            /* ... */
          } as any,
          startDate: new Date(),
          projectType: "renovation",
        })
      ).rejects.toThrow("UNAUTHORIZED")
    })
  })

  describe("list", () => {
    test("returns only user owned projects", async () => {
      const ctx = await createTestContext()
      const caller = appRouter.createCaller(ctx)

      // Create test projects
      await caller.projects.create({
        /* ... */
      })
      await caller.projects.create({
        /* ... */
      })

      const result = await caller.projects.list()

      expect(result).toHaveLength(2)
      result.forEach((project) => {
        expect(project.ownerId).toBe(ctx.user.id)
      })
    })

    test("excludes soft-deleted projects", async () => {
      const ctx = await createTestContext()
      const caller = appRouter.createCaller(ctx)

      const project = await caller.projects.create({
        /* ... */
      })
      await caller.projects.delete({ id: project.id })

      const result = await caller.projects.list()

      expect(result).toHaveLength(0)
    })
  })
})
```

### Testing Utility Functions

```typescript
// apps/web/src/lib/__tests__/utils.test.ts

import { describe, test, expect } from "vitest"
import { formatCurrency, calculateTotal, formatAddress } from "../utils"

describe("formatCurrency", () => {
  test("formats AUD currency correctly", () => {
    expect(formatCurrency(1000)).toBe("$1,000.00")
    expect(formatCurrency(1234.56)).toBe("$1,234.56")
    expect(formatCurrency(0)).toBe("$0.00")
  })

  test("handles negative values", () => {
    expect(formatCurrency(-100)).toBe("-$100.00")
  })

  test("handles very large numbers", () => {
    expect(formatCurrency(1000000)).toBe("$1,000,000.00")
  })
})

describe("calculateTotal", () => {
  test("calculates sum of cost items", () => {
    const costs = [
      { amount: 100, gst: 10 },
      { amount: 200, gst: 20 },
    ]
    expect(calculateTotal(costs)).toBe(330)
  })

  test("handles empty array", () => {
    expect(calculateTotal([])).toBe(0)
  })
})

describe("formatAddress", () => {
  test("formats complete address", () => {
    const address = {
      streetNumber: "123",
      streetName: "Main St",
      suburb: "Sydney",
      state: "NSW",
      postcode: "2000",
    }
    expect(formatAddress(address)).toBe("123 Main St, Sydney NSW 2000")
  })

  test("handles missing street number", () => {
    const address = {
      streetNumber: "",
      streetName: "Main St",
      suburb: "Sydney",
      state: "NSW",
      postcode: "2000",
    }
    expect(formatAddress(address)).toBe("Main St, Sydney NSW 2000")
  })
})
```

## Component Testing

### Testing Forms

```typescript
// apps/web/src/components/forms/__tests__/ProjectCreateForm.test.tsx

import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProjectCreateForm } from '../ProjectCreateForm';
import { TRPCProvider } from '@/test/trpc-provider';

describe('ProjectCreateForm', () => {
  test('renders all form fields', () => {
    render(
      <TRPCProvider>
        <ProjectCreateForm onSuccess={vi.fn()} />
      </TRPCProvider>
    );

    expect(screen.getByLabelText(/project name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/project type/i)).toBeInTheDocument();
  });

  test('validates required fields', async () => {
    render(
      <TRPCProvider>
        <ProjectCreateForm onSuccess={vi.fn()} />
      </TRPCProvider>
    );

    const submitButton = screen.getByRole('button', { name: /create/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/address is required/i)).toBeInTheDocument();
    });
  });

  test('submits form with valid data', async () => {
    const onSuccess = vi.fn();

    render(
      <TRPCProvider>
        <ProjectCreateForm onSuccess={onSuccess} />
      </TRPCProvider>
    );

    // Fill form
    fireEvent.change(screen.getByLabelText(/project name/i), {
      target: { value: 'New Project' }
    });

    // Fill address (simplified for example)
    fireEvent.change(screen.getByLabelText(/address/i), {
      target: { value: '123 Test St, Sydney NSW 2000' }
    });

    // Select date
    fireEvent.change(screen.getByLabelText(/start date/i), {
      target: { value: '2025-01-01' }
    });

    // Select project type
    fireEvent.change(screen.getByLabelText(/project type/i), {
      target: { value: 'renovation' }
    });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Project',
          projectType: 'renovation'
        })
      );
    });
  });

  test('displays loading state during submission', async () => {
    render(
      <TRPCProvider>
        <ProjectCreateForm onSuccess={vi.fn()} />
      </TRPCProvider>
    );

    // Fill and submit form
    // ... (form filling code)

    const submitButton = screen.getByRole('button', { name: /create/i });
    fireEvent.click(submitButton);

    expect(screen.getByText(/creating/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  test('displays error message on submission failure', async () => {
    // Mock API failure
    const mockError = { message: 'Failed to create project' };

    render(
      <TRPCProvider error={mockError}>
        <ProjectCreateForm onSuccess={vi.fn()} />
      </TRPCProvider>
    );

    // Submit form
    // ... (form filling and submission code)

    await waitFor(() => {
      expect(screen.getByText(/failed to create project/i)).toBeInTheDocument();
    });
  });
});
```

### Testing Interactive Components

```typescript
// apps/web/src/components/__tests__/ProjectCard.test.tsx

import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProjectCard } from '../ProjectCard';

describe('ProjectCard', () => {
  const mockProject = {
    id: '123',
    name: 'Test Project',
    address: {
      formatted: '123 Test St, Sydney NSW 2000'
    },
    status: 'active',
    totalCosts: 50000
  };

  test('renders project information', () => {
    render(<ProjectCard project={mockProject} />);

    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText(/123 Test St/)).toBeInTheDocument();
    expect(screen.getByText(/\$50,000/)).toBeInTheDocument();
  });

  test('calls onEdit when edit button clicked', () => {
    const onEdit = vi.fn();
    render(<ProjectCard project={mockProject} onEdit={onEdit} />);

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));

    expect(onEdit).toHaveBeenCalledWith(mockProject.id);
  });

  test('shows delete confirmation dialog', () => {
    render(<ProjectCard project={mockProject} onDelete={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /delete/i }));

    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
  });

  test('calls onDelete after confirmation', () => {
    const onDelete = vi.fn();
    render(<ProjectCard project={mockProject} onDelete={onDelete} />);

    // Open dialog
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));

    // Confirm
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

    expect(onDelete).toHaveBeenCalledWith(mockProject.id);
  });
});
```

## Integration Testing

### API Workflow Tests

```typescript
// apps/web/integration/api/__tests__/projects-workflow.test.ts

import { describe, test, expect, beforeEach } from "vitest"
import { appRouter } from "@/server/api/root"
import { createTestContext, cleanupTestData } from "@/test/test-db"

describe("Projects Workflow Integration", () => {
  beforeEach(async () => {
    await cleanupTestData()
  })

  test("complete project lifecycle", async () => {
    const ctx = await createTestContext()
    const caller = appRouter.createCaller(ctx)

    // 1. Create project
    const project = await caller.projects.create({
      name: "Integration Test Project",
      address: {
        streetNumber: "123",
        streetName: "Test St",
        suburb: "Sydney",
        state: "NSW",
        postcode: "2000",
        formatted: "123 Test St, Sydney NSW 2000",
      },
      startDate: new Date("2025-01-01"),
      projectType: "renovation",
    })

    expect(project.id).toBeDefined()

    // 2. Retrieve project
    const retrieved = await caller.projects.getById({ id: project.id })
    expect(retrieved).toMatchObject({
      id: project.id,
      name: "Integration Test Project",
    })

    // 3. Update project
    const updated = await caller.projects.update({
      id: project.id,
      name: "Updated Project Name",
    })

    expect(updated.name).toBe("Updated Project Name")

    // 4. Add costs to project
    const cost = await caller.costs.create({
      projectId: project.id,
      description: "Test Cost",
      amount: 1000,
      category: "materials",
    })

    expect(cost.projectId).toBe(project.id)

    // 5. Verify project includes costs
    const withCosts = await caller.projects.getById({
      id: project.id,
      includeCosts: true,
    })

    expect(withCosts.costs).toHaveLength(1)
    expect(withCosts.totalCosts).toBe(1000)

    // 6. Soft delete project
    await caller.projects.delete({ id: project.id })

    // 7. Verify project not in list
    const projects = await caller.projects.list()
    expect(projects.find((p) => p.id === project.id)).toBeUndefined()

    // 8. Verify project still in database (soft delete)
    const deleted = await caller.projects.getById({
      id: project.id,
      includeDeleted: true,
    })
    expect(deleted.deletedAt).toBeDefined()
  })
})
```

## E2E Testing

### Authentication Flow

```typescript
// apps/web/e2e/tests/auth.spec.ts

import { test, expect } from "@playwright/test"

test.describe("Authentication", () => {
  test("user can sign up", async ({ page }) => {
    await page.goto("/signup")

    // Fill signup form
    await page.fill('input[name="email"]', "test@example.com")
    await page.fill('input[name="password"]', "SecurePassword123")
    await page.fill('input[name="confirmPassword"]', "SecurePassword123")

    // Submit
    await page.click('button[type="submit"]')

    // Verify redirect to dashboard
    await expect(page).toHaveURL("/dashboard")
    await expect(page.locator("h1")).toContainText("Dashboard")
  })

  test("user can login", async ({ page }) => {
    await page.goto("/login")

    await page.fill('input[name="email"]', "dev@example.com")
    await page.fill('input[name="password"]', "password123")
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL("/dashboard")
  })

  test("shows error for invalid credentials", async ({ page }) => {
    await page.goto("/login")

    await page.fill('input[name="email"]', "wrong@example.com")
    await page.fill('input[name="password"]', "wrongpassword")
    await page.click('button[type="submit"]')

    await expect(page.locator('[role="alert"]')).toContainText("Invalid credentials")
  })

  test("user can logout", async ({ page }) => {
    // Login first
    await page.goto("/login")
    await page.fill('input[name="email"]', "dev@example.com")
    await page.fill('input[name="password"]', "password123")
    await page.click('button[type="submit"]')

    // Logout
    await page.click('button[aria-label="User menu"]')
    await page.click("text=Logout")

    await expect(page).toHaveURL("/login")
  })
})
```

### Project Management Flow

```typescript
// apps/web/e2e/tests/projects.spec.ts

import { test, expect } from "@playwright/test"

test.describe("Project Management", () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto("/login")
    await page.fill('input[name="email"]', "dev@example.com")
    await page.fill('input[name="password"]', "password123")
    await page.click('button[type="submit"]')
  })

  test("create new project", async ({ page }) => {
    await page.goto("/projects")
    await page.click("text=Create Project")

    // Fill form
    await page.fill('input[name="name"]', "E2E Test Project")
    await page.fill('input[name="address"]', "123 Test St, Sydney NSW 2000")
    await page.fill('input[name="startDate"]', "2025-01-01")
    await page.selectOption('select[name="projectType"]', "renovation")

    // Submit
    await page.click('button[type="submit"]')

    // Verify success
    await expect(page.locator('[role="alert"]')).toContainText("Project created")
    await expect(page.locator("h2")).toContainText("E2E Test Project")
  })

  test("view project details", async ({ page }) => {
    await page.goto("/projects")

    // Click on first project
    await page.click('[data-testid="project-card"]:first-child')

    // Verify details page
    await expect(page.locator("h1")).toBeVisible()
    await expect(page.locator('[data-testid="project-address"]')).toBeVisible()
    await expect(page.locator('[data-testid="project-status"]')).toBeVisible()
  })

  test("add cost to project", async ({ page }) => {
    await page.goto("/projects")
    await page.click('[data-testid="project-card"]:first-child')

    // Add cost
    await page.click("text=Add Cost")
    await page.fill('input[name="description"]', "Test Material Cost")
    await page.fill('input[name="amount"]', "5000")
    await page.selectOption('select[name="category"]', "materials")
    await page.click('button[type="submit"]')

    // Verify cost appears
    await expect(page.locator("text=Test Material Cost")).toBeVisible()
    await expect(page.locator("text=$5,000.00")).toBeVisible()
  })
})
```

## Running Tests

### Command Reference

```bash
# Run all unit tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run with coverage
bun run test:coverage

# Run specific test file
bun run test path/to/test.test.ts

# Run tests matching pattern
bun run test --grep "projects router"

# Run integration tests
bun run test:integration

# Run E2E tests
bun run test:e2e

# Run E2E in headed mode (see browser)
bun run test:e2e --headed

# Run specific E2E test
bun run test:e2e tests/auth.spec.ts
```

### CI/CD Testing

Tests run automatically in CI:

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: |
    bun run typecheck
    bun run lint
    bun run test:coverage
    bun run test:e2e
```

## Writing Good Tests

### Best Practices

#### ✅ DO

- **Test behavior, not implementation**

  ```typescript
  // Good
  test('displays project name', () => {
    render(<ProjectCard project={mockProject} />);
    expect(screen.getByText(mockProject.name)).toBeInTheDocument();
  });

  // Bad
  test('renders h2 element', () => {
    const { container } = render(<ProjectCard project={mockProject} />);
    expect(container.querySelector('h2')).toBeTruthy();
  });
  ```

- **Use descriptive test names**

  ```typescript
  // Good
  test("throws FORBIDDEN error when user tries to delete another users project")

  // Bad
  test("delete fails")
  ```

- **Arrange-Act-Assert pattern**

  ```typescript
  test("creates project with valid input", async () => {
    // Arrange
    const ctx = await createTestContext()
    const caller = appRouter.createCaller(ctx)
    const input = {
      /* ... */
    }

    // Act
    const result = await caller.projects.create(input)

    // Assert
    expect(result).toMatchObject(expected)
  })
  ```

#### ❌ DON'T

- **Don't test framework code**

  ```typescript
  // Bad - testing Next.js routing
  test("router.push is called", () => {
    // ...
  })
  ```

- **Don't test third-party libraries**

  ```typescript
  // Bad - testing Zod
  test("zod validates email", () => {
    // ...
  })
  ```

- **Don't have multiple assertions for unrelated things**

  ```typescript
  // Bad
  test("form works", () => {
    // tests rendering, validation, submission, error handling
  })

  // Good - split into multiple tests
  test("renders all form fields")
  test("validates required fields")
  test("submits with valid data")
  test("displays error on failure")
  ```

### Test Utilities

```typescript
// test/test-db.ts
export async function createTestContext(options = {}) {
  const user = await createTestUser();

  return {
    user,
    db: testDb,
    session: { userId: user.id },
    ...options
  };
}

// test/trpc-provider.tsx
export function TRPCProvider({ children, error = null }) {
  const mockClient = createMockTRPCClient({ error });

  return (
    <TRPCReactProvider client={mockClient}>
      {children}
    </TRPCReactProvider>
  );
}
```

## Test Coverage

### Coverage Requirements

Minimum coverage targets:

- **Statements:** 80%
- **Branches:** 75%
- **Functions:** 80%
- **Lines:** 80%

### Checking Coverage

```bash
# Generate coverage report
bun run test:coverage

# View HTML report
open coverage/index.html
```

### Coverage Reports

Coverage reports show:

- Files with coverage gaps
- Uncovered lines (red highlighting)
- Branch coverage (decision points)

Focus on:

1. Critical business logic
2. Error handling paths
3. Edge cases and validations

### Excluding from Coverage

```typescript
/* istanbul ignore next */
function debugHelper() {
  // Debug-only code
}
```

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://testingjavascript.com/)

---

**Questions?** See [Troubleshooting Guide](./troubleshooting.md) or create a GitHub issue.
