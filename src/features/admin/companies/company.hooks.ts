/**
 * ─── ADMIN COMPANY HOOKS ─────────────────────────────────────────────────────
 *
 * React Query hooks for admin company registry management.
 * Follows existing app patterns: useMutation with toast feedback,
 * automatic query invalidation on success.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { showErrorToast, showSuccessToast } from "@/lib/show-toast"
import type { ApiError, NetworkError } from "@/lib/api-error"
import {
  getAdminCompany,
  listAdminCompanies,
  updateAdminCompany,
  type ListCompaniesParams,
} from "./company.api"
import type { AdminUpdateCompanyRequest } from "./company.types"

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const adminCompanyKeys = {
  all: ["admin", "companies"] as const,
  list: (params: ListCompaniesParams) => ["admin", "companies", "list", params] as const,
  detail: (companyId: string) => ["admin", "companies", companyId] as const,
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useAdminCompanies(params: ListCompaniesParams = {}) {
  return useQuery({
    queryKey: adminCompanyKeys.list(params),
    queryFn: () => listAdminCompanies(params),
    staleTime: 30_000,
  })
}

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
      // Invalidate the list so table refreshes
      qc.invalidateQueries({ queryKey: adminCompanyKeys.all })
      // Update the individual company cache entry
      qc.setQueryData(adminCompanyKeys.detail(updated.companyId), updated)
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}
