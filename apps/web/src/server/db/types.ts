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

export type ATOTaxCategory =
  | "capital_works" // Division 43 deductions
  | "depreciation" // Division 40 deductions
  | "immediate_deduction" // Section 8-1 immediate expense
  | "financing_costs" // Section 25-25 borrowing expenses
  | "gst_input_credit" // GST credits
  | "land_acquisition" // Non-deductible capital cost
  | "professional_fees" // Section 40-880 blackhole expenditure
  | "holding_costs" // Deductible holding costs
  | "not_applicable" // Not tax-related

export interface Category {
  id: string // e.g., 'plumber', 'materials', 'photo'
  type: CategoryType // Which entity type this category belongs to
  displayName: string // e.g., 'Plumber', 'Building Materials'
  parentId: string | null // e.g., 'trades' for 'plumber'

  // Tax metadata (Story 2.3)
  taxDeductible: boolean | null // null = not specified (custom/non-cost)
  taxCategory: ATOTaxCategory | null // ATO reporting category
  notes: string | null // Accountant context
  isCustom: boolean // User-created vs predefined
  isArchived: boolean // Soft delete flag
  createdById: string | null // Creator for custom categories
  createdAt: Date | null // Audit trail
}

// Legacy category format (backward compatible)
interface LegacyCategory {
  id: string
  type: CategoryType
  displayName: string
  parentId: string | null
}

// Helper to convert legacy category to full Category with tax metadata
function toCategoryWithDefaults(legacy: LegacyCategory): Category {
  return {
    ...legacy,
    taxDeductible: null,
    taxCategory: null,
    notes: null,
    isCustom: false,
    isArchived: false,
    createdById: null,
    createdAt: null,
  }
}

