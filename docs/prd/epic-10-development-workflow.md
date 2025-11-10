# Development Workflow Guide: UI Overhaul Implementation

## 📚 Table of Contents

1. [Environment Setup](#environment-setup)
2. [Desktop Development Workflow](#desktop-development-workflow)
3. [Mobile Development Workflow](#mobile-development-workflow)
4. [Component Development Process](#component-development-process)
5. [Testing Workflow](#testing-workflow)
6. [Code Review Process](#code-review-process)
7. [Deployment Workflow](#deployment-workflow)

---

## 🛠️ Environment Setup

### Initial Project Setup

```bash
# 1. Clone and setup
git clone [repo-url]
cd real-estate-development-tracker
git checkout -b feature/ui-overhaul

# 2. Install dependencies
npm install

# 3. Install new UI dependencies
npm install framer-motion @use-gesture/react lucide-react
npm install -D @types/react @types/node

# 4. Setup environment variables
cp .env.example .env.local

# 5. Run development server
npm run dev
```

### VS Code Configuration

```json
// .vscode/settings.json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

### Browser Extensions

- React Developer Tools
- Redux DevTools (if using Redux)
- Lighthouse
- WAVE (accessibility testing)
- Responsive Viewer

---

## 💻 Desktop Development Workflow

### Day 1-2: Design System Foundation

#### Step 1: Create Design Token Files

```bash
# Create directory structure
mkdir -p src/styles/design-system
cd src/styles/design-system

# Create token files
touch colors.ts typography.ts spacing.ts animations.ts index.ts
```

#### Step 2: Implement Color System

```typescript
// src/styles/design-system/colors.ts
export const colors = {
  primary: {
    50: "#EFF6FF",
    100: "#DBEAFE",
    200: "#BFDBFE",
    300: "#93C5FD",
    400: "#60A5FA",
    500: "#2563EB", // Primary
    600: "#1D4ED8", // Primary hover
    700: "#1E40AF",
    800: "#1E3A8A",
    900: "#1E3A8A",
  },
  gray: {
    50: "#F8FAFC", // Background secondary
    100: "#F1F5F9", // Background tertiary
    200: "#E2E8F0", // Border
    300: "#CBD5E1", // Border hover
    400: "#94A3B8", // Text tertiary
    500: "#64748B", // Text secondary
    600: "#475569",
    700: "#334155",
    800: "#1E293B",
    900: "#0F172A", // Text primary
  },
  semantic: {
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#2563EB",
  },
} as const

// Update Tailwind config
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: colors.primary,
        gray: colors.gray,
        success: colors.semantic.success,
        warning: colors.semantic.warning,
        error: colors.semantic.error,
      },
    },
  },
}
```

#### Step 3: Implement Typography System

```typescript
// src/styles/design-system/typography.ts
export const typography = {
  fonts: {
    sans: ["Inter", "system-ui", "sans-serif"],
    mono: ["JetBrains Mono", "monospace"],
  },
  sizes: {
    xs: "0.75rem", // 12px
    sm: "0.875rem", // 14px
    base: "1rem", // 16px
    lg: "1.125rem", // 18px
    xl: "1.25rem", // 20px
    "2xl": "1.5rem", // 24px
    "3xl": "1.875rem", // 30px
    "4xl": "2.25rem", // 36px
    "5xl": "3rem", // 48px
  },
  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  lineHeights: {
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
} as const
```

### Day 3-4: Collapsible Sidebar Implementation

#### Step 1: Create Sidebar Context

```typescript
// src/contexts/SidebarContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';

interface SidebarContextType {
  isCollapsed: boolean;
  toggle: () => void;
  setCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Load from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-collapsed');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  useEffect(() => {
    // Save to localStorage
    localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const toggle = () => setIsCollapsed(prev => !prev);
  const setCollapsed = (collapsed: boolean) => setIsCollapsed(collapsed);

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggle, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) throw new Error('useSidebar must be used within SidebarProvider');
  return context;
};
```

#### Step 2: Build Sidebar Component

```typescript
// src/components/desktop/Sidebar/Sidebar.tsx
import { cn } from '@/lib/utils';
import { useSidebar } from '@/contexts/SidebarContext';
import { SidebarHeader } from './SidebarHeader';
import { SidebarNav } from './SidebarNav';
import { SidebarFooter } from './SidebarFooter';

export function Sidebar() {
  const { isCollapsed } = useSidebar();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 bottom-0 z-40",
        "bg-white border-r border-gray-200",
        "transition-all duration-200 ease-in-out",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex flex-col h-full">
        <SidebarHeader />
        <SidebarNav />
        <SidebarFooter />
      </div>
    </aside>
  );
}
```

#### Step 3: Implement Navigation Items

```typescript
// src/components/desktop/Sidebar/SidebarNav.tsx
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Home,
  Building,
  DollarSign,
  Calendar,
  Users,
  Folder,
  BarChart3
} from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { useSidebar } from '@/contexts/SidebarContext';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/' },
  { id: 'projects', label: 'Projects', icon: Building, href: '/projects' },
  { id: 'costs', label: 'Costs', icon: DollarSign, href: '/costs' },
  { id: 'timeline', label: 'Timeline', icon: Calendar, href: '/timeline' },
  { id: 'vendors', label: 'Vendors', icon: Users, href: '/vendors' },
  { id: 'documents', label: 'Documents', icon: Folder, href: '/documents' },
  { id: 'reports', label: 'Reports', icon: BarChart3, href: '/reports' },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();

  return (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        const linkContent = (
          <Link
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg",
              "transition-colors duration-150",
              isActive
                ? "bg-primary-50 text-primary-600"
                : "hover:bg-gray-100 text-gray-700"
            )}
          >
            <Icon className={cn(
              "w-5 h-5 flex-shrink-0",
              isActive ? "text-primary-600" : "text-gray-500"
            )} />
            {!isCollapsed && (
              <span className="font-medium text-sm">{item.label}</span>
            )}
          </Link>
        );

        if (isCollapsed) {
          return (
            <Tooltip key={item.id} content={item.label} side="right">
              {linkContent}
            </Tooltip>
          );
        }

        return <div key={item.id}>{linkContent}</div>;
      })}
    </nav>
  );
}
```

### Day 5-6: Top Navigation for Subsections

#### Step 1: Create Project Navigation Component

```typescript
// src/components/desktop/ProjectNavigation/ProjectNavigation.tsx
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface ProjectNavigationProps {
  projectId: string;
  items?: NavItem[];
}

