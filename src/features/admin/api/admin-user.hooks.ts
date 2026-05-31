/**
 * ─── ADMIN USER MANAGEMENT HOOKS ─────────────────────────────────────────────
 *
 * React Query hooks for admin user detail page:
 *   - User detail query
 *   - Role assignment / removal mutations
 *   - Permission override grant / deny / list / remove
 *
 * Follows existing app patterns: useMutation with toast feedback,
 * automatic query invalidation on success.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { showErrorToast, showSuccessToast } from "@/lib/show-toast"
import type { ApiError, NetworkError } from "@/lib/api-error"
import type { AdminSetQuotaRequest, GrantPermissionRequest } from "./admin-user.types"
import type { AdminProjectModerationStatus } from "@/features/user/api/session.types"
import {
  adminRevokeAllUserSessions,
  adminRevokeUserSession,
  assignRoleToUser,
  denyPermission,
  getAdminSearchQuota,
  getAdminUser,
  getAdminUserDetail,
  getAdminUserSessionHistory,
  getAdminUserSessions,
  getUserOverrides,
  grantPermission,
  moderateUserProject,
  removeOverride,
  removeRoleFromUser,
  resetAdminSearchQuota,
  setAdminSearchQuota,
} from "./admin-user.api"

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const adminUserKeys = {
  detail: (userId: string) => ["admin", "user", userId] as const,
  overrides: (userId: string) => ["admin", "user", userId, "overrides"] as const,
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useAdminUser(userId: string) {
  return useQuery({
    queryKey: adminUserKeys.detail(userId),
    queryFn: () => getAdminUser(userId),
    enabled: !!userId,
  })
}

export function useUserOverrides(userId: string) {
  return useQuery({
    queryKey: adminUserKeys.overrides(userId),
    queryFn: () => getUserOverrides(userId),
    enabled: !!userId,
  })
}

// ─── Role Mutations ───────────────────────────────────────────────────────────

export function useAssignRole(userId: string, onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (roleId: string) => assignRoleToUser(roleId, userId),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Role assigned successfully")
      qc.invalidateQueries({ queryKey: adminUserKeys.detail(userId) })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

export function useRemoveRole(userId: string, onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (roleId: string) => removeRoleFromUser(roleId, userId),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Role removed successfully")
      qc.invalidateQueries({ queryKey: adminUserKeys.detail(userId) })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

// ─── Permission Override Mutations ────────────────────────────────────────────

export function useGrantPermission(userId: string, onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: GrantPermissionRequest) => grantPermission(userId, data),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Permission granted successfully")
      qc.invalidateQueries({ queryKey: adminUserKeys.overrides(userId) })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

export function useDenyPermission(userId: string, onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: GrantPermissionRequest) => denyPermission(userId, data),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Permission denied successfully")
      qc.invalidateQueries({ queryKey: adminUserKeys.overrides(userId) })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

export function useRemoveOverride(userId: string, onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (permissionId: string) => removeOverride(userId, permissionId),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Permission override removed successfully")
      qc.invalidateQueries({ queryKey: adminUserKeys.overrides(userId) })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

// ─── Admin User Detail (full with skills/categories) ──────────────────────────

export function useAdminUserDetail(userId: string) {
  return useQuery({
    queryKey: [...adminUserKeys.detail(userId), "full"] as const,
    queryFn: () => getAdminUserDetail(userId),
    enabled: !!userId,
  })
}

/**
 * Hide or restore a user's project from their public profile.
 * Invalidates the full user-detail query so the row reflects the new state.
 */
export function useModerateUserProject(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { projectId: string; status: AdminProjectModerationStatus }) =>
      moderateUserProject(userId, vars.projectId, vars.status),
    retry: false,
    onSuccess: (_data, vars) => {
      showSuccessToast(
        vars.status === "HIDDEN"
          ? "Project hidden from public profile"
          : "Project restored to public profile",
      )
      qc.invalidateQueries({ queryKey: adminUserKeys.detail(userId) })
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

// ─── Admin Session Management ─────────────────────────────────────────────────

export const adminSessionKeys = {
  active: (userId: string) => ["admin", "user", userId, "sessions"] as const,
  history: (userId: string, page: number, size: number) =>
    ["admin", "user", userId, "sessions", "history", page, size] as const,
}

export function useAdminUserSessions(userId: string) {
  return useQuery({
    queryKey: adminSessionKeys.active(userId),
    queryFn: () => getAdminUserSessions(userId),
    enabled: !!userId,
  })
}

export function useAdminUserSessionHistory(userId: string, page: number, size: number) {
  return useQuery({
    queryKey: adminSessionKeys.history(userId, page, size),
    queryFn: () => getAdminUserSessionHistory(userId, page, size),
    enabled: !!userId,
  })
}

export function useAdminRevokeSession(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sessionId: string) => adminRevokeUserSession(userId, sessionId),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Session revoked successfully")
      qc.invalidateQueries({ queryKey: adminSessionKeys.active(userId) })
      qc.invalidateQueries({ queryKey: ["admin", "user", userId, "sessions", "history"] })
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

export function useAdminRevokeAllSessions(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => adminRevokeAllUserSessions(userId),
    retry: false,
    onSuccess: () => {
      showSuccessToast("All sessions revoked — user has been signed out from all devices")
      qc.invalidateQueries({ queryKey: adminSessionKeys.active(userId) })
      qc.invalidateQueries({ queryKey: ["admin", "user", userId, "sessions", "history"] })
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

// ─── Search Quota ─────────────────────────────────────────────────────────────

export const adminQuotaKeys = {
  detail: (userId: string) => ["admin", "user", userId, "search-quota"] as const,
}

export function useAdminSearchQuota(userId: string) {
  return useQuery({
    queryKey: adminQuotaKeys.detail(userId),
    queryFn: () => getAdminSearchQuota(userId),
    enabled: !!userId,
    staleTime: 30_000,
    retry: false,
  })
}

export function useSetAdminSearchQuota(userId: string, onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: AdminSetQuotaRequest) => setAdminSearchQuota(userId, data),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Search quota updated")
      qc.invalidateQueries({ queryKey: adminQuotaKeys.detail(userId) })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

export function useResetAdminSearchQuota(userId: string, onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => resetAdminSearchQuota(userId),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Search quota reset to system default (10 / month)")
      qc.invalidateQueries({ queryKey: adminQuotaKeys.detail(userId) })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}


