# Mobile Dashboard Screen

## Screen: Dashboard (Mobile)
**Purpose:** Provide instant project overview with quick action access for the developer

```
┌─────────────────────────┐
│ 📊 Development Tracker  │
│ Total: $1,245,000      │
├─────────────────────────┤
│ ↓ Pull to refresh      │
├─────────────────────────┤
│ Active Projects (3)     │
│                         │
│ ┌─────────────────────┐ │
│ │ Maple Street Dev    │ │
│ │ $450,000 / $500k    │ │
│ │ ████████░░ 90%      │ │
│ │ 🟢 Active • On Track│ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ Downtown Plaza      │ │
│ │ $380,000 / $400k    │ │
│ │ ████████░░ 95%      │ │
│ │ 🟢 Active • On Track│ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ Riverside Complex   │ │
│ │ $415,000 / $600k    │ │
│ │ ████████░░ 69%      │ │
│ │ 🟡 Active • Watch   │ │
│ └─────────────────────┘ │
│                         │
│ Recent Activity         │
│ ├─ 2hr: $1,200 Plumbing│
│ ├─ 5hr: $450 Electrical│
│ ├─ 1d: $2,800 Materials│
│ ├─ 1d: $15,000 Roofing │
│ └─ 2d: $800 Permits    │
│                         │
│                    [+]  │
├─────────────────────────┤
│  🏠   📊   ➕   👥   ☰  │
│ Home Proj  Add  Cont Menu│
└─────────────────────────┘
```

## Key Elements
- Project cost summary cards with progress indicators
- Floating action button (FAB) for quick cost entry
- Recent activity feed (last 5 costs added)  
- Project status badges (active/on-hold/complete)
- Pull-to-refresh gesture support

## Interaction Notes
- Cards expand on tap to show breakdown
- Swipe between projects horizontally
- Long-press for quick actions menu
- FAB morphs to full-screen cost entry
- Activity items link to cost details

## Accessibility
- Minimum 44x44px touch targets
- High contrast status indicators
- Screen reader announces percentages
- Semantic heading structure