# Integration Tests for Error Handling & Loading States

This document outlines integration tests that verify optimistic updates, form validation, network error handling, and toast notifications. These tests require manual verification or future automated integration testing with MSW (Mock Service Worker) or Playwright.

## Optimistic Updates Tests

### Cost Deletion Optimistic Update

**Test Scenario**: Verify that cost deletion shows immediate UI update and rolls back on error

**Manual Test Steps**:

1. Navigate to a project with costs
2. Click delete on a cost entry
3. Verify cost is immediately removed from UI (optimistic update)
4. Simulate network failure (DevTools offline mode)
5. Try to delete another cost
6. Verify:
   - Cost is removed immediately from UI
   - Error toast appears
   - Cost is restored to list (rollback)

**Expected Behavior**:

- Optimistic update removes cost from UI instantly
- On error, previous state is restored
- Toast notification shows success/error feedback

### Cost Creation Optimistic Update

**Test Scenario**: Verify cost creation shows immediate feedback

**Manual Test Steps**:

1. Navigate to cost creation form
2. Fill in cost details
3. Submit form
4. Verify:
   - Form shows loading state
   - Success toast appears
   - Redirected to project page
   - New cost appears in list

**Expected Behavior**:

- Loading spinner shows during submission
- Toast confirms successful creation
- Cost list updates with new entry

### Cost Update Optimistic Update

**Test Scenario**: Verify cost updates show immediate feedback and rollback on error

**Manual Test Steps**:

1. Navigate to cost edit form
2. Modify cost details
3. Submit form
4. Verify success flow
5. Simulate error and verify rollback

**Expected Behavior**:

- Optimistic update shows changes immediately
- Error triggers rollback to previous state
- Toast notifications for success/error

## Form Validation Error Display Tests

### Cost Entry Form Validation

**Test Scenario**: Verify all form fields show validation errors correctly

**Manual Test Steps**:

1. Navigate to cost creation form
2. Try to submit with empty description
3. Verify: Error message "Description is required" appears below field
4. Enter invalid amount (negative number)
5. Verify: Error message "Amount must be positive" appears
6. Test each field:
   - Description (required, min length)
   - Amount (required, positive number)
   - Date (required, valid date)
   - Category (optional)

**Expected Behavior**:

- Field-level errors display below each input
- Error messages use aria-describedby for accessibility
- Submit button disabled when form is invalid
- Errors clear when field is corrected

### Project Form Validation

**Test Scenario**: Verify project form validation works correctly

**Manual Test Steps**:

1. Navigate to project creation form
2. Test required fields:
   - Name (required, min length)
   - Address (required)
3. Verify error messages display correctly
4. Verify submit button disabled state

**Expected Behavior**:

- Clear validation messages for each field
- Accessible error announcements
- Form cannot submit with errors

## Network Error Handling Tests

### Query Failure with Retry

**Test Scenario**: Verify network errors show error state with retry option

**Manual Test Steps**:

1. Enable DevTools offline mode
2. Navigate to projects page
3. Verify:
   - ErrorState component displays
   - "Try Again" button appears
   - User-friendly error message shows
4. Go back online
5. Click "Try Again" button
6. Verify:
   - Projects load successfully
   - Error state is replaced with data

**Expected Behavior**:

- ErrorState component shows on network failure
- Retry button triggers refetch
- Success replaces error state

### Mutation Failure Handling

**Test Scenario**: Verify mutation errors show appropriate feedback

**Manual Test Steps**:

1. Try to create a cost with invalid data (server validation error)
2. Verify:
   - Error toast appears with message
   - Form remains populated with user input
   - User can correct and retry
3. Simulate network timeout
4. Verify:
   - Error toast shows timeout message
   - Form state preserved
   - Retry logic attempts up to 3 times

**Expected Behavior**:

- Clear error messages for different error types
- User input preserved on error
- Automatic retry for transient errors

## Toast Notification Accessibility Tests

