# Page Inventory - Story 10.9

## Current State Analysis

### Existing Navigation Components (Stories 10.1-10.8)

All new navigation components from Epic 10 are already implemented:

- ✅ **Sidebar** (Story 10.3): `src/components/layout/Sidebar.tsx` - Collapsible desktop sidebar
- ✅ **SidebarLayout** (Story 10.3): `src/components/layout/SidebarLayout.tsx` - Layout wrapper
- ✅ **BottomTabBar** (Story 10.5): `src/components/navigation/BottomTabBar.tsx` - Mobile bottom tabs with FAB
- ✅ **FloatingActionButton** (Story 10.7): Integrated in BottomTabBar
- ✅ **SwipeableDrawer** (Story 10.6): `src/components/navigation/SwipeableDrawer.tsx` - Mobile navigation drawer
- ✅ **MobileHeader** (Story 10.8): `src/components/layout/MobileHeader.tsx` - Collapsible mobile header
- ✅ **MobileNavigation** (Story 10.8): `src/components/layout/MobileNavigation.tsx` - Wrapper combining MobileHeader + SwipeableDrawer

### Root Layout Status

**File:** `src/app/layout.tsx`

**Currently includes globally:**

- ✅ BottomTabBar (mobile only)
- ✅ MobileNavigation (mobile header + drawer)
- ✅ CommandPalette
- ✅ Toaster notifications
- ✅ OfflineBanner
- ❌ Desktop Sidebar - **NOT YET ADDED**

### Old Component to Remove

**Navbar Component:** `src/components/layout/Navbar.tsx`

- Old horizontal navigation
- Used on ALL current pages
- Needs to be REMOVED from all pages

---

## Complete Page Inventory

Total pages: **38**
Total layouts: **5**

### Pages by Category

#### 1. Dashboard / Home (2 pages)

- `/` - `src/app/page.tsx` - Main landing/dashboard
- `/dashboard` - `src/app/dashboard/page.tsx` - Dashboard

#### 2. Authentication Pages (5 pages)

- `/login` - `src/app/login/page.tsx`
- `/login/verify-2fa` - `src/app/login/verify-2fa/page.tsx`
- `/register` - `src/app/register/page.tsx`
- `/forgot-password` - `src/app/forgot-password/page.tsx`
- `/reset-password` - `src/app/reset-password/page.tsx`

#### 3. Projects Pages (11 pages)

- `/projects` - `src/app/projects/page.tsx` - Projects list
- `/projects/new` - `src/app/projects/new/page.tsx` - Create project
- `/projects/[id]` - `src/app/projects/[id]/page.tsx` - Project detail
- `/projects/[id]/edit` - `src/app/projects/[id]/edit/page.tsx`
- `/projects/[id]/settings` - `src/app/projects/[id]/settings/page.tsx`
- `/projects/[id]/partners` - `src/app/projects/[id]/partners/page.tsx`
- `/projects/[id]/costs` - `src/app/projects/[id]/costs/page.tsx`
- `/projects/[id]/costs/new` - `src/app/projects/[id]/costs/new/page.tsx`
- `/projects/[id]/costs/[costId]/edit` - `src/app/projects/[id]/costs/[costId]/edit/page.tsx`
- `/projects/[id]/documents` - `src/app/projects/[id]/documents/page.tsx`
- `/projects/[id]/documents/[documentId]` - `src/app/projects/[id]/documents/[documentId]/page.tsx`
- `/projects/[id]/events` - `src/app/projects/[id]/events/page.tsx`
- `/projects/[id]/events/[eventId]` - `src/app/projects/[id]/events/[eventId]/page.tsx`

#### 4. Vendors Pages (3 pages)

- `/vendors/[id]` - `src/app/vendors/[id]/page.tsx` - Vendor detail
- `/vendors/compare` - `src/app/vendors/compare/page.tsx`
- `/vendors/dashboard` - `src/app/vendors/dashboard/page.tsx` - Vendors list

#### 5. Settings Pages (7 pages)

- `/settings` - `src/app/settings/page.tsx` - Main settings
- `/settings/profile` - `src/app/settings/profile/page.tsx`
- `/settings/preferences` - `src/app/settings/preferences/page.tsx`
- `/settings/notifications` - `src/app/settings/notifications/page.tsx`
- `/settings/security` - `src/app/settings/security/page.tsx`
- `/settings/security/devices` - `src/app/settings/security/devices/page.tsx`
- `/settings/security/backup-codes` - `src/app/settings/security/backup-codes/page.tsx`

#### 6. Admin Pages (2 pages)

- `/admin` - `src/app/admin/page.tsx`
- `/admin/security` - `src/app/admin/security/page.tsx`

#### 7. Other Pages (8 pages)

- `/categories` - `src/app/categories/page.tsx`
- `/contacts` - `src/app/contacts/page.tsx`
- `/contacts/[id]` - `src/app/contacts/[id]/page.tsx`
- `/portfolio` - `src/app/portfolio/page.tsx`
- `/invite/[token]` - `src/app/invite/[token]/page.tsx` - Partner invite acceptance
- `/unsubscribe/[token]` - `src/app/unsubscribe/[token]/page.tsx` - Email unsubscribe

---

## Layout Files

### 1. Root Layout

**File:** `src/app/layout.tsx`
**Current state:** Has mobile navigation (BottomTabBar, MobileNavigation) but NOT desktop Sidebar
**Needs:** Add Sidebar component and content wrapper with margin adjustment

### 2. Projects Detail Layout

**File:** `src/app/projects/[id]/layout.tsx`
**Current state:** Uses Navbar + HorizontalNav for subsections (Story 10.4)
**Impact:** HorizontalNav must remain intact for project subsections
**Special requirements:**