export function ProjectNavigation({ projectId, items }: ProjectNavigationProps) {
  const pathname = usePathname();

  const defaultItems: NavItem[] = [
    { id: 'overview', label: 'Overview', href: `/projects/${projectId}` },
    { id: 'costs', label: 'Costs', href: `/projects/${projectId}/costs` },
    { id: 'timeline', label: 'Timeline', href: `/projects/${projectId}/timeline` },
    { id: 'tasks', label: 'Tasks', href: `/projects/${projectId}/tasks` },
    { id: 'documents', label: 'Documents', href: `/projects/${projectId}/documents` },
    { id: 'team', label: 'Team', href: `/projects/${projectId}/team` },
    { id: 'settings', label: 'Settings', href: `/projects/${projectId}/settings` },
  ];

  const navItems = items || defaultItems;

  return (
    <div className="bg-gray-50 border-b border-gray-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8 h-12 overflow-x-auto scrollbar-hide">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "inline-flex items-center gap-2 px-1 py-3",
                  "border-b-2 text-sm font-medium whitespace-nowrap",
                  "transition-colors duration-150",
                  isActive
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                )}
              >
                {Icon && <Icon className="w-4 h-4" />}
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
```

### Day 7-8: Desktop Layout Integration

#### Step 1: Create Desktop Layout Wrapper

```typescript
// src/components/layouts/DesktopLayout.tsx
import { Sidebar } from '@/components/desktop/Sidebar';
import { Header } from '@/components/desktop/Header';
import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';

