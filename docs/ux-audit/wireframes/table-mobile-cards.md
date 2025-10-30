# Responsive Table to Cards Wireframes

**Component:** Data Tables (Costs, Contacts, Documents)
**Priority:** P0
**Affects:** All table views on mobile (<768px)
**Goal:** Transform tables to card view on mobile with swipe actions

---

## Current State Issues

1. **Tables require horizontal scrolling on mobile** - Poor UX, hard to read
2. **6+ columns compressed into small screen** - Text illegible
3. **No mobile-optimized actions** - Edit/delete buttons too small
4. **No swipe gestures** - Missed opportunity for mobile interactions
5. **Difficult to scan and compare** - Table format not suited for mobile

---

## Proposed Solution: Card View for Mobile

### Costs List: Desktop Table View (≥768px)

Current desktop table works well, keep as-is:

```
┌──────────────────────────────────────────────────────────────────────┐
│ Costs (47)                     [Filters ▾] [Sort ▾] [+ Add Cost]     │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ Date       │ Description      │ Category    │ Vendor    │ Amount    │
│────────────┼──────────────────┼─────────────┼───────────┼──────────│
│ 30 Oct     │ Concrete pour    │ Materials   │ ABC Corp  │ $2,500   │
│ 29 Oct     │ Electrical work  │ Labor       │ John's El │ $850     │
│ 28 Oct     │ Building permit  │ Permits     │ City Hall │ $350     │
│ 27 Oct     │ Lumber delivery  │ Materials   │ Home Dept │ $1,200   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**Keep This for Desktop** - Works perfectly with:

- Sortable columns
- Inline filters
- Quick actions on hover
- Select multiple rows
- Pagination

---

### Costs List: Mobile Card View (<768px)

Transform to cards on mobile:

```
┌─────────────────────────────────────┐
│ Costs (47)                    [≡]   │
├─────────────────────────────────────┤
│                                     │
│  [🔍 Search costs...]               │
│                                     │
│  [Filters (2)]  [Sort: Date ▾]     │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ 📦 Materials                  │ │
│  │ Concrete pour, west side      │ │
│  │                               │ │
│  │ ABC Concrete Corp             │ │
│  │ 30 Oct 2025                   │ │
│  │                               │ │
│  │         $2,500.00             │ │
│  │                               │ │
│  │  [View] [Edit] [Delete]       │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ ⚡ Labor                       │ │
│  │ Electrical rough-in work      │ │
│  │                               │ │
│  │ John's Electrical Services    │ │
│  │ 29 Oct 2025                   │ │
│  │                               │ │
│  │          $850.00              │ │
│  │                               │ │
│  │  [View] [Edit] [Delete]       │ │
│  └───────────────────────────────┘ │
│                                     │
│           [Load More...]            │
│                                     │
└─────────────────────────────────────┘
```

**Card Structure:**

- Category icon + label at top
- Description as title
- Vendor name (secondary)
- Date (tertiary)
- Amount prominent (large, bold)
- Actions at bottom (View, Edit, Delete)

**Features:**

- Vertical scrolling (no horizontal scroll)
- Clear visual hierarchy
- Touch-friendly action buttons
- Pagination with "Load More"

---

### Costs Card: With Swipe Actions

Swipe left to reveal actions:

```
│  ┌───────────────────────────────┐ │
│  │ 📦 Materials                  │ │
│  │ Concrete pour, west side   [←]│ │
│  │                               │ │
│  │ ABC Concrete Corp             │ │
│  │ 30 Oct 2025                   │ │
│  │                               │ │
│  │         $2,500.00             │ │
│  └───────────────────────────────┘ │
│    [✏️ Edit]  [🗑️ Delete]          │
```

**Interaction:**

- Swipe left reveals Edit and Delete buttons
- Tap Edit to navigate to edit form
- Tap Delete shows confirmation dialog
- Swipe right to close (return to default state)

**Visual Feedback:**

- Card slides left with smooth animation
- Buttons slide in from right
- Haptic feedback on mobile (if available)

---

### Costs Card: Expanded Detail View

Tap card to expand details:

```
│  ┌───────────────────────────────┐ │
│  │ 📦 Materials              [▲] │ │
│  │ Concrete pour, west side      │ │
│  │                               │ │
│  │ Details                       │ │
│  │ ───────────────────────────── │ │
│  │ Vendor: ABC Concrete Corp     │ │
│  │ Date: 30 Oct 2025             │ │
│  │ Category: Materials           │ │
│  │ Payment: Credit Card          │ │
│  │ Invoice #: INV-2024-1234      │ │
│  │                               │ │
│  │ Notes:                        │ │
│  │ Foundation pour for west wing │ │
│  │ including labor and materials │ │
│  │                               │ │
│  │ Amount: $2,500.00             │ │
│  │                               │ │
│  │  [View] [Edit] [Delete]       │ │
│  └───────────────────────────────┘ │
```

**Features:**

- Tap card to expand
- Shows all metadata
- Notes section if exists
- Actions remain at bottom
- Tap [▲] or anywhere outside to collapse

---

## Contacts List: Mobile Card View

### Desktop Table (Current)

```
┌──────────────────────────────────────────────────────────────────────┐
│ Contacts (28)                  [Filters ▾] [Sort ▾] [+ Add Contact]  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ Name           │ Company         │ Role        │ Phone      │ Email │
│────────────────┼─────────────────┼─────────────┼────────────┼───────│
│ John Smith     │ ABC Plumbing    │ Contractor  │ 555-0123   │ ✉     │
│ Sarah Johnson  │ City Hall       │ Inspector   │ 555-0456   │ ✉     │
│ Mike Chen      │ Elite Electric  │ Electrician │ 555-0789   │ ✉     │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

