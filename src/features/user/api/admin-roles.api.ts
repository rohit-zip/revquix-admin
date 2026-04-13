/**
 * ─── ADMIN ROLES API ──────────────────────────────────────────────────────────
 *
 * API calls for the admin role management endpoints.
 */

import { apiClient } from "@/lib/axios"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RolePermission {
  permissionId: string
  name: string
}

export interface AdminRoleResponse {
  roleId: string
  name: string
  description: string
  isSystemRole: boolean
  permissions: RolePermission[]
  createdAt: string
  updatedAt: string
}

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

// ─── API Calls ────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/roles?page=0&size=100
 *
 * Fetches all available roles. Uses a large page size to get all roles
 * in a single request (roles are few — typically < 20).
 */
export const listRoles = (
  page = 0,
  size = 100,
): Promise<SpringPageResponse<AdminRoleResponse>> =>
  apiClient
    .get<SpringPageResponse<AdminRoleResponse>>("/admin/roles", {
      params: { page, size },
    })
    .then((r) => r.data)