interface DesktopLayoutProps {
  children: React.ReactNode;
  showProjectNav?: boolean;
  projectId?: string;
}

export function DesktopLayout({
  children,
  showProjectNav,
  projectId
}: DesktopLayoutProps) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div
        className={cn(
          "transition-all duration-200 ease-in-out",
          isCollapsed ? "ml-16" : "ml-64"
        )}
      >
        <Header />
        {showProjectNav && projectId && (
          <ProjectNavigation projectId={projectId} />
        )}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

---

## 📱 Mobile Development Workflow

### Day 1-2: Mobile Foundation

#### Step 1: Setup Mobile Detection

```typescript
// src/hooks/useMediaQuery.ts
import { useState, useEffect } from "react"

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    if (media.matches !== matches) {
      setMatches(media.matches)
    }

    const listener = () => setMatches(media.matches)
    media.addEventListener("change", listener)

    return () => media.removeEventListener("change", listener)
  }, [matches, query])

  return matches
}

// Helper hooks
export const useIsMobile = () => useMediaQuery("(max-width: 768px)")
export const useIsTablet = () => useMediaQuery("(min-width: 768px) and (max-width: 1024px)")
export const useIsDesktop = () => useMediaQuery("(min-width: 1024px)")
```

#### Step 2: Configure PWA

```typescript
// src/app/manifest.ts
export default function manifest() {
  return {
    name: "DevTrack - Real Estate Tracker",
    short_name: "DevTrack",
    description: "Track real estate development projects",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2563EB",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  }
}
```

### Day 3-4: Bottom Tab Bar Implementation

#### Step 1: Create Bottom Tab Bar Component

```typescript
// src/components/mobile/BottomTabBar/BottomTabBar.tsx
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, Building, Plus, DollarSign, Folder } from 'lucide-react';
import { useState } from 'react';
import { SpeedDial } from './SpeedDial';

interface TabItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  badge?: number;
}

const tabs: TabItem[] = [
  { id: 'home', icon: Home, label: 'Home', href: '/' },
  { id: 'projects', icon: Building, label: 'Projects', href: '/projects', badge: 3 },
  { id: 'add', icon: Plus, label: '', href: '#' }, // Special FAB
  { id: 'costs', icon: DollarSign, label: 'Costs', href: '/costs' },
  { id: 'files', icon: Folder, label: 'Files', href: '/files' },
];

export function BottomTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [speedDialOpen, setSpeedDialOpen] = useState(false);

  const handleTabPress = (tab: TabItem) => {
    if (tab.id === 'add') {
      setSpeedDialOpen(!speedDialOpen);
    } else {
      router.push(tab.href);
      // Trigger haptic feedback on iOS
      if (window.navigator.vibrate) {
        window.navigator.vibrate(10);
      }
    }
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 pb-safe">
        <div className="flex items-center justify-around h-14">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            const isAddButton = tab.id === 'add';
            const Icon = tab.icon;

            if (isAddButton) {
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabPress(tab)}
                  className="relative -mt-4"
                  aria-label="Quick add"
                >
                  <div className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center shadow-lg",
                    "bg-primary-500 text-white",
                    "transform transition-transform active:scale-95"
                  )}>
                    <Icon className={cn(
                      "w-6 h-6 transition-transform duration-200",
                      speedDialOpen && "rotate-45"
                    )} />
                  </div>
                </button>
              );
            }

            return (
              <button
                key={tab.id}
                onClick={() => handleTabPress(tab)}
                className="flex flex-col items-center justify-center flex-1 py-1 px-2"
              >
                <div className="relative">
                  <Icon className={cn(
                    "w-6 h-6",
                    isActive ? "text-primary-500" : "text-gray-400"
                  )} />
                  {tab.badge && (
                    <span className="absolute -top-1 -right-1 bg-error text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className={cn(
                  "text-xs mt-0.5",
                  isActive ? "text-primary-500 font-medium" : "text-gray-400"
                )}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <SpeedDial open={speedDialOpen} onClose={() => setSpeedDialOpen(false)} />
    </>
  );
}
```

