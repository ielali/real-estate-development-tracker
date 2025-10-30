# Cost Entry Mobile Optimization Wireframes

**Component:** Cost Entry Form
**Priority:** P0
**Affects:** `/projects/[id]/costs/new`, Mobile users
**Goal:** Streamline mobile cost entry for on-site field use

---

## Current State Issues

1. **8 fields in single long form** - excessive scrolling on mobile
2. **All fields visible at once** - overwhelming, hard to focus
3. **No smart defaults** - must enter same data repeatedly
4. **No cost templates** - can't reuse common costs
5. **Small touch targets** - inputs only 40px height (need 44px minimum)
6. **Mobile keyboard covers fields** - can't see what typing

---

## Proposed Solution: 2-Step Mobile Form

### Step 1: Essential Fields (Above Fold)

```
┌─────────────────────────────────────┐
│ [← Back]        Add Cost            │
├─────────────────────────────────────┤
│                                     │
│  Step 1 of 2                        │
│  ●───○                              │
│                                     │
│  Amount *                           │
│  ┌─────────────────────────────┐   │
│  │ $                           │   │
│  └─────────────────────────────┘   │
│                                     │
│  Category *                         │
│  ┌─────────────────────────────┐   │
│  │ Materials             ▾     │   │
│  └─────────────────────────────┘   │
│    Recently used: Labor, Permits   │
│                                     │
│  Date *                             │
│  ┌─────────────────────────────┐   │
│  │ 30 Oct 2025           📅    │   │
│  └─────────────────────────────┘   │
│                                     │
│  Description                        │
│  ┌─────────────────────────────┐   │
│  │ (Optional - add details)    │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│                                     │
│  [Next: Add Details →]              │
│                                     │
└─────────────────────────────────────┘
```

**Fields:**

1. **Amount** (required) - Large, prominent, autofocus
2. **Category** (required) - Dropdown with recent categories shown
3. **Date** (required) - Default to today
4. **Description** (optional) - Brief text area

**Features:**

