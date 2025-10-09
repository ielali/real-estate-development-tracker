# Testing Guide

This document explains how to run tests in the Real Estate Portfolio application.

## Test Configuration

This project uses **Vitest** as the test runner, NOT Bun's built-in test runner. The configuration is in `vitest.config.ts`.

### Important: Do NOT use `bun test`

❌ **WRONG:** `bun test`
✅ **CORRECT:** `npm run test` or `npm run test:run`

When you run `bun test`, Bun uses its own test runner which doesn't understand Vitest's globals like `vi`, `describe`, `test`, etc. This causes errors like:

```
TypeError: vi.useFakeTimers is not a function
```

## Running Tests

### Run all tests (watch mode)

```bash
cd apps/web
npm run test
```

### Run all tests once

```bash
cd apps/web
npm run test:run
```

### Run only component/hook tests

```bash
cd apps/web
npm run test:component
```

### Run only API/server tests

```bash
cd apps/web
npm run test:api
```

### Run tests with UI

```bash
cd apps/web
npm run test:ui
```

### Run specific test file

```bash
cd apps/web
npm run test:run src/hooks/__tests__/useDebounce.test.ts
```

## Test Environments

Tests automatically use the appropriate environment based on their location:

- **Component tests** (`src/components/**/*.test.tsx`): jsdom environment
- **Hook tests** (`src/hooks/**/*.test.ts`): jsdom environment
- **API tests** (`src/server/**/*.test.ts`): node environment
- **Router tests** (`src/api/**/*.test.ts`): node environment

This is configured in `vitest.config.ts` via `environmentMatchGlobs`.

## Test Structure

```
apps/web/src/
├── components/
│   └── __tests__/          # Component tests (jsdom)
├── hooks/
│   └── __tests__/          # Hook tests (jsdom)
├── lib/
│   └── __tests__/          # Utility tests (jsdom)
├── server/
│   └── __tests__/          # Server tests (node)
└── test/
    ├── setup.ts            # Global test setup
    └── test-db.ts          # Test database utilities
```

## Writing Tests

### Component Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { MyComponent } from '../MyComponent'

test('renders component', () => {
  render(<MyComponent />)
  expect(screen.getByText('Hello')).toBeInTheDocument()
})
```

### Hook Tests

```typescript
import { renderHook, waitFor } from "@testing-library/react"
import { useDebounce } from "../useDebounce"

test("debounces value", async () => {
  const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
    initialProps: { value: "initial" },
  })

  rerender({ value: "updated" })

  await waitFor(() => {
    expect(result.current).toBe("updated")
  })
})
```

### API Tests

```typescript
import { appRouter } from "../root"
import { createTestContext } from "@/test/test-db"

test("creates resource", async () => {
  const ctx = await createTestContext()
  const caller = appRouter.createCaller(ctx)

  const result = await caller.resource.create({ name: "test" })

  expect(result).toMatchObject({ name: "test" })
})
```

## Test Database

API tests use a separate test database configured via `NEON_TEST_DATABASE_URL` environment variable.

The test database is:

- Automatically cleaned between tests
- Isolated per test via transactions
- Reset after all tests complete

## Debugging Tests

### View test output

```bash
npm run test:run -- --reporter=verbose
```

### Run tests in UI mode (interactive)

```bash
npm run test:ui
```

### Debug specific test

```bash
npm run test:run -- --testNamePattern="should debounce value"
```

## Common Issues

### Issue: `vi is not defined` or `vi.useFakeTimers is not a function`

**Cause:** Running tests with `bun test` instead of Vitest
**Solution:** Use `npm run test` or `npm run test:run`

### Issue: Tests timeout waiting for database

**Cause:** Missing `NEON_TEST_DATABASE_URL` environment variable
**Solution:** Ensure `.env` file contains valid test database URL

### Issue: Tests fail with "jsdom not found"

**Cause:** Missing jsdom dependency
**Solution:** Run `npm install` to ensure all dependencies are installed

## CI/CD

Tests run automatically in GitHub Actions on:

- Pull requests
- Pushes to main branch

CI uses the same test commands and configuration as local development.
