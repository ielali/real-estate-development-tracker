# Testing Guide

This document explains how testing is organized in this project and how to run different types of tests.

## Test Organization

This project uses **two separate testing frameworks** for different purposes:

### 1. **Vitest** - Unit & Integration Tests

- **Location**: `src/**/__tests__/*.test.ts(x)`
- **Purpose**: Unit tests, integration tests, component tests, API tests
- **Environment**: jsdom (for components) or node (for server/API)
- **Configuration**: [vitest.config.ts](../vitest.config.ts)

### 2. **Playwright** - E2E Tests

- **Location**: `e2e/**/*.spec.ts`
- **Purpose**: End-to-end accessibility and browser tests
- **Environment**: Real browsers (Chromium, Firefox, WebKit)
- **Configuration**: [playwright.config.ts](../playwright.config.ts)

## Running Tests

### Vitest (Unit/Integration Tests)

```bash
# Run tests in watch mode (interactive)
bun run test

# Run all tests once (CI mode)
bun run test:run

# Run with UI
bun run test:ui

# Run only component tests
bun run test:component

# Run only API/server tests
bun run test:api

# Run specific test file
bun run test:run src/hooks/__tests__/useDebounce.test.ts
```

**Important**: Always use `bun run test` or `bun run test:run`, **NOT** `bun test`. The `bun test` command uses Bun's built-in test runner which doesn't understand Vitest globals like `vi`, `describe`, `test`, etc.

### Playwright (E2E Tests)

**Important**: E2E tests require the application to be running first:

```bash
# Terminal 1: Start the dev server
bun run dev

# Terminal 2: Run e2e tests
bun run test:e2e          # Interactive mode
bun run test:e2e:run      # CI mode
bun run test:e2e:ui       # UI mode (recommended for development)
bun run test:e2e:debug    # Debug mode
```

## Test File Patterns

### Vitest Tests (`.test.ts` or `.test.tsx`)

```
src/
  components/
    __tests__/
      error-boundary.test.tsx        # Component tests
      ActiveFilters.test.tsx
  hooks/
    __tests__/
      useDebounce.test.ts            # Hook tests
  server/
    api/
      routers/
        __tests__/
          cost.test.ts               # API tests
```

### Playwright Tests (`.spec.ts`)

```
e2e/
  tests/
    accessibility.spec.ts            # E2E accessibility tests
    auth.spec.ts                     # E2E auth flow tests
```

## Test Environments

Tests automatically use the appropriate environment based on their location:

- **Component tests** (`src/components/**/*.test.tsx`): jsdom environment
- **Hook tests** (`src/hooks/**/*.test.ts`): jsdom environment
- **API tests** (`src/server/**/*.test.ts`): node environment
- **Router tests** (`src/api/**/*.test.ts`): node environment

This is configured in `vitest.config.ts` via `environmentMatchGlobs`.

## Test Database Setup

API tests use a separate test database configured via `NETLIFY_TEST_DATABASE_URL` environment variable.

### Local Development

1. **Environment Variable**: Add the test database URL to your `.env` file:

   ```bash
   NETLIFY_TEST_DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
   ```

2. **Run Migrations** (first time only):

   ```bash
   NODE_ENV=test bun run db:migrate
   ```

3. **Run Tests**:
   ```bash
   bun run test:run
   ```

### Test Database Behavior

- **Isolation**: Each test file gets a fresh database connection
- **Cleanup**: Tests delete all data between runs (except categories)
- **Sequential**: Tests run sequentially to avoid race conditions
- **Same Schema**: Uses the same PostgreSQL schema as production

## Test Isolation

To prevent conflicts between the two test frameworks:

- **Vitest** explicitly **excludes** the `e2e/` directory (via `exclude` config)
- **Playwright** only looks in the `e2e/` directory (via `testDir` config)
- Different file extensions help distinguish them: `.test.ts` for Vitest, `.spec.ts` for Playwright

## Test Results & Reports

### Vitest Results

- **JSON Report**: `test-results/results.json`
- **Coverage**: `coverage/`

### Playwright Results

- **JSON Report**: `test-results/playwright-results.json`
- **HTML Report**: `playwright-report/`
- **Traces**: `.playwright/` (for debugging failures)

All test result directories are git-ignored.

## Writing Tests

### Component Tests

