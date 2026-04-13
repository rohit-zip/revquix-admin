/**
 * ─── BOOKING SEARCH TYPES ─────────────────────────────────────────────────────
 */

export type BookingStatus =
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED_BY_USER"
  | "CANCELLED_BY_MENTOR"
  | "NO_SHOW"

export type BookingCategory =
  | "BUSINESS_STARTUP"
  | "PROFESSIONAL_DEVELOPER"
  | "HIRING_RECRUITMENT"

export interface MyBookingResponse {
  bookingId: string
  sessionId: string | null
  status: BookingStatus
  category: BookingCategory | null
  userName: string
  userEmail: string
  mentorName: string
  mentorEmail: string
  scheduledAt: string | null
  durationMinutes: number
  meetingTimezone: string | null
  /** UTC instant when the join window opens (scheduledAt - 30 min) */
  allowedJoinAt: string | null
  roomName: string | null
  meetingUrl: string | null
  cancellationReason: string | null
  cancelledAt: string | null
  meetingOutcome: string | null
  outcomeWrittenAt: string | null
  hasFeedback: boolean
  createdAt: string
}

export interface CancelBookingRequest {
  reason?: string
}

export interface CallCreditsResponse {
  used: number
  limit: number
  remaining: number
}

export interface FeedbackRequest {
  rating: number
  comment?: string
}

export interface FeedbackResponse {
  feedbackId: string
  sessionId: string
  bookingId: string
  userName: string
  userEmail: string
  rating: number
  comment: string | null
  submittedAt: string
}
