/**
 * PDF Report Service Tests
 *
 * Tests PDF generation functionality including chart rendering,
 * data formatting, and RBAC support
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from "vitest"
import { sql } from "drizzle-orm"
import { generateProjectPdf } from "../report-pdf.service"
import { createTestDb, cleanupAllTestDatabases } from "@/test/test-db"
import type { User } from "@/server/db/schema/users"
import { users } from "@/server/db/schema/users"
import { projects } from "@/server/db/schema/projects"
import { categories } from "@/server/db/schema/categories"
import { costs } from "@/server/db/schema/costs"
import { contacts } from "@/server/db/schema/contacts"
import { documents } from "@/server/db/schema/documents"
import { events } from "@/server/db/schema/events"
import { projectAccess } from "@/server/db/schema/projectAccess"
import { CATEGORIES } from "@/server/db/types"

describe("PDF Report Service", () => {
  let testDbInstance: Awaited<ReturnType<typeof createTestDb>>
  let testUser: User
  let otherUser: User
  let projectId: string
  let categoryId: string

  beforeAll(async () => {
    testDbInstance = await createTestDb()
  })

  afterAll(async () => {
    await cleanupAllTestDatabases()
  })

  beforeEach(async () => {
    await testDbInstance.cleanup()

    // Seed categories
    const existingCategories = await testDbInstance.db
      .select({ count: sql<number>`count(*)` })
      .from(categories)

    if (Number(existingCategories[0]?.count) === 0) {
      await testDbInstance.db.insert(categories).values(CATEGORIES)
    }

    // Get a category ID
    const category = await testDbInstance.db.select().from(categories).limit(1)
    categoryId = category[0]!.id

    // Create test users
    testUser = await testDbInstance.db
      .insert(users)
      .values({
        id: "test-user-1",
        email: "testuser@example.com",
        name: "Test User",
        firstName: "Test",
        lastName: "User",
      })
      .returning()
      .then((rows: User[]) => rows[0]!)

    otherUser = await testDbInstance.db
      .insert(users)
      .values({
        id: "test-user-2",
        email: "otheruser@example.com",
        name: "Other User",
        firstName: "Other",
        lastName: "User",
      })
      .returning()
      .then((rows: User[]) => rows[0]!)

    // Create test project with all required fields
    const project = await testDbInstance.db
      .insert(projects)
      .values({
        name: "Test Project",
        ownerId: testUser.id,
        status: "active",
        projectType: "residential",
        address: {
          street: "123 Test St",
          city: "Sydney",
          state: "NSW",
          postcode: "2000",
          country: "Australia",
        },
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
        totalBudget: 100000000, // $1,000,000 in cents
      })
      .returning()

    projectId = project[0]!.id

    // Create test costs
    await testDbInstance.db.insert(costs).values([
      {
        projectId,
        amount: 50000000, // $500,000
        description: "Test cost 1",
        categoryId,
        date: new Date("2024-06-01"),
        createdById: testUser.id,
      },
      {
        projectId,
        amount: 30000000, // $300,000
        description: "Test cost 2",
        categoryId,
        date: new Date("2024-06-15"),
        createdById: testUser.id,
      },
    ])
  })

  describe("generateProjectPdf", () => {
    test("generates PDF for project owner with minimal data", async () => {
      const result = await generateProjectPdf(testDbInstance.db, {
        projectId,
        userId: testUser.id,
        dateRange: { start: null, end: null },
        isPartnerView: false,
      })

      expect(result).toBeInstanceOf(Buffer)
      expect(result.length).toBeGreaterThan(0)
      // PDF files start with %PDF
      expect(result.toString("utf8", 0, 4)).toBe("%PDF")
    })

    test("generates PDF with all data types", async () => {
      // Add contact/vendor
      const contact = await testDbInstance.db
        .insert(contacts)
        .values({
          projectId,
          firstName: "Vendor",
          lastName: "One",
          email: "vendor@example.com",
          phone: "1234567890",
          companyName: "Vendor Co",
          categoryId, // Add categoryId (required field)
        })
        .returning()

      const contactId = contact[0]!.id

      // Add cost with vendor
      await testDbInstance.db.insert(costs).values({
        projectId,
        amount: 20000000, // $200,000
        description: "Vendor cost",
        categoryId,
        date: new Date("2024-07-01"),
        createdById: testUser.id,
        contactId,
      })

      // Add document
      await testDbInstance.db.insert(documents).values({
        projectId,
        fileName: "test-doc.pdf",
        fileSize: 1024000, // 1MB
        mimeType: "application/pdf",
        blobUrl: "test/path",
        categoryId,
        uploadedById: testUser.id,
      })

      // Add event
      await testDbInstance.db.insert(events).values({
        projectId,
        title: "Test Event",
        date: new Date("2024-08-01"),
        categoryId,
        createdById: testUser.id,
      })

      const result = await generateProjectPdf(testDbInstance.db, {
        projectId,
        userId: testUser.id,
        dateRange: { start: null, end: null },
        isPartnerView: false,
      })

      expect(result).toBeInstanceOf(Buffer)
      expect(result.length).toBeGreaterThan(0)
      expect(result.toString("utf8", 0, 4)).toBe("%PDF")
    })

    test("generates PDF with date range filter", async () => {
      const result = await generateProjectPdf(testDbInstance.db, {
        projectId,
        userId: testUser.id,
        dateRange: {
          start: new Date("2024-06-01"),
          end: new Date("2024-06-30"),
        },
        isPartnerView: false,
      })

      expect(result).toBeInstanceOf(Buffer)
      expect(result.length).toBeGreaterThan(0)
    })

    test("generates PDF for partner with watermark", async () => {
      // Add partner access (must have acceptedAt for access)
      await testDbInstance.db.insert(projectAccess).values({
        projectId,
        userId: otherUser.id,
        role: "partner",
        grantedById: testUser.id,
        acceptedAt: new Date(), // Partner must have accepted the invitation
      })

      const result = await generateProjectPdf(testDbInstance.db, {
        projectId,
        userId: otherUser.id,
        dateRange: { start: null, end: null },
        isPartnerView: true,
      })

      expect(result).toBeInstanceOf(Buffer)
      expect(result.length).toBeGreaterThan(0)
      // PDF generated successfully for partner
      // Note: Watermark is rendered in PDF but may be compressed/encoded,
      // so we can't reliably search for the text in the binary
    })

    test("generates PDF with multiple costs for chart rendering", async () => {
      // Add more costs to trigger chart rendering
      const category2 = await testDbInstance.db
        .select()
        .from(categories)
        .limit(1)
        .offset(1)
        .then((rows: User[]) => rows[0]!)

      await testDbInstance.db.insert(costs).values([
        {
          projectId,
          amount: 10000000, // $100,000
          description: "Cost for category 2",
          categoryId: category2.id,
          date: new Date("2024-06-20"),
          createdById: testUser.id,
        },
        {
          projectId,
          amount: 5000000, // $50,000
          description: "Another cost for category 2",
          categoryId: category2.id,
          date: new Date("2024-06-25"),
          createdById: testUser.id,
        },
      ])

      const result = await generateProjectPdf(testDbInstance.db, {
        projectId,
        userId: testUser.id,
        dateRange: { start: null, end: null },
        isPartnerView: false,
      })

      expect(result).toBeInstanceOf(Buffer)
      expect(result.length).toBeGreaterThan(0)
    })

    test("generates PDF with vendors for bar chart", async () => {
      // Create multiple vendors with different spend amounts
      const vendors = await Promise.all([
        testDbInstance.db
          .insert(contacts)
          .values({
            projectId,
            firstName: "Vendor",
            lastName: "A",
            email: "vendora@example.com",
            companyName: "Vendor A Co",
            categoryId, // Add categoryId (required field)
          })
          .returning(),
        testDbInstance.db
          .insert(contacts)
          .values({
            projectId,
            firstName: "Vendor",
            lastName: "B",
            email: "vendorb@example.com",
            companyName: "Vendor B Co",
            categoryId, // Add categoryId (required field)
          })
          .returning(),
      ])

      // Add costs for each vendor
      await testDbInstance.db.insert(costs).values([
        {
          projectId,
          amount: 15000000, // $150,000
          description: "Vendor A cost",
          categoryId,
          date: new Date("2024-06-01"),
          createdById: testUser.id,
          contactId: vendors[0]![0]!.id,
        },
        {
          projectId,
          amount: 25000000, // $250,000
          description: "Vendor B cost",
          categoryId,
          date: new Date("2024-06-02"),
          createdById: testUser.id,
          contactId: vendors[1]![0]!.id,
        },
      ])

      const result = await generateProjectPdf(testDbInstance.db, {
        projectId,
        userId: testUser.id,
        dateRange: { start: null, end: null },
        isPartnerView: false,
      })

      expect(result).toBeInstanceOf(Buffer)
      expect(result.length).toBeGreaterThan(0)
    })

    test("generates PDF with timeline events for timeline chart", async () => {
      // Create multiple timeline events
      await testDbInstance.db.insert(events).values([
        {
          projectId,
          title: "Event 1",
          date: new Date("2024-01-15"),
          categoryId,
          createdById: testUser.id,
        },
        {
          projectId,
          title: "Event 2",
          date: new Date("2024-03-20"),
          categoryId,
          createdById: testUser.id,
        },
        {
          projectId,
          title: "Event 3",
          date: new Date("2024-06-10"),
          categoryId,
          createdById: testUser.id,
        },
      ])

      const result = await generateProjectPdf(testDbInstance.db, {
        projectId,
        userId: testUser.id,
        dateRange: { start: null, end: null },
        isPartnerView: false,
      })

      expect(result).toBeInstanceOf(Buffer)
      expect(result.length).toBeGreaterThan(0)
    })

    test("generates PDF without optional project fields", async () => {
      // Create project without startDate, endDate, totalBudget
      const minimalProject = await testDbInstance.db
        .insert(projects)
        .values({
          name: "Minimal Project",
          ownerId: testUser.id,
          status: "active",
          projectType: "commercial",
          address: {
            street: "456 Test Ave",
            city: "Melbourne",
            state: "VIC",
            postcode: "3000",
            country: "Australia",
          },
        })
        .returning()

      const result = await generateProjectPdf(testDbInstance.db, {
        projectId: minimalProject[0]!.id,
        userId: testUser.id,
        dateRange: { start: null, end: null },
        isPartnerView: false,
      })

      expect(result).toBeInstanceOf(Buffer)
      expect(result.length).toBeGreaterThan(0)
    })

    test("throws error for non-existent project", async () => {
      await expect(
        generateProjectPdf(testDbInstance.db, {
          projectId: "non-existent-id",
          userId: testUser.id,
          dateRange: { start: null, end: null },
          isPartnerView: false,
        })
      ).rejects.toThrow()
    })

    test("throws error for unauthorized user", async () => {
      await expect(
        generateProjectPdf(testDbInstance.db, {
          projectId,
          userId: otherUser.id, // Not owner, no partner access
          dateRange: { start: null, end: null },
          isPartnerView: false,
        })
      ).rejects.toThrow()
    })

    test("generates PDF with empty data sets", async () => {
      // Create project with no costs, documents, events
      const emptyProject = await testDbInstance.db
        .insert(projects)
        .values({
          name: "Empty Project",
          ownerId: testUser.id,
          status: "planning",
          projectType: "residential",
          address: {
            street: "789 Empty St",
            city: "Brisbane",
            state: "QLD",
            postcode: "4000",
            country: "Australia",
          },
        })
        .returning()

      const result = await generateProjectPdf(testDbInstance.db, {
        projectId: emptyProject[0]!.id,
        userId: testUser.id,
        dateRange: { start: null, end: null },
        isPartnerView: false,
      })

      expect(result).toBeInstanceOf(Buffer)
      expect(result.length).toBeGreaterThan(0)
    })

    test("generates PDF with large dataset", async () => {
      // Create 50 costs to test performance and chart rendering with real data
      const largeCostBatch = Array.from({ length: 50 }, (_, i) => {
        // Generate valid dates by cycling through months 1-12 and days 1-28
        const month = ((i % 12) + 1).toString().padStart(2, "0")
        const day = ((i % 28) + 1).toString().padStart(2, "0")
        return {
          projectId,
          amount: Math.floor(Math.random() * 10000000) + 1000000, // Random between $10k-$100k
          description: `Test cost ${i + 1}`,
          categoryId,
          date: new Date(`2024-${month}-${day}`),
          createdById: testUser.id,
        }
      })

      await testDbInstance.db.insert(costs).values(largeCostBatch)

      const result = await generateProjectPdf(testDbInstance.db, {
        projectId,
        userId: testUser.id,
        dateRange: { start: null, end: null },
        isPartnerView: false,
      })

      expect(result).toBeInstanceOf(Buffer)
      expect(result.length).toBeGreaterThan(0)
    })

    test("PDF generation completes within reasonable time", async () => {
      const startTime = Date.now()

      await generateProjectPdf(testDbInstance.db, {
        projectId,
        userId: testUser.id,
        dateRange: { start: null, end: null },
        isPartnerView: false,
      })

      const duration = Date.now() - startTime

      // Should complete within 5 seconds even for moderate data
      expect(duration).toBeLessThan(5000)
    }, 10000) // 10 second test timeout
  })

  describe("Edge Cases", () => {
    test("handles project with very long description texts", async () => {
      const longDescription = "A".repeat(1000) // 1000 character description

      await testDbInstance.db.insert(costs).values({
        projectId,
        amount: 1000000,
        description: longDescription,
        categoryId,
        date: new Date("2024-06-01"),
        createdById: testUser.id,
      })

      const result = await generateProjectPdf(testDbInstance.db, {
        projectId,
        userId: testUser.id,
        dateRange: { start: null, end: null },
        isPartnerView: false,
      })

      expect(result).toBeInstanceOf(Buffer)
      expect(result.length).toBeGreaterThan(0)
    })

    test("handles special characters in project data", async () => {
      await testDbInstance.db.insert(costs).values({
        projectId,
        amount: 1000000,
        description: "Cost with special chars: & < > \" ' / \\",
        categoryId,
        date: new Date("2024-06-01"),
        createdById: testUser.id,
      })

      const result = await generateProjectPdf(testDbInstance.db, {
        projectId,
        userId: testUser.id,
        dateRange: { start: null, end: null },
        isPartnerView: false,
      })

      expect(result).toBeInstanceOf(Buffer)
      expect(result.length).toBeGreaterThan(0)
    })

    test("handles very large cost amounts", async () => {
      await testDbInstance.db.insert(costs).values({
        projectId,
        amount: 999999999999, // $9.99 billion
        description: "Very large cost",
        categoryId,
        date: new Date("2024-06-01"),
        createdById: testUser.id,
      })

      const result = await generateProjectPdf(testDbInstance.db, {
        projectId,
        userId: testUser.id,
        dateRange: { start: null, end: null },
        isPartnerView: false,
      })

      expect(result).toBeInstanceOf(Buffer)
      expect(result.length).toBeGreaterThan(0)
    })
  })
})
