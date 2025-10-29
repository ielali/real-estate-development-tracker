import {
  db,
  users,
  accounts,
  addresses,
  projects,
  costs,
  contacts,
  documents,
  events,
  projectAccess,
  projectContact,
  auditLog,
  categories,
} from "./index"
import { formatAddress, CATEGORIES } from "./types"

async function seed() {
  console.log("🌱 Starting seed process...")

  try {
    console.log("Clearing existing data...")
    await db.delete(auditLog)
    await db.delete(projectContact)
    await db.delete(projectAccess)
    await db.delete(events)
    await db.delete(documents)
    await db.delete(costs)
    await db.delete(contacts)
    await db.delete(projects)
    await db.delete(addresses)
    await db.delete(accounts)
    await db.delete(users)
    await db.delete(categories)

    console.log("Creating categories...")
    await db.insert(categories).values(CATEGORIES)

    console.log("Creating users...")

    // Create basic user records for seeding purposes
    // Note: Passwords will be set through Better Auth API later
    const adminUser = await db
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        email: "imad.elali@pm.me",
        name: "Admin User",
        firstName: "Admin",
        lastName: "User",
        role: "admin",
      })
      .returning()
      .then((rows: (typeof users.$inferSelect)[]) => rows[0])

    const partnerUser1 = await db
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        email: "subscriptions.ie@pm.me",
        name: "Partner One",
        firstName: "Partner",
        lastName: "One",
        role: "partner",
      })
      .returning()
      .then((rows: (typeof users.$inferSelect)[]) => rows[0])

    const partnerUser2 = await db
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        email: "bitwave.pty@pm.me",
        name: "Partner Two",
        firstName: "Partner",
        lastName: "Two",
        role: "partner",
      })
      .returning()
      .then((rows: (typeof users.$inferSelect)[]) => rows[0])

    console.log("Creating addresses...")
    const toorakAddress = await db
      .insert(addresses)
      .values({
        streetNumber: "123",
        streetName: "Collins",
        streetType: "Street",
        suburb: "Toorak",
        state: "VIC",
        postcode: "3142",
        country: "Australia",
        formattedAddress: formatAddress({
          streetNumber: "123",
          streetName: "Collins",
          streetType: "Street",
          suburb: "Toorak",
          state: "VIC",
          postcode: "3142",
          country: "Australia",
        }),
      })
      .returning()
      .then((rows: (typeof addresses.$inferSelect)[]) => rows[0])

    console.log("Creating projects...")
    const activeRenovation = await db
      .insert(projects)
      .values({
        name: "Toorak Victorian Renovation",
        description: "Complete renovation of heritage-listed Victorian terrace house",
        addressId: toorakAddress.id,
        projectType: "renovation",
        status: "active",
        startDate: new Date("2024-01-15"),
        endDate: new Date("2024-06-30"),
        ownerId: adminUser.id,
        totalBudget: 85000000,
      })
      .returning()
      .then((rows: (typeof projects.$inferSelect)[]) => rows[0])

    const bondiAddress = await db
      .insert(addresses)
      .values({
        streetNumber: "456",
        streetName: "Coastal",
        streetType: "Drive",
        suburb: "Bondi Beach",
        state: "NSW",
        postcode: "2026",
        country: "Australia",
        formattedAddress: formatAddress({
          streetNumber: "456",
          streetName: "Coastal",
          streetType: "Drive",
          suburb: "Bondi Beach",
          state: "NSW",
          postcode: "2026",
          country: "Australia",
        }),
      })
      .returning()
      .then((rows: (typeof addresses.$inferSelect)[]) => rows[0])

    const southYarraAddress = await db
      .insert(addresses)
      .values({
        streetNumber: "789",
        streetName: "Chapel",
        streetType: "Street",
        suburb: "South Yarra",
        state: "VIC",
        postcode: "3141",
        country: "Australia",
        formattedAddress: formatAddress({
          streetNumber: "789",
          streetName: "Chapel",
          streetType: "Street",
          suburb: "South Yarra",
          state: "VIC",
          postcode: "3141",
          country: "Australia",
        }),
      })
      .returning()
      .then((rows: (typeof addresses.$inferSelect)[]) => rows[0])

    const onHoldNewBuild = await db
      .insert(projects)
      .values({
        name: "Bondi Beach New Build",
        description: "Modern 4-bedroom family home with ocean views",
        addressId: bondiAddress.id,
        projectType: "new_build",
        status: "on_hold",
        startDate: new Date("2024-03-01"),
        ownerId: adminUser.id,
        totalBudget: 180000000,
      })
      .returning()
      .then((rows: (typeof projects.$inferSelect)[]) => rows[0])

    const completedDevelopment = await db
      .insert(projects)
      .values({
        name: "South Yarra Mixed-Use Development",
        description: "Commercial and residential mixed-use building with retail",
        addressId: southYarraAddress.id,
        projectType: "development",
        status: "completed",
        startDate: new Date("2023-06-01"),
        endDate: new Date("2024-01-15"),
        ownerId: adminUser.id,
        totalBudget: 450000000,
      })
      .returning()
      .then((rows: (typeof projects.$inferSelect)[]) => rows[0])

    console.log("Creating sample contact addresses...")
    const businessAddress1 = await db
      .insert(addresses)
      .values({
        streetNumber: "42",
        streetName: "Industrial",
        streetType: "Drive",
        suburb: "Richmond",
        state: "VIC",
        postcode: "3121",
        country: "Australia",
        formattedAddress: formatAddress({
          streetNumber: "42",
          streetName: "Industrial",
          streetType: "Drive",
          suburb: "Richmond",
          state: "VIC",
          postcode: "3121",
          country: "Australia",
        }),
      })
      .returning()
      .then((rows: (typeof addresses.$inferSelect)[]) => rows[0])

    const businessAddress2 = await db
      .insert(addresses)
      .values({
        streetNumber: "88",
        streetName: "Collins",
        streetType: "Street",
        suburb: "Melbourne",
        state: "VIC",
        postcode: "3000",
        country: "Australia",
        formattedAddress: formatAddress({
          streetNumber: "88",
          streetName: "Collins",
          streetType: "Street",
          suburb: "Melbourne",
          state: "VIC",
          postcode: "3000",
          country: "Australia",
        }),
      })
      .returning()
      .then((rows: (typeof addresses.$inferSelect)[]) => rows[0])

    console.log("Creating contacts...")
    const contactsData = [
      {
        firstName: "Bob",
        lastName: "Builder",
        company: "BuildRight Construction",
        categoryId: "general_contractor",
        email: "bob@buildright.com.au",
        phone: "03-9555-0001",
        mobile: "0400-555-001",
        addressId: businessAddress1.id,
      },
      {
        firstName: "Emma",
        lastName: "Electric",
        company: "PowerUp Electrical",
        categoryId: "electrician",
        email: "emma@powerup.com.au",
        phone: "03-9555-0002",
        mobile: "0400-555-002",
        addressId: businessAddress2.id,
      },
      {
        firstName: "Pete",
        lastName: "Pipes",
        company: "FlowMaster Plumbing",
        categoryId: "plumber",
        email: "pete@flowmaster.com.au",
        phone: "03-9555-0003",
        mobile: "0400-555-003",
      },
      {
        firstName: "Carol",
        lastName: "Carpenter",
        company: "WoodWorks Inc",
        categoryId: "carpenter",
        email: "carol@woodworks.com.au",
        phone: "03-9555-0004",
      },
      {
        firstName: "Frank",
        lastName: "Floors",
        company: "Premium Flooring",
        categoryId: "flooring",
        email: "frank@premiumfloors.com.au",
        mobile: "0400-555-005",
      },
      {
        firstName: "Wendy",
        lastName: "Windows",
        company: "ClearView Windows",
        categoryId: "glazier",
        email: "wendy@clearview.com.au",
        phone: "03-9555-0006",
      },
      {
        firstName: "Ron",
        lastName: "Roofer",
        company: "TopShield Roofing",
        categoryId: "roofer",
        email: "ron@topshield.com.au",
        phone: "03-9555-0007",
      },
      {
        firstName: "Harry",
        lastName: "HVAC",
        company: "Climate Control Systems",
        categoryId: "hvac",
        email: "harry@climatecontrol.com.au",
        mobile: "0400-555-008",
      },
      {
        firstName: "Paula",
        lastName: "Painter",
        company: "Perfect Paint Co",
        categoryId: "painter",
        email: "paula@perfectpaint.com.au",
        phone: "03-9555-0009",
      },
      {
        firstName: "Larry",
        lastName: "Landscaper",
        company: "Green Gardens",
        categoryId: "landscaper",
        email: "larry@greengardens.com.au",
        mobile: "0400-555-010",
      },
      {
        firstName: "Sam",
        lastName: "Supplier",
        company: "BuildMart Supplies",
        categoryId: "building_supplies",
        email: "sam@buildmart.com.au",
        phone: "03-9555-0011",
      },
      {
        firstName: "Alice",
        lastName: "Architect",
        company: "Modern Design Studio",
        categoryId: "architect",
        email: "alice@moderndesign.com.au",
        phone: "03-9555-0012",
      },
      {
        firstName: "Ian",
        lastName: "Inspector",
        company: "VIC Building Authority",
        categoryId: "building_inspector",
        email: "ian@vba.vic.gov.au",
        phone: "03-9555-0013",
      },
      {
        firstName: "Rachel",
        lastName: "Realtor",
        company: "Prime Properties",
        categoryId: "real_estate_agent",
        email: "rachel@primeprops.com.au",
        mobile: "0400-555-014",
      },
      {
        firstName: "Dan",
        lastName: "Drywaller",
        company: "Smooth Walls Inc",
        categoryId: "carpenter",
        email: "dan@smoothwalls.com.au",
        phone: "03-9555-0015",
      },
    ]

    const createdContacts = await db.insert(contacts).values(contactsData).returning()

    console.log("Creating costs...")
    const costsData = [
      {
        projectId: activeRenovation.id,
        amount: 1500000,
        description: "Demolition and site prep",
        categoryId: "cost_demolition",
        date: new Date("2024-01-20"),
        contactId: createdContacts[0].id,
        createdById: adminUser.id,
      },
      {
        projectId: activeRenovation.id,
        amount: 850000,
        description: "Electrical rewiring - main panel",
        categoryId: "cost_electrical",
        date: new Date("2024-01-25"),
        contactId: createdContacts[1].id,
        createdById: adminUser.id,
      },
      {
        projectId: activeRenovation.id,
        amount: 2200000,
        description: "Plumbing rough-in",
        categoryId: "cost_plumbing",
        date: new Date("2024-02-01"),
        contactId: createdContacts[2].id,
        createdById: adminUser.id,
      },
      {
        projectId: activeRenovation.id,
        amount: 3500000,
        description: "Hardwood flooring materials",
        categoryId: "cost_materials",
        date: new Date("2024-02-10"),
        contactId: createdContacts[10].id,
        createdById: adminUser.id,
      },
      {
        projectId: activeRenovation.id,
        amount: 1800000,
        description: "Kitchen cabinets",
        categoryId: "cost_carpentry",
        date: new Date("2024-02-15"),
        contactId: createdContacts[3].id,
        createdById: adminUser.id,
      },
      {
        projectId: activeRenovation.id,
        amount: 950000,
        description: "Bathroom fixtures",
        categoryId: "cost_plumbing",
        date: new Date("2024-02-20"),
        contactId: createdContacts[2].id,
        createdById: adminUser.id,
      },
      {
        projectId: activeRenovation.id,
        amount: 2100000,
        description: "HVAC system installation",
        categoryId: "cost_labor",
        date: new Date("2024-03-01"),
        contactId: createdContacts[7].id,
        createdById: adminUser.id,
      },
      {
        projectId: onHoldNewBuild.id,
        amount: 5000000,
        description: "Architectural plans",
        categoryId: "cost_design",
        date: new Date("2024-02-01"),
        contactId: createdContacts[11].id,
        createdById: adminUser.id,
      },
      {
        projectId: onHoldNewBuild.id,
        amount: 15000000,
        description: "Foundation work",
        categoryId: "cost_foundation",
        date: new Date("2024-03-15"),
        contactId: createdContacts[0].id,
        createdById: adminUser.id,
      },
      {
        projectId: onHoldNewBuild.id,
        amount: 8500000,
        description: "Framing lumber",
        categoryId: "cost_materials",
        date: new Date("2024-03-20"),
        contactId: createdContacts[10].id,
        createdById: adminUser.id,
      },
      {
        projectId: completedDevelopment.id,
        amount: 25000000,
        description: "Structural steel",
        categoryId: "cost_materials",
        date: new Date("2023-07-01"),
        createdById: adminUser.id,
      },
      {
        projectId: completedDevelopment.id,
        amount: 35000000,
        description: "Concrete pour - floors 1-3",
        categoryId: "cost_foundation",
        date: new Date("2023-08-01"),
        createdById: adminUser.id,
      },
      {
        projectId: completedDevelopment.id,
        amount: 18000000,
        description: "Elevator installation",
        categoryId: "cost_specialty",
        date: new Date("2023-09-15"),
        createdById: adminUser.id,
      },
      {
        projectId: completedDevelopment.id,
        amount: 42000000,
        description: "Glass curtain wall",
        categoryId: "cost_materials",
        date: new Date("2023-10-01"),
        contactId: createdContacts[5].id,
        createdById: adminUser.id,
      },
      {
        projectId: completedDevelopment.id,
        amount: 28000000,
        description: "Commercial HVAC systems",
        categoryId: "cost_labor",
        date: new Date("2023-11-01"),
        contactId: createdContacts[7].id,
        createdById: adminUser.id,
      },
      {
        projectId: activeRenovation.id,
        amount: 650000,
        description: "Drywall installation",
        categoryId: "cost_labor",
        date: new Date("2024-03-10"),
        contactId: createdContacts[14].id,
        createdById: adminUser.id,
      },
      {
        projectId: activeRenovation.id,
        amount: 1200000,
        description: "Interior painting",
        categoryId: "cost_painting",
        date: new Date("2024-03-20"),
        contactId: createdContacts[8].id,
        createdById: adminUser.id,
      },
      {
        projectId: activeRenovation.id,
        amount: 2800000,
        description: "Landscaping and exterior",
        categoryId: "cost_labor",
        date: new Date("2024-04-01"),
        contactId: createdContacts[9].id,
        createdById: adminUser.id,
      },
      {
        projectId: activeRenovation.id,
        amount: 3200000,
        description: "Roofing replacement",
        categoryId: "cost_labor",
        date: new Date("2024-02-05"),
        contactId: createdContacts[6].id,
        createdById: adminUser.id,
      },
      {
        projectId: activeRenovation.id,
        amount: 450000,
        description: "Permits and inspections",
        categoryId: "cost_permits_fees",
        date: new Date("2024-01-15"),
        contactId: createdContacts[12].id,
        createdById: adminUser.id,
      },
    ]

    await db.insert(costs).values(costsData)

    console.log("Creating documents...")
    const documentsData = [
      {
        projectId: activeRenovation.id,
        fileName: "demolition-permit.pdf",
        fileSize: 524288,
        mimeType: "application/pdf",
        blobUrl: "blob://demo/demolition-permit.pdf",
        categoryId: "permits",
        uploadedById: adminUser!.id,
      },
      {
        projectId: activeRenovation.id,
        fileName: "before-photo-1.jpg",
        fileSize: 2097152,
        mimeType: "image/jpeg",
        blobUrl: "blob://demo/before-photo-1.jpg",
        categoryId: "photos",
        uploadedById: adminUser!.id,
      },
      {
        projectId: activeRenovation.id,
        fileName: "electrical-invoice.pdf",
        fileSize: 312456,
        mimeType: "application/pdf",
        blobUrl: "blob://demo/electrical-invoice.pdf",
        categoryId: "invoices",
        uploadedById: adminUser!.id,
      },
      {
        projectId: onHoldNewBuild.id,
        fileName: "architectural-plans.pdf",
        fileSize: 8388608,
        mimeType: "application/pdf",
        blobUrl: "blob://demo/architectural-plans.pdf",
        categoryId: "plans",
        uploadedById: adminUser!.id,
      },
      {
        projectId: onHoldNewBuild.id,
        fileName: "building-permit-application.pdf",
        fileSize: 412678,
        mimeType: "application/pdf",
        blobUrl: "blob://demo/building-permit-application.pdf",
        categoryId: "permits",
        uploadedById: adminUser!.id,
      },
      {
        projectId: completedDevelopment.id,
        fileName: "final-inspection-report.pdf",
        fileSize: 892345,
        mimeType: "application/pdf",
        blobUrl: "blob://demo/final-inspection-report.pdf",
        categoryId: "inspections",
        uploadedById: adminUser!.id,
      },
      {
        projectId: completedDevelopment.id,
        fileName: "completion-photo-1.jpg",
        fileSize: 3145728,
        mimeType: "image/jpeg",
        blobUrl: "blob://demo/completion-photo-1.jpg",
        categoryId: "photos",
        uploadedById: adminUser!.id,
      },
      {
        projectId: completedDevelopment.id,
        fileName: "hvac-warranty.pdf",
        fileSize: 234567,
        mimeType: "application/pdf",
        blobUrl: "blob://demo/hvac-warranty.pdf",
        categoryId: "warranties",
        uploadedById: adminUser!.id,
      },
    ]

    const createdDocuments = await db.insert(documents).values(documentsData).returning()

    console.log("Creating events...")
    const eventsData = [
      {
        projectId: activeRenovation.id,
        title: "Project Kickoff",
        description: "Initial meeting with contractor",
        date: new Date("2024-01-15"),
        categoryId: "meeting",
        createdById: adminUser.id,
      },
      {
        projectId: activeRenovation.id,
        title: "Demolition Complete",
        description: "Interior demolition finished",
        date: new Date("2024-01-25"),
        categoryId: "milestone",
        createdById: adminUser.id,
      },
      {
        projectId: activeRenovation.id,
        title: "Electrical Inspection",
        description: "City electrical inspection passed",
        date: new Date("2024-02-05"),
        categoryId: "inspection",
        createdById: adminUser.id,
      },
      {
        projectId: onHoldNewBuild.id,
        title: "Design Review",
        description: "Architectural plans review meeting",
        date: new Date("2024-02-15"),
        categoryId: "meeting",
        createdById: adminUser.id,
      },
      {
        projectId: onHoldNewBuild.id,
        title: "Project On Hold",
        description: "Awaiting financing approval",
        date: new Date("2024-03-25"),
        categoryId: "milestone",
        createdById: adminUser.id,
      },
      {
        projectId: completedDevelopment.id,
        title: "Foundation Complete",
        description: "Foundation pour and curing complete",
        date: new Date("2023-08-15"),
        categoryId: "milestone",
        createdById: adminUser.id,
      },
      {
        projectId: completedDevelopment.id,
        title: "Topping Out",
        description: "Final beam placed ceremony",
        date: new Date("2023-10-30"),
        categoryId: "milestone",
        createdById: adminUser.id,
      },
      {
        projectId: completedDevelopment.id,
        title: "Certificate of Occupancy",
        description: "COO received from city",
        date: new Date("2024-01-10"),
        categoryId: "milestone",
        createdById: adminUser.id,
      },
    ]

    await db.insert(events).values(eventsData)

    console.log("Creating project access...")
    await db.insert(projectAccess).values([
      {
        projectId: activeRenovation.id,
        userId: partnerUser1.id,
        permission: "edit",
        invitedAt: new Date("2024-01-10"),
        acceptedAt: new Date("2024-01-11"),
        invitedBy: adminUser.id,
      },
      {
        projectId: activeRenovation.id,
        userId: partnerUser2.id,
        permission: "view",
        invitedAt: new Date("2024-01-12"),
        acceptedAt: new Date("2024-01-13"),
        invitedBy: adminUser.id,
      },
      {
        projectId: completedDevelopment.id,
        userId: partnerUser1.id,
        permission: "view",
        invitedAt: new Date("2023-06-01"),
        acceptedAt: new Date("2023-06-02"),
        invitedBy: adminUser.id,
      },
    ])

    console.log("Linking contacts to projects...")
    const projectContactData = [
      { projectId: activeRenovation.id, contactId: createdContacts[0].id },
      { projectId: activeRenovation.id, contactId: createdContacts[1].id },
      { projectId: activeRenovation.id, contactId: createdContacts[2].id },
      { projectId: activeRenovation.id, contactId: createdContacts[3].id },
      { projectId: activeRenovation.id, contactId: createdContacts[6].id },
      { projectId: activeRenovation.id, contactId: createdContacts[7].id },
      { projectId: activeRenovation.id, contactId: createdContacts[8].id },
      { projectId: activeRenovation.id, contactId: createdContacts[9].id },
      { projectId: onHoldNewBuild.id, contactId: createdContacts[0].id },
      { projectId: onHoldNewBuild.id, contactId: createdContacts[10].id },
      { projectId: onHoldNewBuild.id, contactId: createdContacts[11].id },
      { projectId: completedDevelopment.id, contactId: createdContacts[5].id },
      { projectId: completedDevelopment.id, contactId: createdContacts[7].id },
    ]

    await db.insert(projectContact).values(projectContactData)

    console.log("Creating audit log entries...")
    const auditData = [
      {
        userId: adminUser.id,
        action: "create",
        entityType: "project",
        entityId: activeRenovation.id,
        metadata: JSON.stringify({ name: "Main Street Renovation" }),
      },
      {
        userId: adminUser.id,
        action: "create",
        entityType: "project",
        entityId: onHoldNewBuild.id,
        metadata: JSON.stringify({ name: "Sunset District New Build" }),
      },
      {
        userId: adminUser.id,
        action: "create",
        entityType: "project",
        entityId: completedDevelopment.id,
        metadata: JSON.stringify({ name: "Downtown Mixed-Use Development" }),
      },
      {
        userId: adminUser.id,
        action: "update",
        entityType: "project",
        entityId: completedDevelopment.id,
        changes: JSON.stringify({ status: { from: "active", to: "completed" } }),
      },
      {
        userId: adminUser.id,
        action: "invite",
        entityType: "project_access",
        entityId: activeRenovation.id,
        metadata: JSON.stringify({ invitedUserId: partnerUser1.id, permission: "edit" }),
      },
      {
        userId: partnerUser1.id,
        action: "accept",
        entityType: "project_access",
        entityId: activeRenovation.id,
        metadata: JSON.stringify({ permission: "edit" }),
      },
      {
        userId: adminUser.id,
        action: "create",
        entityType: "cost",
        entityId: costsData[0].projectId,
        metadata: JSON.stringify({ amount: 1500000, description: "Demolition and site prep" }),
      },
      {
        userId: adminUser.id,
        action: "upload",
        entityType: "document",
        entityId: createdDocuments[0].id,
        metadata: JSON.stringify({ fileName: "demolition-permit.pdf" }),
      },
    ]

    await db.insert(auditLog).values(auditData)

    console.log("✅ Seed completed successfully!")
    console.log(`
    Summary:
    - Categories: ${CATEGORIES.length} hierarchical categories
    - Users: 3 (1 admin, 2 partners)
    - Projects: 3 (1 active, 1 on-hold, 1 completed)
    - Contacts: 15
    - Costs: 20
    - Documents: 8
    - Events: 8
    - Project Access: 3 permissions
    - Project Contacts: 13 links
    - Audit Log: 8 entries
    `)
  } catch (error) {
    console.error("❌ Seed failed:", error)
    throw error
  }
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
