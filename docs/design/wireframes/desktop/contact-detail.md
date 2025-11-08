# Contact Detail View (Desktop)

## Screen: Contact Detail - Linked Relationships

**Purpose:** Show comprehensive contact information with all linked project activities

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ Home > Contacts > John's Plumbing                                           Edit │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│ ┌─────────────────┐ John's Plumbing Services                                    │
│ │    [Profile]    │ Trades > Plumber > Commercial                              │
│ │     Photo       │                                                             │
│ │    or Logo      │ 📞 (555) 123-4567    ✉️ john@plumbing.com                 │
│ │                 │ 🏢 123 Industry Ave, Construction City, CC 12345           │
│ └─────────────────┘ 💰 Total Spending: $18,450 across 3 projects              │
│                                                                                   │
│ ┌─── Contact Information ────┐  ┌─── Project Associations ──────────────────┐ │
│ │ Primary: John Smith        │  │ ┌─ Maple Street Dev ──────── $4,500 ──┐ │ │
│ │ License: PL-2024-5678      │  │ │ 3 costs, 2 events, 1 document      │ │ │
│ │ Insurance: Valid until     │  │ │ Last activity: Nov 12 (Rough-in)   │ │ │
│ │           Dec 2025         │  │ └─────────────────────────────────────┘ │ │
│ │ Rating: ⭐⭐⭐⭐⭐         │  │ ┌─ Downtown Plaza ─────── $8,200 ──┐  │ │
│ │ Payment Terms: NET 30      │  │ │ 5 costs, 4 events, 3 documents     │ │ │
│ │ Added: Jan 15, 2024        │  │ │ Last activity: Oct 28 (Final)       │ │ │
│ └────────────────────────────┘  │ └─────────────────────────────────────┘ │ │
│                                  │ ┌─ Riverside Complex ──── $5,750 ──┐  │ │
│ [Activity Timeline] [Documents] [Communications] [Related Contacts]      │ │ │
│ ───────────────── ─────────── ──────────────── ─────────────────────     │ │ │
│                                  │ │ 4 costs, 1 event, 2 documents      │ │ │
│ Linked Activity Timeline         │ │ Status: In Progress                 │ │ │
│ ┌─────────────────────────────────┐ │ └─────────────────────────────────┘ │ │
│ │ ── November 2024 ──────────────│ └─────────────────────────────────────┘ │
│ │                               │                                         │
│ │ Nov 12  Maple Street Dev      │ Performance Metrics                     │
│ │ 🔧 Electrical rough-in done   │ ┌─────────────┬─────────────┬─────────┐ │
│ │ 💰 $4,500 payment processed   │ │ Projects    │ Avg Cost    │ Rating  │ │
│ │ 📸 Work completion photos     │ │ 3 active    │ $6,150      │ 5.0⭐   │ │
│ │ 📄 Compliance certificate     │ └─────────────┴─────────────┴─────────┘ │
│ │                               │                                         │
│ │ Nov 08  Maple Street Dev      │ Communication History                   │
│ │ 🚀 Plumbing phase started     │ ├─ Nov 10: Site meeting attendance       │
│ │ 📅 Estimated 3-week duration  │ ├─ Nov 05: Quote approval via email      │
│ │                               │ ├─ Oct 28: Schedule coordination call    │
│ │ ── October 2024 ─────────────│ ├─ Oct 15: Initial project discussion    │
│ │                               │ └─ Sep 22: Reference check completed     │
│ │ Oct 28  Downtown Plaza        │                                         │
│ │ ✅ Final inspection passed     │ Related Contacts                        │
│ │ 💰 $2,100 final payment       │ ┌─ Smith Electric ─────────────────────┐ │
│ │ 📋 Project completion cert    │ │ Often works together                │ │
│ │                               │ │ Same projects: Maple St, Downtown   │ │
│ │ Oct 20  Downtown Plaza        │ └─────────────────────────────────────┘ │
│ │ 🔧 Fixture installation       │ ┌─ ABC Construction ──────────────────┐ │
│ │ 💰 $3,800 progress payment    │ │ General contractor relationship     │ │
│ │ 📸 Installation photos        │ │ Recommended by: 3 projects          │ │
│ │                               │ └─────────────────────────────────────┘ │
│ └─────────────────────────────────┘                                       │
│                                                                                   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

## Key Elements

- Contact header with category breadcrumb and actions
- **Linked Items Timeline:** Chronological list of all costs, documents, events
- Project association cards with spending summaries
- Performance metrics and ratings
- Communication history tracking
- Related contacts with relationship context

## Linked Relationships Display

Timeline shows all connected activities:

- **Costs:** Payment history with amounts and project context
- **Events:** Meetings, milestones, work completion tied to contact
- **Documents:** Photos, certificates, contracts associated with contact
- **Projects:** Cross-project activity and spending patterns

## Interaction Notes

- Timeline items link back to original records
- Project badges filter activities when clicked
- Inline editing for contact details
- Communication log auto-updates from system actions
- Related contacts show collaboration patterns

## Data Intelligence Features

- Automatic spending totals across projects
- Performance tracking and rating system
- Communication frequency analysis
- Relationship mapping with other contacts
- Payment history and terms tracking

## Accessibility

- Contact information clearly structured with labels
- Timeline semantically marked with proper headings
- All linked items have descriptive link text
- Keyboard navigation for all interactive elements
- Screen reader announces relationship counts
