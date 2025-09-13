# Testing Strategy

## Testing Pyramid

```
                E2E Tests (Playwright)
               /                    \
          Integration Tests (API)
             /                  \
        Frontend Unit Tests  Backend Unit Tests
            (Vitest)            (Vitest)
```

## Test Organization

**Frontend Tests:**
```
src/components/__tests__/
src/hooks/__tests__/
src/lib/__tests__/
e2e/tests/
```

**Backend Tests:**
```
src/server/__tests__/
src/lib/__tests__/
integration/api/__tests__/
```

**E2E Tests:**
```
e2e/
├── tests/
│   ├── cost-entry.spec.ts
│   ├── partner-dashboard.spec.ts
│   └── auth-flow.spec.ts
└── fixtures/
```

## Test Examples

**Frontend Component Test:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { CostEntry } from '../CostEntry';

test('submits cost entry with valid data', async () => {
  const onSuccess = vi.fn();
  render(<CostEntry projectId="123" onSuccess={onSuccess} />);
  
  fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '150.00' } });
  fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Materials' } });
  fireEvent.click(screen.getByRole('button', { name: /save/i }));
  
  await waitFor(() => expect(onSuccess).toHaveBeenCalled());
});
```

**Backend API Test:**
```typescript
import { createTRPCMsw } from 'msw-trpc';
import { appRouter } from '../server/routers/_app';

const trpcMsw = createTRPCMsw(appRouter);

test('creates cost with valid input', async () => {
  const caller = appRouter.createCaller(mockContext);
  
  const result = await caller.costs.quickAdd({
    projectId: 'project-123',
    amount: 15000,
    description: 'Plumbing materials',
    categoryId: 'materials',
    date: new Date(),
  });
  
  expect(result).toMatchObject({
    amount: 15000,
    description: 'Plumbing materials',
  });
});
```

**E2E Test:**
```typescript
import { test, expect } from '@playwright/test';

test('cost entry flow on mobile', async ({ page }) => {
  await page.goto('/projects/123');
  await page.getByRole('button', { name: 'Add Cost' }).click();
  
  await page.fill('[data-testid=amount-input]', '150.00');
  await page.fill('[data-testid=description-input]', 'Building materials');
  await page.selectOption('[data-testid=category-select]', 'materials');
  
  await page.getByRole('button', { name: 'Save Cost' }).click();
  
  await expect(page.getByText('Cost added successfully')).toBeVisible();
});
```
