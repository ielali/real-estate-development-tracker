#!/usr/bin/env tsx
/**
 * Test script for inserting documents into the database
 *
 * This script tests document table insertions to help debug any issues
 * with the documents table schema, constraints, or data flow.
 *
 * Usage:
 *   bun tsx src/server/db/test-document-insert.ts
 */

import { db, documents, projects, users, categories } from "./index"
import { eq } from "drizzle-orm"

async function testDocumentInsert() {
  console.log("🧪 Starting document insert test...\n")

  try {
    // Step 1: Verify categories exist
    console.log("1️⃣ Checking for document categories...")
    const docCategories = await db.select().from(categories).where(eq(categories.type, "document"))

    if (docCategories.length === 0) {
      throw new Error("No document categories found! Run migrations first.")
    }

    console.log(`   ✓ Found ${docCategories.length} document categories`)
    docCategories.forEach((cat) => {
      console.log(`     - ${cat.id}: ${cat.displayName}`)
    })

    // Step 2: Get a test user
    console.log("\n2️⃣ Getting test user...")
    const testUser = await db.select().from(users).limit(1)

    if (testUser.length === 0) {
      throw new Error("No users found! Run seed script first: bun run db:seed")
    }

    console.log(`   ✓ Using user: ${testUser[0].email} (${testUser[0].id})`)

    // Step 3: Get a test project
    console.log("\n3️⃣ Getting test project...")
    const testProject = await db.select().from(projects).limit(1)

    if (testProject.length === 0) {
      throw new Error("No projects found! Run seed script first: bun run db:seed")
    }

    console.log(`   ✓ Using project: ${testProject[0].name} (${testProject[0].id})`)

    // Step 4: Count existing documents
    console.log("\n4️⃣ Counting existing documents...")
    const existingDocs = await db.select().from(documents)
    console.log(`   ✓ Found ${existingDocs.length} existing documents`)

    // Step 5: Insert test documents
    console.log("\n5️⃣ Inserting test documents...")

    const testDocuments = [
      {
        projectId: testProject[0].id,
        fileName: "test-invoice-001.pdf",
        fileSize: 256789,
        mimeType: "application/pdf",
        blobUrl: "blob://test/test-invoice-001.pdf",
        categoryId: "invoices",
        uploadedById: testUser[0].id,
      },
      {
        projectId: testProject[0].id,
        fileName: "test-photo-before.jpg",
        fileSize: 1536789,
        mimeType: "image/jpeg",
        blobUrl: "blob://test/test-photo-before.jpg",
        thumbnailUrl: "blob://test/test-photo-before-thumb.jpg",
        categoryId: "photos",
        uploadedById: testUser[0].id,
      },
      {
        projectId: testProject[0].id,
        fileName: "test-blueprint-v1.pdf",
        fileSize: 4567890,
        mimeType: "application/pdf",
        blobUrl: "blob://test/test-blueprint-v1.pdf",
        categoryId: "plans",
        uploadedById: testUser[0].id,
      },
      {
        projectId: testProject[0].id,
        fileName: "test-permit-application.pdf",
        fileSize: 892345,
        mimeType: "application/pdf",
        blobUrl: "blob://test/test-permit-application.pdf",
        categoryId: "permits",
        uploadedById: testUser[0].id,
      },
    ]

    const insertedDocs = await db.insert(documents).values(testDocuments).returning()

    console.log(`   ✓ Successfully inserted ${insertedDocs.length} test documents`)

    insertedDocs.forEach((doc, index) => {
      console.log(`\n   Document ${index + 1}:`)
      console.log(`     ID: ${doc.id}`)
      console.log(`     File: ${doc.fileName}`)
      console.log(`     Size: ${(doc.fileSize / 1024).toFixed(2)} KB`)
      console.log(`     Type: ${doc.mimeType}`)
      console.log(`     Category: ${doc.categoryId}`)
      console.log(`     Blob URL: ${doc.blobUrl}`)
      console.log(`     Thumbnail: ${doc.thumbnailUrl || "N/A"}`)
      console.log(`     Created: ${doc.createdAt}`)
    })

    // Step 6: Verify the inserts
    console.log("\n6️⃣ Verifying inserts...")
    const allDocs = await db.select().from(documents)
    console.log(`   ✓ Total documents in database: ${allDocs.length}`)

    // Step 7: Test retrieval with joins
    console.log("\n7️⃣ Testing document retrieval with project info...")
    const docsWithProject = await db
      .select({
        documentId: documents.id,
        fileName: documents.fileName,
        fileSize: documents.fileSize,
        categoryId: documents.categoryId,
        projectName: projects.name,
        projectId: projects.id,
      })
      .from(documents)
      .innerJoin(projects, eq(documents.projectId, projects.id))
      .limit(3)

    console.log(`   ✓ Retrieved ${docsWithProject.length} documents with project info:`)
    docsWithProject.forEach((doc) => {
      console.log(`     - ${doc.fileName} → Project: ${doc.projectName}`)
    })

    // Step 8: Test filtering by category
    console.log("\n8️⃣ Testing category filtering...")
    const photoDocs = await db.select().from(documents).where(eq(documents.categoryId, "photos"))

    console.log(`   ✓ Found ${photoDocs.length} photo documents`)

    console.log("\n✅ All document insert tests passed!")
    console.log("\n📊 Summary:")
    console.log(`   - Documents inserted: ${insertedDocs.length}`)
    console.log(`   - Total documents: ${allDocs.length}`)
    console.log(`   - Photo documents: ${photoDocs.length}`)
    console.log(`   - Database: Connected successfully`)
    console.log(`   - Schema: Valid and working`)
  } catch (error) {
    console.error("\n❌ Document insert test failed!")
    console.error("Error details:", error)

    if (error instanceof Error) {
      console.error("\nError message:", error.message)
      console.error("Stack trace:", error.stack)
    }

    throw error
  }
}

// Run the test
testDocumentInsert()
  .then(() => {
    console.log("\n🎉 Test completed successfully")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n💥 Test failed with error:", error)
    process.exit(1)
  })
