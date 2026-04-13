/**
 * ─── ADMIN USER MANAGEMENT API ────────────────────────────────────────────────
 *
 * API calls for admin user detail, role assignment,
 * and per-user permission override endpoints.
 * All paths are relative to the apiClient baseURL (/api/v1).
 */

import { apiClient } from "@/lib/axios"
import type { AdminUserResponse } from "@/features/user/api/user-search.types"
import type { AdminUserDetailResponse } from "@/features/user/api/session.types"
import type {
  GrantPermissionRequest,
  UserPermissionOverrideResponse,
  UserRoleResponse,
} from "./admin-user.types"
import type { SessionHistoryPage, UserSessionResponse } from "@/features/user/api/session.types"

// ═══════════════════════════════════════════════════════════════════════════════
// USER DETAIL
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /user/{userId} — Get admin-facing user summary */
export const getAdminUser = (userId: string): Promise<AdminUserResponse> =>
  apiClient.get<AdminUserResponse>(`/user/${userId}`).then((r) => r.data)

/** GET /user/{userId}/detail — Get full admin user detail with skills, categories, auth providers */
export const getAdminUserDetail = (userId: string): Promise<AdminUserDetailResponse> =>
  apiClient.get<AdminUserDetailResponse>(`/user/${userId}/detail`).then((r) => r.data)

// ═══════════════════════════════════════════════════════════════════════════════
// ROLE ↔ USER ASSIGNMENT
// ═══════════════════════════════════════════════════════════════════════════════

/** POST /admin/roles/{roleId}/users/{userId} — Assign a role to user */
export const assignRoleToUser = (
  roleId: string,
  userId: string,
): Promise<UserRoleResponse> =>
  apiClient
    .post<UserRoleResponse>(`/admin/roles/${roleId}/users/${userId}`)
    .then((r) => r.data)

/** DELETE /admin/roles/{roleId}/users/{userId} — Remove a role from user */
export const removeRoleFromUser = (
  roleId: string,
  userId: string,
): Promise<void> =>
  apiClient
    .delete(`/admin/roles/${roleId}/users/${userId}`)
    .then(() => undefined)

// ═══════════════════════════════════════════════════════════════════════════════
// PERMISSION OVERRIDES
// ═══════════════════════════════════════════════════════════════════════════════

/** POST /admin/users/{userId}/permissions/grant — Grant a permission override */
export const grantPermission = (
  userId: string,
  data: GrantPermissionRequest,
): Promise<UserPermissionOverrideResponse> =>
  apiClient
    .post<UserPermissionOverrideResponse>(
      `/admin/users/${userId}/permissions/grant`,
      data,
    )
    .then((r) => r.data)

/** POST /admin/users/{userId}/permissions/deny — Deny a permission override */
export const denyPermission = (
  userId: string,
  data: GrantPermissionRequest,
): Promise<UserPermissionOverrideResponse> =>
  apiClient
    .post<UserPermissionOverrideResponse>(
      `/admin/users/${userId}/permissions/deny`,
      data,
    )
    .then((r) => r.data)

/** GET /admin/users/{userId}/permissions — List all user permission overrides */
export const getUserOverrides = (
  userId: string,
): Promise<UserPermissionOverrideResponse[]> =>
  apiClient
    .get<UserPermissionOverrideResponse[]>(
      `/admin/users/${userId}/permissions`,
    )
    .then((r) => r.data)

/** DELETE /admin/users/{userId}/permissions/{permissionId} — Remove an override */
export const removeOverride = (
  userId: string,
  permissionId: string,
): Promise<void> =>
  apiClient
    .delete(`/admin/users/${userId}/permissions/${permissionId}`)
    .then(() => undefined)

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN SESSION MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /admin/users/{userId}/sessions — All active sessions for a user */
export const getAdminUserSessions = (userId: string): Promise<UserSessionResponse[]> =>
  apiClient
    .get<UserSessionResponse[]>(`/admin/users/${userId}/sessions`)
    .then((r) => r.data)

/** GET /admin/users/{userId}/sessions/history — Paginated full session history */
export const getAdminUserSessionHistory = (
  userId: string,
  page = 0,
  size = 20,
): Promise<SessionHistoryPage> =>
  apiClient
    .get<SessionHistoryPage>(`/admin/users/${userId}/sessions/history`, {
      params: { page, size },
    })
    .then((r) => r.data)

/** DELETE /admin/users/{userId}/sessions/{sessionId} — Revoke a specific session */
export const adminRevokeUserSession = (
  userId: string,
  sessionId: string,
): Promise<void> =>
  apiClient
    .delete(`/admin/users/${userId}/sessions/${sessionId}`)
    .then(() => undefined)

/** DELETE /admin/users/{userId}/sessions — Revoke all sessions for a user */
export const adminRevokeAllUserSessions = (userId: string): Promise<void> =>
  apiClient
    .delete(`/admin/users/${userId}/sessions`)
    .then(() => undefined)

