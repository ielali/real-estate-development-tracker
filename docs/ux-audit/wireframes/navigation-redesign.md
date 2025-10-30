# Navigation Redesign Wireframes

**Component:** Global Navigation
**Priority:** P0
**Affects:** All pages
**Goal:** Improve navigation efficiency, add breadcrumbs, implement project switcher

---

## Current State Issues

1. No breadcrumb navigation on deep pages (users lose context)
2. Cannot quickly switch between projects (must return to project list)
3. Navigation menu too crowded on mobile
4. No indication of current page/section

---

## Proposed Solution: Desktop Navigation

### Top Navigation Bar (≥768px)

```
┌─────────────────────────────────────────────────────────────────────┐
│ [Logo] RE Tracker    [Project Switcher ▾]    Projects  Contacts    │
│                                                                      │
│                                        [Search 🔍]  [User Menu ▾]   │
└─────────────────────────────────────────────────────────────────────┘
│                                                                      │
│  [Breadcrumbs: Projects > Harbor View Apartments > Costs]           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Components:**

1. **Logo & Brand** (left)
2. **Project Switcher** (dropdown showing current project + recent projects)
3. **Main Nav Links** (Projects, Contacts - simplified from 4 to 2)
4. **Global Search** (Cmd+K to open)
5. **User Menu** (Settings, Logout)
6. **Breadcrumb Navigation** (below main nav, shows current location)

---

### Project Switcher Dropdown

When clicked, shows:

```
┌─────────────────────────────────────┐
│ Current Project                     │
│ ✓ Harbor View Apartments            │
│                                     │
│ Recent Projects                     │
│   Sunset Terrace                    │
│   Oak Street Renovation             │
│   Downtown Plaza                    │
│                                     │
│ ─────────────────────────────────── │
│ [All Projects →]                    │
└─────────────────────────────────────┘
```

**Features:**

- Shows current project with checkmark
- Lists 5 most recent projects
- "All Projects" link to full list
- Keyboard shortcut: `Cmd+Shift+P`

---

### Breadcrumb Navigation

**Pattern:**

```
Projects > [Project Name] > [Section]
```

**Examples:**

- `Projects > Harbor View Apartments > Dashboard`
- `Projects > Harbor View Apartments > Costs`
- `Projects > Harbor View Apartments > Costs > Add Cost`
- `Contacts > John Smith`

**Interaction:**

- Each segment is clickable (navigates to that level)
- Current page is not clickable (just text)
- Mobile: Truncate middle segments with "..." if too long

---

## Proposed Solution: Mobile Navigation

### Bottom Tab Navigation (<768px)

```
┌─────────────────────────────────────┐
│                                     │
│        [Main Content Area]          │
│                                     │
│                                     │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  [🏠]    [📁]    [➕]    [👤]       │
│  Home  Projects  Add  Profile       │
└─────────────────────────────────────┘
```

**Bottom Tabs (48px height):**

1. **Home** (🏠) - Dashboard / Project list
2. **Projects** (📁) - Current project context
3. **Add** (➕) - Quick action menu (floating)
4. **Profile** (👤) - Settings & account

**Features:**

- Fixed position at bottom (thumb-friendly)
- Active tab highlighted with primary color
- Large touch targets (minimum 48x48px)
- Icon + label for clarity

---

### Quick Action Menu (Mobile)

When "Add" (➕) button tapped, shows bottom sheet:

```
┌─────────────────────────────────────┐
│ Quick Actions                       │
│ ─────────────────────────────────── │
│                                     │
│ [💰] Add Cost                       │
│                                     │
│ [📄] Upload Document                │
│                                     │
│ [📅] Add Event                      │
│                                     │
│ [👥] Add Contact                    │
│                                     │
│        [Cancel]                     │
└─────────────────────────────────────┘
```

**Features:**

- Bottom sheet overlay (easy to reach with thumb)
- Large tap targets (64px height each)
- Icon + text for clarity
- Swipe down or tap outside to dismiss

---

## Implementation Details

### Desktop Navigation Code Structure

```tsx
<nav className="sticky top-0 z-50 bg-white border-b border-slate-200">
  <div className="container mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex items-center justify-between h-16">
      {/* Left: Logo + Project Switcher */}
      <div className="flex items-center gap-6">
        <Logo />
        <ProjectSwitcher />
      </div>

      {/* Center: Main Nav */}
      <div className="hidden md:flex items-center gap-6">
        <NavLink href="/projects">Projects</NavLink>
        <NavLink href="/contacts">Contacts</NavLink>
      </div>

      {/* Right: Search + User */}
      <div className="flex items-center gap-4">
        <SearchButton />
        <UserMenu />
      </div>
    </div>
  </div>

  {/* Breadcrumbs */}
  <Breadcrumbs />
</nav>
```

---

### Mobile Navigation Code Structure

```tsx
{
  /* Mobile Bottom Tab Bar */
}
;<nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200">
  <div className="flex items-center justify-around h-16">
    <TabButton icon={Home} label="Home" href="/" />
    <TabButton icon={FolderOpen} label="Projects" href="/projects" />
    <QuickActionButton /> {/* Floating + button */}
    <TabButton icon={User} label="Profile" href="/profile" />
  </div>