// Predefined category hierarchies (stored as constants, not database records)
const LEGACY_CATEGORIES: LegacyCategory[] = [
  // Contact Categories - Construction Team
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
  {
    id: "project_manager",
    type: "contact",
    displayName: "Project Manager",
    parentId: "construction_team",
  },
  {
    id: "subcontractors",
    type: "contact",
    displayName: "Subcontractors (Framing, Roofing, etc.)",
    parentId: "construction_team",
  },

  // Contact Categories - Trades
  { id: "trades", type: "contact", displayName: "Trades", parentId: null },
  { id: "electrician", type: "contact", displayName: "Electrician", parentId: "trades" },
  { id: "plumber", type: "contact", displayName: "Plumber", parentId: "trades" },
  { id: "hvac", type: "contact", displayName: "HVAC Specialist", parentId: "trades" },
  { id: "carpenter", type: "contact", displayName: "Carpenter", parentId: "trades" },
  { id: "tiler", type: "contact", displayName: "Tiler", parentId: "trades" },
  { id: "painter", type: "contact", displayName: "Painter", parentId: "trades" },
  { id: "landscaper", type: "contact", displayName: "Landscaper", parentId: "trades" },
  { id: "concreter", type: "contact", displayName: "Concreter", parentId: "trades" },
  { id: "bricklayer", type: "contact", displayName: "Bricklayer", parentId: "trades" },
  { id: "glazier", type: "contact", displayName: "Glazier", parentId: "trades" },
  { id: "roofer", type: "contact", displayName: "Roofer", parentId: "trades" },
  { id: "flooring", type: "contact", displayName: "Flooring Specialist", parentId: "trades" },

  // Contact Categories - Design & Planning
  { id: "design_planning", type: "contact", displayName: "Design & Planning", parentId: null },
  { id: "architect", type: "contact", displayName: "Architect", parentId: "design_planning" },
  { id: "draftsperson", type: "contact", displayName: "Draftsperson", parentId: "design_planning" },
  {
    id: "interior_designer",
    type: "contact",
    displayName: "Interior Designer",
    parentId: "design_planning",
  },
  {
    id: "structural_engineer",
    type: "contact",
    displayName: "Structural Engineer",
    parentId: "design_planning",
  },
  {
    id: "civil_engineer",
    type: "contact",
    displayName: "Civil Engineer",
    parentId: "design_planning",
  },
  { id: "surveyor", type: "contact", displayName: "Surveyor", parentId: "design_planning" },
  { id: "town_planner", type: "contact", displayName: "Town Planner", parentId: "design_planning" },
  {
    id: "landscape_architect",
    type: "contact",
    displayName: "Landscape Architect",
    parentId: "design_planning",
  },

  // Contact Categories - Consultants
  { id: "consultants", type: "contact", displayName: "Consultants", parentId: null },
  {
    id: "building_inspector",
    type: "contact",
    displayName: "Building Inspector",
    parentId: "consultants",
  },
  {
    id: "energy_assessor",
    type: "contact",
    displayName: "Energy Assessor",
    parentId: "consultants",
  },
  {
    id: "quantity_surveyor",
    type: "contact",
    displayName: "Quantity Surveyor",
    parentId: "consultants",
  },
  {
    id: "geotechnical_engineer",
    type: "contact",
    displayName: "Geotechnical Engineer",
    parentId: "consultants",
  },
  {
    id: "environmental_consultant",
    type: "contact",
    displayName: "Environmental Consultant",
    parentId: "consultants",
  },
  {
    id: "heritage_consultant",
    type: "contact",
    displayName: "Heritage Consultant",
    parentId: "consultants",
  },
  {
    id: "acoustic_consultant",
    type: "contact",
    displayName: "Acoustic Consultant",
    parentId: "consultants",
  },

  // Contact Categories - Legal & Financial
  { id: "legal_financial", type: "contact", displayName: "Legal & Financial", parentId: null },
  { id: "lawyer", type: "contact", displayName: "Lawyer/Solicitor", parentId: "legal_financial" },
  { id: "conveyancer", type: "contact", displayName: "Conveyancer", parentId: "legal_financial" },
  { id: "accountant", type: "contact", displayName: "Accountant", parentId: "legal_financial" },
  {
    id: "mortgage_broker",
    type: "contact",
    displayName: "Mortgage Broker",
    parentId: "legal_financial",
  },
  { id: "bank_lender", type: "contact", displayName: "Bank/Lender", parentId: "legal_financial" },
  {
    id: "insurance_broker",
    type: "contact",
    displayName: "Insurance Broker",
    parentId: "legal_financial",
  },
  {
    id: "financial_advisor",
    type: "contact",
    displayName: "Financial Advisor",
    parentId: "legal_financial",
  },

  // Contact Categories - Government & Compliance
  {
    id: "government_compliance",
    type: "contact",
    displayName: "Government & Compliance",
    parentId: null,
  },
  {
    id: "council_officer",
    type: "contact",
    displayName: "Council Officer",
    parentId: "government_compliance",
  },
  {
    id: "building_certifier",
    type: "contact",
    displayName: "Building Certifier",
    parentId: "government_compliance",
  },
  {
    id: "fire_safety_inspector",
    type: "contact",
    displayName: "Fire Safety Inspector",
    parentId: "government_compliance",
  },
  {
    id: "development_assessment_officer",
    type: "contact",
    displayName: "Development Assessment Officer",
    parentId: "government_compliance",
  },

  // Contact Categories - Suppliers & Vendors
  { id: "suppliers_vendors", type: "contact", displayName: "Suppliers & Vendors", parentId: null },
  {
    id: "building_supplies",
    type: "contact",
    displayName: "Building Supplies",
    parentId: "suppliers_vendors",
  },
  {
    id: "hardware_store",
    type: "contact",
    displayName: "Hardware Store",
    parentId: "suppliers_vendors",
  },
  {
    id: "timber_supplier",
    type: "contact",
    displayName: "Timber Supplier",
    parentId: "suppliers_vendors",
  },
  {
    id: "steel_supplier",
    type: "contact",
    displayName: "Steel Supplier",
    parentId: "suppliers_vendors",
  },
  {
    id: "appliance_supplier",
    type: "contact",
    displayName: "Appliance Supplier",
    parentId: "suppliers_vendors",
  },
  {
    id: "fixture_supplier",
    type: "contact",
    displayName: "Fixture Supplier",
    parentId: "suppliers_vendors",
  },
  {
    id: "equipment_rental",
    type: "contact",
    displayName: "Equipment Rental",
    parentId: "suppliers_vendors",
  },

  // Contact Categories - Real Estate
  { id: "real_estate", type: "contact", displayName: "Real Estate", parentId: null },
  {
    id: "real_estate_agent",
    type: "contact",
    displayName: "Real Estate Agent",
    parentId: "real_estate",
  },
  {
    id: "property_manager",
    type: "contact",
    displayName: "Property Manager",
    parentId: "real_estate",
  },
  { id: "buyers_agent", type: "contact", displayName: "Buyer's Agent", parentId: "real_estate" },
  { id: "valuer", type: "contact", displayName: "Valuer", parentId: "real_estate" },
  { id: "auctioneer", type: "contact", displayName: "Auctioneer", parentId: "real_estate" },
  {
    id: "marketing_staging",
    type: "contact",
    displayName: "Marketing/Staging Consultant",
    parentId: "real_estate",
  },

  // Contact Categories - Investment Partners
  {
    id: "investment_partners",
    type: "contact",
    displayName: "Investment Partners",
    parentId: null,
  },
  {
    id: "silent_partner",
    type: "contact",
    displayName: "Silent Partner",
    parentId: "investment_partners",
  },
  {
    id: "joint_venture_partner",
    type: "contact",
    displayName: "Joint Venture Partner",
    parentId: "investment_partners",
  },
  {
    id: "private_investor",
    type: "contact",
    displayName: "Private Investor",
    parentId: "investment_partners",
  },
  {
    id: "investment_group",
    type: "contact",
    displayName: "Investment Group",
    parentId: "investment_partners",
  },

  // Contact Categories - Other Services
  { id: "other_services", type: "contact", displayName: "Other Services", parentId: null },
  {
    id: "demolition_contractor",
    type: "contact",
    displayName: "Demolition Contractor",
    parentId: "other_services",
  },
  {
    id: "waste_removal",
    type: "contact",
    displayName: "Waste Removal",
    parentId: "other_services",
  },
  {
    id: "cleaning_service",
    type: "contact",
    displayName: "Cleaning Service",
    parentId: "other_services",
  },
  {
    id: "security_service",
    type: "contact",
    displayName: "Security Service",
    parentId: "other_services",
  },
  {
    id: "photography_videography",
    type: "contact",
    displayName: "Photography/Videography",
    parentId: "other_services",
  },
  {
    id: "marketing_agency",
    type: "contact",
    displayName: "Marketing Agency",
    parentId: "other_services",
  },
  { id: "custom_other", type: "contact", displayName: "Custom/Other", parentId: "other_services" },

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

// Convert all legacy categories to full Category objects
export const CATEGORIES: Category[] = LEGACY_CATEGORIES.map(toCategoryWithDefaults)

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
