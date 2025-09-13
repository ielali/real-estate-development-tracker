# Wireframes Directory

This directory contains ASCII wireframes for the Real Estate Development Tracker application, organized by device type and screen function.

## Mobile Wireframes (/mobile/)

### Core User Screens (Developer-focused)
- **dashboard.md** - Main mobile dashboard with project cards and quick actions
- **cost-entry-form.md** - 30-second cost entry flow with numeric keypad
- **project-detail.md** - Project overview with tabbed navigation
- **contact-directory.md** - Hierarchical contact management with category browsing
- **timeline-tab.md** - Chronological event timeline with linked entities

## Desktop Wireframes (/desktop/)

### Developer & Partner Views
- **project-dashboard.md** - Multi-project overview dashboard (developer view)  
- **partner-dashboard.md** - Professional read-only dashboard for investment partners
- **contact-detail.md** - Comprehensive contact profile with linked relationships
- **costs-breakdown-view.md** - Detailed cost analysis with vendor and category breakdowns

## Design Specifications Alignment

These wireframes implement the requirements from `/docs/front-end-spec.md`:

### Mobile-First Approach
- **30-second cost entry** flow optimized for on-site use
- **Thumb-reachable** bottom navigation with FAB for primary actions
- **Progressive disclosure** with expandable cards and drill-down navigation
- **Pull-to-refresh** and swipe gestures throughout

### Professional Partner Experience  
- **Executive-level** dashboards with financial focus
- **Read-only access** with professional presentation
- **Chart visualizations** with ROI and trend analysis
- **Print-friendly** reports and export capabilities

### Comprehensive Entity Linking (PRD FR8)
- **Costs ↔ Vendors ↔ Documents** relationships displayed consistently
- **Timeline events** linked to contacts, costs, and supporting documents
- **Contact profiles** show all associated projects, spending, and communications
- **Document management** with attachment indicators and preview capabilities

### Accessibility & Performance
- **WCAG 2.1 AA compliance** considerations built into each wireframe
- **44x44px minimum** touch targets on mobile
- **High contrast** status indicators and financial data
- **Semantic structure** with proper headings and landmarks

## Navigation Architecture

### Mobile Navigation Pattern
```
Bottom Tab Bar:
🏠 Dashboard → 📊 Projects → ➕ Add Cost → 👥 Contacts → ☰ Menu
```

### Desktop Navigation Pattern  
```
Top Navigation:
Home > Projects > [Project Name] > [Current Section]
With project switcher dropdown and user account menu
```

## Component Integration

These wireframes reference the component library defined in the specification:
- **ProjectCard** components in various states and layouts
- **QuickAddButton** (FAB) for primary actions
- **CostItem** displays with swipe actions and bulk selection
- **StatCard** metrics throughout dashboards
- **VendorSelect** with smart search and inline creation
- **ChartComponent** for financial visualizations
- **EventItem** timeline displays with linked entity indicators

## Next Steps

1. **High-fidelity mockups** - Create detailed visual designs in Figma
2. **Interactive prototypes** - Build clickable prototypes for user testing  
3. **Component library** - Develop React components based on these wireframes
4. **Responsive testing** - Validate layouts across device breakpoints
5. **Accessibility testing** - Screen reader and keyboard navigation validation

## File Naming Convention

- Mobile screens: `[screen-name].md` (e.g., `dashboard.md`)
- Desktop screens: `[view-name].md` (e.g., `partner-dashboard.md`)
- Each file includes purpose, key elements, interactions, and accessibility notes