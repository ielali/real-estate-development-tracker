# UI Generation Prompts for Hybrid Mobile Navigation

## For v0 by Vercel / Lovable / Cursor / Other AI UI Tools

### 1. Complete Mobile Layout with Hybrid Navigation

```prompt
Create a mobile-first React component with TypeScript and Tailwind CSS for a real estate development tracker app using a hybrid navigation approach.

Requirements:
- Hybrid navigation: bottom tab bar + sliding drawer menu
- Bottom tab bar with 5 items: Home, Projects (with badge), center FAB add button, Costs, Files
- Collapsible header that hides on scroll down, shows on scroll up
- Sliding drawer from left with user profile, navigation sections, and settings
- Support for iOS safe areas (notch, Dynamic Island, home indicator)
- Use these colors: primary #2563EB, background #F8FAFC, white #FFFFFF, text #0F172A, gray #475569
- Icons: Use Lucide React or Heroicons
- Smooth animations with Framer Motion or CSS transitions
- Gesture support for swipe to open/close drawer

The bottom tab bar should:
- Be fixed at bottom with 56px height
- Have a centered floating action button (+) that's raised above other tabs
- Show active state with blue color and filled icon
- Display notification badges on tabs

The sliding drawer should:
- Overlay with semi-transparent backdrop
- Be 320px wide maximum (or 80% of screen width, whichever is smaller)
- Have user profile section at top with gradient background (#2563EB to #1D4ED8)
- Group navigation items by section (Main, Tools, Account)
- Support swipe-to-close gesture
- Include these navigation items:
  Main: Dashboard, All Projects, Master Timeline, Vendors
  Tools: Reports, Analytics, Notifications
  Account: Settings, Help & Support, Sign Out

Header should include:
- Hamburger menu button on left
- App logo and name in center
- Notification bell with badge on right

Include example content showing a projects list with progress indicators and stats cards.
```

### 2. Project Detail View with Horizontal Navigation

```prompt
Create a mobile project detail screen with horizontal scrolling navigation tabs for a React app using TypeScript and Tailwind CSS.

Layout structure:
- Fixed header with back button, project name ("The Grand Plaza"), and menu icon
- Horizontal scrolling tab navigation below header (Overview, Costs, Timeline, Tasks, Documents, Team, Reports)
- Active tab with blue background pill shape (#2563EB), others with gray text (#475569)
- Content area with stats cards grid (2x2)
- Floating action button (FAB) in bottom right with speed dial menu

Design specifications:
- Colors: primary #2563EB, success #10B981, warning #F59E0B, error #EF4444
- Border radius: 8px for cards, full for pills/buttons
- Shadows: soft shadows on cards and FAB (shadow-lg)
- Typography: Inter font, 14px base, 12px labels, 18px headers

The horizontal navigation should:
- Be scrollable with momentum scrolling
- Show fade gradient on right edge when more items available
- Smooth scroll to active item when selected
- Have 48px height for good touch targets
- Use icons with text for each tab

The FAB speed dial should:
- Show options when tapped: Add Photo, Add Cost, Create Task, Upload Document, Add Note
- Animate options sliding up from FAB with staggered animation
- Have semi-transparent backdrop when open
- Use material design elevation (shadow-xl)
- Close when backdrop is tapped or FAB is pressed again

Content area should display:
- 4 stat cards in 2x2 grid (Budget, Spent, Progress, Timeline)
- Recent activity feed with timeline items
- Each stat card with icon, label, value, and trend indicator

Include loading states with skeleton screens and empty states with helpful messages.
```

### 3. Mobile Dashboard with Bottom Tab Navigation

