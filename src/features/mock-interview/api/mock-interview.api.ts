/**
 * ─── MOCK INTERVIEW API ──────────────────────────────────────────────────────
 *
 * API calls for MockInterviewBookingController endpoints.
 */

import { apiClient } from "@/lib/axios"
import type { GenericFilterRequest, GenericFilterResponse } from "@/core/filters/filter.types"
import type {
  CancellationPreviewResponse,
  MockInterviewBookingResponse,
  MockInterviewConfirmRequest,
  MockInterviewFeedbackRequest,
  MockInterviewFeedbackResponse,
  MockInterviewIntakeRequest,
  MockInterviewReserveRequest,
  RefundPolicyResponse,
  ReserveSlotResponse,
} from "./mock-interview.types"

const BASE = "/mock-interview"

// ─── Intake ───────────────────────────────────────────────────────────────────

/** POST /mock-interview/intake — Submit intake form */
export const submitIntake = (
  data: MockInterviewIntakeRequest,
): Promise<{ intakeId: string; message: string }> =>
  apiClient
    .post<{ intakeId: string; message: string }>(`${BASE}/intake`, data)
    .then((r) => r.data)

/** POST /mock-interview/intake/{intakeId}/resume — Upload resume */
export const uploadIntakeResume = (
  intakeId: string,
  file: File,
): Promise<{ message: string }> => {
  const fd = new FormData()
  fd.append("file", file)
  return apiClient
    .post<{ message: string }>(`${BASE}/intake/${intakeId}/resume`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data)
}

// ─── Reserve + Pay ────────────────────────────────────────────────────────────

/** POST /mock-interview/reserve — Reserve slot + create payment order */
export const reserveSlot = (
  data: MockInterviewReserveRequest,
): Promise<ReserveSlotResponse> =>
  apiClient.post<ReserveSlotResponse>(`${BASE}/reserve`, data).then((r) => r.data)

/** POST /mock-interview/confirm — Confirm payment (backup for webhook) */
export const confirmPayment = (
  data: MockInterviewConfirmRequest,
): Promise<MockInterviewBookingResponse> =>
  apiClient
    .post<MockInterviewBookingResponse>(`${BASE}/confirm`, data)
    .then((r) => r.data)

// ─── Booking Management ──────────────────────────────────────────────────────

/** GET /mock-interview/{bookingId} — Get booking details */
export const getBooking = (bookingId: string): Promise<MockInterviewBookingResponse> =>
  apiClient
    .get<MockInterviewBookingResponse>(`${BASE}/${bookingId}`)
    .then((r) => r.data)

/** PUT /mock-interview/{bookingId}/cancel — Cancel booking */
export const cancelBooking = (
  bookingId: string,
  reason?: string,
): Promise<MockInterviewBookingResponse> =>
  apiClient
    .put<MockInterviewBookingResponse>(`${BASE}/${bookingId}/cancel`, { reason })
    .then((r) => r.data)

/** POST /mock-interview/my/search — Search my bookings */
export const searchMyBookings = (
  request: GenericFilterRequest,
  params: { page: number; size: number },
): Promise<GenericFilterResponse<MockInterviewBookingResponse>> =>
  apiClient
    .post<GenericFilterResponse<MockInterviewBookingResponse>>(
      `${BASE}/my/search?page=${params.page}&size=${params.size}`,
      request,
    )
    .then((r) => r.data)

/** POST /mock-interview/mentor/search — Search bookings received as a mentor */
export const searchMentorBookings = (
  request: GenericFilterRequest,
  params: { page: number; size: number },
): Promise<GenericFilterResponse<MockInterviewBookingResponse>> =>
  apiClient
    .post<GenericFilterResponse<MockInterviewBookingResponse>>(
      `${BASE}/mentor/search?page=${params.page}&size=${params.size}`,
      request,
    )
    .then((r) => r.data)

/** POST /mock-interview/admin/search — Admin: search all */
export const searchAllBookings = (
  request: GenericFilterRequest,
  params: { page: number; size: number },
): Promise<GenericFilterResponse<MockInterviewBookingResponse>> =>
  apiClient
    .post<GenericFilterResponse<MockInterviewBookingResponse>>(
      `${BASE}/admin/search?page=${params.page}&size=${params.size}`,
      request,
    )
    .then((r) => r.data)

// ─── Refund Policy ────────────────────────────────────────────────────────────

/**
 * GET /mock-interview/refund-policy — Fetch the cancellation/refund policy.
 * Public endpoint — no auth required. Response is cached for 1 hour by the
 * server; clients should cache it with a long staleTime as well.
 */
export const getRefundPolicy = (): Promise<RefundPolicyResponse> =>
  apiClient
    .get<RefundPolicyResponse>(`${BASE}/refund-policy`)
    .then((r) => r.data)

/**
 * GET /mock-interview/{bookingId}/cancellation-preview — Real-time refund estimate.
 * Returns the refund percentage and amount that would apply if the user cancelled
 * right now.  Re-fetch whenever the cancel dialog is opened.
 */
export const getCancellationPreview = (bookingId: string): Promise<CancellationPreviewResponse> =>
  apiClient
    .get<CancellationPreviewResponse>(`${BASE}/${bookingId}/cancellation-preview`)
    .then((r) => r.data)

// ─── Mentor Feedback ──────────────────────────────────────────────────────────

/** POST /mock-interview/{bookingId}/mentor-feedback — Submit detailed mentor feedback */
export const submitMockFeedback = (
  bookingId: string,
  data: MockInterviewFeedbackRequest,
): Promise<MockInterviewFeedbackResponse> =>
  apiClient
    .post<MockInterviewFeedbackResponse>(`${BASE}/${bookingId}/mentor-feedback`, data)
    .then((r) => r.data)

/** GET /mock-interview/{bookingId}/mentor-feedback — Get feedback for a booking */
export const getMockFeedback = (
  bookingId: string,
): Promise<MockInterviewFeedbackResponse> =>
  apiClient
    .get<MockInterviewFeedbackResponse>(`${BASE}/${bookingId}/mentor-feedback`)
    .then((r) => r.data)

/** GET /mock-interview/{bookingId}/mentor-feedback/exists — Check if feedback exists */
export const checkFeedbackExists = (
  bookingId: string,
): Promise<{ exists: boolean }> =>
  apiClient
    .get<{ exists: boolean }>(`${BASE}/${bookingId}/mentor-feedback/exists`)
    .then((r) => r.data)