#### Step 2: Implement Speed Dial Menu

```typescript
// src/components/mobile/BottomTabBar/SpeedDial.tsx
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, DollarSign, FileText, StickyNote, CheckSquare } from 'lucide-react';

interface SpeedDialProps {
  open: boolean;
  onClose: () => void;
}

const actions = [
  { id: 'photo', icon: Camera, label: 'Take Photo', color: 'bg-blue-500' },
  { id: 'cost', icon: DollarSign, label: 'Add Cost', color: 'bg-green-500' },
  { id: 'task', icon: CheckSquare, label: 'Create Task', color: 'bg-purple-500' },
  { id: 'document', icon: FileText, label: 'Upload Document', color: 'bg-orange-500' },
  { id: 'note', icon: StickyNote, label: 'Add Note', color: 'bg-yellow-500' },
];

export function SpeedDial({ open, onClose }: SpeedDialProps) {
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
            onClick={onClose}
          />

          {/* Menu Items */}
          <motion.div className="fixed bottom-20 left-0 right-0 z-50 px-4">
            {actions.map((action, index) => {
              const Icon = action.icon;

              return (
                <motion.button
                  key={action.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => {
                    console.log(`Action: ${action.id}`);
                    onClose();
                  }}
                  className="flex items-center gap-3 w-full bg-white rounded-lg p-3 mb-2 shadow-lg active:scale-95 transition-transform"
                >
                  <div className={`w-10 h-10 ${action.color} rounded-full flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-medium text-gray-900">{action.label}</span>
                </motion.button>
              );
            })}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

### Day 5-6: Swipeable Drawer Implementation

#### Step 1: Install Gesture Library

```bash
npm install @use-gesture/react react-spring
```

#### Step 2: Create Swipeable Drawer

```typescript
// src/components/mobile/SwipeableDrawer/SwipeableDrawer.tsx
import { animated, useSpring } from 'react-spring';
import { useDrag } from '@use-gesture/react';
import { useState, useEffect } from 'react';
import { DrawerContent } from './DrawerContent';

interface SwipeableDrawerProps {
  open: boolean;
  onClose: () => void;
  onOpen: () => void;
}

export function SwipeableDrawer({ open, onClose, onOpen }: SwipeableDrawerProps) {
  const [{ x }, api] = useSpring(() => ({
    x: -320,
    config: { tension: 200, friction: 25 }
  }));

  useEffect(() => {
    api.start({ x: open ? 0 : -320 });
  }, [open, api]);

  const bind = useDrag(
    ({ down, movement: [mx], velocity: [vx], direction: [dx] }) => {
      // If drawer is open and swiping left
      if (open && mx < 0) {
        if (!down) {
          // Gesture ended
          if (mx < -100 || (vx < -0.2 && dx < 0)) {
            onClose();
          } else {
            api.start({ x: 0 });
          }
        } else {
          // Dragging
          api.start({ x: mx, immediate: true });
        }
      }

      // If drawer is closed and swiping from left edge
      if (!open && mx > 0 && down) {
        if (mx > 20) {
          onOpen();
        }
      }
    },
    {
      axis: 'x',
      filterTaps: true,
      bounds: { right: 0 },
      rubberband: true
    }
  );

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <animated.div
        {...bind()}
        style={{
          x,
          touchAction: 'pan-y'
        }}
        className="fixed left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white z-50 shadow-xl"
      >
        <DrawerContent onClose={onClose} />
      </animated.div>

      {/* Edge swipe zone */}
      {!open && (
        <div
          {...bind()}
          className="fixed left-0 top-0 bottom-0 w-5 z-30"
        />
      )}
    </>
  );
}
```

