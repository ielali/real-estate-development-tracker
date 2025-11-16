/**
 * Construction Phase Templates
 *
 * Standard construction phase templates for different project types.
 * These can be used to initialize phases for new projects.
 */

export type PhaseTemplate = {
  phaseNumber: number
  name: string
  phaseType: string
  description?: string
}

/**
 * Residential Construction Phases
 * Typical phases for residential building projects (single-family, multi-family)
 */
export const RESIDENTIAL_PHASES: PhaseTemplate[] = [
  {
    phaseNumber: 1,
    name: "Pre-Construction",
    phaseType: "pre_construction",
    description: "Permits, design finalization, site surveys, and pre-construction planning",
  },
  {
    phaseNumber: 2,
    name: "Site Preparation",
    phaseType: "site_prep",
    description: "Clearing, grading, excavation, and utility rough-ins",
  },
  {
    phaseNumber: 3,
    name: "Foundation",
    phaseType: "foundation",
    description: "Foundation excavation, footings, foundation walls, and waterproofing",
  },
  {
    phaseNumber: 4,
    name: "Framing",
    phaseType: "framing",
    description: "Floor systems, wall framing, roof framing, and sheathing",
  },
  {
    phaseNumber: 5,
    name: "MEP Rough-In",
    phaseType: "mep_rough",
    description: "Rough plumbing, electrical, and HVAC installation",
  },
  {
    phaseNumber: 6,
    name: "Exterior Finishes",
    phaseType: "exterior",
    description: "Siding, windows, doors, roofing, and exterior trim",
  },
  {
    phaseNumber: 7,
    name: "Insulation & Drywall",
    phaseType: "insulation_drywall",
    description: "Insulation installation, drywall hanging, taping, and finishing",
  },
  {
    phaseNumber: 8,
    name: "Interior Finishes",
    phaseType: "interior",
    description: "Flooring, cabinets, trim, painting, and fixture installation",
  },
  {
    phaseNumber: 9,
    name: "Final Inspections",
    phaseType: "inspections",
    description: "Final building inspections and punch list items",
  },
  {
    phaseNumber: 10,
    name: "Closeout",
    phaseType: "closeout",
    description: "Certificate of occupancy, final cleaning, and project handover",
  },
]

/**
 * Commercial Construction Phases
 * Typical phases for commercial building projects (offices, retail, industrial)
 */
export const COMMERCIAL_PHASES: PhaseTemplate[] = [
  {
    phaseNumber: 1,
    name: "Design & Permits",
    phaseType: "design",
    description: "Architectural design, engineering, and permit acquisition",
  },
  {
    phaseNumber: 2,
    name: "Demolition & Site Work",
    phaseType: "demolition",
    description: "Existing structure demolition, site clearing, and preparation",
  },
  {
    phaseNumber: 3,
    name: "Foundation & Structure",
    phaseType: "structure",
    description: "Foundation, structural steel/concrete, and core systems",
  },
  {
    phaseNumber: 4,
    name: "MEP Systems",
    phaseType: "mep",
    description: "Complete mechanical, electrical, and plumbing systems installation",
  },
  {
    phaseNumber: 5,
    name: "Building Envelope",
    phaseType: "envelope",
    description: "Exterior walls, windows, roofing, and weatherproofing",
  },
  {
    phaseNumber: 6,
    name: "Interior Build-Out",
    phaseType: "interior",
    description: "Interior walls, ceilings, flooring, and finishes",
  },
  {
    phaseNumber: 7,
    name: "Systems Commissioning",
    phaseType: "commissioning",
    description: "Testing and balancing of building systems",
  },
  {
    phaseNumber: 8,
    name: "Substantial Completion",
    phaseType: "completion",
    description: "Final inspections, punch list, and certificate of occupancy",
  },
]

/**
 * Renovation/Remodel Phases
 * Typical phases for renovation and remodeling projects
 */
export const RENOVATION_PHASES: PhaseTemplate[] = [
  {
    phaseNumber: 1,
    name: "Planning & Design",
    phaseType: "planning",
    description: "Design, permits, and planning for renovation work",
  },
  {
    phaseNumber: 2,
    name: "Demolition",
    phaseType: "demolition",
    description: "Selective demolition of existing finishes and systems",
  },
  {
    phaseNumber: 3,
    name: "Structural & Systems",
    phaseType: "structural",
    description: "Structural modifications and system upgrades",
  },
  {
    phaseNumber: 4,
    name: "Rough-In Work",
    phaseType: "rough_in",
    description: "New plumbing, electrical, and HVAC rough-in",
  },
  {
    phaseNumber: 5,
    name: "Finishes",
    phaseType: "finishes",
    description: "Drywall, flooring, cabinets, and finish work",
  },
  {
    phaseNumber: 6,
    name: "Completion",
    phaseType: "completion",
    description: "Final inspections, testing, and project closeout",
  },
]

/**
 * All construction phase templates organized by project type
 */
export const CONSTRUCTION_PHASE_TEMPLATES = {
  residential: RESIDENTIAL_PHASES,
  commercial: COMMERCIAL_PHASES,
  renovation: RENOVATION_PHASES,
} as const

export type ProjectType = keyof typeof CONSTRUCTION_PHASE_TEMPLATES

/**
 * Get phase template by project type
 */
export function getPhaseTemplate(projectType: ProjectType): PhaseTemplate[] {
  return CONSTRUCTION_PHASE_TEMPLATES[projectType]
}

/**
 * Get all available project types
 */
export function getAvailableProjectTypes(): ProjectType[] {
  return Object.keys(CONSTRUCTION_PHASE_TEMPLATES) as ProjectType[]
}