- Remove Navbar only, keep HorizontalNav
- HorizontalNav is sticky at top for project subsection navigation (costs, documents, events, partners, settings)
- Applies to 13 project detail and subsection pages

### 3. Settings Layout

**File:** `src/app/settings/layout.tsx`
**Current state:** Uses Navbar + custom sidebar/tab navigation for settings sections
**Impact:** Custom settings navigation must remain intact
**Special requirements:**

- Remove Navbar only
- Keep nested sidebar navigation (desktop) and tab navigation (mobile) for settings subsections
- Settings sections: Profile, Security, Preferences
- Applies to 7 settings pages

### 4. Admin Layout

**File:** `src/app/admin/layout.tsx`
**Current state:** Self-contained layout WITHOUT Navbar (already correct!)
**Impact:** Already has its own admin panel sidebar
**Special requirements:**

- **NO CHANGES NEEDED** - admin layout doesn't use Navbar
- Has self-contained admin sidebar navigation
- Applies to 2 admin pages

### 5. Vendors Layout

**File:** `src/app/vendors/layout.tsx`
**Current state:** Simple wrapper with Navbar
**Impact:** Simple layout, just needs Navbar removal
**Special requirements:**

- Remove Navbar
- Keep padding wrapper for mobile bottom tabs
- Applies to 3 vendor pages

---

## Current Page Pattern

All pages currently follow this pattern:

```tsx
export default function SomePage() {
  return (
    <>
      <Navbar /> {/* ← OLD COMPONENT TO REMOVE */}
      <div className="container py-10">{/* Page content */}</div>
    </>
  )
}
```

---

## Target Pattern After Migration

After migration, pages should follow this simplified pattern:

```tsx
export default function SomePage() {
  return <div className="container py-10">{/* Page content - navigation handled globally */}</div>
}
```

Or wrapped content without fragments:

```tsx
export default function SomePage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container py-10">{/* Page content */}</div>
    </main>
  )
}
```

---

## Migration Strategy

### Approach: Global Layout Update

1. **Update Root Layout** (`src/app/layout.tsx`):
   - Add Sidebar component (desktop only, hidden on mobile)
   - Add content wrapper div that adjusts margin based on sidebar state
   - Keep existing BottomTabBar and MobileNavigation

2. **Remove Old Navbar** from all 38 pages:
   - Remove `<Navbar />` import
   - Remove `<Navbar />` JSX
   - Simplify page structure (remove wrapper fragments if no longer needed)

3. **Test Each Page**:
   - Desktop: Sidebar visible, content adjusts
   - Mobile: Bottom tabs + drawer + collapsible header visible
   - All data fetching and functionality intact

### Authentication & Protected Routes

Pages requiring authentication:

- All project pages
- Vendors pages
- Settings pages
- Admin pages
- Contacts pages
- Categories page
- Portfolio page

Public pages:

- Home (/)
- Login
- Register
- Forgot password
- Reset password
- Invite acceptance
- Unsubscribe

---

## API Routes & Data Fetching

### tRPC Patterns Found

Most pages use tRPC for data fetching:

```tsx
const { data, isLoading, error } = api.projects.list.useQuery()
```

**Key APIs by page type:**

- Projects: `api.projects.*`
- Vendors: `api.vendors.*`
- Costs: `api.costs.*`
- Documents: `api.documents.*`
- Settings: `api.users.*`, `api.auth.*`

**Important:** Navigation update should NOT affect API calls or data fetching logic

---

## Modal & Dialog Components

Location: TBD during implementation
Need to update for consistent styling with new design system

---

## Testing Checklist Per Page

For each migrated page:

- [ ] Page loads without errors
- [ ] Desktop sidebar visible and functional
- [ ] Mobile bottom tabs visible
- [ ] Mobile drawer accessible
- [ ] Mobile header collapses on scroll
- [ ] Data fetches correctly
- [ ] Forms submit successfully
- [ ] Navigation works (can navigate away and back)
- [ ] Authentication/authorization intact
- [ ] No console errors
- [ ] Performance maintained

---

## Dependencies & Integration Points

### External Libraries

- Next.js 14 App Router
- tRPC for API calls
- Framer Motion for animations (sidebar, mobile header)
- Tailwind CSS for styling
- Radix UI for UI components (used in Sidebar, etc.)

### Internal Dependencies

- Auth system: `useAuth()` hook
- User roles: `useUserRole()` hook
- Sidebar state: `useCollapsedSidebar()` hook
- Viewport detection: `useViewport()` hook

---

## Rollback Plan

If issues arise:

1. Revert root layout changes
2. Restore Navbar component on affected pages
3. Use feature flag to control new navigation per page
4. Test incrementally

**Feature flag approach:**

```tsx
const useNewNav = process.env.NEXT_PUBLIC_NEW_NAV_ENABLED === "true"
```

---

## Summary

**Status:** Inventory complete ✅

**Key Findings:**

- All Epic 10 navigation components exist and are functional
- 38 pages total found
- 35 pages need Navbar removal (admin pages don't use Navbar)
- 5 nested layouts inspected:
  - Projects: Has HorizontalNav (keep it)
  - Settings: Has nested sidebar/tabs (keep them)
  - Admin: No Navbar (no changes needed)
  - Vendors: Simple wrapper (remove Navbar)
- Root layout needs Sidebar addition
- Mobile navigation already in place globally

**Critical Discovery:**

- Admin layout (2 pages) does NOT use Navbar - no changes needed there!
- Projects and Settings have nested navigation that must be preserved

**Next Steps:**

1. ✅ Inspect nested layouts - COMPLETE
2. Add Sidebar to root layout
3. Remove Navbar from 35 pages systematically (excluding admin pages)
4. Test each page thoroughly