</nav>

{
  /* Quick Action Menu (Bottom Sheet) */
}
;<Sheet open={isQuickActionOpen}>
  <SheetContent side="bottom">
    <SheetHeader>
      <SheetTitle>Quick Actions</SheetTitle>
    </SheetHeader>
    <div className="grid gap-2 py-4">
      <QuickAction icon={DollarSign} label="Add Cost" href="/costs/new" />
      <QuickAction icon={Upload} label="Upload Document" href="/documents/upload" />
      <QuickAction icon={Calendar} label="Add Event" href="/events/new" />
      <QuickAction icon={Users} label="Add Contact" href="/contacts/new" />
    </div>
  </SheetContent>
</Sheet>
```

---

## Project Switcher Component

### Functionality

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" className="gap-2">
      {currentProject.name}
      <ChevronDown className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="start" className="w-72">
    <DropdownMenuLabel>Current Project</DropdownMenuLabel>
    <DropdownMenuItem>
      <Check className="mr-2 h-4 w-4" />
      {currentProject.name}
    </DropdownMenuItem>

    <DropdownMenuSeparator />

    <DropdownMenuLabel>Recent Projects</DropdownMenuLabel>
    {recentProjects.map((project) => (
      <DropdownMenuItem key={project.id} onClick={() => switchProject(project.id)}>
        {project.name}
      </DropdownMenuItem>
    ))}

    <DropdownMenuSeparator />

    <DropdownMenuItem asChild>
      <Link href="/projects">All Projects →</Link>
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

## Accessibility Requirements

### Keyboard Navigation

- **Tab:** Navigate through nav items
- **Cmd+Shift+P:** Open project switcher
- **Cmd+K:** Open search
- **Escape:** Close dropdowns/menus

### Screen Reader

- Nav wrapped in `<nav>` element with `aria-label="Main navigation"`
- Breadcrumbs in `<nav aria-label="Breadcrumb">`
- Current page: `aria-current="page"`
- Project switcher: `aria-label="Switch project"`

### Mobile

- Bottom nav: `role="navigation"` with `aria-label="Primary"`
- Touch targets: Minimum 48x48px
- Active tab: `aria-current="page"`

---

## Responsive Behavior

### Breakpoint: 768px (md)

**< 768px (Mobile):**

- Bottom tab navigation
- Hamburger menu for secondary nav
- Breadcrumbs hidden (or simplified to "< Back")

**≥ 768px (Desktop):**

- Top horizontal navigation
- Project switcher visible
- Full breadcrumbs shown
- Search bar visible

---

## Visual Design

### Colors

- Background: `bg-white`
- Border: `border-slate-200`
- Active state: `text-primary` (blue-500)
- Hover: `hover:bg-slate-50`

### Spacing

- Nav height: `h-16` (64px)
- Item gap: `gap-6` (24px)
- Padding: `px-4 sm:px-6 lg:px-8`

### Typography

- Nav links: `text-base font-medium` (16px, 500 weight)
- Breadcrumbs: `text-sm text-slate-600` (14px, muted)

---

## Before & After Comparison

### Before (Current State)

**Pain Points:**

- 4 nav links (Home, Projects, Contacts, Categories) - cluttered
- No project switcher (must navigate to project list)
- No breadcrumbs (users lose context)
- Mobile nav uses hamburger (hard to reach)
- No quick actions (must navigate to each section)

### After (Proposed State)

**Improvements:**

- 2 primary nav links (Projects, Contacts) - simplified
- Project switcher for quick switching
- Breadcrumbs on all deep pages
- Bottom tab navigation on mobile (thumb-friendly)
- Quick action menu for common tasks (Add cost, Upload doc)
- Reduced clicks: 5 clicks → 2 clicks to add cost from project page

**Expected Impact:**

- ✅ Faster navigation between projects
- ✅ Reduced confusion on deep pages
- ✅ Better mobile UX (thumb-friendly bottom nav)
- ✅ Fewer clicks for common actions

---

## Implementation Estimate

- Navigation redesign: **2-3 days**
- Project switcher: **1 day**
- Breadcrumbs: **1 day**
- Mobile bottom nav: **2 days**
- Quick action menu: **1 day**
- Testing & refinement: **1 day**

**Total: 8-9 days**

---

## Related Issues from Audit

- ✅ Fixes P1: Cannot easily switch between projects
- ✅ Fixes P1: No breadcrumbs on deep pages
- ✅ Fixes P1: No current page highlighting in nav
- ✅ Fixes P1: Navigation bar has too many links
- ✅ Fixes P1: Navigation menu not thumb-friendly on mobile
- ✅ Fixes P1: No quick-add button for mobile costs

---

**Next Steps:**

1. Review wireframes with product owner
2. Get design approval
3. Implement desktop navigation first
4. Implement mobile bottom nav
5. Test with real users
6. Iterate based on feedback