```prompt
Create a mobile dashboard screen with bottom tab navigation for a real estate development tracker app using React, TypeScript, and Tailwind CSS.

Layout requirements:
- Collapsible header (hides on scroll down, shows on scroll up)
- Scrollable content with pull-to-refresh
- Grid of stat cards (2 columns on mobile)
- Recent projects list with progress bars
- Fixed bottom tab bar with 5 items
- Empty state when no projects

Header (56px height):
- Menu icon on left (opens drawer)
- "DevTrack" logo/text center
- Notification bell with red dot indicator on right
- White background with bottom border
- Smooth slide animation when hiding/showing

Bottom tab bar (56px height + safe area):
- 5 items evenly spaced
- Icons: Home (house), Projects (building), Add (plus in circle), Costs (dollar), Files (folder)
- Center "Add" button styled as FAB (raised, blue background, larger)
- Active tab: blue icon and text (#2563EB)
- Inactive: gray (#94A3B8)
- Labels under icons (10px font size)
- Badge on Projects tab showing count

Content area:
- Pull-to-refresh indicator at top
- "Dashboard" title (24px, bold)
- 4 stat cards in 2x2 grid:
  1. Active Projects (count + trend)
  2. Total Budget (currency + percentage)
  3. Total Spent (currency + percentage of budget)
  4. On Schedule (fraction + delayed count)

Project list items (cards with 12px gap):
- White background, rounded corners (8px), subtle shadow
- Project name (16px, semibold)
- Project type/address (12px, gray)
- Progress bar (4px height, blue/yellow/green based on status)
- Budget and completion percentage
- Status badge (Active/On Hold/Completed)
- Tap to navigate to detail

Empty state:
- Icon (building outline, 48px, gray)
- "No projects yet" text
- "Create your first project" button
- Centered in viewport

Colors:
- Primary: #2563EB (blue)
- Success: #10B981 (green)
- Warning: #F59E0B (amber)
- Error: #EF4444 (red)
- Background: #F8FAFC
- Card: #FFFFFF
- Text primary: #0F172A
- Text secondary: #475569
- Text tertiary: #94A3B8
- Border: #E2E8F0

Include TypeScript interfaces, proper touch targets (min 44px), and iOS safe area support.
```

### 4. Quick Add Menu (Speed Dial)

```prompt
Create a mobile speed dial/quick add menu component for a construction project app using React, TypeScript, Tailwind CSS, and Framer Motion.

The component should:
- Triggered by center FAB in bottom tab bar
- Animate options sliding up from FAB with spring animation
- Have semi-transparent backdrop (black/30 opacity)
- Support tap outside to close
- Use staggered animations for menu items

Menu structure:
- Main FAB button (56px diameter)
  - Blue background (#2563EB)
  - White plus icon (24px)
  - Elevated shadow (shadow-xl)
  - Transforms to X when open

Speed dial items (appear above FAB):
1. Take Photo (camera icon) - Opens camera
2. Add Cost (dollar icon) - Opens cost entry form
3. Create Task (checkbox icon) - Opens task form
4. Upload Document (document icon) - Opens file picker
5. Add Note (pencil icon) - Opens note editor

Each menu item:
- White background card (rounded-lg)
- 56px height, full width minus 32px margins
- Icon on left (40px square area, gray background, 20px icon)
- Label text (14px, medium weight)
- Subtle shadow (shadow-lg)
- 8px gap between items
- Ripple effect on tap

Animation specifications:
- Backdrop: fade in (200ms)
- Menu items: slide up + fade in
- Stagger delay: 30ms between items
- Spring animation: stiffness: 400, damping: 25
- Close animation: reverse order, faster (150ms)

State management:
- isOpen boolean state
- Toggle on FAB press
- Close on backdrop tap
- Close on menu item selection
- Close on escape key (desktop)

Accessibility:
- Proper ARIA labels
- Role="menu" on container
- Role="menuitem" on items
- Trap focus when open
- Announce state changes

TypeScript interfaces:
interface QuickAction {
  id: string;
  icon: React.ComponentType;
  label: string;
  action: () => void;
  color?: string;
}

Include proper touch handling, haptic feedback trigger (iOS), and smooth animations.
```

### 5. Mobile Cost Entry Form

