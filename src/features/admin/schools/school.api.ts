/**
 * ─── ADMIN SCHOOL API ─────────────────────────────────────────────────────────
 *
 * API calls for admin school registry management.
 * All paths are relative to apiClient baseURL (/api/v1).
 */

import { apiClient } from "@/lib/axios"
import type { GenericFilterRequest, GenericFilterResponse } from "@/core/filters/filter.types"
import type {
  AdminSchoolResponse,
  AdminUpdateSchoolRequest,
} from "./school.types"

// ─── Search schools (filter engine) ──────────────────────────────────────────

export const searchAdminSchools = (
  request: GenericFilterRequest,
  params: { page: number; size: number },
): Promise<GenericFilterResponse<AdminSchoolResponse>> =>
  apiClient
    .post<GenericFilterResponse<AdminSchoolResponse>>(
      `/admin/schools/search?page=${params.page}&size=${params.size}`,
      request,
    )
    .then((r) => r.data)

// ─── Get single school ────────────────────────────────────────────────────────

export const getAdminSchool = (schoolId: string): Promise<AdminSchoolResponse> =>
  apiClient.get<AdminSchoolResponse>(`/admin/schools/${schoolId}`).then((r) => r.data)

// ─── Update school ────────────────────────────────────────────────────────────

export const updateAdminSchool = (
  schoolId: string,
  data: AdminUpdateSchoolRequest,
): Promise<AdminSchoolResponse> =>
  apiClient
    .patch<AdminSchoolResponse>(`/admin/schools/${schoolId}`, data)
    .then((r) => r.data)
