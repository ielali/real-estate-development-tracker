# Contact Directory (Mobile)

## Screen: Contact Directory - Hierarchical Management

**Purpose:** Enable developers to efficiently browse and manage contacts using comprehensive category hierarchy

```
┌─────────────────────────┐
│ ← Contacts         [+]  │
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │ 🔍 Search contacts  │ │
│ └─────────────────────┘ │
├─────────────────────────┤
│ Filter: [All ▼] 🔄      │
├─────────────────────────┤
│                         │
│ Recently Used (4)       │
│ ┌─────────────────────┐ │
│ │ John's Plumbing     │ │
│ │ Trades > Plumber    │ │
│ │ 📞 📧 💬           │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ ABC Construction    │ │
│ │ Construction > GC   │ │
│ │ 📞 📧 💬           │ │
│ └─────────────────────┘ │
│                         │
│ Browse by Category      │
│ ▼ Construction Team (8) │
│   ├─ General Contract. │
│   ├─ Site Manager      │
│   └─ Superintendent    │
│                         │
│ ▶ Trades (15)           │
│ ▶ Design & Planning (6) │
│ ▶ Legal & Financial (4) │
│ ▶ Materials & Supply (9)│
│                         │
│ All Contacts (42)       │
│ ┌─────────────────────┐ │
│ │ Smith Electric      │ │
│ │ Trades > Electrician│ │
│ │ 📞 📧 💬           │ │
│ │ 3 projects          │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ Sarah Miller        │ │
│ │ Design > Architect  │ │
│ │ 📞 📧 💬           │ │
│ │ 1 project           │ │
│ └─────────────────────┘ │
│                         │
├─────────────────────────┤
│  🏠   📊   ➕   👥   ☰  │
│ Home Proj  Add  Cont Menu│
└─────────────────────────┘
```

## Key Elements

- Expandable category tree with parent-child relationships
- Smart search across categories
- Filter chips for active categories with count badges
- Contact cards showing category breadcrumb
- Quick-add contact button pre-fills category
- "Recently Used" section for frequent contacts
- Project count indicators

## Interaction Notes

- Tap category to expand subcategories
- Long-press contact for bulk actions
- Swipe contact card for quick call/email
- Search queries across categories
- Recently used auto-updates based on usage

## Category Hierarchy

- Construction Team > General Contractor, Site Manager, Superintendent
- Trades > Electrician, Plumber, HVAC, Roofing, Flooring
- Design & Planning > Architect, Engineer, Designer, Surveyor
- Legal & Financial > Attorney, Accountant, Lender, Inspector
- Materials & Supply > Supplier, Distributor, Equipment Rental

## Accessibility

- Expandable/collapsible sections announced
- Contact action buttons properly labeled
- Category hierarchy navigable via keyboard
- Search results announce count
