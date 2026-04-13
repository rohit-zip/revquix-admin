/**
 * ─── BOOKING SEARCH API ───────────────────────────────────────────────────────
 */

import { apiClient } from "@/lib/axios"
import type {
  GenericFilterRequest,
  GenericFilterResponse,
  PaginationParams,
} from "@/core/filters/filter.types"
import type {
  CallCreditsResponse,
  CancelBookingRequest,
  FeedbackRequest,
  FeedbackResponse,
  MyBookingResponse,
} from "./booking-search.types"

export const searchMyBookings = (
  request: GenericFilterRequest,
  params: PaginationParams,
): Promise<GenericFilterResponse<MyBookingResponse>> =>
  apiClient
    .post<GenericFilterResponse<MyBookingResponse>>(
      "/bookings/search",
      request,
      { params: { page: params.page, size: params.size } },
    )
    .then((r) => r.data)

export const getBookingById = (bookingId: string): Promise<MyBookingResponse> =>
  apiClient.get<MyBookingResponse>(`/bookings/${bookingId}`).then((r) => r.data)

export const cancelBooking = (
  bookingId: string,
  request?: CancelBookingRequest,
): Promise<void> =>
  apiClient.delete(`/bookings/${bookingId}`, { data: request }).then(() => undefined)

/**
 * GET /api/v1/bookings/my/active
 * Returns the user's active booking (CONFIRMED or IN_PROGRESS), or null if none.
 */
export const getActiveBooking = (): Promise<MyBookingResponse | null> =>
  apiClient
    .get<MyBookingResponse>("/bookings/my/active")
    .then((r) => r.data)
    .catch((err) => {
      if (err?.response?.status === 204) return null
      throw err
    })

/**
 * GET /api/v1/bookings/my/credits
 * Returns the user's free call credit balance.
 */
export const getCallCredits = (): Promise<CallCreditsResponse> =>
  apiClient.get<CallCreditsResponse>("/bookings/my/credits").then((r) => r.data)

/**
 * POST /api/v1/meetings/{sessionId}/feedback
 * Submits post-meeting feedback (rating + comment). One-time only.
 */
export const submitFeedback = (
  sessionId: string,
  request: FeedbackRequest,
): Promise<FeedbackResponse> =>
  apiClient
    .post<FeedbackResponse>(`/meetings/${sessionId}/feedback`, request)
    .then((r) => r.data)

/**
 * GET /api/v1/meetings/{sessionId}/feedback
 * Returns the feedback submitted for a meeting, or 404 if not yet submitted.
 */
export const getFeedback = (sessionId: string): Promise<FeedbackResponse> =>
  apiClient.get<FeedbackResponse>(`/meetings/${sessionId}/feedback`).then((r) => r.data)

/**
 * PUT /api/v1/meetings/{sessionId}/outcome
 * Writes / updates the meeting outcome (MOM). Requires mentor or admin access.
 */
export const saveMeetingOutcome = (
  sessionId: string,
  outcome: string,
): Promise<void> =>
  apiClient.put(`/meetings/${sessionId}/outcome`, { outcome }).then(() => undefined)

