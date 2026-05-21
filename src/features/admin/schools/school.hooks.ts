/**
 * ─── ADMIN SCHOOL HOOKS ───────────────────────────────────────────────────────
 *
 * React Query hooks for admin school registry management.
 * The list query is driven by useGenericSearch (filter engine).
 * This file only exports the detail query and the update mutation.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { showErrorToast, showSuccessToast } from "@/lib/show-toast"
import type { ApiError, NetworkError } from "@/lib/api-error"
import { getAdminSchool, updateAdminSchool } from "./school.api"
import type { AdminUpdateSchoolRequest } from "./school.types"

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const adminSchoolKeys = {
  all: ["admin", "schools"] as const,
  detail: (schoolId: string) => ["admin", "schools", schoolId] as const,
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useAdminSchool(schoolId: string) {
  return useQuery({
    queryKey: adminSchoolKeys.detail(schoolId),
    queryFn: () => getAdminSchool(schoolId),
    enabled: !!schoolId,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useUpdateAdminSchool(onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      schoolId,
      data,
    }: {
      schoolId: string
      data: AdminUpdateSchoolRequest
    }) => updateAdminSchool(schoolId, data),
    retry: false,
    onSuccess: (updated) => {
      showSuccessToast("School updated")
      // Invalidate list so DataExplorer refetches
      qc.invalidateQueries({ queryKey: adminSchoolKeys.all })
      // Update individual school cache entry
      qc.setQueryData(adminSchoolKeys.detail(updated.schoolId), updated)
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}