```typescript
import { describe, it, expect, afterEach } from "vitest"
import { render, screen, cleanup } from '@testing-library/react'
import { MyComponent } from '../MyComponent'

describe("MyComponent", () => {
  afterEach(() => {
    cleanup()
  })

  it('renders component', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

### Hook Tests

```typescript
import { describe, it, expect } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { useDebounce } from "../useDebounce"

describe("useDebounce", () => {
  it("debounces value", async () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: "initial" },
    })

    rerender({ value: "updated" })

    await waitFor(() => {
      expect(result.current).toBe("updated")
    })
  })
})
```

### API Tests

```typescript
import { describe, it, expect } from "vitest"
import { appRouter } from "../root"
import { createTestContext } from "@/test/test-db"

describe("resource.create", () => {
  it("creates resource", async () => {
    const ctx = await createTestContext()
    const caller = appRouter.createCaller(ctx)

    const result = await caller.resource.create({ name: "test" })

    expect(result).toMatchObject({ name: "test" })
  })
})
```

## Best Practices

### Writing Vitest Tests

1. Use `cleanup()` from `@testing-library/react` to prevent DOM pollution
2. Add `afterEach(() => cleanup())` in component tests
3. Use container-scoped queries: `within(container).getByText()` instead of `screen.getByText()`
4. Keep tests focused on a single behavior
5. Always import React in component test files (`import React from 'react'`)

### Writing Playwright Tests

1. Wait for `networkidle` before running assertions
2. Use `data-testid` attributes for stable selectors
3. Test accessibility with `@axe-core/playwright`
4. Test keyboard navigation and screen reader compatibility

## Debugging Tests

### View test output

```bash
bun run test:run -- --reporter=verbose
```

### Run tests in UI mode (interactive)

```bash
bun run test:ui
```

### Debug specific test

```bash
bun run test:run -- --testNamePattern="should debounce value"
```

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Run Vitest tests
  run: bun run test:run

- name: Start app for e2e tests
  run: bun run build && bun run start &

- name: Run Playwright tests
  run: bun run test:e2e:run
```

Tests run automatically in GitHub Actions on:

- Pull requests
- Pushes to main branch

The test database URL is stored as a GitHub Actions secret:

- Secret name: `NETLIFY_TEST_DATABASE_URL`
- The workflow automatically uses this secret when running tests

## Troubleshooting

### Issue: `vi is not defined` or `vi.useFakeTimers is not a function`

**Cause:** Running tests with `bun test` instead of Vitest
**Solution:** Use `bun run test` or `bun run test:run`

### Issue: "Failed to resolve import @playwright/test"

This error occurs when Vitest tries to run Playwright e2e tests. The `e2e/` directory should be excluded in `vitest.config.ts`. Verify:

```typescript
exclude: ["**/node_modules/**", "**/e2e/**", "**/dist/**", "**/.next/**"]
```

### Issue: "Found multiple elements" in component tests

This indicates DOM pollution between tests. Ensure:

1. You're importing and calling `cleanup()` in `afterEach()`
2. You're using container-scoped queries: `within(container).getByText()`

### Issue: "React is not defined" in component tests

**Cause:** Missing React import in component or test file
**Solution:** Add `import React from 'react'` at the top of the file

### Issue: Tests timeout waiting for database

**Cause:** Missing `NETLIFY_TEST_DATABASE_URL` environment variable
**Solution:** Ensure `.env` file contains valid test database URL

### Issue: Tests fail with "jsdom not found"

**Cause:** Missing jsdom dependency
**Solution:** Run `bun install` to ensure all dependencies are installed

### Issue: Tests fail with "tables already exist"

The test database has already been migrated. This is normal - tests will use the existing schema.

### Issue: Playwright tests timing out

Make sure:

1. The development server is running (`bun run dev`)
2. The `BASE_URL` environment variable is set correctly
3. Network conditions allow the app to load within the timeout period

### Issue: Slow test performance

First run may be slower due to initial connection setup. Subsequent runs should be faster.

## Integration Tests

For detailed information about manual integration testing procedures including optimistic updates, form validation, network error handling, and toast notifications, see:

- **Integration Test Procedures**: [src/components/**tests**/integration-tests.md](../src/components/__tests__/integration-tests.md)
- **Keyboard Navigation Checklist**: [testing/keyboard-navigation-checklist.md](testing/keyboard-navigation-checklist.md)
- **Screen Reader Testing Guide**: [testing/screen-reader-testing.md](testing/screen-reader-testing.md)

## Related Documentation

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [Database Environment Variables](DATABASE_ENVIRONMENT_VARIABLES.md)
