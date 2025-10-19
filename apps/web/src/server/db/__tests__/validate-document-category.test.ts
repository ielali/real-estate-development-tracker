/**
 * Document Category Validation Tests
 *
 * Tests the validateDocumentCategory utility to ensure it properly
 * validates and auto-corrects invalid category IDs
 */

import { describe, it, expect } from "vitest"
import {
  validateDocumentCategory,
  isValidDocumentCategory,
  VALID_DOCUMENT_CATEGORIES,
} from "../validate-document-category"

describe("validateDocumentCategory", () => {
  describe("valid predefined categories", () => {
    it("accepts 'photos' (valid predefined category)", async () => {
      const result = await validateDocumentCategory("photos")
      expect(result).toBe("photos")
    })

    it("accepts 'receipts'", async () => {
      const result = await validateDocumentCategory("receipts")
      expect(result).toBe("receipts")
    })

    it("accepts 'invoices'", async () => {
      const result = await validateDocumentCategory("invoices")
      expect(result).toBe("invoices")
    })

    it("accepts 'contracts'", async () => {
      const result = await validateDocumentCategory("contracts")
      expect(result).toBe("contracts")
    })

    it("accepts 'permits'", async () => {
      const result = await validateDocumentCategory("permits")
      expect(result).toBe("permits")
    })

    it("accepts 'plans'", async () => {
      const result = await validateDocumentCategory("plans")
      expect(result).toBe("plans")
    })

    it("accepts 'inspections'", async () => {
      const result = await validateDocumentCategory("inspections")
      expect(result).toBe("inspections")
    })

    it("accepts 'warranties'", async () => {
      const result = await validateDocumentCategory("warranties")
      expect(result).toBe("warranties")
    })

    it("accepts 'correspondence'", async () => {
      const result = await validateDocumentCategory("correspondence")
      expect(result).toBe("correspondence")
    })
  })

  describe("auto-correction of common mistakes", () => {
    it("auto-corrects 'photo' → 'photos' (CRITICAL TEST FROM ERROR LOG)", async () => {
      const result = await validateDocumentCategory("photo")
      expect(result).toBe("photos")
    })

    it("auto-corrects 'receipt' → 'receipts'", async () => {
      const result = await validateDocumentCategory("receipt")
      expect(result).toBe("receipts")
    })

    it("auto-corrects 'invoice' → 'invoices'", async () => {
      const result = await validateDocumentCategory("invoice")
      expect(result).toBe("invoices")
    })

    it("auto-corrects 'contract' → 'contracts'", async () => {
      const result = await validateDocumentCategory("contract")
      expect(result).toBe("contracts")
    })

    it("auto-corrects 'permit' → 'permits'", async () => {
      const result = await validateDocumentCategory("permit")
      expect(result).toBe("permits")
    })

    it("auto-corrects 'plan' → 'plans'", async () => {
      const result = await validateDocumentCategory("plan")
      expect(result).toBe("plans")
    })

    it("auto-corrects 'inspection' → 'inspections'", async () => {
      const result = await validateDocumentCategory("inspection")
      expect(result).toBe("inspections")
    })

    it("auto-corrects 'warranty' → 'warranties'", async () => {
      const result = await validateDocumentCategory("warranty")
      expect(result).toBe("warranties")
    })

    it("handles case-insensitive input (PHOTO → photos)", async () => {
      const result = await validateDocumentCategory("PHOTO")
      expect(result).toBe("photos")
    })

    it("handles case-insensitive input (Photo → photos)", async () => {
      const result = await validateDocumentCategory("Photo")
      expect(result).toBe("photos")
    })
  })

  describe("error handling", () => {
    it("throws error for completely invalid category", async () => {
      await expect(validateDocumentCategory("invalid_category")).rejects.toThrow(
        /Invalid document category/
      )
    })

    it("throws error with helpful message listing valid categories", async () => {
      try {
        await validateDocumentCategory("invalid")
        expect.fail("Should have thrown an error")
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toContain("photos")
        expect((error as Error).message).toContain("receipts")
        expect((error as Error).message).toContain("invoices")
      }
    })

    it("throws error for empty string", async () => {
      await expect(validateDocumentCategory("")).rejects.toThrow()
    })

    it("throws error for random string", async () => {
      await expect(validateDocumentCategory("xyz123")).rejects.toThrow()
    })
  })

  describe("isValidDocumentCategory helper", () => {
    it("returns true for valid category", async () => {
      const result = await isValidDocumentCategory("photos")
      expect(result).toBe(true)
    })

    it("returns true for auto-correctable category", async () => {
      const result = await isValidDocumentCategory("photo")
      expect(result).toBe(true)
    })

    it("returns false for invalid category", async () => {
      const result = await isValidDocumentCategory("invalid")
      expect(result).toBe(false)
    })
  })

  describe("VALID_DOCUMENT_CATEGORIES constant", () => {
    it("exports the correct list of valid categories", () => {
      expect(VALID_DOCUMENT_CATEGORIES).toEqual([
        "photos",
        "receipts",
        "invoices",
        "contracts",
        "permits",
        "plans",
        "inspections",
        "warranties",
        "correspondence",
      ])
    })

    it("contains 9 categories", () => {
      expect(VALID_DOCUMENT_CATEGORIES).toHaveLength(9)
    })

    it("all categories are plural except correspondence", () => {
      const nonPluralExceptions = ["correspondence"]
      VALID_DOCUMENT_CATEGORIES.forEach((cat) => {
        if (!nonPluralExceptions.includes(cat)) {
          expect(cat.endsWith("s")).toBe(true)
        }
      })
    })
  })

  describe("real-world error case simulation", () => {
    it("simulates exact error from Netlify logs: og-image.png with category 'photo'", async () => {
      // This is the exact scenario from the error log
      const fileName = "og-image.png"
      const mimeType = "image/png"
      const categoryId = "photo" // ❌ Invalid - should be "photos"

      console.log("\n📋 Simulating Netlify Error Scenario:")
      console.log(`  File: ${fileName}`)
      console.log(`  MIME Type: ${mimeType}`)
      console.log(`  Category (invalid): "${categoryId}"`)

      // Validate and auto-correct
      const validatedCategoryId = await validateDocumentCategory(categoryId)

      console.log(`  Category (corrected): "${validatedCategoryId}"`)
      console.log("  ✅ Auto-correction successful!\n")

      expect(validatedCategoryId).toBe("photos")
    })

    it("simulates exact error from previous log: apple-touch-icon.png", async () => {
      // Original error: apple-touch-icon.png (image/png) with category "photo"
      const categoryId = "photo" // ❌ Invalid

      const validatedCategoryId = await validateDocumentCategory(categoryId)
      expect(validatedCategoryId).toBe("photos")
    })
  })
})