### Screen Reader Announcements

**Test Scenario**: Verify toast notifications are announced to screen readers

**Manual Test Steps** (requires screen reader):

1. Enable screen reader (NVDA/JAWS/VoiceOver)
2. Perform action that triggers success toast (create cost)
3. Verify: Screen reader announces "Cost added successfully"
4. Perform action that triggers error toast (delete with network error)
5. Verify: Screen reader announces error message

**Expected Behavior**:

- Sonner toasts automatically announced via aria-live regions
- Success and error toasts distinguishable by screen reader
- Toast message content is clear and concise

### Keyboard Dismissal

**Test Scenario**: Verify toasts can be dismissed with keyboard

**Manual Test Steps**:

1. Trigger a toast notification
2. Press Escape key
3. Verify: Toast is dismissed
4. Verify: Focus returns to appropriate element

**Expected Behavior**:

- Escape key dismisses active toast
- Focus management works correctly
- No keyboard traps

## Offline State Detection Tests

### Offline Banner Display

**Test Scenario**: Verify offline banner appears when network is unavailable

**Manual Test Steps**:

1. Application loads in online state
2. Verify: No offline banner visible
3. Enable DevTools offline mode
4. Verify:
   - Offline banner appears at top of page
   - Banner message: "You are currently offline..."
   - Banner is sticky and always visible
5. Go back online
6. Verify: Banner disappears

**Expected Behavior**:

- useOnlineStatus hook detects offline state
- OfflineBanner component renders when offline
- Banner provides clear messaging about limitations
- Banner auto-hides when back online

### Feature Degradation When Offline

**Test Scenario**: Verify network-dependent features handle offline state gracefully

**Manual Test Steps**:

1. Go offline
2. Try to create/edit/delete cost
3. Verify:
   - Mutation fails with error toast
   - Error message indicates offline state
   - No data corruption occurs
4. Go back online
5. Verify: All features work normally

**Expected Behavior**:

- Offline mutations fail gracefully
- Error messages explain offline state
- No partial or corrupt data saved
- Retry logic works when back online

## Automated Test Implementation Notes

### Future Implementation with Playwright

For full integration testing, consider implementing with Playwright:

\`\`\`typescript
// Example Playwright test for optimistic updates
test('cost deletion with rollback on error', async ({ page }) => {
await page.goto('/projects/123')

// Mock network to fail delete request
await page.route('\*_/api/trpc/costs.softDelete_', route => {
route.abort()
})

// Click delete
await page.click('[data-testid="delete-cost-btn"]')

// Verify optimistic update (cost removed)
await expect(page.locator('[data-testid="cost-item"]')).toHaveCount(2)

// Verify rollback (cost restored)
await expect(page.locator('[data-testid="cost-item"]')).toHaveCount(3)

// Verify error toast
await expect(page.locator('.sonner-toast')).toContainText('Failed to delete')
})
\`\`\`

### Future Implementation with MSW

For component-level integration tests with tRPC mocking:

\`\`\`typescript
// Example MSW setup for tRPC
import { setupServer } from 'msw/node'
import { trpcMsw } from '@trpc/msw'

const server = setupServer(
trpcMsw.costs.softDelete.mutation(() => {
throw new Error('Network error')
})
)

test('optimistic update rollback', async () => {
// Test with MSW intercepting tRPC calls
})
\`\`\`

## Test Coverage Summary

✅ **Implemented Unit Tests**:

- ErrorBoundary component
- Skeleton components (ProjectListSkeleton, CostListSkeleton)
- useOnlineStatus hook
- EmptyState component
- ErrorState component

📝 **Manual Integration Tests** (documented above):

- Optimistic updates with rollback
- Form validation error display
- Network error handling with retry
- Toast notification accessibility
- Offline state detection

🔮 **Future Automated Integration Tests** (requires setup):

- Playwright end-to-end tests
- MSW-based tRPC integration tests
- Visual regression tests for error states
