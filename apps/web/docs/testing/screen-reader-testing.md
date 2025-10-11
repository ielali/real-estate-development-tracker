# Screen Reader Testing Guide

This document provides comprehensive procedures for testing the Real Estate Development Tracker application with screen readers. Screen reader compatibility is essential for blind and visually impaired users to access and use the application effectively.

## Overview

Screen readers convert on-screen content to speech or Braille output, enabling users who cannot see the screen to navigate and interact with web applications. Proper semantic HTML, ARIA attributes, and logical content structure are critical for screen reader accessibility.

## Screen Reader Tools

### Primary Screen Readers

| Screen Reader | Platform  | Cost               | Recommendation                          |
| ------------- | --------- | ------------------ | --------------------------------------- |
| **NVDA**      | Windows   | Free (open source) | **Primary testing tool for Windows**    |
| **JAWS**      | Windows   | Paid ($1000+)      | Secondary testing (enterprise standard) |
| **VoiceOver** | macOS/iOS | Free (built-in)    | **Primary testing tool for macOS/iOS**  |
| **TalkBack**  | Android   | Free (built-in)    | Mobile testing                          |
| **Narrator**  | Windows   | Free (built-in)    | Basic testing only                      |

### Recommended Testing Setup

**Minimum Testing:**

- NVDA on Windows (free, widely used)
- VoiceOver on macOS (built-in, Apple ecosystem)

**Comprehensive Testing:**

- NVDA on Windows
- JAWS on Windows
- VoiceOver on macOS
- VoiceOver on iOS (Safari)
- TalkBack on Android (Chrome)

## NVDA Testing (Windows)

### Installation and Setup

