# Color Contrast Testing Guide - Story 10.16

## WCAG AA Requirements

**Minimum Contrast Ratios:**

- Normal text (< 18pt or < 14pt bold): **4.5:1**
- Large text (≥ 18pt or ≥ 14pt bold): **3:1**
- UI components and graphical objects: **3:1**

## Login & 2FA Screens - Color Combinations to Test

### Light Mode

#### Text Colors

- **Primary Headings** (`text-[#333333]` on `bg-background-light #f6f7f8`)
  - Expected: High contrast (16.8:1) ✅

- **Body Text** (`text-slate-600` on `bg-background-light`)
  - Slate-600: #475569
  - Expected: 7.4:1 ✅

- **Form Labels** (`text-[#333333]` on `bg-white`)
  - Expected: 16.8:1 ✅

- **Input Placeholder** (`text-slate-400` on `bg-white`)
  - Slate-400: #94a3b8
  - Expected: 3.4:1 ⚠️ (borderline, needs verification)

- **Error Text** (`text-red-800` on `bg-red-50`)
  - Red-800: #991b1b on Red-50: #fef2f2
  - Expected: 8.5:1 ✅

- **Primary Links** (`text-primary #137fec` on `bg-white`)
  - Expected: 3.1:1 ⚠️ (needs verification)

#### Button Colors

- **Navy Button** (`bg-navy #0A2540` with `text-white`)
  - Expected: 17.2:1 ✅

- **Primary Button** (if used)
  - `bg-primary #137fec` with `text-white`
  - Expected: 4.5:1 ✅

#### Border Colors

- **Input Borders** (`border-slate-300` on white)
  - Slate-300: #cbd5e1
  - Expected: Decorative, not text ✅

### Dark Mode

#### Text Colors

- **Primary Headings** (`dark:text-slate-200` on `dark:bg-background-dark #101922`)
  - Slate-200: #e2e8f0 on #101922
  - Expected: 11.5:1 ✅

- **Body Text** (`dark:text-slate-400` on `dark:bg-background-dark`)
  - Slate-400: #94a3b8 on #101922
  - Expected: 5.8:1 ✅

- **Form Labels** (`dark:text-slate-300` on `dark:bg-background-dark`)
  - Slate-300: #cbd5e1
  - Expected: 9.2:1 ✅

- **Input Text** (`dark:text-slate-100` on `dark:bg-background-dark`)
  - Slate-100: #f1f5f9
  - Expected: 13.7:1 ✅

- **Error Text** (`dark:text-red-200` on `dark:bg-red-900/20`)
  - Red-200: #fecaca on Red-900 with 20% opacity
  - **⚠️ NEEDS TESTING** - Overlay opacity may affect contrast

- **Primary Links** (`dark:text-primary/90` on `dark:bg-background-dark`)
  - Primary with 90% opacity
  - **⚠️ NEEDS TESTING** - Opacity may reduce contrast below threshold

#### Button Colors

- **Primary Button Dark** (`dark:bg-primary` with `text-white`)
  - Expected: 4.5:1 ✅

- **Navy Button Dark** (if used in dark mode)
  - May need lighter variant for visibility

#### Border Colors

- **Input Borders Dark** (`dark:border-slate-700`)
  - Slate-700: #334155
  - Expected: Decorative ✅

### Hero Panel (Desktop Only)

#### Light Colors on Dark Background