### Day 7-8: Mobile Layout Integration

#### Step 1: Create Mobile Layout

```typescript
// src/components/layouts/MobileLayout.tsx
import { useState, useEffect } from 'react';
import { BottomTabBar } from '@/components/mobile/BottomTabBar';
import { SwipeableDrawer } from '@/components/mobile/SwipeableDrawer';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { useScrollDirection } from '@/hooks/useScrollDirection';

interface MobileLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  title?: string;
}

export function MobileLayout({
  children,
  showHeader = true,
  title = 'DevTrack'
}: MobileLayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const scrollDirection = useScrollDirection();
  const headerVisible = scrollDirection === 'up' || scrollDirection === null;

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  return (
    <div className="min-h-screen bg-gray-50">
      {showHeader && (
        <MobileHeader
          title={title}
          visible={headerVisible}
          onMenuClick={() => setDrawerOpen(true)}
        />
      )}

      <SwipeableDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onOpen={() => setDrawerOpen(true)}
      />

      <main className={`pb-14 ${showHeader ? 'pt-14' : ''}`}>
        {children}
      </main>

      <BottomTabBar />
    </div>
  );
}
```

#### Step 2: Create Scroll Direction Hook

```typescript
// src/hooks/useScrollDirection.ts
import { useState, useEffect } from "react"

export function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState<"up" | "down" | null>(null)

  useEffect(() => {
    let lastScrollY = window.pageYOffset
    let ticking = false

    const updateScrollDirection = () => {
      const scrollY = window.pageYOffset

      if (Math.abs(scrollY - lastScrollY) < 50) {
        ticking = false
        return
      }

      setScrollDirection(scrollY > lastScrollY ? "down" : "up")
      lastScrollY = scrollY > 0 ? scrollY : 0
      ticking = false
    }

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDirection)
        ticking = true
      }
    }

    window.addEventListener("scroll", onScroll)

    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return scrollDirection
}
```

---

## 🔄 Component Development Process

### 1. Component Planning

```typescript
// docs/components/ComponentSpec.md
# Component: [ComponentName]

## Purpose
[Description of what the component does]

## Props
- prop1: type - description
- prop2: type - description

## States
- state1: description
- state2: description

## Events
- onEvent1: description
- onEvent2: description

## Accessibility
- ARIA roles
- Keyboard navigation
- Screen reader support

## Responsive Behavior
- Mobile: description
- Tablet: description
- Desktop: description
```

### 2. Component Development

```typescript
// src/components/[ComponentName]/[ComponentName].tsx
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface ComponentNameProps {
  className?: string;
  children?: React.ReactNode;
  // Add other props
}

export const ComponentName = forwardRef<HTMLDivElement, ComponentNameProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base styles
          "base-class",
          // Conditional styles
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ComponentName.displayName = 'ComponentName';
```

### 3. Component Testing

```typescript
// src/components/[ComponentName]/[ComponentName].test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName>Test Content</ComponentName>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<ComponentName onClick={handleClick}>Click Me</ComponentName>);

    fireEvent.click(screen.getByText('Click Me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    const { container } = render(
      <ComponentName className="custom-class">Test</ComponentName>
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
```

### 4. Component Documentation

```typescript
// src/components/[ComponentName]/[ComponentName].stories.tsx
import type { Meta, StoryObj } from "@storybook/react"
import { ComponentName } from "./ComponentName"

const meta: Meta<typeof ComponentName> = {
  title: "Components/ComponentName",
  component: ComponentName,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    // Define controls
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: "Default Component",
  },
}

export const WithCustomStyle: Story = {
  args: {
    children: "Custom Styled",
    className: "bg-blue-500 text-white",
  },
}
```

---

## 🧪 Testing Workflow

### Unit Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- ComponentName.test.tsx
```

### Integration Testing

```typescript
// tests/integration/navigation.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '@/App';

