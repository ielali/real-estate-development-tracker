# Hybrid Mobile Navigation - Implementation Specification

## Overview

This document provides the complete implementation specification for the hybrid mobile navigation approach, combining a bottom tab bar with a sliding drawer for the Real Estate Development Tracker application.

## Core Architecture

### Mobile Layout Structure

```tsx
// Main Mobile Layout Component
interface MobileLayoutProps {
  children: React.ReactNode
  currentRoute: string
  user: User
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ children, currentRoute, user }) => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [headerVisible, setHeaderVisible] = useState(true)

  return (
    <div className="mobile-container">
      {/* Collapsible Header */}
      <MobileHeader visible={headerVisible} onMenuClick={() => setDrawerOpen(true)} user={user} />

      {/* Sliding Drawer */}
      <SwipeableDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} user={user} />

      {/* Main Content with Scroll Detection */}
      <ScrollableContent onScroll={(direction) => setHeaderVisible(direction === "up")}>
        {children}
      </ScrollableContent>

      {/* Fixed Bottom Tab Bar */}
      <BottomTabBar currentRoute={currentRoute} />
    </div>
  )
}
```

## Component Specifications

### 1. Mobile Header Component

```tsx
interface MobileHeaderProps {
  visible: boolean
  onMenuClick: () => void
  user: User
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ visible, onMenuClick, user }) => {
  return (
    <header
      className={`
        fixed top-0 left-0 right-0 z-40
        h-14 bg-white border-b border-gray-200
        transform transition-transform duration-200
        ${visible ? "translate-y-0" : "-translate-y-full"}
      `}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex items-center justify-between px-4 h-full">
        {/* Menu Button */}
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100"
          aria-label="Open menu"
        >
          <MenuIcon className="w-6 h-6" />
        </button>

        {/* Logo/Title */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <BuildingIcon className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-lg">DevTrack</span>
        </div>

        {/* Notifications */}
        <button className="p-2 -mr-2 rounded-lg hover:bg-gray-100 relative">
          <BellIcon className="w-6 h-6" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
      </div>
    </header>
  )
}
```

### 2. Bottom Tab Bar Component

```tsx
interface TabItem {
  id: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  route: string
  badge?: number
}

const bottomTabs: TabItem[] = [
  { id: "home", icon: HomeIcon, label: "Home", route: "/" },
  { id: "projects", icon: BuildingIcon, label: "Projects", route: "/projects", badge: 3 },
  { id: "add", icon: PlusCircleIcon, label: "", route: "#add" }, // Special FAB-style
  { id: "costs", icon: DollarIcon, label: "Costs", route: "/costs" },
  { id: "files", icon: FolderIcon, label: "Files", route: "/files" },
]

const BottomTabBar: React.FC<{ currentRoute: string }> = ({ currentRoute }) => {
  const router = useRouter()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around h-14">
        {bottomTabs.map((tab) => {
          const isActive = currentRoute === tab.route
          const isAddButton = tab.id === "add"

          if (isAddButton) {
            return (
              <button key={tab.id} onClick={() => openQuickAddMenu()} className="relative -mt-4">
                <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <PlusIcon className="w-6 h-6 text-white" />
                </div>
              </button>
            )
          }

          return (
            <button
              key={tab.id}
              onClick={() => router.push(tab.route)}
              className="flex flex-col items-center justify-center flex-1 py-1 px-2 min-w-0"
            >
              <div className="relative">
                <tab.icon className={`w-6 h-6 ${isActive ? "text-blue-600" : "text-gray-500"}`} />
                {tab.badge && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-xs mt-0.5 ${isActive ? "text-blue-600 font-medium" : "text-gray-500"}`}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
```

### 3. Sliding Drawer Component

```tsx
interface SwipeableDrawerProps {
  open: boolean
  onClose: () => void
  user: User
}

