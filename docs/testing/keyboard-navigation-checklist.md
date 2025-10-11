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

**Form: Sign In**

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
3. Verify tab order includes all fields in logical order

## Focus Management

### Focus Indicators

- [ ] All focusable elements have visible focus indicator
- [ ] Focus indicator has sufficient contrast (3:1 ratio minimum)
- [ ] Focus indicator is at least 2px thick or equivalent
- [ ] Focus indicator works on all color themes (light/dark)

### Focus Restoration

**After Modal Close:**

- [ ] Focus returns to element that opened the modal
- [ ] Focus is visible and indicated clearly
- [ ] No focus loss or reset to top of page

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
- [ ] Focus returns to trigger element after close

## Interactive Component Testing

### Buttons

- [ ] **Enter** activates button
- [ ] **Space** activates button
- [ ] Disabled buttons are not in tab order

### Links

- [ ] **Enter** follows link
- [ ] Links are distinguishable from buttons

### Checkboxes and Radio Buttons

**Checkboxes:**

- [ ] **Space** toggles checked state
- [ ] **Enter** does NOT toggle (avoids accidental form submission)

**Radio Button Groups:**

- [ ] **Tab** enters group (focuses selected item or first item)
- [ ] **Arrow Keys** move selection within group
- [ ] **Space** selects focused option
- [ ] **Tab** exits group

### Select Dropdowns

**Custom Select Component:**

1. Tab to select trigger
2. Press **Enter** or **Space**
3. Verify:
   - [ ] Dropdown opens
   - [ ] Focus moves to selected option (or first option)
   - [ ] **Arrow Keys** navigate options
   - [ ] **Enter** selects option and closes dropdown
   - [ ] **Escape** closes without selecting

## Approval Criteria

Before marking keyboard navigation as complete:

- [ ] All critical user flows are fully keyboard accessible
- [ ] No focus traps (except intentional modal traps)
- [ ] All interactive elements are reachable via keyboard
- [ ] Focus indicators are clearly visible on all elements
- [ ] Tab order is logical and intuitive
- [ ] Modal focus management works correctly
- [ ] No critical issues remain

---

**Last Updated:** 2025-10-11
**Review Cadence:** After any major UI changes or new component additions
**Owner:** Development & QA Teams