- **Hero Heading** (`text-white` with `text-4xl font-black` on `bg-slate-900/60`)
  - White (#ffffff) on dark overlay
  - Expected: 15+:1 ✅

- **Hero Description** (`text-slate-200 text-lg` on `bg-slate-900/60`)
  - Expected: 12+:1 ✅

## Testing Tools

### Online Tools (Quick Check)

1. **WebAIM Contrast Checker** (recommended)
   - URL: https://webaim.org/resources/contrastchecker/
   - Enter foreground and background colors
   - Shows pass/fail for WCAG AA and AAA

2. **Color Review**
   - URL: https://color.review/
   - Live contrast ratio calculator
   - Simulates color blindness

3. **Coolors Contrast Checker**
   - URL: https://coolors.co/contrast-checker
   - Visual interface for quick tests

### Browser DevTools

1. **Chrome DevTools**
   - Inspect element → Styles panel
   - Hover over color value → Shows contrast ratio
   - AA and AAA indicators

2. **Firefox Accessibility Inspector**
   - DevTools → Accessibility tab
   - "Check for issues" → Contrast
   - Highlights low-contrast elements

### Automated Testing

```bash
# Using axe-core (already in project)
npm run test:accessibility

# Or with Pa11y
npx pa11y http://localhost:3000/login --standard WCAG2AA
```

### Manual Testing Checklist

#### Light Mode - Login Screen

- [ ] "Welcome Back" heading on light background
- [ ] "Sign in to continue" subtitle
- [ ] Email field label
- [ ] Email input text
- [ ] Email input placeholder
- [ ] Password field label
- [ ] Password input text
- [ ] "Remember me" checkbox label
- [ ] "Forgot password?" link
- [ ] "Sign In" button text
- [ ] "Don't have an account?" text
- [ ] "Sign up" link
- [ ] Error message text on red background
- [ ] Validation error text below inputs

#### Dark Mode - Login Screen

- [ ] All elements from Light Mode checklist
- [ ] Verify increased contrast in dark theme
- [ ] Check border visibility against dark background

#### Light Mode - 2FA Screen

- [ ] "Two-Factor Authentication" heading
- [ ] Instruction text
- [ ] 6-digit input field text
- [ ] "Trust this device" label
- [ ] "Resend code" link
- [ ] "Use backup code" link
- [ ] "Contact support" link
- [ ] Error messages

#### Dark Mode - 2FA Screen

- [ ] All elements from Light Mode 2FA checklist

#### Hero Panel (Desktop)

- [ ] Main heading white text on overlay
- [ ] Description text on overlay
- [ ] Logo visibility (white container)

## Priority Issues to Check

### ⚠️ High Priority

1. **Primary link color** (`#137fec`) on white background
   - May need darkening to `#0d6bc9` (hover color) for better contrast

2. **Placeholder text** (`slate-400`) contrast
   - May need upgrading to `slate-500` for AA compliance

3. **Dark mode error backgrounds** with opacity
   - Test actual rendered contrast with opacity applied

### Medium Priority

1. **Focus indicators** - Ring color visibility
   - `ring-primary/50` needs testing on both light and dark backgrounds

2. **Link hover states** - Underline visibility
   - Ensure hover state maintains contrast ratio

### Low Priority

1. **Border colors** - Decorative only
   - Not required to meet contrast ratio

2. **Loading spinner** - Animation visibility
   - Visual indicator, not text content

## Testing Workflow

1. **Quick Automated Scan**

   ```bash
   # Run axe-core tests
   npm run test:accessibility -- --grep "contrast"
   ```

2. **Manual Spot Checks**
   - Test 5-6 key color combinations manually
   - Focus on text colors that appear borderline

3. **Browser DevTools Verification**
   - Inspect suspicious elements
   - Use Chrome's built-in contrast ratio display

4. **Document Results**
   - Update this file with actual test results
   - Flag any failures for design adjustment

## Remediation Strategies

If contrast fails:

### For Text Colors

1. **Darken light mode text** (decrease luminosity)
2. **Lighten dark mode text** (increase luminosity)
3. **Increase font weight** (may help borderline cases)
4. **Increase font size** (>18pt has lower threshold)

### For Link Colors

1. **Add underline** (makes links more visible even with lower contrast)
2. **Darken link color** in light mode
3. **Lighten link color** in dark mode
4. **Use bold font** for important links

### For Error States

1. **Use darker red** (`red-900` instead of `red-800`)
2. **Reduce background opacity** (make overlay more opaque)
3. **Add border** for additional visual distinction

## Test Results

### Tested on: _[Date]_

### Tested by: _[Name]_

| Element      | Mode  | Foreground | Background         | Ratio | Pass/Fail |
| ------------ | ----- | ---------- | ------------------ | ----- | --------- |
| Main Heading | Light | #333333    | #f6f7f8            |       |           |
| Body Text    | Light | #475569    | #f6f7f8            |       |           |
| Primary Link | Light | #137fec    | #ffffff            |       |           |
| Error Text   | Light | #991b1b    | #fef2f2            |       |           |
| Main Heading | Dark  | #e2e8f0    | #101922            |       |           |
| Body Text    | Dark  | #94a3b8    | #101922            |       |           |
| Primary Link | Dark  | #137fec    | #101922            |       |           |
| Error Text   | Dark  | #fecaca    | rgba(red-900, 0.2) |       |           |

_Fill in this table after testing_

## References

- **WCAG 2.1 Contrast Guidelines**: https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum
- **WebAIM Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **Tailwind Color Palette**: https://tailwindcss.com/docs/customizing-colors
- **Story 10.16 Colors**: `tailwind.config.ts` (navy, primary, background-light, background-dark)