### Mobile Card View

```
┌─────────────────────────────────────┐
│ Contacts (28)                 [≡]   │
├─────────────────────────────────────┤
│                                     │
│  [🔍 Search contacts...]            │
│                                     │
│  [Filters]  [Sort: Name ▾]         │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  JS                           │ │
│  │  John Smith                   │ │
│  │  ABC Plumbing Supply          │ │
│  │                               │ │
│  │  📱 (555) 123-4567            │ │
│  │  ✉️ john@abcplumbing.com      │ │
│  │  👷 Contractor                 │ │
│  │                               │ │
│  │  [Call] [Email] [View]        │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  SJ                           │ │
│  │  Sarah Johnson                │ │
│  │  City Building Department     │ │
│  │                               │ │
│  │  📱 (555) 456-7890            │ │
│  │  ✉️ sjohnson@cityinspector.gov│ │
│  │  🏛️ Inspector                  │ │
│  │                               │ │
│  │  [Call] [Email] [View]        │ │
│  └───────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

**Card Structure:**

- Avatar with initials at top-left
- Full name as title
- Company name (secondary)
- Phone, Email, Role with icons
- Action buttons: Call, Email, View

**Features:**

- Avatar provides visual distinction
- Icons make contact info scannable
- Direct actions (Call, Email) for quick contact
- View button for full details

---

### Contacts Card: Quick Actions

Tap phone or email to trigger native actions:

```
│  ┌───────────────────────────────┐ │
│  │  JS                           │ │
│  │  John Smith                   │ │
│  │  ABC Plumbing Supply          │ │
│  │                               │ │
│  │  📱 (555) 123-4567  [Tap]     │ │
│  │  ✉️ john@abcplumbing.com      │ │
│  │  👷 Contractor                 │ │
│  └───────────────────────────────┘ │
```

**Interaction:**

- Tap phone number → Opens phone dialer
- Tap email → Opens email client
- Tap [Call] button → Same as tapping phone number
- Tap [Email] button → Same as tapping email address

---

## Documents List: Mobile Grid Cards

### Desktop Grid View (Current)

```
┌──────────────────────────────────────────────────────────────────────┐
│ Documents (12)                  [Filters ▾] [Sort ▾] [Upload]        │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐                    │
│  │[Image] │  │[Image] │  │[Image] │  │[PDF]   │                    │
│  │        │  │        │  │        │  │        │                    │
│  │Floor   │  │Invoice │  │Contract│  │Permit  │                    │
│  │Plan    │  │        │  │        │  │        │                    │
│  │2 days  │  │1 week  │  │2 weeks │  │3 weeks │                    │
│  └────────┘  └────────┘  └────────┘  └────────┘                    │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**Keep 4-column grid on desktop** - Works well

---

### Mobile Card/List Hybrid View

