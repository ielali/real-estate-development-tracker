export type AustralianState = "NSW" | "VIC" | "QLD" | "WA" | "SA" | "TAS" | "ACT" | "NT"

export interface Address {
  streetNumber: string
  streetName: string
  streetType: string | null // Street, Road, Avenue, etc.
  suburb: string
  state: AustralianState
  postcode: string
  country: string // Default: 'Australia'
  formatted?: string // Full formatted address for display
}

export type CategoryType = "contact" | "cost" | "document" | "event"

export interface Category {
  id: string // e.g., 'plumber', 'materials', 'photo'
  type: CategoryType // Which entity type this category belongs to
  displayName: string // e.g., 'Plumber', 'Building Materials'
  parentId: string | null // e.g., 'trades' for 'plumber'
}

// Predefined category hierarchies (stored as constants, not database records)
export const CATEGORIES: Category[] = [
  // Contact Categories
  { id: "construction_team", type: "contact", displayName: "Construction Team", parentId: null },
  {
    id: "general_contractor",
    type: "contact",
    displayName: "Builder/General Contractor",
    parentId: "construction_team",
  },
  {
    id: "site_supervisor",
    type: "contact",
    displayName: "Site Supervisor",
    parentId: "construction_team",
  },
  { id: "trades", type: "contact", displayName: "Trades", parentId: null },
  { id: "electrician", type: "contact", displayName: "Electrician", parentId: "trades" },
  { id: "plumber", type: "contact", displayName: "Plumber", parentId: "trades" },
  { id: "carpenter", type: "contact", displayName: "Carpenter", parentId: "trades" },
  { id: "hvac", type: "contact", displayName: "HVAC Specialist", parentId: "trades" },
  { id: "painter", type: "contact", displayName: "Painter", parentId: "trades" },
  { id: "flooring", type: "contact", displayName: "Flooring Specialist", parentId: "trades" },
  { id: "roofing", type: "contact", displayName: "Roofer", parentId: "trades" },
  { id: "drywall", type: "contact", displayName: "Drywall Specialist", parentId: "trades" },
  { id: "windows_doors", type: "contact", displayName: "Windows & Doors", parentId: "trades" },
  { id: "landscaping", type: "contact", displayName: "Landscaper", parentId: "trades" },
  {
    id: "professional_services",
    type: "contact",
    displayName: "Professional Services",
    parentId: null,
  },
  { id: "architect", type: "contact", displayName: "Architect", parentId: "professional_services" },
  { id: "engineer", type: "contact", displayName: "Engineer", parentId: "professional_services" },
  {
    id: "inspector",
    type: "contact",
    displayName: "Building Inspector",
    parentId: "professional_services",
  },
  {
    id: "realtor",
    type: "contact",
    displayName: "Real Estate Agent",
    parentId: "professional_services",
  },
  { id: "supplier", type: "contact", displayName: "Supplier", parentId: null },

  // Cost Categories
  { id: "materials", type: "cost", displayName: "Materials", parentId: null },
  { id: "labor", type: "cost", displayName: "Labor", parentId: null },
  { id: "permits_fees", type: "cost", displayName: "Permits & Fees", parentId: null },
  { id: "professional", type: "cost", displayName: "Professional Services", parentId: null },
  { id: "equipment", type: "cost", displayName: "Equipment Rental", parentId: null },
  { id: "utilities", type: "cost", displayName: "Utilities", parentId: null },
  { id: "insurance", type: "cost", displayName: "Insurance", parentId: null },
  { id: "contingency", type: "cost", displayName: "Contingency", parentId: null },
  { id: "demolition", type: "cost", displayName: "Demolition", parentId: null },
  { id: "foundation", type: "cost", displayName: "Foundation", parentId: null },
  { id: "electrical", type: "cost", displayName: "Electrical", parentId: null },
  { id: "plumbing", type: "cost", displayName: "Plumbing", parentId: null },
  { id: "carpentry", type: "cost", displayName: "Carpentry", parentId: null },
  { id: "painting", type: "cost", displayName: "Painting", parentId: null },
  { id: "specialty", type: "cost", displayName: "Specialty Work", parentId: null },
  { id: "design", type: "cost", displayName: "Design Services", parentId: null },

  // Document Categories
  { id: "photos", type: "document", displayName: "Photos", parentId: null },
  { id: "receipts", type: "document", displayName: "Receipts", parentId: null },
  { id: "invoices", type: "document", displayName: "Invoices", parentId: null },
  { id: "contracts", type: "document", displayName: "Contracts", parentId: null },
  { id: "permits", type: "document", displayName: "Permits", parentId: null },
  { id: "plans", type: "document", displayName: "Plans & Drawings", parentId: null },
  { id: "inspections", type: "document", displayName: "Inspection Reports", parentId: null },
  { id: "warranties", type: "document", displayName: "Warranties", parentId: null },
  { id: "correspondence", type: "document", displayName: "Correspondence", parentId: null },

  // Event Categories
  { id: "milestone", type: "event", displayName: "Milestone", parentId: null },
  { id: "meeting", type: "event", displayName: "Meeting", parentId: null },
  { id: "inspection", type: "event", displayName: "Inspection", parentId: null },
  { id: "delivery", type: "event", displayName: "Delivery", parentId: null },
  { id: "status_change", type: "event", displayName: "Status Change", parentId: null },
  { id: "issue", type: "event", displayName: "Issue/Problem", parentId: null },
  { id: "completion", type: "event", displayName: "Completion", parentId: null },
]

// Helper function to get categories by type
export function getCategoriesByType(type: CategoryType): Category[] {
  return CATEGORIES.filter((cat) => cat.type === type)
}

// Helper function to get category by id
export function getCategoryById(id: string): Category | undefined {
  return CATEGORIES.find((cat) => cat.id === id)
}

// Helper function to validate category id for a specific type
export function isValidCategoryForType(categoryId: string, type: CategoryType): boolean {
  const category = getCategoryById(categoryId)
  return category ? category.type === type : false
}

// Helper function to format address
export function formatAddress(address: Partial<Address>): string {
  const parts = []

  if (address.streetNumber && address.streetName) {
    const streetType = address.streetType ? ` ${address.streetType}` : ""
    parts.push(`${address.streetNumber} ${address.streetName}${streetType}`)
  }

  if (address.suburb) {
    parts.push(address.suburb)
  }

  if (address.state && address.postcode) {
    parts.push(`${address.state} ${address.postcode}`)
  }

  if (address.country && address.country !== "Australia") {
    parts.push(address.country)
  }

  return parts.join(", ")
}
