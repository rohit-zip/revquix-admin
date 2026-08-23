import { type ClassValue, clsx } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/**
 * ─── `cn()`, and why it is not the stock one-liner ────────────────────────────
 *
 * `tailwind-merge` resolves conflicts by bucketing each class into a "class
 * group" and keeping only the last class in each group. For `shadow-*` it has
 * two candidates - `shadow` (which knows `''`, `none`, t-shirt sizes and
 * arbitrary values) and `shadow-color` (whose validator is `isAny`, i.e. it
 * matches literally everything else). A custom name like `shadow-overlay` is
 * none of the first group's members, so stock tailwind-merge files it as a
 * shadow COLOUR - and a colour does not conflict with a size:
 *
 *     cn("…primitive base… shadow-overlay", "shadow-xl")
 *       → "shadow-overlay shadow-xl"               ← BOTH survive
 *
 * Both then land on the element and CSS source order picks the winner, not the
 * call site. It also means `shadow-none` can never turn an elevation off.
 * Registering the names as literal members of `shadow` fixes it in one place;
 * exact literals beat validators in tailwind-merge's lookup, so
 * `shadow-overlay` is now unambiguously a shadow and `shadow-red-500` is still
 * a colour.
 *
 * ⚠ Add a `--shadow-*` alias to globals.css and you must add it here too. A
 * missing name does not fail loudly - it fails by being overridden.
 */
export const ELEVATION_STEPS = ["overlay", "overlay-sm", "overlay-lg"] as const

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      shadow: [{ shadow: [...ELEVATION_STEPS] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
