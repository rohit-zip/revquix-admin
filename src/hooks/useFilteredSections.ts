"use client"

import { useMemo } from "react"
import { useSelector } from "react-redux"

import type { AuthorityGuard, NavSection } from "@/config/dashboard/nav.config"
// AuthorityGuard and NavSection are re-exported from the admin nav.config
import type { RootState } from "@/core/store"

/**
 * Returns the nav sections for the given workspace filtered by the current
 * user's authorities (roles + fine-grained permissions).
 *
 * Rules
 * ─────
 * • An `AuthorityGuard` is resolved as follows:
 *   1. `allOf` — user must hold **every** listed authority (AND logic).
 *   2. `anyOf` — user must hold **at least one** listed authority (OR logic).
 *   3. Both conditions must pass when combined.
 *   4. Guard is absent/empty → unrestricted (always visible).
 *
 * • A **section** with an `access` guard is included only when the guard is
 *   satisfied.
 * • An **item** inside a visible section is included only when its `access`
 *   guard is satisfied.
 * • Sections that become empty after item-filtering are automatically removed.
 *
 * @example
 * const sections = useFilteredSections(WORKSPACE_CONFIGS[activeWorkspace].sections)
 */
export function useFilteredSections(sections: NavSection[]): NavSection[] {
  const authorities = useSelector(
    (state: RootState) => state.userProfile.currentUser?.authorities ?? [],
  )

  return useMemo(() => {
    const authoritySet = new Set(authorities)

    /**
     * Evaluates an `AuthorityGuard`.
     * Returns `true` when the user satisfies all specified conditions.
     * An absent/empty guard is treated as "no restriction".
     */
    function satisfiesGuard(guard?: AuthorityGuard): boolean {
      if (!guard) return true

      const { allOf, anyOf } = guard

      // allOf — every listed authority must be present
      if (allOf && allOf.length > 0) {
        if (!allOf.every((a) => authoritySet.has(a))) return false
      }

      // anyOf — at least one listed authority must be present
      if (anyOf && anyOf.length > 0) {
        if (!anyOf.some((a) => authoritySet.has(a))) return false
      }

      return true
    }

    const filtered: NavSection[] = []

    for (const section of sections) {
      // Gate the whole section (optional section-level guard)
      if (!satisfiesGuard(section.access)) continue

      // Gate individual items
      const visibleItems = section.items.filter((item) =>
        satisfiesGuard(item.access),
      )

      // Drop sections that end up with no items
      if (visibleItems.length === 0) continue

      filtered.push({ ...section, items: visibleItems })
    }

    return filtered
  }, [sections, authorities])
}

