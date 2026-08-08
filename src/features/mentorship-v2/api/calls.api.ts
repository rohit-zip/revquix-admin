/**
 * ─── MENTORSHIP V2 (PHASE 4) CALL LIFECYCLE API ──────────────────────────────
 *
 * Backs AdminMentorshipV2CallController. Reads need `PERM_VIEW_MENTORSHIP_V2_INTERNALS`;
 * running the sweep, force-completing a booking, and moderating a review all need
 * `PERM_MANAGE_MENTORSHIP_V2_COMMERCE` — the same read/write split every earlier phase's
 * admin panel uses, because completing a booking releases a payout and hiding a review
 * changes a public rating.
 */

import { apiClient } from "@/lib/axios"
import type {
  AdminCallSnapshot,
  AdminMessageThread,
  BookingReviewRow,
  BookingSessionDiagnostics,
  ForceSubmitFeedbackRequest,
  LifecycleSweepReport,
} from "./calls.types"

const BASE = "/admin/mentorship-v2/calls"

export const getCallSnapshot = (): Promise<AdminCallSnapshot> =>
  apiClient.get<AdminCallSnapshot>(`${BASE}/snapshot`).then((r) => r.data)

export const inspectBookingSession = (bookingId: string): Promise<BookingSessionDiagnostics> =>
  apiClient.get<BookingSessionDiagnostics>(`${BASE}/bookings/${bookingId}`).then((r) => r.data)

export const runLifecycleSweep = (): Promise<LifecycleSweepReport> =>
  apiClient.post<LifecycleSweepReport>(`${BASE}/sweeps/lifecycle`).then((r) => r.data)

export const forceCompleteBooking = (
  bookingId: string,
  reason?: string,
): Promise<BookingSessionDiagnostics> =>
  apiClient
    .post<BookingSessionDiagnostics>(`${BASE}/bookings/${bookingId}/force-complete`, null, {
      params: { reason },
    })
    .then((r) => r.data)

export const moderateReview = (
  reviewId: string,
  hidden: boolean,
  reason?: string,
): Promise<BookingReviewRow> =>
  apiClient
    .post<BookingReviewRow>(`${BASE}/reviews/${reviewId}/moderate`, null, {
      params: { hidden, reason },
    })
    .then((r) => r.data)

/**
 * Phase 5: files the mentor's structured feedback report on their behalf. Refused server-side
 * on anything not already `DISPUTED` from a feedback breach — see
 * `BookingFeedbackService.adminSubmit`'s Javadoc for why.
 */
export const forceSubmitFeedback = (
  bookingId: string,
  payload: ForceSubmitFeedbackRequest,
): Promise<BookingSessionDiagnostics> =>
  apiClient
    .post<BookingSessionDiagnostics>(`${BASE}/bookings/${bookingId}/feedback/force-submit`, payload)
    .then((r) => r.data)

/**
 * The private buyer/mentor conversation for a booking, read-only.
 *
 * ⚠ Every call writes an `AdminActionType.MESSAGE_THREAD_VIEWED` audit row. This console audits
 * changes rather than reads, so that is the exception — and it is deliberate: this is a private
 * conversation between two people who have no reason to expect staff are reading it, and it
 * frequently contains the customer's resume. Open it to answer a question, not to browse.
 */
export const inspectBookingMessages = (bookingId: string): Promise<AdminMessageThread> =>
  apiClient.get<AdminMessageThread>(`${BASE}/bookings/${bookingId}/messages`).then((r) => r.data)