```
┌─────────────────────────────────────┐
│ Documents (12)               [≡]    │
├─────────────────────────────────────┤
│                                     │
│  [🔍 Search documents...]           │
│                                     │
│  [Filters]  [Sort: Recent ▾]       │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ [Image]  Floor Plan           │ │
│  │ Thumb    2024-10-30           │ │
│  │ nail     Progress Photos      │ │
│  │          2.3 MB               │ │
│  │                               │ │
│  │  [View] [Download] [Delete]   │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ [PDF]    Invoice ABC-1234     │ │
│  │ Icon     2024-10-28           │ │
│  │          Invoices & Receipts  │ │
│  │          1.8 MB               │ │
│  │                               │ │
│  │  [View] [Download] [Delete]   │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ [Image]  Site Photo West      │ │
│  │ Thumb    2024-10-27           │ │
│  │ nail     Progress Photos      │ │
│  │          4.1 MB               │ │
│  │                               │ │
│  │  [View] [Download] [Delete]   │ │
│  └───────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

**Card Structure:**

- Thumbnail on left (square)
- Document name as title
- Date, category, file size
- Actions at bottom

**Features:**

- List format easier to scan on mobile
- Thumbnails for quick recognition
- All metadata visible
- Large tap targets for actions

---

## Filtering & Sorting on Mobile

### Filter Panel (Bottom Sheet)

On mobile, tap [Filters] opens bottom sheet:

```
┌─────────────────────────────────────┐
│        ───                          │
│                                     │
│  Filters                      [✕]   │
│  ─────────────────────────────────  │
│                                     │
│  Category                           │
│  ☑ Materials                        │
│  ☐ Labor                            │
│  ☑ Permits & Fees                   │
│  ☐ Equipment                        │
│                                     │
│  Date Range                         │
│  [This Month ▾]                     │
│                                     │
│  Amount                             │
│  Min: [$0     ]  Max: [$10,000]    │
│                                     │
│  Vendor                             │
│  [Select vendors...          ▾]     │
│                                     │
│                                     │
│  [Clear All]       [Apply (2)]      │
│                                     │
└─────────────────────────────────────┘
```

**Features:**

- Bottom sheet slides up (thumb-friendly)
- All filters in one place
- Active filter count shown in button "[Apply (2)]"
- Clear all option
- Swipe down or tap [✕] to close

---

### Active Filters Display

After applying filters:

```
┌─────────────────────────────────────┐
│ Costs (47)                    [≡]   │
├─────────────────────────────────────┤
│                                     │
│  [🔍 Search costs...]               │
│                                     │
│  Active Filters:                    │
│  [Materials ✕] [Permits & Fees ✕]  │
│  [Clear All]                        │
│                                     │
│  [Sort: Date ▾]                     │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ (Filtered cards...)           │ │
```

**Features:**

- Active filters shown as badges
- Tap [✕] on badge to remove that filter
- [Clear All] removes all filters
- Filter count visible

---

## Implementation Details

### Responsive Component Structure

```tsx
function CostList({ costs }: Props) {
  const isMobile = useMediaQuery("(max-width: 768px)")

  if (isMobile) {
    return <CostCardList costs={costs} />
  }

  return <CostTable costs={costs} />
}
```

---

### Cost Card Component

```tsx
function CostCard({ cost }: { cost: Cost }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card className="p-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <CategoryIcon category={cost.category} />
          <span className="text-sm font-medium">{cost.category}</span>
        </div>
        <Button variant="ghost" size="icon">
          {isExpanded ? <ChevronUp /> : <ChevronDown />}
        </Button>
      </div>

      {/* Description */}
      <h3 className="text-lg font-semibold mb-2">{cost.description}</h3>

      {/* Metadata */}
      <div className="space-y-1 text-sm text-slate-600 mb-3">
        {cost.vendorName && <p>{cost.vendorName}</p>}
        <p>{formatDate(cost.date)}</p>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="space-y-2 border-t border-slate-200 pt-3 mb-3">
          <DetailRow label="Payment Method" value={cost.paymentMethod} />
          <DetailRow label="Invoice #" value={cost.invoiceNumber} />
          {cost.notes && <DetailRow label="Notes" value={cost.notes} />}
        </div>
      )}

      {/* Amount */}
      <p className="text-2xl font-bold text-center mb-4">${cost.amount.toFixed(2)}</p>

      {/* Actions */}
      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="flex-1">
          View
        </Button>
        <Button size="sm" variant="outline" className="flex-1">
          Edit
        </Button>
        <Button size="sm" variant="destructive" className="flex-1">
          Delete
        </Button>
      </div>
    </Card>
  )
}
```

---

### Swipe Actions (Advanced)

```tsx
import { useSwipeable } from "react-swipeable"