- Only 4 fields visible (reduced from 8)
- Large input heights (48px minimum)
- Smart defaults (today's date)
- Recently used categories shown below dropdown
- Progress indicator (Step 1 of 2)

---

### Step 2: Optional Details

```
┌─────────────────────────────────────┐
│ [← Back]        Add Cost            │
├─────────────────────────────────────┤
│                                     │
│  Step 2 of 2                        │
│  ●───●                              │
│                                     │
│  Vendor/Contractor (Optional)       │
│  ┌─────────────────────────────┐   │
│  │ Search or select...     ▾   │   │
│  └─────────────────────────────┘   │
│    Recently used: ABC Plumbing     │
│    [+ Add new vendor]              │
│                                     │
│  Payment Method (Optional)          │
│  ┌─────────────────────────────┐   │
│  │ Credit Card             ▾   │   │
│  └─────────────────────────────┘   │
│                                     │
│  Receipt/Invoice # (Optional)       │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  Notes (Optional)                   │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  [← Previous]    [Save Cost]        │
│                                     │
└─────────────────────────────────────┘
```

**Fields:**

1. **Vendor/Contractor** (optional) - Searchable dropdown
2. **Payment Method** (optional) - Dropdown
3. **Receipt/Invoice #** (optional) - Text input
4. **Notes** (optional) - Text area

**Features:**

- All fields optional (can skip this step)
- Recently used vendors shown
- "Add new vendor" quick action
- Can go back to edit Step 1
- "Save Cost" button prominent

---

## Alternative: Single-Page with Progressive Disclosure

For users who prefer single-page:

```
┌─────────────────────────────────────┐
│ [← Back]        Add Cost            │
├─────────────────────────────────────┤
│                                     │
│  Amount *                           │
│  ┌─────────────────────────────┐   │
│  │ $                           │   │
│  └─────────────────────────────┘   │
│                                     │
│  Category *                         │
│  ┌─────────────────────────────┐   │
│  │ Materials             ▾     │   │
│  └─────────────────────────────┘   │
│                                     │
│  Date *                             │
│  ┌─────────────────────────────┐   │
│  │ 30 Oct 2025           📅    │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ ▼ Show optional fields      │   │
│  └─────────────────────────────┘   │
│                                     │
│  [Save Cost]                        │
│                                     │
└─────────────────────────────────────┘
```

When "Show optional fields" tapped, expands accordion:

```
│  ┌─────────────────────────────┐   │
│  │ ▲ Hide optional fields      │   │
│  └─────────────────────────────┘   │
│                                     │
│  Vendor/Contractor                  │
│  ┌─────────────────────────────┐   │
│  │ Select vendor...        ▾   │   │
│  └─────────────────────────────┘   │
│                                     │
│  Payment Method                     │
│  ┌─────────────────────────────┐   │
│  │ Credit Card             ▾   │   │
│  └─────────────────────────────┘   │
│                                     │
│  ... (more fields)                  │
```

---

## Cost Templates Feature

### Template Selection

Add button at top of form:

```
┌─────────────────────────────────────┐
│ [← Back]        Add Cost            │
├─────────────────────────────────────┤
│                                     │
│  [⚡ Use Template]                  │
│                                     │
│  Amount *                           │
│  ...                                │
```

When "Use Template" tapped:

```
┌─────────────────────────────────────┐
│ Cost Templates                      │
│ ─────────────────────────────────── │
│                                     │
│ [💡] Concrete Delivery              │
│     $2,500 • Materials • ABC Supply │
│                                     │
│ [🔧] Plumbing Inspection            │
│     $350 • Permits • City Inspector │
│                                     │
│ [⚡] Electrician Labor               │
│     $800 • Labor • John's Electric  │
│                                     │
│ [+ Create New Template]             │
│                                     │
│        [Cancel]                     │
└─────────────────────────────────────┘
```

**Features:**

- Show 5-10 most used templates
- Template includes: Amount, Category, Vendor, Description
- Tap to pre-fill form (user can still edit)
- "Create New Template" saves current form as template

---

### Creating Template

After successfully adding a cost, show prompt:

```
┌─────────────────────────────────────┐
│  ✓ Cost Added Successfully          │
│                                     │
│  Save as template for next time?    │
│                                     │
│  Template Name:                     │
│  ┌─────────────────────────────┐   │
│  │ Concrete Delivery           │   │
│  └─────────────────────────────┘   │
│                                     │
│  [Skip]        [Save Template]      │
│                                     │
└─────────────────────────────────────┘
```

---

## Smart Defaults & Recently Used

### Category Dropdown Enhancement

```
┌─────────────────────────────────────┐
│ Select Category                     │
│ ─────────────────────────────────── │
│                                     │
│ Recently Used                       │
│ ✓ Materials                         │
│   Labor                             │
│   Permits                           │
│                                     │
│ ─────────────────────────────────── │
│                                     │
│ All Categories                      │
│   Materials                         │
│   Labor                             │
│   Permits & Fees                    │
│   Equipment Rental                  │
│   Professional Fees                 │
│   Utilities                         │
│   Insurance                         │
│   Other                             │
│                                     │
└─────────────────────────────────────┘
```

**Features:**

- Top 3 recently used categories shown first
- Visual separation from all categories
- Reduces scrolling for common selections

---

### Vendor Dropdown Enhancement

```
┌─────────────────────────────────────┐
│ Select Vendor                       │
│ ─────────────────────────────────── │
│                                     │
│ [Search vendors...]                 │
│                                     │
│ Recently Used                       │
│   ABC Plumbing Supply               │
│   John's Electrical Services        │
│   City Building Department          │
│                                     │
│ ─────────────────────────────────── │
│                                     │
│ [+ Add New Vendor]                  │
│                                     │
│ All Vendors (23)                    │
│   A&B Construction Materials        │
│   ABC Plumbing Supply               │
│   Acme Hardware                     │
│   ...                               │
│                                     │
└─────────────────────────────────────┘
```

**Features:**

- Search box at top
- Recently used vendors (last 5)
- "Add New Vendor" quick action
- Alphabetical list of all vendors

---

### Quick Vendor Creation

When "[+ Add New Vendor]" tapped, inline modal:

```
┌─────────────────────────────────────┐
│ Add New Vendor                      │
│ ─────────────────────────────────── │
│                                     │
│ Company Name *                      │
│ ┌─────────────────────────────┐   │
│ │                             │   │
│ └─────────────────────────────┘   │
│                                     │
│ Contact Name                        │
│ ┌─────────────────────────────┐   │
│ │                             │   │
│ └─────────────────────────────┘   │
│                                     │
│ Phone                               │
│ ┌─────────────────────────────┐   │
│ │                             │   │
│ └─────────────────────────────┘   │
│                                     │
│ [Cancel]        [Add Vendor]        │
│                                     │
└─────────────────────────────────────┘
```

---

## Mobile-Specific Optimizations

### 1. Touch Targets (48px minimum)

```css
.mobile-input {
  height: 48px; /* min 44px, 48px recommended */
  padding: 0 16px;
  font-size: 16px; /* Prevents iOS zoom on focus */
}

.mobile-button {
  min-height: 48px;
  min-width: 48px;
  padding: 12px 24px;
}
```

---

### 2. Input Types for Mobile Keyboards

```tsx
{
  /* Amount field - Shows number keyboard with decimal */
}
;<Input type="number" inputMode="decimal" step="0.01" placeholder="0.00" />

{
  /* Phone field - Shows phone keypad */
}
;<Input type="tel" inputMode="tel" />

{
  /* Email field - Shows @ and .com shortcuts */
}
;<Input type="email" inputMode="email" />

{
  /* Date field - Shows date picker */
}
;<Input type="date" />
```

---

### 3. Prevent Keyboard Covering Input

```tsx
// When input is focused, scroll it into view
const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
  setTimeout(() => {
    e.target.scrollIntoView({
      behavior: "smooth",
      block: "center", // Center in viewport
    })
  }, 300) // Wait for keyboard animation
}
```

---

### 4. Auto-save Draft (Prevent Data Loss)

```tsx
// Save form data to session storage every 5 seconds
useEffect(() => {
  const interval = setInterval(() => {
    if (form.formState.isDirty) {
      sessionStorage.setItem("costDraft", JSON.stringify(form.getValues()))
    }
  }, 5000)

  return () => clearInterval(interval)
}, [form])

// Restore draft on mount
useEffect(() => {
  const draft = sessionStorage.getItem("costDraft")
  if (draft) {
    const parsed = JSON.parse(draft)
    form.reset(parsed)
    toast.info("Draft restored", {
      action: {
        label: "Discard",
        onClick: () => {
          sessionStorage.removeItem("costDraft")
          form.reset()
        },
      },
    })
  }
}, [])
```

---

## Implementation Details

### Component Structure

```tsx
// 2-Step Form Component
function CostEntryFormMobile() {
  const [step, setStep] = useState(1)
  const form = useForm<CostFormData>({
    resolver: zodResolver(costSchema),
    defaultValues: {
      date: new Date(),
      amount: "",
      category: "",
    },
  })

  return (
    <Form {...form}>
      {/* Progress Indicator */}
      <ProgressIndicator currentStep={step} totalSteps={2} />

      {/* Step 1: Essential Fields */}
      {step === 1 && <StepOne form={form} onNext={() => setStep(2)} />}

      {/* Step 2: Optional Details */}
      {step === 2 && <StepTwo form={form} onBack={() => setStep(1)} onSubmit={handleSubmit} />}
    </Form>
  )
}
```

---

### Desktop vs. Mobile Rendering

```tsx
function CostEntryForm() {
  const isMobile = useMediaQuery("(max-width: 768px)")

  if (isMobile) {
    return <CostEntryFormMobile />
  }

  return <CostEntryFormDesktop />
}
```

---

## Accessibility Requirements

### Keyboard Navigation

- Tab through fields in logical order
- Enter to advance to next step
- Escape to go back or cancel

### Screen Reader

- Step indicator announced: "Step 1 of 2"
- Required fields: `aria-required="true"`
- Error messages: `aria-live="polite"` for validation errors
- Form sections: `role="group"` with `aria-labelledby`

### Focus Management

- Auto-focus first field on mount
- Focus next field after successful step 1
- Focus error field on validation failure

---

## Before & After Comparison

### Before (Current State)

**Pain Points:**

- 8 fields in single form (overwhelming)
- Must scroll to see all fields (disorienting)
- No smart defaults (repetitive data entry)
- Input height 40px (too small for thumbs)
- Mobile keyboard covers fields (can't see typing)
- No templates (must re-enter common costs)

**Time to add cost:** 3-4 minutes

---

### After (Proposed State)

**Improvements:**

- 4 essential fields in Step 1 (reduced cognitive load)
- 4 optional fields in Step 2 (progressive disclosure)
- Smart defaults (today's date, recent categories)
- Input height 48px (thumb-friendly)
- Auto-scroll active field into view (always visible)
- Cost templates (1-tap to pre-fill common costs)

**Time to add cost:**

- With template: **15-30 seconds** ⚡
- Without template: **1-2 minutes** ✅

**Expected Impact:**

- ✅ 60% time savings with templates
- ✅ 50% reduction in form fields shown (reduced scrolling)
- ✅ Better mobile UX (larger targets, appropriate keyboards)
- ✅ Reduced data entry errors (smart defaults)
- ✅ Higher completion rate (less overwhelming)

---

## Implementation Estimate

- 2-step form: **2 days**
- Smart defaults & recently used: **1 day**
- Cost templates: **3 days**
- Quick vendor creation: **1 day**
- Auto-save draft: **1 day**
- Mobile optimizations (touch targets, keyboards): **1 day**
- Testing & refinement: **1 day**

**Total: 10 days**

---

## Related Issues from Audit

- ✅ Fixes P0: Form touch targets too small on mobile
- ✅ Fixes P1: Cost entry form too long on mobile
- ✅ Fixes P1: Cost form has too many fields
- ✅ Fixes P1: No templates for recurring costs
- ✅ Fixes P1: Cost form doesn't show recent categories
- ✅ Fixes P1: Cannot create vendor from cost form
- ✅ Fixes P1: No draft saving for long forms
- ✅ Fixes P2: Mobile keyboard covers form fields

---

**Next Steps:**

1. Review wireframes with product owner
2. User test 2-step vs. single-page with accordion
3. Implement chosen approach for mobile
4. Keep existing desktop form (works well)
5. Test with real users on-site
6. Measure time savings and completion rate
