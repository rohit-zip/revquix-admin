"use client"

import { useAuth } from "./useAuth"
import type { PageAccessRule } from "@/config/page-access.config"
// PageAccessRule is defined in the admin page-access.config

/**
 * ─── USEAUTHORIZATION HOOK ────────────────────────────────────────────────────
 *
 * Central RBAC hook.  Reads the `authorities` array from CurrentUserResponse
 * (populated after the user profile is fetched) and exposes helpers for:
 *
 *   • hasAnyAuthority(list)  → true if the user has ≥ 1 of the given strings
 *   • hasAllAuthorities(list)→ true if the user has ALL of the given strings
 *   • canAccessPage(rule)    → convenience wrapper around hasAnyAuthority
 *
 * Usage:
 *   const { hasAnyAuthority } = useAuthorization()
 *   if (!hasAnyAuthority(["ROLE_ADMIN", "PERM_MANAGE_ROLE"])) return null
 */

export function useAuthorization() {
  const { isLoggedIn, currentUser } = useAuth()

  // ─── Basic presence checks ────────────────────────────────────────────────
  const canAccessDashboard = isLoggedIn
  const canAccessSettings = isLoggedIn

  // ─── Authority helpers ────────────────────────────────────────────────────

  /**
   * Returns `true` when the current user has **at least one** of the supplied
   * authority strings (roles or permissions).
   *
   * @example — conditional render
   *   const { hasAnyAuthority } = useAuthorization()
   *
   *   // Show a button only to admins or managers
   *   {hasAnyAuthority(["ROLE_ADMIN", "PERM_MANAGE_ROLE"]) && (
   *     <Button>Manage Roles</Button>
   *   )}
   *
   * @example — early return inside a component
   *   if (!hasAnyAuthority(["ROLE_ADMIN"])) {
   *     return <p>You do not have access to this section.</p>
   *   }
   *
   * @example — inside a custom hook
   *   const canDeleteUsers = hasAnyAuthority(["ROLE_ADMIN", "PERM_DELETE_USER"])
   */
  function hasAnyAuthority(authorities: string[]): boolean {
    if (!authorities.length) return true // empty list → open access
    if (!currentUser?.authorities?.length) return false
    return authorities.some((a) => currentUser.authorities.includes(a))
  }

  /**
   * Returns `true` when the current user has **every** supplied authority string.
   * Use this when a feature requires ALL listed permissions simultaneously.
   *
   * @example — require both a role AND a fine-grained permission
   *   const { hasAllAuthorities } = useAuthorization()
   *
   *   // Only show the "Publish" button if the user is an admin AND
   *   // explicitly holds the publish permission
   *   {hasAllAuthorities(["ROLE_ADMIN", "PERM_PUBLISH_CONTENT"]) && (
   *     <Button>Publish</Button>
   *   )}
   *
   * @example — guard an entire form section
   *   const canEditBilling =
   *     hasAllAuthorities(["ROLE_ADMIN", "PERM_EDIT_BILLING"])
   *
   *   return (
   *     <fieldset disabled={!canEditBilling}>
   *       <BillingForm />
   *     </fieldset>
   *   )
   */
  function hasAllAuthorities(authorities: string[]): boolean {
    if (!authorities.length) return true
    if (!currentUser?.authorities?.length) return false
    return authorities.every((a) => currentUser.authorities.includes(a))
  }

  /**
   * Evaluates a {@link PageAccessRule} object — shorthand for
   * `hasAnyAuthority(rule.anyOf)`.
   *
   * Prefer this when you already have a `PageAccessRule` at hand (e.g. when
   * reading directly from `PAGE_ACCESS_CONFIG`).
   *
   * @example — reading from PAGE_ACCESS_CONFIG
   *   import { PAGE_ACCESS_CONFIG } from "@/config/page-access.config"
   *   const { canAccessPage } = useAuthorization()
   *
   *   const canSeeRoles = canAccessPage(PAGE_ACCESS_CONFIG["/admin/roles"])
   *
   *   {canSeeRoles && <NavItem href="/admin/roles">Roles</NavItem>}
   *
   * @example — inline rule object
   *   const { canAccessPage } = useAuthorization()
   *
   *   const isAnalyticsAllowed = canAccessPage({
   *     anyOf: ["ROLE_ADMIN", "PERM_VIEW_ANALYTICS"],
   *   })
   *
   * @example — hide sidebar links based on access rules
   *   const links = [
   *     { href: "/admin/roles",    rule: PAGE_ACCESS_CONFIG["/admin/roles"],    label: "Roles"    },
   *     { href: "/admin/users",    rule: PAGE_ACCESS_CONFIG["/admin/users"],    label: "Users"    },
   *   ]
   *
   *   links
   *     .filter(({ rule }) => canAccessPage(rule))
   *     .map(({ href, label }) => <NavItem key={href} href={href}>{label}</NavItem>)
   */
  function canAccessPage(rule: PageAccessRule): boolean {
    return hasAnyAuthority(rule.anyOf ?? [])
  }

  return {
    canAccessDashboard,
    canAccessSettings,
    hasAnyAuthority,
    hasAllAuthorities,
    canAccessPage,
  }
}


