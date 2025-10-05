import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines and merges Tailwind CSS class names intelligently
 *
 * Merges class names using clsx for conditional logic and tailwind-merge
 * to resolve conflicting Tailwind classes. Ensures the last class wins
 * for conflicting utilities (e.g., "p-2 p-4" becomes "p-4").
 *
 * @param inputs - Class names, objects, or arrays to merge
 * @returns Merged class string with conflicts resolved
 *
 * @example
 * cn("px-2 py-1", "px-4") // "py-1 px-4"
 * cn("text-red-500", condition && "text-blue-500") // "text-blue-500" if condition is true
 * cn({ "bg-white": isLight, "bg-black": !isLight }) // Conditional classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
