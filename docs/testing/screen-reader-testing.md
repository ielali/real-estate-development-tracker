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

### Recommended Testing Setup

**Minimum Testing:**

- NVDA on Windows (free, widely used)
- VoiceOver on macOS (built-in, Apple ecosystem)

## NVDA Testing (Windows)

### Basic NVDA Commands

| Command               | Action                                      |
| --------------------- | ------------------------------------------- |
| **NVDA + Q**          | Quit NVDA                                   |
| **NVDA + S**          | Toggle speech mode                          |
| **Insert**            | NVDA modifier key (default)                 |
| **Down Arrow**        | Read next line                              |
| **Up Arrow**          | Read previous line                          |
| **NVDA + Down Arrow** | Say all (read from current position to end) |
| **Tab**               | Next focusable element                      |
| **H**                 | Next heading                                |
| **K**                 | Next link                                   |
| **E**                 | Next edit field (input)                     |
| **B**                 | Next button                                 |
| **F**                 | Next form field                             |

### NVDA Testing Procedure

**Test: Homepage**

1. Launch NVDA
2. Open browser and navigate to homepage
3. Press **NVDA + Down Arrow** to read entire page
4. Verify:
   - [ ] Page title is announced
   - [ ] Landmarks are announced (navigation, main, footer)
   - [ ] Headings are announced with level
   - [ ] Links are announced as "link: [text]"
   - [ ] Buttons are announced as "button: [text]"
   - [ ] Images have alt text announced

**Test: Sign In Form**

1. Navigate to sign in page
2. Press **F** to jump to first form field
3. Verify:
   - [ ] Form landmark is announced
   - [ ] Each input has clear label
   - [ ] Required fields are announced
   - [ ] Error messages are announced

## VoiceOver Testing (macOS)

### Basic VoiceOver Commands

| Command              | Action                                |
| -------------------- | ------------------------------------- |
| **Cmd + F5**         | Toggle VoiceOver on/off               |
| **VO**               | VoiceOver modifier (Control + Option) |
| **VO + Right Arrow** | Next item                             |
| **VO + Left Arrow**  | Previous item                         |
| **VO + A**           | Read all from current position        |
| **VO + U**           | Open rotor                            |

### VoiceOver Testing Procedure

**Test: Homepage with VoiceOver**

1. Enable VoiceOver (Cmd + F5)
2. Navigate to homepage in Safari
3. Press **VO + A** to read entire page
4. Press **VO + U** to open rotor
5. Select "Headings" and verify all headings appear

## Semantic HTML Requirements

### Required HTML5 Elements

Use semantic HTML elements for proper screen reader interpretation:

```html
✅ Correct Semantic HTML
<nav aria-label="Main navigation">...</nav>
<main id="main-content">...</main>
<button type="button">Submit</button>
<h1>Page Title</h1>

❌ Incorrect Non-Semantic HTML
<div class="nav">...</div>
<div class="button">...</div>
```

## ARIA Attributes for Screen Readers

### ARIA Labels

```html
<!-- Icon-only buttons -->
<button aria-label="Close modal">
  <XIcon />
</button>
```

### ARIA Live Regions

```html
<!-- Announce dynamic content changes -->
<div aria-live="polite" aria-atomic="true">
  <p>3 new projects added</p>
</div>

<!-- Assertive: Interrupt and announce immediately -->
<div aria-live="assertive" role="alert">
  <p>Error: Failed to save project</p>
</div>
```

## Form Accessibility Testing

### Form Field Labels

Every form field must have an accessible label:

```html
<label for="username">Username</label> <input id="username" type="text" />
```

### Testing Checklist

- [ ] All inputs have labels
- [ ] Required fields are marked
- [ ] Error messages are associated with fields
- [ ] Helper text is announced

## Testing Checklist Summary

Before approving screen reader accessibility:

- [ ] Tested with NVDA on Windows
- [ ] Tested with VoiceOver on macOS
- [ ] All pages use semantic HTML
- [ ] Heading hierarchy is logical
- [ ] All interactive elements are labeled
- [ ] Forms have labels for all fields
- [ ] Error messages are announced
- [ ] Dynamic content changes are announced
- [ ] No "unlabeled" or generic announcements
- [ ] All critical workflows are completable

---

**Last Updated:** 2025-10-11
**Review Cadence:** After any major UI changes or new component additions
**Owner:** Development & QA Teams
