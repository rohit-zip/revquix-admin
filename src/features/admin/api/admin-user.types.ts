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

