/**
 * ─── ADMIN COMPANY HOOKS ─────────────────────────────────────────────────────
 *
 * React Query hooks for admin company registry management.
 * The list query is driven by useGenericSearch (filter engine).
 * This file only exports the detail query and the update mutation.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { showErrorToast, showSuccessToast } from "@/lib/show-toast"
import type { ApiError, NetworkError } from "@/lib/api-error"
import { getAdminCompany, updateAdminCompany } from "./company.api"
import type { AdminUpdateCompanyRequest } from "./company.types"

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const adminCompanyKeys = {
  all: ["admin", "companies"] as const,
  detail: (companyId: string) => ["admin", "companies", companyId] as const,
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useAdminCompany(companyId: string) {
  return useQuery({
    queryKey: adminCompanyKeys.detail(companyId),
    queryFn: () => getAdminCompany(companyId),
    enabled: !!companyId,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useUpdateAdminCompany(onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      companyId,
      data,
    }: {
      companyId: string
      data: AdminUpdateCompanyRequest
    }) => updateAdminCompany(companyId, data),
    retry: false,
    onSuccess: (updated) => {
      showSuccessToast("Company updated")
      // Invalidate list so DataExplorer refetches
      qc.invalidateQueries({ queryKey: adminCompanyKeys.all })
      // Update individual company cache entry
      qc.setQueryData(adminCompanyKeys.detail(updated.companyId), updated)
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}
