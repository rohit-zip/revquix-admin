/**
 * ─── ADMIN USER MANAGEMENT TYPES ──────────────────────────────────────────────
 *
 * TypeScript interfaces mirroring backend DTOs for user-level
 * role assignment and permission override endpoints.
 */

// Re-export AdminUserResponse from user-search for convenience
export type { AdminUserResponse } from "@/features/user/api/user-search.types"

// ─── User Role Response ───────────────────────────────────────────────────────

export interface RoleDetails {
  roleId: string
  roleName: string
  description: string
  isSystemRole: boolean
}

export interface UserRoleResponse {
  userId: string
  email: string
  name: string
  roles: RoleDetails[]
}

// ─── Permission Override ──────────────────────────────────────────────────────

export interface UserPermissionOverrideResponse {
  overrideId: number
  userId: string
  permissionId: string
  permissionName: string
  grantType: "GRANT" | "DENY"
  expiresAt: string | null
  reason: string | null
  grantedBy: string
  createdAt: string
}

export interface GrantPermissionRequest {
  permissionId: string
  expiresAt?: string | null
  reason?: string | null
}

// ─── Search Quota ─────────────────────────────────────────────────────────────

/**
 * A single month's quota usage row.
 * Mirrors backend {@code AdminQuotaDetailResponse.MonthEntry}.
 */
export interface QuotaMonthEntry {
  /** ISO year-month, e.g. "2026-05" */
  yearMonth: string
  /** Number of searches used this month */
  searchCount: number
  /**
   * Admin-set override for this month.
   * null = system default (10), -1 = unlimited, >0 = custom cap.
   */
  customQuota: number | null
  /** Effective limit for this month (resolves null → system default) */
  effectiveLimit: number
  /** ISO-8601 instant — first search of the month */
  createdAt: string | null
  /** ISO-8601 instant — most recent update */
  updatedAt: string | null
}

/**
 * Full admin quota detail for a user.
 * Mirrors backend {@code AdminQuotaDetailResponse}.
 */
export interface AdminQuotaDetail {
  userId: string
  /** Current effective monthly limit (-1 = unlimited, 10 = system default) */
  currentLimit: number
  /** True when the user currently has unlimited searches */
  isCurrentlyUnlimited: boolean
  /** Month-by-month history, newest first */
  history: QuotaMonthEntry[]
}

/**
 * Request body for PATCH /admin/users/{userId}/search-quota.
 * quota: -1 = unlimited, positive integer = custom monthly cap.
 */
export interface AdminSetQuotaRequest {
  quota: number
}

// ─── Account Status Actions ───────────────────────────────────────────────────

/**
 * Admin account-state actions. Mirrors backend {@code AccountStatusAction}.
 * - DELETE-permission actions: SOFT_DELETE, RESTORE
 * - EDIT-permission actions: everything else
 * - Destructive (reason required): DISABLE, LOCK, SOFT_DELETE, FORCE_LOGOUT, FORCE_PASSWORD_RESET
 */
export type AccountStatusAction =
  | "DISABLE"
  | "ENABLE"
  | "LOCK"
  | "UNLOCK"
  | "SOFT_DELETE"
  | "RESTORE"
  | "FORCE_LOGOUT"
  | "FORCE_PASSWORD_RESET"

/**
 * Request body for PATCH /admin/users/{userId}/status.
 * Mirrors backend {@code AdminUpdateAccountStatusRequest}.
 */
export interface UpdateAccountStatusRequest {
  action: AccountStatusAction
  /** Required for destructive actions; ignored for restorative ones. */
  reason?: string | null
  /** LOCK only: ISO-8601 instant → temporary lock; omit/null → indefinite block. */
  lockUntil?: string | null
  /** Reserved for Phase 4 (email notifications). */
  notifyUser?: boolean | null
}

