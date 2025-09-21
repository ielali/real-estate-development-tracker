import { db, contacts, costs, documents, events } from "./index"
import { isValidCategoryForType, getCategoryById } from "./types"

export async function validateDatabaseCategories() {
  console.log("🔍 Validating category references in database...")

  const issues = []

  // Validate contacts
  console.log("Checking contacts...")
  const contactsData = await db.select().from(contacts)
  for (const contact of contactsData) {
    if (!isValidCategoryForType(contact.categoryId, "contact")) {
      const category = getCategoryById(contact.categoryId)
      issues.push({
        table: "contacts",
        id: contact.id,
        categoryId: contact.categoryId,
        issue: category
          ? `Category '${contact.categoryId}' is type '${category.type}', expected 'contact'`
          : `Unknown category '${contact.categoryId}'`,
      })
    }
  }

  // Validate costs
  console.log("Checking costs...")
  const costsData = await db.select().from(costs)
  for (const cost of costsData) {
    if (!isValidCategoryForType(cost.categoryId, "cost")) {
      const category = getCategoryById(cost.categoryId)
      issues.push({
        table: "costs",
        id: cost.id,
        categoryId: cost.categoryId,
        issue: category
          ? `Category '${cost.categoryId}' is type '${category.type}', expected 'cost'`
          : `Unknown category '${cost.categoryId}'`,
      })
    }
  }

  // Validate documents
  console.log("Checking documents...")
  const documentsData = await db.select().from(documents)
  for (const document of documentsData) {
    if (!isValidCategoryForType(document.categoryId, "document")) {
      const category = getCategoryById(document.categoryId)
      issues.push({
        table: "documents",
        id: document.id,
        categoryId: document.categoryId,
        issue: category
          ? `Category '${document.categoryId}' is type '${category.type}', expected 'document'`
          : `Unknown category '${document.categoryId}'`,
      })
    }
  }

  // Validate events
  console.log("Checking events...")
  const eventsData = await db.select().from(events)
  for (const event of eventsData) {
    if (!isValidCategoryForType(event.categoryId, "event")) {
      const category = getCategoryById(event.categoryId)
      issues.push({
        table: "events",
        id: event.id,
        categoryId: event.categoryId,
        issue: category
          ? `Category '${event.categoryId}' is type '${category.type}', expected 'event'`
          : `Unknown category '${event.categoryId}'`,
      })
    }
  }

  if (issues.length === 0) {
    console.log("✅ All category references are valid!")
    console.log(`Validated:
    - ${contactsData.length} contacts
    - ${costsData.length} costs
    - ${documentsData.length} documents
    - ${eventsData.length} events`)
    return { valid: true, issues: [] }
  } else {
    console.log(`❌ Found ${issues.length} category validation issues:`)
    for (const issue of issues) {
      console.log(`  - ${issue.table}[${issue.id}]: ${issue.issue}`)
    }
    return { valid: false, issues }
  }
}

// Run validation if this file is executed directly
if (require.main === module) {
  validateDatabaseCategories()
    .then((result) => {
      process.exit(result.valid ? 0 : 1)
    })
    .catch((error) => {
      console.error("Validation failed:", error)
      process.exit(1)
    })
}
