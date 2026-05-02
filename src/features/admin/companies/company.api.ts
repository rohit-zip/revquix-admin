/**
 * ─── ADMIN COMPANY API ───────────────────────────────────────────────────────
 *
 * API calls for admin company registry management.
 * All paths are relative to apiClient baseURL (/api/v1).
 */

import { apiClient } from "@/lib/axios"
import type {
  AdminCompanyListResponse,
  AdminCompanyResponse,
  AdminUpdateCompanyRequest,
} from "./company.types"

// ─── List companies (paginated, filterable) ───────────────────────────────────

export interface ListCompaniesParams {
  page?: number
  size?: number
  search?: string
  isVerified?: boolean
  isActive?: boolean
}

export const listAdminCompanies = (
  params: ListCompaniesParams = {},
): Promise<AdminCompanyListResponse> => {
  const { page = 0, size = 20, search, isVerified, isActive } = params
  const query = new URLSearchParams({
    page: String(page),
    size: String(size),
  })
  if (search) query.set("search", search)
  if (isVerified !== undefined) query.set("isVerified", String(isVerified))
  if (isActive !== undefined) query.set("isActive", String(isActive))
  return apiClient
    .get<AdminCompanyListResponse>(`/admin/companies?${query.toString()}`)
    .then((r) => r.data)
}

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
