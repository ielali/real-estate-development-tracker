# Cost Entry Form (Mobile)

## Screen: Quick Cost Entry

**Purpose:** Enable rapid cost entry with minimal friction while on construction site (30-second flow)

```
┌─────────────────────────┐
│ ← Add Cost         Save │
├─────────────────────────┤
│ Maple Street Dev       │
├─────────────────────────┤
│ Amount *                │
│ ┌─────────────────────┐ │
│ │ $                   │ │
│ └─────────────────────┘ │
│                         │
│ ┌───┬───┬───┐         │
│ │ 1 │ 2 │ 3 │         │
│ ├───┼───┼───┤         │
│ │ 4 │ 5 │ 6 │         │
│ ├───┼───┼───┤         │
│ │ 7 │ 8 │ 9 │         │
│ ├───┼───┼───┤         │
│ │ . │ 0 │ ← │         │
│ └───┴───┴───┘         │
│                         │
│ Vendor *                │
│ ┌─────────────────────┐ │
│ │ 🔍 Search/Add...   │ │
│ └─────────────────────┘ │
│ Recently Used:          │
│ • John's Plumbing       │
│ • ABC Materials         │
│ • Smith Electric        │
│                         │
│ Category *              │
│ [Materials] [Labor]     │
│ [Permits] [Equipment]   │
│ [Utilities] [Other]     │
│                         │
│ Description (optional)  │
│ ┌─────────────────────┐ │
│ │                     │ │
│ └─────────────────────┘ │
│                         │
│ Date                    │
│ ┌─────────────────────┐ │
│ │ Today, Nov 15, 2024 │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ 📷 Add Photo/Receipt│ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │    SAVE COST       │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

## Key Elements

- Large numeric keypad for amount entry
- Smart vendor search with recent/frequent at top
- Category pills for quick selection
- Optional camera button for receipt capture
- Sticky save button always visible
- Auto-populated date (editable)

## Interaction Notes

- Auto-focus on amount field on open
- Keyboard never obscures save button
- Swipe down to dismiss/cancel
- Vendor field allows inline creation
- Categories are single-select toggles
- Form data persists if accidentally closed

## Accessibility

- Large 48x48px number buttons
- High contrast active states
- Voice input support for amount
- Clear required field indicators (\*)
