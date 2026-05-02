/**
 * ─── ADMIN COMPANY API ───────────────────────────────────────────────────────
 *
 * API calls for admin company registry management.
 * All paths are relative to apiClient baseURL (/api/v1).
 */

import { apiClient } from "@/lib/axios"
import type { GenericFilterRequest, GenericFilterResponse } from "@/core/filters/filter.types"
import type {
  AdminCompanyResponse,
  AdminUpdateCompanyRequest,
} from "./company.types"

// ─── Search companies (filter engine) ────────────────────────────────────────

export const searchAdminCompanies = (
  request: GenericFilterRequest,
  params: { page: number; size: number },
): Promise<GenericFilterResponse<AdminCompanyResponse>> =>
  apiClient
    .post<GenericFilterResponse<AdminCompanyResponse>>(
      `/admin/companies/search?page=${params.page}&size=${params.size}`,
      request,
    )
    .then((r) => r.data)

// ─── Get single company ───────────────────────────────────────────────────────

export const getAdminCompany = (companyId: string): Promise<AdminCompanyResponse> =>
  apiClient.get<AdminCompanyResponse>(`/admin/companies/${companyId}`).then((r) => r.data)

// ─── Update company ───────────────────────────────────────────────────────────

export const updateAdminCompany = (
  companyId: string,
  data: AdminUpdateCompanyRequest,
): Promise<AdminCompanyResponse> =>
  apiClient
    .patch<AdminCompanyResponse>(`/admin/companies/${companyId}`, data)
    .then((r) => r.data)