```prompt
Create a mobile-optimized cost entry form that slides up from bottom for a construction project app using React, TypeScript, and Tailwind CSS.

Form layout:
- Full-screen modal sliding up from bottom
- Header with Cancel and Save buttons
- Scrollable form content with keyboard avoidance
- Smart input focusing and keyboard management

Header (56px):
- "Add Cost" title center
- Cancel button left (text button)
- Save button right (primary blue)
- Bottom border
- Fixed position during scroll

Form fields (16px padding):
1. Amount field (large, prominent):
   - 32px font size for amount
   - Currency symbol prefix ($)
   - Numeric keyboard
   - Auto-format with commas
   - Required field indicator

2. Description field:
   - Text input
   - 16px font
   - Placeholder: "What was this for?"
   - Required

3. Category selection:
   - Quick select chips (horizontal scroll)
   - Common categories: Materials, Labor, Equipment, Services, Other
   - Selected state with blue background
   - Tap to select

4. Date picker:
   - Default to today
   - Calendar icon on right
   - Native date picker on mobile

5. Vendor/Contact field:
   - Searchable select
   - Recent vendors section (last 5)
   - "Add new vendor" option at bottom
   - Avatar icons for vendors

6. Receipt photo:
   - Large touch target (full width, 80px height)
   - Camera icon and "Add Receipt" text
   - Shows thumbnail when added
   - Option to retake

7. Notes (optional):
   - Expandable section
   - Textarea when expanded
   - 100 character limit indicator

Bottom section (sticky):
- "Save as Template" toggle
- Save button (full width, 48px height)
- Disabled state while saving
- Loading spinner when processing

Validation:
- Inline error messages
- Red border on invalid fields
- Shake animation on validation fail
- Toast notification on success

Colors:
- Primary: #2563EB
- Error: #EF4444
- Success: #10B981
- Background: #FFFFFF
- Input background: #F8FAFC
- Text: #0F172A
- Placeholder: #94A3B8

Interactions:
- Auto-focus amount field on open
- Smooth scroll to focused input
- Keyboard dismiss on scroll
- Haptic feedback on save
- Auto-save draft every 3 seconds
- Success animation before close

Include TypeScript interfaces for form data, proper keyboard handling, and accessibility labels.
```

### 6. Swipeable Drawer Component

```prompt
Create a swipeable navigation drawer component for mobile using React, TypeScript, Tailwind CSS, and Framer Motion with gesture support.

Drawer specifications:
- Slides in from left side
- 320px width (max 85% screen width)
- Full height with safe area support
- Swipe gestures for open/close
- Spring animations

Structure:
1. User Profile Section (gradient background):
   - Background gradient: #2563EB to #1D4ED8
   - User avatar (48px circle)
   - User name (16px, white, semibold)
   - User role/email (12px, white/90% opacity)
   - Edit profile link

2. Navigation Sections:
   Main Section:
   - Dashboard (speedometer icon)
   - All Projects (building icon)
   - Timeline (calendar icon)
   - Vendors (users icon)

   Tools Section:
   - Reports (chart icon)
   - Analytics (trending icon)
   - Notifications (bell icon) with badge

   Account Section:
   - Settings (cog icon)
   - Help & Support (question icon)
   - Sign Out (logout icon, red text)

3. Each nav item:
   - 48px height
   - 16px horizontal padding
   - Icon (20px) + label (14px) with 12px gap
   - Hover state: gray background
   - Active state: blue background, blue text
   - Ripple effect on tap

Gesture handling:
- Swipe from left edge to open (20px edge zone)
- Swipe left on drawer to close
- Velocity threshold: 0.2
- Drag threshold: 50px
- Rubber band effect at limits
- Backdrop tap to close

Animation:
- Opening: slide + fade (spring: stiffness 400, damping 30)
- Closing: slide + fade (faster, 200ms)
- Backdrop: fade in/out (200ms)
- Scale effect on drag (subtle)

State management:
const [isOpen, setIsOpen] = useState(false);
const [dragX, setDragX] = useState(0);

Touch/Mouse events:
- onTouchStart: Record start position
- onTouchMove: Update drag position
- onTouchEnd: Determine open/close based on velocity and position
- Mouse events for desktop testing

Accessibility:
- Focus trap when open
- Escape key to close
- ARIA labels and roles
- Screen reader announcements
- Skip to main content link

Include backdrop overlay (50% black), proper z-index layering (z-50), and TypeScript interfaces for navigation items.
```

