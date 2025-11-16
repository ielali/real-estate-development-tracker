/**
 * Centralized Icon Exports
 * Story 10.14: Icon System - Lucide React
 *
 * Single source of truth for all icon imports across the application.
 * Benefits:
 * - Easy to swap icon libraries (change imports in one place)
 * - Type safety (centralized type exports)
 * - Prevents scattered imports
 * - Tree-shaking still works (re-exports are tree-shakeable)
 *
 * Usage in components:
 * ```tsx
 * import { Home, FilledIcon } from '@/components/icons'
 *
 * <FilledIcon icon={Home} filled={isActive} className="w-5 h-5" />
 * ```
 *
 * Icon Size Standards (AC 8):
 * - Navigation items: w-5 h-5 (20px) - Sidebar, HorizontalNav, BottomTabBar
 * - Buttons (small): w-4 h-4 (16px) - Icon buttons, inline actions
 * - Headers/emphasis: w-6 h-6 (24px) - Page headers, large CTAs
 * - Mobile touch targets: w-6 h-6 (24px) - Mobile navigation (44px min touch)
 */

// ============================================================================
// NAVIGATION ICONS (Story 10.14 - Primary Focus)
// ============================================================================

export {
  // Sidebar - Main Navigation
  Home,
  FolderKanban,
  Briefcase,
  Users,
  Building2,
  Grid2x2,

  // Sidebar - Tools Navigation
  Bell,
  Settings,
  HelpCircle,

  // TopHeaderBar
  Search,
  Plus,
  Menu,

  // HorizontalNav (Project Tabs)
  DollarSign,
  Calendar,
  FileText,
  Layers,

  // BottomTabBar (Mobile)
  User,

  // FloatingActionButton (Speed Dial)
  X,
  Camera,
  CheckSquare,
  StickyNote,

  // Type exports
  type LucideIcon,
} from "lucide-react"

// ============================================================================
// FILLED ICON WRAPPER
// ============================================================================

export { FilledIcon, type FilledIconProps } from "./FilledIcon"
