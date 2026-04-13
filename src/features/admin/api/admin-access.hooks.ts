/**
 * ─── ADMIN ACCESS HOOKS ──────────────────────────────────────────────────────
 *
 * React Query hooks for admin role & permission management.
 * Follows existing app patterns: useMutation with toast feedback,
 * automatic query invalidation on success.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { showErrorToast, showSuccessToast } from "@/lib/show-toast"
import type { ApiError, NetworkError } from "@/lib/api-error"
import type { CreatePermissionRequest, CreateRoleRequest } from "./admin-access.types"
import {
  createPermission,
  createRole,
  deletePermission,
  deleteRole,
  listPermissions,
  listRoles,
  updatePermission,
  updateRole,
} from "./admin-access.api"

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const adminAccessKeys = {
  roles: ["admin", "roles"] as const,
  permissions: ["admin", "permissions"] as const,
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useRoles() {
  return useQuery({
    queryKey: adminAccessKeys.roles,
    queryFn: () => listRoles(),
  })
}

export function usePermissions() {
  return useQuery({
    queryKey: adminAccessKeys.permissions,
    queryFn: () => listPermissions(),
  })
}

// ─── Role Mutations ───────────────────────────────────────────────────────────

export function useCreateRole(onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateRoleRequest) => createRole(data),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Role created successfully")
      qc.invalidateQueries({ queryKey: adminAccessKeys.roles })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

export function useUpdateRole(onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ roleId, data }: { roleId: string; data: CreateRoleRequest }) =>
      updateRole(roleId, data),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Role updated successfully")
      qc.invalidateQueries({ queryKey: adminAccessKeys.roles })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

export function useDeleteRole(onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (roleId: string) => deleteRole(roleId),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Role deleted successfully")
      qc.invalidateQueries({ queryKey: adminAccessKeys.roles })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

// ─── Permission Mutations ─────────────────────────────────────────────────────

export function useCreatePermission(onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreatePermissionRequest) => createPermission(data),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Permission created successfully")
      qc.invalidateQueries({ queryKey: adminAccessKeys.permissions })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

export function useUpdatePermission(onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      permissionId,
      data,
    }: {
      permissionId: string
      data: CreatePermissionRequest
    }) => updatePermission(permissionId, data),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Permission updated successfully")
      qc.invalidateQueries({ queryKey: adminAccessKeys.permissions })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

export function useDeletePermission(onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (permissionId: string) => deletePermission(permissionId),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Permission deleted successfully")
      qc.invalidateQueries({ queryKey: adminAccessKeys.permissions })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