const SwipeableDrawer: React.FC<SwipeableDrawerProps> = ({ open, onClose, user }) => {
  const { ref, x } = useSwipeGesture({
    onSwipeLeft: () => x.value < -50 && onClose(),
  })

  return (
    <>
      {/* Overlay */}
      {open && <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />}

      {/* Drawer */}
      <div
        ref={ref}
        className={`
          fixed left-0 top-0 bottom-0 w-80 bg-white z-50
          transform transition-transform duration-300 ease-out
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{
          paddingTop: "env(safe-area-inset-top)",
          maxWidth: "calc(100vw - 56px)", // Always leave some space
        }}
      >
        {/* User Profile Section */}
        <div className="p-4 bg-gradient-to-br from-blue-600 to-blue-700">
          <div className="flex items-center gap-3 text-white">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-12 h-12 rounded-full border-2 border-white/20"
            />
            <div>
              <div className="font-semibold">{user.name}</div>
              <div className="text-sm opacity-90">{user.role}</div>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <ScrollView className="flex-1">
          {/* Main Navigation */}
          <div className="p-3">
            <DrawerSection title="Main">
              <DrawerItem icon={DashboardIcon} label="Dashboard" route="/dashboard" />
              <DrawerItem icon={ProjectIcon} label="All Projects" route="/projects/all" />
              <DrawerItem icon={TimelineIcon} label="Master Timeline" route="/timeline" />
              <DrawerItem icon={VendorIcon} label="Vendors" route="/vendors" badge={5} />
            </DrawerSection>

            <DrawerSection title="Tools">
              <DrawerItem icon={ReportIcon} label="Reports" route="/reports" />
              <DrawerItem icon={AnalyticsIcon} label="Analytics" route="/analytics" />
              <DrawerItem icon={NotificationIcon} label="Notifications" route="/notifications" />
            </DrawerSection>

            <DrawerSection title="Account">
              <DrawerItem icon={SettingsIcon} label="Settings" route="/settings" />
              <DrawerItem icon={HelpIcon} label="Help & Support" route="/help" />
              <DrawerItem icon={LogoutIcon} label="Sign Out" action={signOut} />
            </DrawerSection>
          </div>
        </ScrollView>
      </div>
    </>
  )
}
```

### 4. Quick Add Menu (Speed Dial)

```tsx
const QuickAddMenu: React.FC = () => {
  const [open, setOpen] = useState(false)

  const quickActions = [
    { icon: CameraIcon, label: "Take Photo", action: "camera" },
    { icon: ReceiptIcon, label: "Add Cost", action: "cost" },
    { icon: TaskIcon, label: "Create Task", action: "task" },
    { icon: DocumentIcon, label: "Upload Document", action: "document" },
    { icon: NoteIcon, label: "Add Note", action: "note" },
  ]

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setOpen(false)}
          />

          {/* Speed Dial Items */}
          <motion.div className="fixed bottom-20 left-0 right-0 z-50 px-4">
            {quickActions.map((action, index) => (
              <motion.button
                key={action.action}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleQuickAction(action.action)}
                className="flex items-center gap-3 w-full bg-white rounded-lg p-3 mb-2 shadow-lg"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <action.icon className="w-5 h-5 text-gray-700" />
                </div>
                <span className="font-medium">{action.label}</span>
              </motion.button>
            ))}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
```

## Gesture Handling

### Swipe Gestures Implementation

```tsx
import { useGesture } from "@use-gesture/react"

const useSwipeGesture = ({ onSwipeLeft, onSwipeRight, threshold = 50 }) => {
  const [{ x }, api] = useSpring(() => ({ x: 0 }))

  const bind = useGesture({
    onDrag: ({ down, movement: [mx], velocity: [vx] }) => {
      if (!down) {
        if (mx < -threshold && vx < -0.2) onSwipeLeft?.()
        if (mx > threshold && vx > 0.2) onSwipeRight?.()
      }
      api.start({ x: down ? mx : 0, immediate: down })
    },
  })

  return { bind, x }
}

// Usage in Drawer
const DrawerWithGestures = () => {
  const { bind, x } = useSwipeGesture({
    onSwipeLeft: closeDrawer,
  })

  return (
    <animated.div
      {...bind()}
      style={{
        transform: x.to((x) => `translateX(${Math.max(x, 0)}px)`),
      }}
      className="drawer"
    >
      {/* Drawer content */}
    </animated.div>
  )
}
```

## Responsive Breakpoints

```css
/* Mobile First Approach */

/* Small phones (iPhone SE, Galaxy S8) */
@media (max-width: 375px) {
  .bottom-tab-label {
    display: none; /* Icons only to save space */
  }

  .mobile-header h1 {
    font-size: 1rem;
  }
}

/* Standard phones */
@media (min-width: 376px) and (max-width: 428px) {
  .bottom-tab-bar {
    height: 56px;
  }
}

/* Large phones (Pro Max, Plus models) */
@media (min-width: 429px) and (max-width: 768px) {
  .drawer {
    width: 320px;
  }
}

/* Tablets - Switch to desktop layout */
@media (min-width: 769px) {
  .bottom-tab-bar {
    display: none;
  }

  .mobile-header {
    display: none;
  }

  .desktop-sidebar {
    display: flex;
  }
}

/* Landscape orientation */
@media (orientation: landscape) and (max-height: 428px) {
  .mobile-header {
    height: 48px; /* Smaller header */
  }

  .bottom-tab-bar {
    height: 48px; /* Smaller tabs */
  }
}
```

## State Management

```tsx
// Mobile Navigation State
interface MobileNavState {
  drawerOpen: boolean
  headerVisible: boolean
  quickAddOpen: boolean
  activeTab: string
  scrollPosition: number
}

// Zustand Store
const useMobileNavStore = create<MobileNavState>((set) => ({
  drawerOpen: false,
  headerVisible: true,
  quickAddOpen: false,
  activeTab: "home",
  scrollPosition: 0,

  toggleDrawer: () => set((state) => ({ drawerOpen: !state.drawerOpen })),
  setHeaderVisible: (visible: boolean) => set({ headerVisible: visible }),
  setActiveTab: (tab: string) => set({ activeTab: tab }),
}))
```

## Animation Specifications

```tsx
// Framer Motion Variants
const drawerVariants = {
  open: {
    x: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 30,
    },
  },
  closed: {
    x: "-100%",
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 30,
    },
  },
}

const headerVariants = {
  visible: {
    y: 0,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  hidden: {
    y: "-100%",
    transition: { duration: 0.2, ease: "easeIn" },
  },
}

const tabPressAnimation = {
  scale: 0.95,
  transition: { duration: 0.1 },
}
```

## Platform-Specific Adjustments

### iOS Specific

```tsx
// Safe Area Handling
const iosSafeAreaStyles = {
  paddingTop: "env(safe-area-inset-top, 0)",
  paddingBottom: "env(safe-area-inset-bottom, 0)",
  paddingLeft: "env(safe-area-inset-left, 0)",
  paddingRight: "env(safe-area-inset-right, 0)",
}

// Haptic Feedback
const triggerHaptic = (type: "light" | "medium" | "heavy") => {
  if (window.webkit?.messageHandlers?.haptic) {
    window.webkit.messageHandlers.haptic.postMessage(type)
  }
}
```

### Android Specific

```tsx
// Back Button Handler
useEffect(() => {
  const handleBackButton = (e: PopStateEvent) => {
    if (drawerOpen) {
      e.preventDefault()
      closeDrawer()
      return false
    }
    return true
  }

  window.addEventListener("popstate", handleBackButton)
  return () => window.removeEventListener("popstate", handleBackButton)
}, [drawerOpen])

// Status Bar Color
const setStatusBarColor = (color: string) => {
  const metaTheme = document.querySelector('meta[name="theme-color"]')
  if (metaTheme) {
    metaTheme.setAttribute("content", color)
  }
}
```

## Performance Optimizations

### 1. Lazy Loading Routes

```tsx
const MobileRoutes = {
  "/": lazy(() => import("./pages/mobile/Home")),
  "/projects": lazy(() => import("./pages/mobile/Projects")),
  "/costs": lazy(() => import("./pages/mobile/Costs")),
  "/files": lazy(() => import("./pages/mobile/Files")),
}
```

### 2. Virtual Scrolling for Lists

```tsx
import { FixedSizeList } from "react-window"

const ProjectList = ({ projects }) => (
  <FixedSizeList
    height={window.innerHeight - 120} // Minus header and tabs
    itemCount={projects.length}
    itemSize={80}
    width="100%"
  >
    {({ index, style }) => (
      <div style={style}>
        <ProjectCard project={projects[index]} />
      </div>
    )}
  </FixedSizeList>
)
```

### 3. Image Optimization

```tsx
const OptimizedImage = ({ src, alt, ...props }) => {
  const [loading, setLoading] = useState(true)

  return (
    <div className="relative">
      {loading && <Skeleton />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoading(false)}
        className={`${loading ? "opacity-0" : "opacity-100"} transition-opacity`}
        {...props}
      />
    </div>
  )
}
```

## Testing Checklist

### Device Testing Matrix

- [ ] iPhone SE (375x667)
- [ ] iPhone 14 (390x844)
- [ ] iPhone 14 Pro Max (428x926)
- [ ] Samsung Galaxy S23 (360x780)
- [ ] Google Pixel 7 (412x915)
- [ ] iPad Mini (768x1024)

### Interaction Testing

- [ ] Swipe gestures work smoothly
- [ ] Bottom tabs respond to taps
- [ ] Drawer opens/closes properly
- [ ] Header hides on scroll down
- [ ] Quick add menu functions
- [ ] Back button behavior (Android)
- [ ] Safe areas respected (iOS)

### Performance Testing

- [ ] 60fps scrolling
- [ ] < 100ms touch response
- [ ] < 3s time to interactive
- [ ] Smooth animations
- [ ] No jank on tab switches

## Deployment Considerations

### PWA Configuration

```json
{
  "name": "DevTrack Mobile",
  "short_name": "DevTrack",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#2563EB",
  "background_color": "#FFFFFF",
  "categories": ["business", "productivity"],
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### App Store Considerations

- Ensure 44pt minimum touch targets (iOS)
- Support Dynamic Type (iOS)
- Implement pull-to-refresh
- Handle offline states gracefully
- Support landscape orientation
- Implement proper back navigation (Android)