1. Download NVDA from [nvaccess.org](https://www.nvaccess.org/)
2. Install and launch NVDA
3. NVDA will start speaking immediately

### Basic NVDA Commands

| Command       | Action                          |
| ------------- | ------------------------------- |
| **NVDA + Q**  | Quit NVDA                       |
| **NVDA + S**  | Toggle speech mode (speech/off) |
| **Insert**    | NVDA modifier key (default)     |
| **Caps Lock** | Alternative NVDA modifier key   |
| **NVDA + N**  | Open NVDA menu                  |
| **NVDA + F1** | Help on focused element         |

### Navigation Commands

| Command               | Action                                       |
| --------------------- | -------------------------------------------- |
| **Down Arrow**        | Read next line                               |
| **Up Arrow**          | Read previous line                           |
| **Ctrl**              | Stop reading                                 |
| **NVDA + Down Arrow** | Say all (read from current position to end)  |
| **Tab**               | Next focusable element                       |
| **Shift + Tab**       | Previous focusable element                   |
| **H**                 | Next heading                                 |
| **Shift + H**         | Previous heading                             |
| **1-6**               | Jump to heading level (1 = h1, 2 = h2, etc.) |
| **K**                 | Next link                                    |
| **Shift + K**         | Previous link                                |
| **E**                 | Next edit field (input)                      |
| **Shift + E**         | Previous edit field                          |
| **B**                 | Next button                                  |
| **Shift + B**         | Previous button                              |
| **F**                 | Next form field                              |
| **Shift + F**         | Previous form field                          |
| **T**                 | Next table                                   |
| **Shift + T**         | Previous table                               |
| **L**                 | Next list                                    |
| **Shift + L**         | Previous list                                |
| **I**                 | Next list item                               |
| **Shift + I**         | Previous list item                           |

### NVDA Testing Procedure

**Test: Homepage (`/`)**

1. Launch NVDA
2. Open browser and navigate to homepage
3. Press **NVDA + Down Arrow** to read entire page
4. Verify:
   - [ ] Page title is announced
   - [ ] Landmarks are announced (navigation, main, footer)
   - [ ] Headings are announced with level (e.g., "Heading level 1: Welcome")
   - [ ] Links are announced as "link: [text]"
   - [ ] Buttons are announced as "button: [text]"
   - [ ] Images have alt text announced
   - [ ] No "unlabeled" or "clickable" without context

5. Press **H** to navigate by headings
6. Verify:
   - [ ] All major sections have headings
   - [ ] Heading hierarchy is logical (h1 → h2 → h3, no skips)
   - [ ] Headings describe content accurately

7. Press **K** to navigate by links
8. Verify:
   - [ ] All links have descriptive text (not "click here" or "read more")
   - [ ] Link purpose is clear from text alone
   - [ ] External links indicate they open externally

**Test: Navigation Menu**

1. Tab to main navigation menu
2. Verify:
   - [ ] Navigation landmark is announced: "navigation"
   - [ ] Menu items are announced as links
   - [ ] Current page is indicated (e.g., "current page: Projects")
   - [ ] Submenu structure is clear (if submenus exist)

**Test: Sign In Form (`/auth/sign-in`)**

1. Navigate to sign in page
2. Press **F** to jump to first form field
3. Verify:
   - [ ] Form landmark is announced: "form"
   - [ ] Each input has clear label: "edit, Email"
   - [ ] Required fields are announced: "required"
   - [ ] Input type is announced: "edit" (text), "password" (password)
   - [ ] Placeholder text is announced (if present)
   - [ ] Helper text is announced with aria-describedby

4. Enter invalid data and submit
5. Verify:
   - [ ] Error messages are announced immediately
   - [ ] Error messages are associated with fields
   - [ ] Focus moves to first error field
   - [ ] Error summary is available (if multiple errors)

6. Tab to submit button
7. Verify:
   - [ ] Button is announced: "button, Sign In"
   - [ ] Button state is clear (enabled/disabled)
   - [ ] Loading state is announced: "button, busy, Signing in..."

**Test: Project List (`/projects`)**

1. Navigate to projects page
2. Press **T** to find table (if projects in table)
3. Verify:
   - [ ] Table is announced: "table with X rows"
   - [ ] Table caption/title is announced
   - [ ] Column headers are read when navigating cells
   - [ ] Row and column position is announced

4. Press **L** to find list (if projects in list)
5. Verify:
   - [ ] List is announced: "list with X items"
   - [ ] Each list item is announced clearly
   - [ ] Nested lists are announced correctly

6. Test interactive elements in list/table
7. Verify:
   - [ ] Action buttons are labeled clearly: "Edit project ABC", not just "Edit"
   - [ ] Delete confirmations are announced
   - [ ] Success/error messages are announced in live region

**Test: Modal Dialogs**

1. Open a modal (e.g., create project)
2. Verify:
   - [ ] Dialog role is announced: "dialog"
   - [ ] Dialog title is announced
   - [ ] Focus moves into dialog
   - [ ] Background content is hidden from screen reader
   - [ ] Modal content is fully accessible

3. Close modal with Escape
4. Verify:
   - [ ] Closure is announced or focus returns to trigger
   - [ ] No "ghost" focus on closed modal

**Test: Dynamic Content Updates**

1. Trigger an action that updates content (e.g., add cost entry)
2. Verify:
   - [ ] New content is announced: "Cost entry added"
   - [ ] Live region announces change (aria-live)
   - [ ] Focus management is appropriate
   - [ ] Loading states are announced: "loading projects"

## VoiceOver Testing (macOS)

### Activation and Setup

1. **Enable VoiceOver:** Cmd + F5 or System Settings → Accessibility → VoiceOver
2. VoiceOver will start speaking and showing the VoiceOver cursor (black rectangle)

### Basic VoiceOver Commands

| Command            | Action                                     |
| ------------------ | ------------------------------------------ |
| **Cmd + F5**       | Toggle VoiceOver on/off                    |
| **VO**             | VoiceOver modifier keys (Control + Option) |
| **VO + H**         | VoiceOver help menu                        |
| **VO + Shift + ?** | VoiceOver commands help                    |

### Navigation Commands

| Command                  | Action                         |
| ------------------------ | ------------------------------ |
| **VO + Right Arrow**     | Next item                      |
| **VO + Left Arrow**      | Previous item                  |
| **VO + A**               | Read all from current position |
| **Control**              | Stop reading                   |
| **Tab**                  | Next focusable element         |
| **Shift + Tab**          | Previous focusable element     |
| **VO + Cmd + H**         | Next heading                   |
| **VO + Cmd + Shift + H** | Previous heading               |
| **VO + Cmd + L**         | Next link                      |
| **VO + Cmd + Shift + L** | Previous link                  |
| **VO + Cmd + J**         | Next form control              |
| **VO + Cmd + Shift + J** | Previous form control          |
| **VO + Space**           | Activate link or button        |

### VoiceOver Rotor

The rotor provides quick navigation by element type:

1. Press **VO + U** to open rotor
2. Use **Left/Right Arrow** to switch categories (headings, links, form controls, landmarks)
3. Use **Up/Down Arrow** to navigate within category
4. Press **Enter** to jump to selected element

### VoiceOver Testing Procedure

**Test: Homepage with VoiceOver**

1. Enable VoiceOver (Cmd + F5)
2. Navigate to homepage in Safari
3. Press **VO + A** to read entire page
4. Verify all content from NVDA testing above applies

5. Press **VO + U** to open rotor
6. Select "Headings" with arrows
7. Verify:
   - [ ] All headings appear in rotor
   - [ ] Heading levels are correct
   - [ ] Heading text is descriptive

8. Switch rotor to "Links"
9. Verify:
   - [ ] All links are listed
   - [ ] Link text is descriptive
   - [ ] Links are organized logically

10. Switch rotor to "Form Controls"
11. Verify:
    - [ ] All form controls are listed
    - [ ] Controls are labeled clearly
    - [ ] Required fields are indicated

**Test: Landmarks and Regions**

1. Press **VO + U** and navigate to "Landmarks"
2. Verify presence of:
   - [ ] Banner (header)
   - [ ] Navigation
   - [ ] Main content
   - [ ] Complementary (aside/sidebar)
   - [ ] Contentinfo (footer)

3. Navigate to each landmark
4. Verify:
   - [ ] Landmark is announced when entering
   - [ ] Landmark has appropriate label (if multiple of same type)
   - [ ] Content within landmark is accessible

## VoiceOver Testing (iOS)

### Activation

1. **Settings → Accessibility → VoiceOver → On**
2. Or triple-click side/home button (if set up as accessibility shortcut)

### Basic iOS VoiceOver Gestures

| Gesture                           | Action                 |
| --------------------------------- | ---------------------- |
| **Single tap**                    | Select and speak item  |
| **Double tap**                    | Activate selected item |
| **Swipe right**                   | Next item              |
| **Swipe left**                    | Previous item          |
| **Two-finger swipe down**         | Read all from top      |
| **Two-finger tap**                | Pause/resume reading   |
| **Three-finger swipe left/right** | Scroll page            |
| **Rotor: Two-finger rotate**      | Change navigation mode |

### iOS Testing Procedure

1. Enable VoiceOver in Settings
2. Open Safari and navigate to homepage
3. Swipe right to navigate through all elements
4. Verify mobile-specific considerations:
   - [ ] Touch targets are large enough (44x44px minimum)
   - [ ] Swipe navigation works smoothly
   - [ ] Modal focus trap works with swipe gestures
   - [ ] Form inputs work with on-screen keyboard
   - [ ] Live region announcements work on mobile

## Semantic HTML Requirements

### Required HTML5 Elements

Use semantic HTML elements for proper screen reader interpretation:

```html
✅ Correct Semantic HTML
<nav aria-label="Main navigation">...</nav>
<main id="main-content">...</main>
<article>...</article>
<section aria-labelledby="section-heading">...</section>
<aside aria-label="Related information">...</aside>
<footer>...</footer>
<button type="button">Submit</button>
<a href="/projects">View Projects</a>
<h1>Page Title</h1>
<h2>Section Title</h2>

❌ Incorrect Non-Semantic HTML
<div class="nav">...</div>
<!-- Should be <nav> -->
<div class="main">...</div>
<!-- Should be <main> -->
<div class="button" onclick="...">...</div>
<!-- Should be <button> -->
<span class="link" onclick="...">...</span>
<!-- Should be <a> -->
<div class="heading">Title</div>
<!-- Should be <h1>, <h2>, etc. -->
```

### Heading Hierarchy

- Use only one `<h1>` per page (page title)
- Follow sequential heading levels (don't skip from h1 to h3)
- Headings should describe the content that follows

```html
✅ Correct Heading Hierarchy
<h1>Real Estate Development Tracker</h1>
<h2>Your Projects</h2>
<h3>Residential Projects</h3>
<h3>Commercial Projects</h3>
<h2>Recent Activity</h2>

❌ Incorrect Heading Hierarchy
<h1>Real Estate Development Tracker</h1>
<h3>Your Projects</h3>
<!-- Skipped h2 -->
<h2>Residential</h2>
<!-- Out of order -->
```

## ARIA Attributes for Screen Readers

### ARIA Labels

Use ARIA labels for elements that need accessible names:

```html
<!-- Icon-only buttons -->
<button aria-label="Close modal">
  <XIcon />
</button>

<!-- Search input -->
<input type="search" aria-label="Search projects" />

<!-- Landmark with multiple instances -->
<nav aria-label="Main navigation">...</nav>
<nav aria-label="Breadcrumb navigation">...</nav>
```

### ARIA Describedby

Associate helper text and errors with form fields:

```html
<label for="email">Email</label>
<input id="email" type="email" aria-describedby="email-hint email-error" />
<span id="email-hint">We'll never share your email</span>
<span id="email-error" role="alert">Email is required</span>
```

### ARIA Live Regions

Announce dynamic content changes to screen readers:

```html
<!-- Polite: Announce when user is idle -->
<div aria-live="polite" aria-atomic="true">
  <p>3 new projects added</p>
</div>

<!-- Assertive: Interrupt and announce immediately -->
<div aria-live="assertive" role="alert">
  <p>Error: Failed to save project</p>
</div>

<!-- Status: For non-critical updates -->
<div role="status" aria-live="polite">
  <p>Loading projects...</p>
</div>
```

### ARIA Required

Mark required form fields:

```html
<label for="project-name"> Project Name <span aria-label="required">*</span> </label>
<input id="project-name" type="text" required aria-required="true" />
```

### ARIA Hidden

Hide decorative elements from screen readers:

```html
<!-- Decorative icon -->
<span aria-hidden="true">
  <DecorativeIcon />
</span>

<!-- Background pattern -->
<div aria-hidden="true" class="background-pattern"></div>
```

## Form Accessibility Testing

### Form Field Labels

Every form field must have an accessible label:

**Method 1: Explicit Label (Recommended)**

```html
<label for="username">Username</label> <input id="username" type="text" />
```

**Method 2: Wrapped Label**

```html
<label>
  Username
  <input type="text" />
</label>
```

**Method 3: ARIA Label (when visible label isn't possible)**

```html
<input type="text" aria-label="Username" />
```

### Testing Checklist

- [ ] All inputs have labels (visual and accessible)
- [ ] Labels are announced before input value
- [ ] Required fields are marked and announced
- [ ] Error messages are associated with fields (aria-describedby)
- [ ] Errors are announced immediately (role="alert")
- [ ] Placeholder text is NOT the only label
- [ ] Helper text is associated with field (aria-describedby)
- [ ] Fieldsets group related fields (e.g., address)
- [ ] Legends describe fieldset purpose

## Testing Error Messages

### Error Announcement Testing

1. Submit form with invalid data
2. Verify with screen reader:
   - [ ] Error summary is announced (if multiple errors)
   - [ ] Focus moves to first error field
   - [ ] Individual error message is read with field label
   - [ ] Error is associated with field (aria-describedby or role="alert")
   - [ ] Error persists when field receives focus

### Error Patterns

```html
✅ Correct Error Pattern
<label for="email">Email</label>
<input id="email" type="email" aria-describedby="email-error" aria-invalid="true" />
<span id="email-error" role="alert"> Please enter a valid email address </span>

❌ Incorrect Error Pattern (not announced)
<label for="email">Email</label>
<input id="email" type="email" />
<span style="color: red">Invalid email</span>
<!-- Not associated -->
```

## Dynamic Content Testing

### Loading States

Test announcements for loading content:

```html
<!-- While loading -->
<div role="status" aria-live="polite">
  <p>Loading projects...</p>
</div>

<!-- After load -->
<div role="status" aria-live="polite">
  <p>Loaded 12 projects</p>
</div>
```

**Testing:**

- [ ] Loading message is announced when fetch starts
- [ ] Completion message is announced when fetch completes
- [ ] Loading spinner has accessible label or is hidden (aria-hidden)
- [ ] Skeleton loaders are hidden from screen readers

### Success and Error Toasts

Test toast notifications:

```html
<div role="status" aria-live="polite">
  <p>Project saved successfully</p>
</div>

<div role="alert" aria-live="assertive">
  <p>Error: Failed to save project</p>
</div>
```

**Testing:**

- [ ] Success toasts are announced (role="status", aria-live="polite")
- [ ] Error toasts are announced immediately (role="alert", aria-live="assertive")
- [ ] Toast text is clear and actionable
- [ ] Toasts don't automatically dismiss before announcement finishes

## Image Alternative Text Testing

### Alt Text Guidelines

```html
✅ Good Alt Text
<img src="project-photo.jpg" alt="Victorian house exterior with new siding" />
<img src="logo.svg" alt="Real Estate Tracker" />
<img src="icon-delete.svg" alt="" aria-hidden="true" />
<!-- Decorative -->

❌ Bad Alt Text
<img src="project-photo.jpg" alt="image123.jpg" />
<!-- Filename -->
<img src="logo.svg" alt="Logo" />
<!-- Generic -->
<img src="icon-delete.svg" alt="icon" />
<!-- Should be empty for decorative -->
```

**Testing:**

- [ ] All informative images have descriptive alt text
- [ ] Alt text describes content/purpose, not appearance
- [ ] Decorative images have empty alt="" or aria-hidden="true"
- [ ] Complex images (charts, diagrams) have detailed descriptions
- [ ] Icons in buttons are labeled on button, not icon

## Table Accessibility Testing

### Accessible Data Tables

```html
<table>
  <caption>
    Project Cost Summary
  </caption>
  <thead>
    <tr>
      <th scope="col">Project</th>
      <th scope="col">Budget</th>
      <th scope="col">Spent</th>
      <th scope="col">Remaining</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Kitchen Renovation</th>
      <td>$50,000</td>
      <td>$32,450</td>
      <td>$17,550</td>
    </tr>
  </tbody>
</table>
```

**Testing:**

- [ ] Table has caption describing its purpose
- [ ] Column headers use `<th scope="col">`
- [ ] Row headers use `<th scope="row">` (if applicable)
- [ ] Complex tables use additional ARIA (if needed)
- [ ] Screen reader announces row/column position

## Common Issues and Fixes

| Issue                      | Problem                                  | Solution                                          |
| -------------------------- | ---------------------------------------- | ------------------------------------------------- |
| **Unlabeled button**       | Button announced as "button, clickable"  | Add aria-label or visible text                    |
| **Generic link text**      | Link announced as "click here"           | Use descriptive link text: "View project details" |
| **Missing heading**        | Section has no heading, hard to navigate | Add appropriate heading level                     |
| **Form without labels**    | Input announced as "edit" only           | Add explicit label with for attribute             |
| **Div used as button**     | Element not announced as button          | Use `<button>` element or add role="button"       |
| **Auto-playing content**   | Distracting announcements                | Provide pause control and don't autoplay          |
| **Modal not trapped**      | Focus escapes to background              | Implement focus trap in modal                     |
| **Dynamic content silent** | Updates not announced                    | Add aria-live region or role="alert"              |

## Testing Checklist Summary

Before approving screen reader accessibility:

- [ ] Tested with NVDA on Windows
- [ ] Tested with VoiceOver on macOS
- [ ] Tested with VoiceOver on iOS (mobile)
- [ ] All pages use semantic HTML (nav, main, aside, footer)
- [ ] Heading hierarchy is logical (h1, h2, h3 in order)
- [ ] All interactive elements are labeled (buttons, links, inputs)
- [ ] Forms have labels for all fields
- [ ] Error messages are announced and associated with fields
- [ ] Dynamic content changes are announced (aria-live)
- [ ] Images have appropriate alt text
- [ ] Tables use proper markup (caption, th, scope)
- [ ] Modals trap focus and are announced
- [ ] Navigation is efficient (skip links, landmarks, headings)
- [ ] No "unlabeled" or generic announcements
- [ ] All critical workflows are completable with screen reader

## Resources

### Screen Reader Downloads

- **NVDA:** https://www.nvaccess.org/download/
- **JAWS:** https://www.freedomscientific.com/products/software/jaws/ (paid)
- **VoiceOver:** Built into macOS/iOS (System Settings → Accessibility)
- **Narrator:** Built into Windows (Win + Ctrl + Enter)

### Learning Resources

- [WebAIM Screen Reader User Survey](https://webaim.org/projects/screenreadersurvey/)
- [NVDA User Guide](https://www.nvaccess.org/files/nvda/documentation/userGuide.html)
- [VoiceOver User Guide](https://support.apple.com/guide/voiceover/welcome/mac)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)

---

**Last Updated:** 2025-10-11
**Review Cadence:** After any major UI changes or new component additions
**Owner:** Development & QA Teams
