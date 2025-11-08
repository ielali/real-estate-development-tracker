# Project Detail View (Mobile)

## Screen: Project Detail with Tabbed Navigation

**Purpose:** Comprehensive project information with linked entity management

```
┌─────────────────────────┐
│ ← Maple Street Dev  ⋮   │
├─────────────────────────┤
│ $450,000 / $500,000     │
│ ████████░░ 90% Complete │
│ 🟢 On Track • 2mo left  │
├─────────────────────────┤
│[Overview][Costs][Timeline]│
│ [Docs] [Partners]       │
├─────────────────────────┤
│                         │
│ Project Summary         │
│                         │
│ ┌─────────────────────┐ │
│ │ Budget Status       │ │
│ │ Spent: $450,000     │ │
│ │ Remaining: $50,000  │ │
│ │ ↗️ Trending On Track │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ Timeline Status     │ │
│ │ Started: Aug 15     │ │
│ │ Target: Jan 15      │ │
│ │ ⏱️ 2 months left    │ │
│ └─────────────────────┘ │
│                         │
│ Key Metrics             │
│ ┌─────────┬─────────┐   │
│ │ Costs   │ Vendors │   │
│ │ 127     │ 15      │   │
│ └─────────┴─────────┘   │
│ ┌─────────┬─────────┐   │
│ │ Events  │ Docs    │   │
│ │ 23      │ 45      │   │
│ └─────────┴─────────┘   │
│                         │
│ Recent Activity         │
│ ├─ 2hr: $1,200 Cost    │
│ ├─ 5hr: Site Photo     │
│ ├─ 1d: Permit Update   │
│ └─ 2d: Meeting Notes   │
│                         │
│ Quick Actions           │
│ ┌─────────────────────┐ │
│ │ ➕ Add Cost         │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ 📷 Take Photo       │ │
│ └─────────────────────┘ │
│                         │
├─────────────────────────┤
│  🏠   📊   ➕   👥   ☰  │
│ Home Proj  Add  Cont Menu│
└─────────────────────────┘
```

## Key Elements

- Project header with budget progress
- Tabbed navigation for sections
- Status indicators and metrics
- Recent activity feed
- Quick action buttons
- Visual progress indicators

## Tab Content Areas

- **Overview:** Summary, metrics, recent activity
- **Costs:** Cost list, breakdown charts, vendor analysis
- **Timeline:** Event timeline, milestones, linked activities
- **Documents:** Photo gallery, file uploads, document viewer
- **Partners:** Access management, partner communications

## Interaction Notes

- Horizontal swipe between tabs
- Pull-to-refresh updates data
- Quick actions float above content
- Tap metrics for detailed breakdown
- Activity items link to source records

## Linked Entity Display

Each tab shows comprehensive relationships:

- Costs → Vendors, Categories, Documents
- Timeline → Contacts, Costs, Documents
- Documents → Events, Costs, Contacts
- Partners → Permissions, Projects, Activity
