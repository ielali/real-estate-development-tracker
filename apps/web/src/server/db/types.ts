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

  // Cost Categories - Parent Groups
  { id: "cost_hard_costs", type: "cost", displayName: "Hard Costs", parentId: null },
  { id: "cost_pre_development", type: "cost", displayName: "Pre-Development", parentId: null },
  { id: "cost_professional_fees", type: "cost", displayName: "Professional Fees", parentId: null },
  {
    id: "cost_govt_charges",
    type: "cost",
    displayName: "Government Charges & Taxes",
    parentId: null,
  },
  { id: "cost_finance_costs", type: "cost", displayName: "Finance Costs", parentId: null },
  { id: "cost_insurance", type: "cost", displayName: "Insurance", parentId: null },
  { id: "cost_marketing_sales", type: "cost", displayName: "Marketing & Sales", parentId: null },
  { id: "cost_other_soft", type: "cost", displayName: "Other Soft Costs", parentId: null },

  // Hard Costs
  {
    id: "cost_site_prep",
    type: "cost",
    displayName: "Site Preparation",
    parentId: "cost_hard_costs",
  },
  { id: "cost_demolition", type: "cost", displayName: "Demolition", parentId: "cost_hard_costs" },
  {
    id: "cost_foundation",
    type: "cost",
    displayName: "Foundation & Structural",
    parentId: "cost_hard_costs",
  },
  {
    id: "cost_materials",
    type: "cost",
    displayName: "Construction Materials",
    parentId: "cost_hard_costs",
  },
  { id: "cost_labor", type: "cost", displayName: "Labor & Trades", parentId: "cost_hard_costs" },
  { id: "cost_electrical", type: "cost", displayName: "Electrical", parentId: "cost_hard_costs" },
  { id: "cost_plumbing", type: "cost", displayName: "Plumbing", parentId: "cost_hard_costs" },
  { id: "cost_hvac", type: "cost", displayName: "HVAC", parentId: "cost_hard_costs" },
  { id: "cost_carpentry", type: "cost", displayName: "Carpentry", parentId: "cost_hard_costs" },
  { id: "cost_painting", type: "cost", displayName: "Painting", parentId: "cost_hard_costs" },
  { id: "cost_roofing", type: "cost", displayName: "Roofing", parentId: "cost_hard_costs" },
  { id: "cost_flooring", type: "cost", displayName: "Flooring", parentId: "cost_hard_costs" },
  {
    id: "cost_landscaping",
    type: "cost",
    displayName: "Landscaping & External Works",
    parentId: "cost_hard_costs",
  },
  {
    id: "cost_site_improvements",
    type: "cost",
    displayName: "Site Improvements",
    parentId: "cost_hard_costs",
  },
  {
    id: "cost_specialty",
    type: "cost",
    displayName: "Specialty Work",
    parentId: "cost_hard_costs",
  },
  {
    id: "cost_hard_contingency",
    type: "cost",
    displayName: "Hard Cost Contingency",
    parentId: "cost_hard_costs",
  },

  // Pre-Development Costs
  {
    id: "cost_land_acquisition",
    type: "cost",
    displayName: "Land Acquisition",
    parentId: "cost_pre_development",
  },
  {
    id: "cost_feasibility",
    type: "cost",
    displayName: "Feasibility Studies",
    parentId: "cost_pre_development",
  },
  {
    id: "cost_market_research",
    type: "cost",
    displayName: "Market Research",
    parentId: "cost_pre_development",
  },
  {
    id: "cost_due_diligence",
    type: "cost",
    displayName: "Due Diligence",
    parentId: "cost_pre_development",
  },
  {
    id: "cost_environmental",
    type: "cost",
    displayName: "Environmental Assessments",
    parentId: "cost_pre_development",
  },
  {
    id: "cost_geotechnical",
    type: "cost",
    displayName: "Geotechnical Investigations",
    parentId: "cost_pre_development",
  },

  // Professional Fees
  {
    id: "cost_design",
    type: "cost",
    displayName: "Architectural Design",
    parentId: "cost_professional_fees",
  },
  {
    id: "cost_engineering",
    type: "cost",
    displayName: "Engineering Fees",
    parentId: "cost_professional_fees",
  },
  {
    id: "cost_town_planning",
    type: "cost",
    displayName: "Town Planning",
    parentId: "cost_professional_fees",
  },
  {
    id: "cost_quantity_surveyor",
    type: "cost",
    displayName: "Quantity Surveyor",
    parentId: "cost_professional_fees",
  },
  {
    id: "cost_project_management",
    type: "cost",
    displayName: "Project Management",
    parentId: "cost_professional_fees",
  },
  { id: "cost_legal", type: "cost", displayName: "Legal Fees", parentId: "cost_professional_fees" },
  {
    id: "cost_accounting",
    type: "cost",
    displayName: "Accounting Fees",
    parentId: "cost_professional_fees",
  },

  // Government Charges & Taxes
  { id: "cost_stamp_duty", type: "cost", displayName: "Stamp Duty", parentId: "cost_govt_charges" },
  { id: "cost_gst", type: "cost", displayName: "GST", parentId: "cost_govt_charges" },
  {
    id: "cost_infrastructure_charges",
    type: "cost",
    displayName: "Infrastructure Charges",
    parentId: "cost_govt_charges",
  },
  {
    id: "cost_developer_contributions",
    type: "cost",
    displayName: "Developer Contributions",
    parentId: "cost_govt_charges",
  },
  {
    id: "cost_council_rates",
    type: "cost",
    displayName: "Council Rates & Land Tax",
    parentId: "cost_govt_charges",
  },
  {
    id: "cost_permits_fees",
    type: "cost",
    displayName: "Permits & Application Fees",
    parentId: "cost_govt_charges",
  },

  // Finance Costs
  {
    id: "cost_loan_fees",
    type: "cost",
    displayName: "Loan Establishment Fees",
    parentId: "cost_finance_costs",
  },
  {
    id: "cost_interest",
    type: "cost",
    displayName: "Interest Payments",
    parentId: "cost_finance_costs",
  },
  {
    id: "cost_bank_guarantee",
    type: "cost",
    displayName: "Bank Guarantee Fees",
    parentId: "cost_finance_costs",
  },
  {
    id: "cost_valuation",
    type: "cost",
    displayName: "Valuation Fees",
    parentId: "cost_finance_costs",
  },

  // Insurance
  {
    id: "cost_builders_risk",
    type: "cost",
    displayName: "Builders Risk Insurance",
    parentId: "cost_insurance",
  },
  {
    id: "cost_public_liability",
    type: "cost",
    displayName: "Public Liability Insurance",
    parentId: "cost_insurance",
  },
  {
    id: "cost_professional_indemnity",
    type: "cost",
    displayName: "Professional Indemnity",
    parentId: "cost_insurance",
  },
  {
    id: "cost_contract_works",
    type: "cost",
    displayName: "Contract Works Insurance",
    parentId: "cost_insurance",
  },

  // Marketing & Sales
  {
    id: "cost_marketing",
    type: "cost",
    displayName: "Marketing & Advertising",
    parentId: "cost_marketing_sales",
  },
  {
    id: "cost_sales_commission",
    type: "cost",
    displayName: "Sales Agent Commission",
    parentId: "cost_marketing_sales",
  },
  {
    id: "cost_display_suite",
    type: "cost",
    displayName: "Display Suite/Home",
    parentId: "cost_marketing_sales",
  },
  {
    id: "cost_signage",
    type: "cost",
    displayName: "Signage & Branding",
    parentId: "cost_marketing_sales",
  },

  // Other Soft Costs
  {
    id: "cost_equipment",
    type: "cost",
    displayName: "Equipment Rental",
    parentId: "cost_other_soft",
  },
  {
    id: "cost_utilities",
    type: "cost",
    displayName: "Utilities & Services",
    parentId: "cost_other_soft",
  },
  {
    id: "cost_temporary_services",
    type: "cost",
    displayName: "Temporary Services",
    parentId: "cost_other_soft",
  },
  { id: "cost_security", type: "cost", displayName: "Security", parentId: "cost_other_soft" },
  {
    id: "cost_soft_contingency",
    type: "cost",
    displayName: "Soft Cost Contingency",
    parentId: "cost_other_soft",
  },
  {
    id: "cost_developer_fees",
    type: "cost",
    displayName: "Developer Fees & Overhead",
    parentId: "cost_other_soft",
  },

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
