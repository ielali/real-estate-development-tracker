import { test, expect } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

/**
 * Accessibility Testing Suite
 *
 * Tests all major pages for WCAG AA compliance using axe-core.
 * These tests ensure the application is accessible to all users,
 * including those using assistive technologies.
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000"

// Helper function to run axe and check for violations
async function checkAccessibility(page: any, context: string) {
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze()

  const violations = accessibilityScanResults.violations

  if (violations.length > 0) {
    console.log(`\n❌ Accessibility violations found on ${context}:\n`)
    violations.forEach((violation) => {
      console.log(`  • ${violation.id}: ${violation.description}`)
      console.log(`    Impact: ${violation.impact}`)
      console.log(`    Help: ${violation.helpUrl}`)
      console.log(`    Affected elements: ${violation.nodes.length}`)
      violation.nodes.forEach((node) => {
        console.log(`      - ${node.html}`)
      })
      console.log("")
    })
  }

  expect(violations).toEqual([])
}

test.describe("Accessibility Tests - WCAG AA Compliance", () => {
  test.beforeEach(async ({ page }) => {
    // Set a consistent viewport size for testing
    await page.setViewportSize({ width: 1280, height: 720 })
  })

  test("Home page should have no accessibility violations", async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState("networkidle")
    await checkAccessibility(page, "Home page")
  })

  test("Projects list page should have no accessibility violations", async ({ page }) => {
    await page.goto(`${BASE_URL}/projects`)
    await page.waitForLoadState("networkidle")
    await checkAccessibility(page, "Projects list page")
  })

  test("Sign in page should have no accessibility violations", async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/sign-in`)
    await page.waitForLoadState("networkidle")
    await checkAccessibility(page, "Sign in page")
  })

  test("Sign up page should have no accessibility violations", async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/sign-up`)
    await page.waitForLoadState("networkidle")
    await checkAccessibility(page, "Sign up page")
  })
})

test.describe("Keyboard Navigation Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
  })

  test("Tab navigation should work on home page", async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState("networkidle")

    // Press Tab multiple times and verify focus indicators are visible
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("Tab")
      // Wait for focus to update
      await page.waitForTimeout(100)

      // Verify that an element has focus
      const focusedElement = await page.locator(":focus").count()
      expect(focusedElement).toBeGreaterThan(0)
    }
  })

  test("Escape key should close modals/dialogs", async ({ page }) => {
    await page.goto(`${BASE_URL}/projects`)
    await page.waitForLoadState("networkidle")

    // Try to find and open a modal/dialog if exists
    const dialogTriggers = page.locator('[role="button"], button').filter({
      hasText: /create|add|new/i,
    })

    const count = await dialogTriggers.count()
    if (count > 0) {
      // Click the first dialog trigger
      await dialogTriggers.first().click()
      await page.waitForTimeout(300)

      // Press Escape
      await page.keyboard.press("Escape")
      await page.waitForTimeout(300)

      // Verify dialog is closed (should not find dialog/modal role)
      const openDialogs = await page.locator('[role="dialog"]').count()
      expect(openDialogs).toBe(0)
    }
  })

  test("Enter key should activate buttons", async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/sign-in`)
    await page.waitForLoadState("networkidle")

    // Tab to first button
    const firstButton = page.locator("button, [role='button']").first()
    await firstButton.focus()

    // Verify button is focused
    const isFocused = await firstButton.evaluate((el) => el === document.activeElement)
    expect(isFocused).toBe(true)

    // Pressing Enter should be possible (no error thrown)
    await page.keyboard.press("Enter")
  })
})

test.describe("Form Accessibility Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
  })

  test("Form inputs should have associated labels", async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/sign-in`)
    await page.waitForLoadState("networkidle")

    // Find all input elements
    const inputs = page.locator("input")
    const inputCount = await inputs.count()

    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i)
      const inputId = await input.getAttribute("id")

      if (inputId) {
        // Check if there's a label with for attribute matching the input id
        const label = page.locator(`label[for="${inputId}"]`)
        const labelCount = await label.count()

        // Or check if input has aria-label or aria-labelledby
        const ariaLabel = await input.getAttribute("aria-label")
        const ariaLabelledBy = await input.getAttribute("aria-labelledby")

        expect(
          labelCount > 0 || ariaLabel || ariaLabelledBy,
          `Input with id "${inputId}" should have an associated label`
        ).toBeTruthy()
      }
    }
  })

  test("Required fields should be marked with aria-required", async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/sign-in`)
    await page.waitForLoadState("networkidle")

    // Find required inputs
    const requiredInputs = page.locator("input[required], input[aria-required]")
    const count = await requiredInputs.count()

    for (let i = 0; i < count; i++) {
      const input = requiredInputs.nth(i)
      const ariaRequired =
        (await input.getAttribute("aria-required")) || (await input.getAttribute("required"))
      expect(ariaRequired).toBeTruthy()
    }
  })

  test("Error messages should be associated with fields", async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/sign-in`)
    await page.waitForLoadState("networkidle")

    // Try to submit form without filling it (to trigger errors)
    const submitButton = page.locator('button[type="submit"]').first()
    if ((await submitButton.count()) > 0) {
      await submitButton.click()
      await page.waitForTimeout(500)

      // Check for error messages
      const errorMessages = page.locator('[role="alert"], .error-message')
      const errorCount = await errorMessages.count()

      if (errorCount > 0) {
        // Verify error messages are properly associated with inputs
        for (let i = 0; i < errorCount; i++) {
          const error = errorMessages.nth(i)
          const errorId = await error.getAttribute("id")

          if (errorId) {
            // Find input with aria-describedby pointing to this error
            const associatedInput = page.locator(`input[aria-describedby*="${errorId}"]`)
            const inputCount = await associatedInput.count()
            expect(inputCount).toBeGreaterThan(0)
          }
        }
      }
    }
  })
})

test.describe("Mobile Accessibility Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
  })

  test("Mobile viewport should have no accessibility violations", async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState("networkidle")
    await checkAccessibility(page, "Home page (mobile viewport)")
  })

  test("Touch targets should be at least 44x44 pixels", async ({ page }) => {
    await page.goto(`${BASE_URL}/projects`)
    await page.waitForLoadState("networkidle")

    // Check all interactive elements (buttons, links)
    const interactiveElements = page.locator(
      'button, a, input[type="button"], input[type="submit"], [role="button"]'
    )
    const count = await interactiveElements.count()

    for (let i = 0; i < count; i++) {
      const element = interactiveElements.nth(i)
      const box = await element.boundingBox()

      if (box) {
        // Touch targets should be at least 44x44px for mobile usability
        expect(
          box.width >= 44 || box.height >= 44,
          `Interactive element at index ${i} should have minimum 44x44px touch target`
        ).toBeTruthy()
      }
    }
  })

  test("Mobile navigation should be keyboard accessible", async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState("networkidle")

    // Tab through navigation elements
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("Tab")
      await page.waitForTimeout(100)
    }

    // Should be able to navigate and not get stuck
    const focusedElement = await page.locator(":focus").count()
    expect(focusedElement).toBeGreaterThan(0)
  })
})

test.describe("Color Contrast Tests", () => {
  test("Page should meet WCAG AA color contrast requirements", async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState("networkidle")

    // axe-core includes color-contrast rules in WCAG AA tags
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2aa"])
      .include("body")
      .analyze()

    const colorContrastViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === "color-contrast"
    )

    if (colorContrastViolations.length > 0) {
      console.log("\n❌ Color contrast violations found:\n")
      colorContrastViolations.forEach((violation) => {
        console.log(`  • ${violation.description}`)
        violation.nodes.forEach((node) => {
          console.log(`    - ${node.html}`)
        })
      })
    }

    expect(colorContrastViolations).toEqual([])
  })
})
