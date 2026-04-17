/**
 * ─── ADMIN RESUME REVIEW API ────────────────────────────────────────────────
 */

import { apiClient } from "@/lib/axios"
import type { GenericFilterRequest, GenericFilterResponse } from "@/core/filters/filter.types"
import type {
  ResumeReviewBookingResponse,
  ResumeReviewPlanResponse,
  ResumeReviewReportResponse,
  ResumeReviewUploadResponse,
  ResumeReviewStatusLogResponse,
  ResumeReviewAnalyticsResponse,
  SubmitResumeReportRequest,
  CancelResumeReviewRequest,
  ReassignResumeReviewRequest,
} from "./resume-review.types"

const ADMIN_BASE = "/admin/resume-review"
const USER_BASE = "/resume-review"

// ─── Admin Search ─────────────────────────────────────────────────────────────

export const searchAllBookings = (
  request: GenericFilterRequest,
  params: { page: number; size: number },
): Promise<GenericFilterResponse<ResumeReviewBookingResponse>> =>
  apiClient
    .post<GenericFilterResponse<ResumeReviewBookingResponse>>(
      `${ADMIN_BASE}/search?page=${params.page}&size=${params.size}`,
      request,
    )
    .then((r) => r.data)

// ─── Admin Actions ────────────────────────────────────────────────────────────

export const acceptReview = (bookingId: string): Promise<ResumeReviewBookingResponse> =>
  apiClient.put<ResumeReviewBookingResponse>(`${ADMIN_BASE}/${bookingId}/accept`).then((r) => r.data)

export const reassignReview = (
  bookingId: string,
  data: ReassignResumeReviewRequest,
): Promise<ResumeReviewBookingResponse> =>
  apiClient.put<ResumeReviewBookingResponse>(`${ADMIN_BASE}/${bookingId}/reassign`, data).then((r) => r.data)

export const submitReport = (
  bookingId: string,
  data: SubmitResumeReportRequest,
): Promise<ResumeReviewReportResponse> =>
  apiClient.post<ResumeReviewReportResponse>(`${ADMIN_BASE}/${bookingId}/report`, data).then((r) => r.data)

export const cancelBookingAdmin = (
  bookingId: string,
  data?: CancelResumeReviewRequest,
): Promise<ResumeReviewBookingResponse> =>
  apiClient.put<ResumeReviewBookingResponse>(`${ADMIN_BASE}/${bookingId}/cancel`, data ?? {}).then((r) => r.data)

// ─── Plans (Admin) ────────────────────────────────────────────────────────────

export const getAllPlans = (): Promise<ResumeReviewPlanResponse[]> =>
  apiClient.get<ResumeReviewPlanResponse[]>(`${ADMIN_BASE}/plans`).then((r) => r.data)

// ─── Analytics ────────────────────────────────────────────────────────────────

export const getAnalytics = (): Promise<ResumeReviewAnalyticsResponse> =>
  apiClient.get<ResumeReviewAnalyticsResponse>(`${ADMIN_BASE}/analytics`).then((r) => r.data)

// ─── Booking Detail (uses user endpoints) ─────────────────────────────────────

export const getBooking = (bookingId: string): Promise<ResumeReviewBookingResponse> =>
  apiClient.get<ResumeReviewBookingResponse>(`${USER_BASE}/${bookingId}`).then((r) => r.data)

export const getUploads = (bookingId: string): Promise<ResumeReviewUploadResponse[]> =>
  apiClient.get<ResumeReviewUploadResponse[]>(`${USER_BASE}/${bookingId}/uploads`).then((r) => r.data)

export const getReport = (bookingId: string): Promise<ResumeReviewReportResponse> =>
  apiClient.get<ResumeReviewReportResponse>(`${USER_BASE}/${bookingId}/report`).then((r) => r.data)

export const getStatusLog = (bookingId: string): Promise<ResumeReviewStatusLogResponse[]> =>
  apiClient.get<ResumeReviewStatusLogResponse[]>(`${USER_BASE}/${bookingId}/status-log`).then((r) => r.data)

