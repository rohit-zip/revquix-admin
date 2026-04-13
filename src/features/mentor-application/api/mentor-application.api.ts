/**
 * ─── MENTOR APPLICATION API ──────────────────────────────────────────────────
 *
 * API calls for MentorApplicationController endpoints.
 * All paths are relative to the apiClient baseURL (/api/v1).
 */

import { apiClient } from "@/lib/axios"
import type { GenericFilterRequest, GenericFilterResponse } from "@/core/filters/filter.types"
import type {
  ApplicationLimits,
  MentorApplicationRejectRequest,
  MentorApplicationRequest,
  MentorApplicationResponse,
} from "./mentor-application.types"

const BASE = "/mentor-application"

// ─── Config ───────────────────────────────────────────────────────────────────

/** GET /mentor-application/category-skill-limits — Get all limits (categories, skills, pricing) */
export const getCategorySkillLimits = (): Promise<ApplicationLimits> =>
  apiClient
    .get<ApplicationLimits>(`${BASE}/category-skill-limits`)
    .then((r) => r.data)

// ─── User Endpoints ───────────────────────────────────────────────────────────

/** POST /mentor-application/apply — Submit application (multipart: JSON + resume) */
export const applyMentor = (
  data: MentorApplicationRequest,
  resume: File,
): Promise<MentorApplicationResponse> => {
  const formData = new FormData()
  formData.append(
    "application",
    new Blob([JSON.stringify(data)], { type: "application/json" }),
  )
  formData.append("resume", resume)
  return apiClient
    .post<MentorApplicationResponse>(`${BASE}/apply`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data)
}

/** GET /mentor-application/my — Get current user's latest application */
export const getMyApplication = (): Promise<MentorApplicationResponse | null> =>
  apiClient
    .get<MentorApplicationResponse>(`${BASE}/my`)
    .then((r) => r.data)
    .catch((e) => {
      if (e?.response?.status === 204) return null
      throw e
    })

/** GET /mentor-application/my/history — Get all applications */
export const getMyApplicationHistory = (): Promise<MentorApplicationResponse[]> =>
  apiClient.get<MentorApplicationResponse[]>(`${BASE}/my/history`).then((r) => r.data)

/** DELETE /mentor-application/my/withdraw — Withdraw pending application */
export const withdrawApplication = (): Promise<void> =>
  apiClient.delete(`${BASE}/my/withdraw`).then(() => undefined)

// ─── Admin Endpoints ──────────────────────────────────────────────────────────

/** POST /mentor-application/search — Search all applications (admin) */
export const searchApplications = (
  request: GenericFilterRequest,
  params: { page: number; size: number },
): Promise<GenericFilterResponse<MentorApplicationResponse>> =>
  apiClient
    .post<GenericFilterResponse<MentorApplicationResponse>>(
      `${BASE}/search?page=${params.page}&size=${params.size}`,
      request,
    )
    .then((r) => r.data)

/** GET /mentor-application/{id} — Get application by ID */
export const getApplicationById = (id: string): Promise<MentorApplicationResponse> =>
  apiClient.get<MentorApplicationResponse>(`${BASE}/${id}`).then((r) => r.data)

/** PUT /mentor-application/{id}/approve — Approve application */
export const approveApplication = (id: string): Promise<MentorApplicationResponse> =>
  apiClient.put<MentorApplicationResponse>(`${BASE}/${id}/approve`).then((r) => r.data)

/** PUT /mentor-application/{id}/reject — Reject application with reason */
export const rejectApplication = (
  id: string,
  data: MentorApplicationRejectRequest,
): Promise<MentorApplicationResponse> =>
  apiClient.put<MentorApplicationResponse>(`${BASE}/${id}/reject`, data).then((r) => r.data)

/** PUT /mentor-application/{id}/permanently-reject — Permanently reject */
export const permanentlyRejectApplication = (
  id: string,
  data: MentorApplicationRejectRequest,
): Promise<MentorApplicationResponse> =>
  apiClient
    .put<MentorApplicationResponse>(`${BASE}/${id}/permanently-reject`, data)
    .then((r) => r.data)

/** PUT /mentor-application/{userId}/revoke — Revoke mentor status */
export const revokeMentor = (userId: string): Promise<{ message: string }> =>
  apiClient.put<{ message: string }>(`${BASE}/${userId}/revoke`).then((r) => r.data)

