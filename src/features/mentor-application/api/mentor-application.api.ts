/**
 * ─── MENTOR APPLICATION API (admin console) ──────────────────────────────────
 *
 * API calls for the ADMIN half of MentorApplicationController — search, read,
 * approve, reject, permanently reject, revoke. All paths are relative to the
 * apiClient baseURL (/api/v1).
 *
 * The applicant-side endpoints (`/apply`, `/my`, `/my/history`, `/my/withdraw`,
 * `/category-skill-limits`) deliberately do NOT live here. Applying is done in
 * revquix-web's apply wizard; the admin console reviews applications, it does not
 * submit them. The stale copies of those calls were removed along with the
 * unrouted applicant form they served, which still demanded a resume and a
 * 100-character bio after those requirements were dropped.
 */

import { apiClient } from "@/lib/axios"
import type { GenericFilterRequest, GenericFilterResponse } from "@/core/filters/filter.types"
import type {
  MentorApplicationRejectRequest,
  MentorApplicationResponse,
} from "./mentor-application.types"

const BASE = "/mentor-application"

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