describe('Navigation Integration', () => {
  it('navigates between desktop views', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Start at dashboard
    expect(screen.getByText('Dashboard')).toBeInTheDocument();

    // Click projects in sidebar
    const projectsLink = screen.getByRole('link', { name: /projects/i });
    await user.click(projectsLink);

    // Should navigate to projects
    await waitFor(() => {
      expect(screen.getByText('Projects')).toBeInTheDocument();
    });
  });

  it('opens mobile drawer on swipe', async () => {
    // Set mobile viewport
    window.innerWidth = 390;
    window.innerHeight = 844;

    render(<App />);

    // Simulate swipe from left
    const touchStart = new Touch({ identifier: 1, target: document.body, clientX: 0 });
    const touchMove = new Touch({ identifier: 1, target: document.body, clientX: 100 });

    fireEvent.touchStart(document.body, { touches: [touchStart] });
    fireEvent.touchMove(document.body, { touches: [touchMove] });
    fireEvent.touchEnd(document.body, { touches: [] });

    // Drawer should be visible
    await waitFor(() => {
      expect(screen.getByRole('navigation', { name: /main/i })).toBeVisible();
    });
  });
});
```

### E2E Testing

```typescript
// e2e/navigation.spec.ts
import { test, expect } from "@playwright/test"

test.describe("Desktop Navigation", () => {
  test("sidebar collapses and expands", async ({ page }) => {
    await page.goto("/")

    // Find sidebar
    const sidebar = page.locator("aside")
    await expect(sidebar).toHaveClass(/w-64/)

    // Click toggle button
    await page.click('[aria-label="Toggle sidebar"]')

    // Sidebar should be collapsed
    await expect(sidebar).toHaveClass(/w-16/)

    // Preference should be saved
    await page.reload()
    await expect(sidebar).toHaveClass(/w-16/)
  })
})

test.describe("Mobile Navigation", () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test("bottom tabs navigate correctly", async ({ page }) => {
    await page.goto("/")

    // Click projects tab
    await page.click('[aria-label="Projects"]')
    await expect(page).toHaveURL("/projects")

    // Tab should be active
    const projectsTab = page.locator('[aria-label="Projects"]')
    await expect(projectsTab).toHaveClass(/text-primary/)
  })

  test("speed dial opens and closes", async ({ page }) => {
    await page.goto("/")

    // Click FAB
    await page.click('[aria-label="Quick add"]')

    // Menu should be visible
    await expect(page.locator("text=Take Photo")).toBeVisible()

    // Click outside to close
    await page.click("body", { position: { x: 10, y: 10 } })
    await expect(page.locator("text=Take Photo")).not.toBeVisible()
  })
})
```

---

## 👀 Code Review Process

### PR Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No console warnings/errors
- [ ] Responsive on all breakpoints
- [ ] Accessibility standards met
- [ ] Performance metrics maintained

## Screenshots

[Add screenshots for UI changes]

## Related Issues

Closes #[issue number]
```

### Review Checklist

```typescript
// .github/review-checklist.md
# Code Review Checklist

## Functionality
- [ ] Code accomplishes the intended goal
- [ ] Edge cases handled
- [ ] Error handling implemented
- [ ] Loading states present
- [ ] Empty states designed

## Code Quality
- [ ] DRY principle followed
- [ ] SOLID principles applied
- [ ] Proper abstraction levels
- [ ] Clear variable/function names
- [ ] Comments for complex logic

## Performance
- [ ] No unnecessary re-renders
- [ ] Images optimized
- [ ] Code splitting implemented
- [ ] Lazy loading where appropriate
- [ ] Bundle size impact acceptable

## Testing
- [ ] Unit tests comprehensive
- [ ] Integration tests cover workflows
- [ ] E2E tests for critical paths
- [ ] Test coverage adequate (>80%)

## Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader friendly
- [ ] Color contrast passes
- [ ] Focus indicators visible
- [ ] ARIA labels appropriate

## Security
- [ ] No sensitive data exposed
- [ ] Input validation implemented
- [ ] XSS prevention in place
- [ ] CSRF protection enabled
```

