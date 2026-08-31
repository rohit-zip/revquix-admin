/**
 * ─── ADMIN APP ACCESS CONFIGURATION ─────────────────────────────────────────
 *
 * Single source of truth for who may enter the revquix-admin application.
 *
 * Gate logic (evaluated OR across both arrays):
 *   allowedRoles        → user must hold AT LEAST ONE of these role strings
 *   allowedPermissions  → user may also enter with ANY ONE of these fine-grained
 *                         permissions (without needing a listed role)
 *
 * Any authenticated user whose `authorities` array satisfies neither list is
 * redirected to `unauthorizedRedirectPath`.
 *
 * How to add a new allowed role or permission
 * ─────────────────────────────────────────────
 *   • Append the string to `allowedRoles` or `allowedPermissions` below.
 *   • No code changes elsewhere are required — the AdminRoleGuard component
 *     reads this config at runtime.
 */

export interface AdminAppAccessConfig {
  /** OR logic — user needs AT LEAST ONE of these role strings */
  allowedRoles: string[]
  /**
   * OR logic — user without a listed role may still enter if they hold at
   * least one of these fine-grained permissions.
   */
  allowedPermissions: string[]
  /** Path to redirect to when access is denied (default: /unauthorized) */
  unauthorizedRedirectPath: string
}

export const ADMIN_APP_ACCESS: AdminAppAccessConfig = {
  allowedRoles: [
    "ROLE_ADMIN",           // Full platform administrator
    "ROLE_BUSINESS_MENTOR", // Business mentors manage their own slots / bookings
  ],
  allowedPermissions: [
    // Fine-grained staff permissions — grants entry without a full role.
    // ROLE_ADMIN already implies every permission below (see auth.role_permission
    // seed data), so this list only needs to cover permissions that a user might
    // hold WITHOUT either allowed role — in practice, this means every permission
    // granted to ROLE_BUSINESS_MENTOR, so a mentor who only received individual
    // permission grants (instead of the full role) can still get in.
    "PERM_MANAGE_USERS",
    "PERM_MANAGE_ROLES",
    "PERM_MANAGE_PERMISSIONS",
    "PERM_MANAGE_USER_ROLES",
    "PERM_VIEW_ALL_BOOKINGS",
    "PERM_VIEW_ALL_MOCK_BOOKINGS",
    "PERM_VIEW_MENTOR_APPLICATIONS",
    "PERM_MANAGE_PROFESSIONAL_MENTORS",
    "PERM_VIEW_ALL_PAYMENTS",
    "PERM_MANAGE_PAYOUTS",
    "PERM_VIEW_ALL_COUPONS",
    "PERM_VIEW_ALL_INTAKES",
    "PERM_MANAGE_ASSETS",
    // ROLE_BUSINESS_MENTOR's full permission set (auth.role_permission: V12, V43,
    // V71, V79, V111) — kept in sync so a mentor with only these individual grants
    // (no role) still clears the gate:
    "PERM_MANAGE_OWN_SLOTS",
    "PERM_VIEW_MENTOR_OWN_BOOKINGS",
    "PERM_VIEW_OWN_BOOKINGS",
    "PERM_JOIN_ANY_MEETING",
    "PERM_MANAGE_INTAKES",
    "PERM_WRITE_MEETING_OUTCOME",
    "PERM_VIEW_MEETING_FEEDBACK",
    "PERM_SET_MEETING_URL",
    "PERM_CREATE_COMMENT",
    "PERM_VIEW_COMMENTS",
    "PERM_CREATE_OFFER_ORDER",
    "PERM_VIEW_OWN_OFFER_ORDERS",
    "PERM_REVIEW_OFFER_ORDERS",
    "PERM_FOLLOW_USERS",
    "PERM_VIEW_FOLLOW_LIST",
    "PERM_WRITE_BLOG",
    "PERM_COMMENT_BLOG",
  ],
  unauthorizedRedirectPath: "/unauthorized",
}

/**
 * Pure helper — evaluates a user's authority list against ADMIN_APP_ACCESS.
 * Returns true if the user satisfies at least one condition.
 */
export function hasAdminAppAccess(authorities: string[]): boolean {
  const authoritySet = new Set(authorities)
  return (
    ADMIN_APP_ACCESS.allowedRoles.some((r) => authoritySet.has(r)) ||
    ADMIN_APP_ACCESS.allowedPermissions.some((p) => authoritySet.has(p))
  )
}

