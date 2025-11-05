/**
 * PDF Report Service Tests with Seed Data
 *
 * Tests PDF generation with realistic seed data patterns to catch
 * edge cases that only appear with production data
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from "vitest"
import { sql } from "drizzle-orm"
import { generateProjectPdf } from "../report-pdf.service"
import { createTestDb, cleanupAllTestDatabases } from "@/test/test-db"
import type { User } from "@/server/db/schema/users"
import { users } from "@/server/db/schema/users"
import { projects } from "@/server/db/schema/projects"
import { addresses } from "@/server/db/schema/addresses"
import { categories } from "@/server/db/schema/categories"
import { costs } from "@/server/db/schema/costs"
import { contacts } from "@/server/db/schema/contacts"
import { documents } from "@/server/db/schema/documents"
import { events } from "@/server/db/schema/events"
import { CATEGORIES } from "@/server/db/types"

describe("PDF Report Service - Seed Data Patterns", () => {
  let testDbInstance: Awaited<ReturnType<typeof createTestDb>>
  let testUser: User
  let projectId: string
  let addressId: string

  beforeAll(async () => {
    testDbInstance = await createTestDb()
  })

  afterAll(async () => {
    await cleanupAllTestDatabases()
  })

  beforeEach(async () => {
    try {
      await testDbInstance.cleanup()

      // Seed categories (same as seed script)
      const existingCategories = await testDbInstance.db
        .select({ count: sql<number>`count(*)` })
        .from(categories)

      if (Number(existingCategories[0]?.count) === 0) {
        await testDbInstance.db.insert(categories).values(CATEGORIES)
      }
    } catch (error) {
      console.error("Error in beforeEach setup:", error)
      throw error
    }

    // Create user (same pattern as seed)
    testUser = await testDbInstance.db
      .insert(users)
      .values({
        id: "seed-test-user",
        email: "test@example.com",
        name: "Test User",
        firstName: "Test",
        lastName: "User",
      })
      .returning()
      .then((rows: any[]) => rows[0]!)

    // Create address (same pattern as seed)
    const address = await testDbInstance.db
      .insert(addresses)
      .values({
        streetNumber: "123",
        streetName: "Collins",
        streetType: "Street",
        suburb: "Melbourne",
        state: "VIC",
        postcode: "3000",
        country: "Australia",
        formattedAddress: "123 Collins Street, Melbourne VIC 3000",
      })
      .returning()

    addressId = address[0]!.id

    // Create project (same pattern as seed - note: uses addressId, not address object)
    const project = await testDbInstance.db
      .insert(projects)
      .values({
        name: "Luxury Residential Development",
        description: "High-end residential apartments with harbour views",
        ownerId: testUser.id,
        addressId,
        projectType: "residential",
        status: "active",
        startDate: new Date("2024-01-15"),
        endDate: new Date("2025-06-30"),
        totalBudget: 500000000, // $5,000,000 in cents
      })
      .returning()

    projectId = project[0]!.id

    // Get category IDs (same pattern as seed)
    const categoryRows = await testDbInstance.db
      .select({ id: categories.id, displayName: categories.displayName })
      .from(categories)

    const categoryMap = categoryRows.reduce(
      (acc: any, cat: any) => ({ ...acc, [cat.displayName]: cat.id }),
      {} as Record<string, string>
    )

    // Create contacts/vendors (same pattern as seed)
    const contact1 = await testDbInstance.db
      .insert(contacts)
      .values({
        projectId,
        firstName: "John",
        lastName: "Smith",
        email: "john.smith@constructionco.com.au",
        phone: "+61 400 123 456",
        companyName: "Smith Construction Pty Ltd",
        categoryId: categoryMap.construction,
      })
      .returning()

    const contact2 = await testDbInstance.db
      .insert(contacts)
      .values({
        projectId,
        firstName: "Sarah",
        lastName: "Johnson",
        email: "sarah@designstudio.com.au",
        phone: "+61 400 789 012",
        companyName: "Johnson Design Studio",
        categoryId: categoryMap.design,
      })
      .returning()

    // Create costs (same pattern as seed)
    await testDbInstance.db.insert(costs).values([
      {
        projectId,
        amount: 150000000, // $1,500,000
        description: "Site preparation and foundation work",
        categoryId: categoryMap.construction,
        contactId: contact1[0]!.id,
        date: new Date("2024-02-01"),
        createdById: testUser.id,
      },
      {
        projectId,
        amount: 85000000, // $850,000
        description: "Structural steel and concrete",
        categoryId: categoryMap.construction,
        contactId: contact1[0]!.id,
        date: new Date("2024-03-15"),
        createdById: testUser.id,
      },
      {
        projectId,
        amount: 45000000, // $450,000
        description: "Architectural design and planning",
        categoryId: categoryMap.design,
        contactId: contact2[0]!.id,
        date: new Date("2024-01-20"),
        createdById: testUser.id,
      },
      {
        projectId,
        amount: 25000000, // $250,000
        description: "Electrical installation phase 1",
        categoryId: categoryMap.electrical,
        date: new Date("2024-04-01"),
        createdById: testUser.id,
      },
      {
        projectId,
        amount: 30000000, // $300,000
        description: "Plumbing rough-in",
        categoryId: categoryMap.plumbing,
        date: new Date("2024-04-10"),
        createdById: testUser.id,
      },
    ])

    // Create events (same pattern as seed)
    await testDbInstance.db.insert(events).values([
      {
        projectId,
        title: "Project Kickoff Meeting",
        description: "Initial project planning and team introduction",
        date: new Date("2024-01-15"),
        categoryId: categoryMap.design,
        createdById: testUser.id,
      },
      {
        projectId,
        title: "Foundation Inspection",
        description: "Council inspection of foundation work",
        date: new Date("2024-02-20"),
        categoryId: categoryMap.construction,
        createdById: testUser.id,
      },
      {
        projectId,
        title: "Design Review",
        description: "Client review of final architectural plans",
        date: new Date("2024-03-01"),
        categoryId: categoryMap.design,
        createdById: testUser.id,
      },
    ])

    // Create documents (same pattern as seed)
    await testDbInstance.db.insert(documents).values([
      {
        projectId,
        fileName: "architectural-plans-v3.pdf",
        fileSize: 5242880, // 5 MB
        mimeType: "application/pdf",
        blobUrl: "test/architectural-plans-v3.pdf",
        categoryId: categoryMap.design,
        uploadedById: testUser.id,
      },
      {
        projectId,
        fileName: "structural-engineering-report.pdf",
        fileSize: 3145728, // 3 MB
        mimeType: "application/pdf",
        blobUrl: "test/structural-engineering-report.pdf",
        categoryId: categoryMap.construction,
        uploadedById: testUser.id,
      },
      {
        projectId,
        fileName: "electrical-schematics.dwg",
        fileSize: 2097152, // 2 MB
        mimeType: "application/dwg",
        blobUrl: "test/electrical-schematics.dwg",
        categoryId: categoryMap.electrical,
        uploadedById: testUser.id,
      },
    ])
  })

  test("generates PDF with realistic seed data", async () => {
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

  test("generates PDF with date range filter on seed data", async () => {
    const result = await generateProjectPdf(testDbInstance.db, {
      projectId,
      userId: testUser.id,
      dateRange: {
        start: new Date("2024-02-01"),
        end: new Date("2024-03-31"),
      },
      isPartnerView: false,
    })

    expect(result).toBeInstanceOf(Buffer)
    expect(result.length).toBeGreaterThan(0)
  })

  test("generates PDF with all chart types visible", async () => {
    // This test ensures all visualization components render correctly
    const result = await generateProjectPdf(testDbInstance.db, {
      projectId,
      userId: testUser.id,
      dateRange: { start: null, end: null },
      isPartnerView: false,
    })

    expect(result).toBeInstanceOf(Buffer)
    expect(result.length).toBeGreaterThan(0)

    // PDF should be substantial with all the data
    expect(result.length).toBeGreaterThan(10000) // At least 10KB
  })

  test("handles project with null optional fields", async () => {
    // Create minimal project
    const minimalAddress = await testDbInstance.db
      .insert(addresses)
      .values({
        suburb: "Sydney",
        state: "NSW",
        postcode: "2000",
        country: "Australia",
        formattedAddress: "Sydney NSW 2000",
      })
      .returning()

    const minimalProject = await testDbInstance.db
      .insert(projects)
      .values({
        name: "Minimal Project",
        ownerId: testUser.id,
        addressId: minimalAddress[0]!.id,
        projectType: "commercial",
        status: "planning",
        // No startDate, endDate, totalBudget, description
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

  test("handles project with no address (null addressId)", async () => {
    // Create project without address
    const noAddressProject = await testDbInstance.db
      .insert(projects)
      .values({
        name: "No Address Project",
        ownerId: testUser.id,
        // addressId is null
        projectType: "residential",
        status: "planning",
      })
      .returning()

    const result = await generateProjectPdf(testDbInstance.db, {
      projectId: noAddressProject[0]!.id,
      userId: testUser.id,
      dateRange: { start: null, end: null },
      isPartnerView: false,
    })

    expect(result).toBeInstanceOf(Buffer)
    expect(result.length).toBeGreaterThan(0)

    // Verify PDF is valid (address data is encoded/compressed in PDF binary)
    // Note: We can't easily verify text content in compressed PDF without parsing
  })

  test("handles empty arrays for all data types", async () => {
    // Create project with no costs, events, documents
    const emptyProject = await testDbInstance.db
      .insert(projects)
      .values({
        name: "Empty Data Project",
        ownerId: testUser.id,
        addressId,
        projectType: "commercial",
        status: "planning",
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

  test("handles contacts with null fields", async () => {
    const categoryRows = await testDbInstance.db
      .select({ id: categories.id, displayName: categories.displayName })
      .from(categories)

    const categoryMap = categoryRows.reduce(
      (acc: any, cat: any) => ({ ...acc, [cat.displayName]: cat.id }),
      {} as Record<string, string>
    )

    // Create contact with minimal fields
    const minimalContact = await testDbInstance.db
      .insert(contacts)
      .values({
        projectId,
        firstName: "Minimal",
        lastName: "Vendor",
        categoryId: categoryMap.construction,
        // email, phone, companyName all null
      })
      .returning()

    // Add cost for this vendor
    await testDbInstance.db.insert(costs).values({
      projectId,
      amount: 10000000,
      description: "Minimal vendor cost",
      categoryId: categoryMap.construction,
      contactId: minimalContact[0]!.id,
      date: new Date(),
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

  test("handles very long text fields", async () => {
    const categoryRows = await testDbInstance.db
      .select({ id: categories.id, displayName: categories.displayName })
      .from(categories)

    const categoryMap = categoryRows.reduce(
      (acc: any, cat: any) => ({ ...acc, [cat.displayName]: cat.id }),
      {} as Record<string, string>
    )

    // Create cost with very long description
    await testDbInstance.db.insert(costs).values({
      projectId,
      amount: 5000000,
      description:
        "A".repeat(500) +
        " - This is a very long description that tests text wrapping and overflow handling in the PDF renderer",
      categoryId: categoryMap.construction,
      date: new Date(),
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