## Implementation Guide

### 1. Setup Project Dependencies

```bash
# Core dependencies
npm install react react-dom next
npm install typescript @types/react @types/node

# UI libraries
npm install tailwindcss @tailwindcss/forms
npm install framer-motion
npm install lucide-react
npm install @radix-ui/react-*

# Gesture handling
npm install @use-gesture/react
npm install react-spring

# Utilities
npm install clsx tailwind-merge
npm install react-intersection-observer
```

### 2. Configure Tailwind for Mobile

```javascript
// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2563EB",
          dark: "#1D4ED8",
          light: "#DBEAFE",
        },
        success: "#10B981",
        warning: "#F59E0B",
        error: "#EF4444",
        gray: {
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A",
        },
      },
      height: {
        "safe-top": "env(safe-area-inset-top)",
        "safe-bottom": "env(safe-area-inset-bottom)",
      },
      padding: {
        "safe-top": "env(safe-area-inset-top)",
        "safe-bottom": "env(safe-area-inset-bottom)",
        "safe-left": "env(safe-area-inset-left)",
        "safe-right": "env(safe-area-inset-right)",
      },
      animation: {
        "slide-up": "slideUp 0.3s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "fade-in": "fadeIn 0.2s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
}
```

### 3. Add PWA Support

```json
// manifest.json
{
  "name": "DevTrack - Real Estate Tracker",
  "short_name": "DevTrack",
  "description": "Track real estate development projects on the go",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#2563EB",
  "background_color": "#FFFFFF",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "categories": ["business", "productivity"],
  "shortcuts": [
    {
      "name": "Add Cost",
      "url": "/quick-add/cost",
      "icons": [{ "src": "/icon-cost.png", "sizes": "96x96" }]
    },
    {
      "name": "Take Photo",
      "url": "/quick-add/photo",
      "icons": [{ "src": "/icon-camera.png", "sizes": "96x96" }]
    }
  ]
}
```

### 4. Meta Tags for Mobile

```html
<!-- Add to document head -->
<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
/>
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="theme-color" content="#2563EB" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="manifest" href="/manifest.json" />
```

## Testing Checklist

### Device Testing

- [ ] iPhone SE (small screen)
- [ ] iPhone 14 Pro (notch)
- [ ] iPhone 15 Pro (Dynamic Island)
- [ ] Samsung Galaxy S23
- [ ] Google Pixel 7
- [ ] iPad Mini (tablet)

### Interaction Testing

- [ ] Swipe gestures work smoothly
- [ ] Bottom tabs respond correctly
- [ ] Drawer opens/closes properly
- [ ] Header hides on scroll
- [ ] FAB and speed dial function
- [ ] Forms handle keyboard properly
- [ ] Pull-to-refresh works

### Performance Testing

- [ ] 60fps scrolling
- [ ] < 100ms touch response
- [ ] Smooth animations
- [ ] No layout shifts
- [ ] Images load progressively

### Accessibility Testing

- [ ] VoiceOver (iOS) navigation
- [ ] TalkBack (Android) navigation
- [ ] Keyboard navigation
- [ ] Focus management
- [ ] Color contrast passes

## Optimization Tips

1. **Use CSS transforms** instead of position for animations
2. **Implement virtual scrolling** for long lists
3. **Lazy load** components and images
4. **Debounce** search and filter inputs
5. **Cache** API responses for offline support
6. **Compress** images before upload
7. **Use skeleton screens** instead of spinners
8. **Implement service workers** for offline functionality
9. **Minimize JavaScript** bundle size
10. **Optimize font loading** with font-display: swap
