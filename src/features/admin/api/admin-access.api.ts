/**
 * ─── ADMIN ACCESS API ─────────────────────────────────────────────────────────
 *
 * API calls for admin role & permission management endpoints.
 * All paths are relative to the apiClient baseURL (/api/v1).
 */

import { apiClient } from "@/lib/axios"
import type {
  CreatePermissionRequest,
  CreateRoleRequest,
  PermissionResponse,
  RoleResponse,
  SpringPageResponse,
} from "./admin-access.types"

// ═══════════════════════════════════════════════════════════════════════════════
// ROLES
// ═══════════════════════════════════════════════════════════════════════════════

/** POST /admin/roles — Create a new role */
export const createRole = (data: CreateRoleRequest): Promise<RoleResponse> =>
  apiClient.post<RoleResponse>("/admin/roles", data).then((r) => r.data)

/** GET /admin/roles — Paginated list of all roles */
export const listRoles = (
  page = 0,
  size = 100,
): Promise<SpringPageResponse<RoleResponse>> =>
  apiClient
    .get<SpringPageResponse<RoleResponse>>("/admin/roles", {
      params: { page, size },
    })
    .then((r) => r.data)

/** GET /admin/roles/{roleId} — Get a single role */
export const getRole = (roleId: string): Promise<RoleResponse> =>
  apiClient.get<RoleResponse>(`/admin/roles/${roleId}`).then((r) => r.data)

/** PUT /admin/roles/{roleId} — Update an existing role */
export const updateRole = (
  roleId: string,
  data: CreateRoleRequest,
): Promise<RoleResponse> =>
  apiClient.put<RoleResponse>(`/admin/roles/${roleId}`, data).then((r) => r.data)

/** DELETE /admin/roles/{roleId} — Delete a role */
export const deleteRole = (roleId: string): Promise<void> =>
  apiClient.delete(`/admin/roles/${roleId}`).then(() => undefined)

// ═══════════════════════════════════════════════════════════════════════════════
// PERMISSIONS
// ═══════════════════════════════════════════════════════════════════════════════

/** POST /admin/permissions — Create a new permission */
export const createPermission = (
  data: CreatePermissionRequest,
): Promise<PermissionResponse> =>
  apiClient
    .post<PermissionResponse>("/admin/permissions", data)
    .then((r) => r.data)

/** GET /admin/permissions — Paginated list of all permissions */
export const listPermissions = (
  page = 0,
  size = 200,
): Promise<SpringPageResponse<PermissionResponse>> =>
  apiClient
    .get<SpringPageResponse<PermissionResponse>>("/admin/permissions", {
      params: { page, size },
    })
    .then((r) => r.data)

/** PUT /admin/permissions/{permissionId} — Update a permission */
export const updatePermission = (
  permissionId: string,
  data: CreatePermissionRequest,
): Promise<PermissionResponse> =>
  apiClient
    .put<PermissionResponse>(`/admin/permissions/${permissionId}`, data)
    .then((r) => r.data)

/** DELETE /admin/permissions/{permissionId} — Delete a permission */
export const deletePermission = (permissionId: string): Promise<void> =>
  apiClient.delete(`/admin/permissions/${permissionId}`).then(() => undefined)

