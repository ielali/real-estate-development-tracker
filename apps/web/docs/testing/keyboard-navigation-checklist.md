# Keyboard Navigation Testing Checklist

This document provides comprehensive testing procedures for keyboard navigation across the Real Estate Development Tracker application. All interactive elements must be fully accessible via keyboard to meet WCAG AA accessibility standards.

## Overview

Keyboard navigation is essential for users who cannot use a mouse, including those with motor disabilities and power users who prefer keyboard shortcuts. All functionality must be operable through keyboard alone.

## Core Keyboard Keys

| Key             | Function                                       | Expected Behavior                                      |
| --------------- | ---------------------------------------------- | ------------------------------------------------------ |
| **Tab**         | Move forward through interactive elements      | Focus moves to next focusable element in logical order |
| **Shift + Tab** | Move backward through interactive elements     | Focus moves to previous focusable element              |
| **Enter**       | Activate buttons, links, and submit forms      | Triggers default action of focused element             |
| **Space**       | Activate buttons and toggle checkboxes         | Activates focused button or toggles checkbox state     |
| **Escape**      | Close modals, dialogs, and popover menus       | Dismisses overlay and returns focus to trigger         |
| **Arrow Keys**  | Navigate within composite widgets              | Moves selection in dropdowns, tabs, radio groups       |
| **Home**        | Jump to first item in a list or start of input | Moves to beginning of context                          |
| **End**         | Jump to last item in a list or end of input    | Moves to end of context                                |

## Tab Order Testing

### General Tab Order Requirements

- [ ] Tab order follows visual layout (left-to-right, top-to-bottom)
- [ ] Skip to main content link appears first on Tab
- [ ] Navigation menu items appear in logical order
- [ ] Form fields follow natural reading order
- [ ] Focus never gets trapped (except in modals - see below)
- [ ] Hidden elements are not in tab order
- [ ] Disabled elements are not in tab order

### Testing Procedure: Global Navigation

1. Load any page in the application
2. Press **Tab** from the top of the page
3. Verify tab order:
   - [ ] First focus: "Skip to main content" link (if present)
   - [ ] Second focus: Logo or home link
   - [ ] Next: Main navigation menu items in visual order
   - [ ] Next: User menu / authentication controls
   - [ ] Next: Main content area interactive elements
   - [ ] Last: Footer links (if present)

### Testing Procedure: Forms

**Form: Sign In (`/auth/sign-in`)**

1. Navigate to sign in page
2. Press **Tab** to enter form
3. Verify tab order:
   - [ ] Email input field
   - [ ] Password input field
   - [ ] "Remember me" checkbox (if present)
   - [ ] "Sign In" submit button
   - [ ] "Forgot password?" link (if present)
   - [ ] "Sign up" link
4. Press **Shift + Tab** to verify reverse order

**Form: Project Creation**

1. Navigate to project creation form
2. Press **Tab** through all form fields
3. Verify tab order:
   - [ ] Project name input
   - [ ] Address autocomplete input
   - [ ] Start date picker
   - [ ] Project type select/dropdown
   - [ ] Other optional fields in logical order
   - [ ] Submit button
   - [ ] Cancel button

**Form: Cost Entry**

1. Navigate to cost entry form
2. Verify tab order:
   - [ ] Supplier input
   - [ ] Amount input
   - [ ] Date picker
   - [ ] Category select
   - [ ] Notes textarea
   - [ ] Submit button

## Focus Management

### Focus Indicators

- [ ] All focusable elements have visible focus indicator
- [ ] Focus indicator has sufficient contrast (3:1 ratio minimum)
- [ ] Focus indicator is at least 2px thick or equivalent
- [ ] Focus indicator works on all color themes (light/dark)
- [ ] Focus indicator animates smoothly (if animated)
- [ ] Custom components show focus as clearly as native elements

### Focus Restoration

**After Modal Close:**

- [ ] Focus returns to element that opened the modal
- [ ] Focus is visible and indicated clearly
- [ ] No focus loss or reset to top of page

**After Navigation:**

- [ ] Focus moves to logical starting point (skip link or heading)
- [ ] Back button returns focus to triggering link

**After Delete/Remove Actions:**

- [ ] Focus moves to next item in list
- [ ] If last item deleted, focus moves to previous item
- [ ] If list becomes empty, focus moves to "Add" button or empty state

## Modal and Dialog Testing