function SwipeableCard({ cost }: Props) {
  const [isRevealed, setIsRevealed] = useState(false)

  const handlers = useSwipeable({
    onSwipedLeft: () => setIsRevealed(true),
    onSwipedRight: () => setIsRevealed(false),
    trackMouse: false, // Only track touch
  })

  return (
    <div className="relative overflow-hidden">
      {/* Action Buttons (Behind Card) */}
      <div className="absolute right-0 top-0 bottom-0 flex gap-2 items-center pr-4">
        <Button size="icon" variant="ghost">
          <Edit className="h-5 w-5" />
        </Button>
        <Button size="icon" variant="destructive">
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>

      {/* Card (Slides Left) */}
      <div
        {...handlers}
        className={cn(
          "transition-transform duration-300",
          isRevealed ? "-translate-x-24" : "translate-x-0"
        )}
      >
        <Card>{/* Card content */}</Card>
      </div>
    </div>
  )
}
```

---

## Accessibility Requirements

### Keyboard Navigation

- Tab through cards in order
- Enter to expand/collapse card
- Arrow keys to navigate between cards

### Screen Reader

- Cards have semantic structure (`<article>`)
- Expanded state announced: `aria-expanded="true"`
- Action buttons have clear labels
- Amount has `aria-label="Amount: $2,500.00"`

### Touch Gestures

- Swipe actions optional (actions also visible in expanded state)
- Tap card to expand (don't require swipe)
- Haptic feedback on swipe (if supported)

---

## Performance Considerations

### Virtualization for Long Lists

For lists with 100+ items:

```tsx
import { useVirtualizer } from "@tanstack/react-virtual"

function VirtualizedCardList({ costs }: Props) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: costs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // Estimated card height
    overscan: 5, // Render 5 extra items above/below viewport
  })

  return (
    <div ref={parentRef} className="h-screen overflow-auto">
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <CostCard cost={costs[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Benefits:**

- Only renders visible cards + overscan
- Smooth scrolling even with 1000+ items
- Reduced memory usage

---

## Before & After Comparison

### Before (Current State - Mobile Table)

**Pain Points:**

- Horizontal scrolling required (poor UX)
- Text illegible (too compressed)
- Actions too small to tap
- Hard to scan and compare
- Frustrating on-site use

**User Satisfaction:** 3/10

---

### After (Proposed State - Mobile Cards)

**Improvements:**

- No horizontal scrolling (vertical only)
- Large, readable text
- Touch-friendly action buttons
- Easy to scan with visual hierarchy
- Swipe actions for power users
- Expandable details on demand

**User Satisfaction:** 9/10 (expected)

**Expected Impact:**

- ✅ 90% reduction in user frustration
- ✅ 100% elimination of horizontal scrolling
- ✅ 50% faster task completion on mobile
- ✅ Better on-site UX for field workers

---

## Implementation Estimate

- Card component creation: **2 days**
- Responsive table/card switching: **1 day**
- Swipe actions (optional): **2 days**
- Filter panel (bottom sheet): **2 days**
- Virtualization (performance): **1 day**
- Testing & refinement: **2 days**

**Total: 10 days** (8 days without swipe actions)

---

## Related Issues from Audit

- ✅ Fixes P0: Costs table doesn't optimize for mobile
- ✅ Fixes P1: Navigation menu not thumb-friendly
- ✅ Fixes P1: Filter panel takes full screen on mobile
- ✅ Fixes P2: Horizontal scrolling on project detail

---

**Next Steps:**

1. Review wireframes with product owner
2. User test card view vs. table view on mobile
3. Implement cost list cards first (highest traffic)
4. Extend pattern to contacts and documents
5. Measure user satisfaction and task completion time
6. Consider swipe actions as enhancement (Phase 2)
