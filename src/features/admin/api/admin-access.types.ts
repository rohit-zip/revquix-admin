/**
 * ─── ADMIN ACCESS TYPES ───────────────────────────────────────────────────────
 *
 * TypeScript interfaces mirroring backend DTOs for
 * role & permission management endpoints.
 */

// ─── Shared ───────────────────────────────────────────────────────────────────

/** Spring Boot Page<T> response shape */
export interface SpringPageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
}

// ─── Permission ───────────────────────────────────────────────────────────────

export interface PermissionResponse {
  permissionId: string
  permissionName: string
  description: string
  category: string
  createdAt: string
  updatedAt: string
}

export interface CreatePermissionRequest {
  permissionName: string
  description?: string
  category: string
}

// ─── Role ─────────────────────────────────────────────────────────────────────

export interface RolePermission {
  permissionId: string
  name: string
}

export interface RoleResponse {
  roleId: string
  name: string
  description: string
  isSystemRole: boolean
  permissions: RolePermission[]
  createdAt: string
  updatedAt: string
}

export interface CreateRoleRequest {
  name: string
  description?: string
  isSystemRole?: boolean
  permissionIds?: string[]
}

