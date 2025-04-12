import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// clsx is a tiny library that lets you conditionally join class names:

// clsx("text-red", false && "bg-blue", isDark && "dark", ["rounded", "p-2"])
// // → "text-red dark rounded p-2" (if `isDark` is true)
// It handles:

// Strings

// Falsy values (false, null, undefined, 0)

// Arrays

// Objects with boolean values (like { active: true } → "active")

// So it's smarter than plain join(" ").

// 2. twMerge(...)
// tailwind-merge removes conflicting Tailwind classes intelligently:

// const buttonClass = cn(
//   "px-4 py-2 rounded",
//   isPrimary && "bg-blue-500 text-white",
//   isDisabled && "opacity-50 cursor-not-allowed",
//   "px-6" // overrides previous px-4
// )
//  → "py-2 rounded bg-blue-500 text-white opacity-50 cursor-not-allowed px-6"