### Modal Focus Trap

**Opening a Modal:**

1. Click/activate button to open modal
2. Press **Tab**
3. Verify:
   - [ ] Focus moves to first interactive element in modal
   - [ ] Focus stays within modal (doesn't leak to background page)
   - [ ] **Tab** cycles through modal elements only
   - [ ] **Shift + Tab** from first element moves to last element
   - [ ] **Tab** from last element moves to first element

**Closing a Modal:**

- [ ] **Escape** key closes modal
- [ ] Close button (X) is keyboard accessible
- [ ] "Cancel" or "Close" button is keyboard accessible
- [ ] Background overlay click closes modal (if designed that way)
- [ ] Focus returns to trigger element after close

**Form Submission in Modal:**

- [ ] **Enter** on text input submits form (if single-line)
- [ ] **Enter** on submit button submits form
- [ ] Form validation errors are announced and focusable
- [ ] Success closes modal and returns focus appropriately

### Popover/Dropdown Menu Testing

**Opening Dropdown:**

1. Tab to dropdown trigger button
2. Press **Enter** or **Space**
3. Verify:
   - [ ] Dropdown opens
   - [ ] Focus moves to first menu item
   - [ ] **Arrow Down** moves to next item
   - [ ] **Arrow Up** moves to previous item
   - [ ] **Home** jumps to first item
   - [ ] **End** jumps to last item
   - [ ] **Escape** closes dropdown and returns focus to trigger
   - [ ] **Tab** closes dropdown and moves focus forward
   - [ ] **Enter** on menu item activates it and closes dropdown

## Interactive Component Testing

### Buttons

- [ ] **Enter** activates button
- [ ] **Space** activates button
- [ ] Disabled buttons are not in tab order
- [ ] Loading state buttons remain focusable but don't activate
- [ ] Icon-only buttons have accessible labels

### Links

- [ ] **Enter** follows link
- [ ] Links are distinguishable from buttons (by role and behavior)
- [ ] External links indicate they open in new window (if applicable)
- [ ] Disabled links are not in tab order

### Checkboxes and Radio Buttons

**Checkboxes:**

- [ ] **Space** toggles checked state
- [ ] **Enter** does NOT toggle (avoids accidental form submission)
- [ ] Label is clickable and focusable
- [ ] Checked state is announced by screen readers

**Radio Button Groups:**

- [ ] **Tab** enters group (focuses selected item or first item)
- [ ] **Arrow Keys** move selection within group
- [ ] **Arrow Up/Left** moves to previous option
- [ ] **Arrow Down/Right** moves to next option
- [ ] Selection wraps (last to first, first to last)
- [ ] **Space** selects focused option
- [ ] **Tab** exits group

### Select Dropdowns (Custom)

**Shadcn/ui Select Component:**

1. Tab to select trigger
2. Press **Enter** or **Space**
3. Verify:
   - [ ] Dropdown opens
   - [ ] Focus moves to selected option (or first option)
   - [ ] **Arrow Keys** navigate options
   - [ ] **Enter** selects option and closes dropdown
   - [ ] **Escape** closes without selecting
   - [ ] **Type-ahead** works (typing first letter jumps to option)

### Date Pickers

- [ ] **Tab** enters date picker input
- [ ] Typing date in input field works
- [ ] **Enter** or icon button opens calendar popup
- [ ] **Arrow Keys** navigate calendar days
- [ ] **Page Up/Down** change months
- [ ] **Home** jumps to first day of week
- [ ] **End** jumps to last day of week
- [ ] **Enter** selects date and closes picker
- [ ] **Escape** closes picker without selecting

### Tables and Data Grids

- [ ] **Tab** moves through interactive elements in table
- [ ] **Arrow Keys** navigate cells (if grid is interactive)
- [ ] Row actions (edit, delete) are keyboard accessible
- [ ] Sortable column headers are keyboard accessible
- [ ] Pagination controls are keyboard accessible

### Tabs

**Tab Panel Component:**

1. Tab to tab list
2. Verify:
   - [ ] **Arrow Left/Right** switches between tabs
   - [ ] **Home** jumps to first tab
   - [ ] **End** jumps to last tab
   - [ ] **Tab** moves from tab list to tab panel content
   - [ ] Selected tab is indicated visually and to screen readers

## Skip Links

### Skip to Main Content

- [ ] Skip link appears on first **Tab** press
- [ ] Skip link is visually obvious (not hidden off-screen when focused)
- [ ] **Enter** on skip link moves focus to main content
- [ ] Main content has `id="main"` or similar target
- [ ] Skip link bypasses repetitive navigation

### Additional Skip Links (Optional)

- [ ] Skip to navigation
- [ ] Skip to search
- [ ] Skip to footer

## Error Handling and Validation

### Form Validation Errors

**Triggering Errors:**

1. Submit form with invalid data
2. Verify:
   - [ ] Focus moves to first field with error
   - [ ] Error message is visible and associated with field
   - [ ] Error message is announced by screen reader
   - [ ] **Tab** can navigate through all error messages
   - [ ] Fixing error removes error message and updates state

### Live Region Announcements

- [ ] Success messages are announced (e.g., "Project created")
- [ ] Error messages are announced (e.g., "Failed to save")
- [ ] Loading states are announced (e.g., "Loading projects")
- [ ] Dynamic content changes are announced appropriately

## Page Load and Navigation

### Page Load

- [ ] Focus starts at skip link or main heading
- [ ] Focus is visible (not hidden or off-screen)
- [ ] User can immediately start navigating with keyboard

### Single Page App Navigation

- [ ] Route changes move focus to new page heading or skip link
- [ ] Back button navigation restores focus appropriately
- [ ] Loading states don't lose focus
- [ ] Focus is never reset to `<body>` unintentionally

## Touch and Mobile Considerations

While keyboard testing focuses on desktop, these items ensure keyboard-like interactions work on mobile:

- [ ] All interactive elements have minimum 44x44px touch target
- [ ] Touch interactions don't break focus management
- [ ] Mobile navigation menu is keyboard accessible when open
- [ ] Mobile forms work with hardware keyboards (tablets, Bluetooth keyboards)

## Testing Environments

### Browsers to Test

- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (macOS/iOS)

### Operating Systems

- [ ] Windows 10/11
- [ ] macOS
- [ ] Linux (optional but recommended)

### Assistive Technologies

While this is a keyboard checklist, test with these tools for comprehensive coverage:

- [ ] NVDA (Windows screen reader)
- [ ] JAWS (Windows screen reader)
- [ ] VoiceOver (macOS/iOS screen reader)
- [ ] Dragon NaturallySpeaking (voice control)

## Common Issues Checklist

### Anti-Patterns to Avoid

- [ ] ❌ Focus is not visible (insufficient contrast or missing indicator)
- [ ] ❌ Tab order is illogical (jumps around the page)
- [ ] ❌ Focus gets trapped in component without escape
- [ ] ❌ Modals don't trap focus (Tab escapes to background page)
- [ ] ❌ Custom components are not keyboard accessible
- [ ] ❌ Focus is lost after dynamic content updates
- [ ] ❌ Disabled elements interfere with tab order
- [ ] ❌ **Enter** key causes unexpected behavior
- [ ] ❌ Arrow keys don't work in composite widgets
- [ ] ❌ Focus is programmatically moved without user action

## Automated Testing

While manual testing is essential, supplement with automated checks:

- [ ] Run axe-core accessibility scanner
- [ ] Check focus order with browser dev tools
- [ ] Use Lighthouse accessibility audit
- [ ] Test with Playwright keyboard navigation tests (see `apps/web/e2e/tests/accessibility.spec.ts`)

## Reporting Issues

When reporting keyboard navigation issues, include:

1. **Page/Component:** Where the issue occurs
2. **Steps to Reproduce:** Exact keyboard sequence to trigger issue
3. **Expected Behavior:** What should happen
4. **Actual Behavior:** What actually happens
5. **Browser/OS:** Testing environment
6. **Severity:** Blocker (feature unusable), Major (significant barrier), Minor (cosmetic)

## Approval Criteria

Before marking keyboard navigation as complete:

- [ ] All critical user flows are fully keyboard accessible
- [ ] No focus traps (except intentional modal traps)
- [ ] All interactive elements are reachable via keyboard
- [ ] Focus indicators are clearly visible on all elements
- [ ] Tab order is logical and intuitive
- [ ] Modal focus management works correctly
- [ ] Skip links function properly
- [ ] Form validation and errors are keyboard accessible
- [ ] No critical issues remain

---

**Last Updated:** 2025-10-11
**Review Cadence:** After any major UI changes or new component additions
**Owner:** Development & QA Teams