---

## 🚀 Deployment Workflow

### Development Deployment

```bash
# 1. Create feature branch
git checkout -b feature/ui-overhaul

# 2. Make changes and commit
git add .
git commit -m "feat: implement collapsible sidebar"

# 3. Push to remote
git push origin feature/ui-overhaul

# 4. Create PR
gh pr create --title "UI Overhaul: Collapsible Sidebar" --body "..."

# 5. Deploy to preview
npm run build
npm run deploy:preview
```

### Staging Deployment

```yaml
# .github/workflows/staging.yml
name: Deploy to Staging

on:
  push:
    branches: [develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build application
        run: npm run build
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.STAGING_API_URL }}

      - name: Deploy to staging
        run: npm run deploy:staging
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

### Production Deployment

```bash
# 1. Merge to main
git checkout main
git merge develop

# 2. Create release tag
git tag -a v1.0.0 -m "Release: UI Overhaul"
git push origin v1.0.0

# 3. Deploy to production (automated via CI/CD)
# Triggered by tag push
```

### Rollback Procedure

```bash
# 1. Identify last working deployment
git log --oneline -10

# 2. Revert to previous version
git revert HEAD
git push origin main

# OR using deployment platform
vercel rollback [deployment-id]

# 3. Hotfix if needed
git checkout -b hotfix/critical-bug
# Make fixes
git push origin hotfix/critical-bug
# Fast-track PR and deployment
```

---

## 📈 Monitoring & Analytics

### Performance Monitoring

```typescript
// src/lib/monitoring.ts
export function trackNavigationTiming() {
  if (typeof window !== "undefined" && window.performance) {
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming

    const metrics = {
      dns: navigation.domainLookupEnd - navigation.domainLookupStart,
      tcp: navigation.connectEnd - navigation.connectStart,
      request: navigation.responseStart - navigation.requestStart,
      response: navigation.responseEnd - navigation.responseStart,
      dom: navigation.domInteractive - navigation.responseEnd,
      load: navigation.loadEventEnd - navigation.loadEventStart,
      total: navigation.loadEventEnd - navigation.fetchStart,
    }

    // Send to analytics
    console.log("Navigation Timing:", metrics)
  }
}
```

### User Analytics

```typescript
// src/lib/analytics.ts
export function trackEvent(category: string, action: string, label?: string, value?: number) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

// Usage
trackEvent("Navigation", "sidebar_toggle", "collapsed")
trackEvent("Mobile", "speed_dial_open")
trackEvent("Performance", "page_load_time", "homepage", 1234)
```

---

## 🎓 Team Training

### Documentation Structure

```
docs/
├── guides/
│   ├── desktop-navigation.md
│   ├── mobile-navigation.md
│   ├── component-development.md
│   └── testing-strategy.md
├── api/
│   ├── components/
│   ├── hooks/
│   └── utils/
└── videos/
    ├── navigation-overview.mp4
    ├── mobile-gestures.mp4
    └── development-workflow.mp4
```

### Training Sessions

1. **Week 1: Design System Overview**
   - Color and typography systems
   - Spacing and layout principles
   - Component library tour

2. **Week 2: Navigation Implementation**
   - Desktop sidebar and top nav
   - Mobile bottom tabs and drawer
   - Gesture handling

3. **Week 3: Testing & QA**
   - Unit testing strategies
   - E2E testing with Playwright
   - Performance profiling

4. **Week 4: Deployment & Monitoring**
   - CI/CD pipeline
   - Feature flags
   - Analytics and monitoring

---

This comprehensive workflow guide provides step-by-step instructions for implementing the UI overhaul across both desktop and mobile platforms. Each section includes actual code examples, testing strategies, and deployment procedures to ensure successful implementation.
