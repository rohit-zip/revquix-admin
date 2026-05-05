/**
 * ─── NOTIFICATION TYPES ───────────────────────────────────────────────────────
 *
 * TypeScript interfaces mirroring backend DTOs for
 * NotificationController endpoints.
 */

// ─── Enums ────────────────────────────────────────────────────────────────────

export const NOTIFICATION_TYPE = {
  MENTOR_APPLICATION_SUBMITTED: "MENTOR_APPLICATION_SUBMITTED",
  MENTOR_APPLICATION_APPROVED: "MENTOR_APPLICATION_APPROVED",
  MENTOR_APPLICATION_REJECTED: "MENTOR_APPLICATION_REJECTED",
  MENTOR_APPLICATION_PERMANENTLY_REJECTED: "MENTOR_APPLICATION_PERMANENTLY_REJECTED",
  BOOKING_CONFIRMED: "BOOKING_CONFIRMED",
  BOOKING_CANCELLED: "BOOKING_CANCELLED",
  SESSION_REMINDER: "SESSION_REMINDER",
  SESSION_CANCELLED: "SESSION_CANCELLED",
  PAYMENT_SUCCESSFUL: "PAYMENT_SUCCESSFUL",
  PAYMENT_REFUNDED: "PAYMENT_REFUNDED",
  MOCK_INTERVIEW_CONFIRMED: "MOCK_INTERVIEW_CONFIRMED",
  MOCK_INTERVIEW_CANCELLED: "MOCK_INTERVIEW_CANCELLED",
  HOURLY_SESSION_CONFIRMED: "HOURLY_SESSION_CONFIRMED",
  HOURLY_SESSION_CANCELLED: "HOURLY_SESSION_CANCELLED",
  SESSION_DISPUTE_RAISED: "SESSION_DISPUTE_RAISED",
  SESSION_DISPUTE_RESOLVED: "SESSION_DISPUTE_RESOLVED",
  PAYOUT_CYCLE_STARTED: "PAYOUT_CYCLE_STARTED",
  PAYOUT_PROCESSED: "PAYOUT_PROCESSED",
  MENTOR_REVOKED: "MENTOR_REVOKED",
  PLATFORM_ANNOUNCEMENT: "PLATFORM_ANNOUNCEMENT",
  CUSTOM: "CUSTOM",
} as const

export type NotificationType = (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE]

export const NOTIFICATION_TYPE_OPTIONS: { label: string; value: NotificationType }[] = [
  { label: "Custom / General", value: "CUSTOM" },
  { label: "Platform Announcement", value: "PLATFORM_ANNOUNCEMENT" },
  { label: "Mentor Application Submitted", value: "MENTOR_APPLICATION_SUBMITTED" },
  { label: "Mentor Application Approved", value: "MENTOR_APPLICATION_APPROVED" },
  { label: "Mentor Application Rejected", value: "MENTOR_APPLICATION_REJECTED" },
  { label: "Mentor Application Permanently Rejected", value: "MENTOR_APPLICATION_PERMANENTLY_REJECTED" },
  { label: "Mentor Status Revoked", value: "MENTOR_REVOKED" },
  { label: "Booking Confirmed", value: "BOOKING_CONFIRMED" },
  { label: "Booking Cancelled", value: "BOOKING_CANCELLED" },
  { label: "Session Reminder", value: "SESSION_REMINDER" },
  { label: "Session Cancelled", value: "SESSION_CANCELLED" },
  { label: "Payment Successful", value: "PAYMENT_SUCCESSFUL" },
  { label: "Payment Refunded", value: "PAYMENT_REFUNDED" },
  { label: "Mock Interview Confirmed", value: "MOCK_INTERVIEW_CONFIRMED" },
  { label: "Mock Interview Cancelled", value: "MOCK_INTERVIEW_CANCELLED" },
  { label: "Hourly Session Confirmed", value: "HOURLY_SESSION_CONFIRMED" },
  { label: "Hourly Session Cancelled", value: "HOURLY_SESSION_CANCELLED" },
  { label: "Session Dispute Raised", value: "SESSION_DISPUTE_RAISED" },
  { label: "Session Dispute Resolved", value: "SESSION_DISPUTE_RESOLVED" },
  { label: "Payout Cycle Started", value: "PAYOUT_CYCLE_STARTED" },
  { label: "Payout Processed", value: "PAYOUT_PROCESSED" },
]

export const NOTIFICATION_CATEGORY = {
  BOOKINGS: "BOOKINGS",
  PAYMENTS: "PAYMENTS",
  MOCK_INTERVIEWS: "MOCK_INTERVIEWS",
  HOURLY_SESSIONS: "HOURLY_SESSIONS",
  DISPUTES: "DISPUTES",
  MENTOR_APPLICATION: "MENTOR_APPLICATION",
  MENTOR_EARNINGS: "MENTOR_EARNINGS",
  MENTOR_STATUS: "MENTOR_STATUS",
  PLATFORM: "PLATFORM",
} as const

export type NotificationCategory = (typeof NOTIFICATION_CATEGORY)[keyof typeof NOTIFICATION_CATEGORY]

export const ROLE_OPTIONS: { label: string; value: string }[] = [
  { label: "All Users (Broadcast)", value: "" },
  { label: "Regular Users", value: "USER" },
  { label: "Business Mentors", value: "BUSINESS_MENTOR" },
  { label: "Professional Mentors", value: "PROFESSIONAL_MENTOR" },
]

// ─── Action Button ─────────────────────────────────────────────────────────────

export interface NotificationActionButton {
  label: string
  url: string
  variant?: "primary" | "secondary" | "danger"
}

// ─── Response ─────────────────────────────────────────────────────────────────

export interface NotificationResponse {
  notificationId: string
  /** Populated in admin endpoints; null in user-facing endpoints. */
  targetUserId: string | null
  /** Email of the target user — admin-only. */
  targetUserEmail: string | null
  /** Display name of the target user — admin-only. */
  targetUserName: string | null
  title: string
  message: string | null
  type: NotificationType
  category: NotificationCategory
  read: boolean
  email: boolean
  actionButtons: NotificationActionButton[] | null
  metadata: Record<string, unknown> | null
  expiresAt: string | null
  createdAt: string
  updatedAt: string
}

// ─── Paginated Response ────────────────────────────────────────────────────────

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
}

// ─── Unread Count ─────────────────────────────────────────────────────────────

export interface UnreadCountResponse {
  count: number
}

// ─── Admin: Send Notification Request ─────────────────────────────────────────

export interface SendNotificationRequest {
  targetUserId?: string | null
  targetRole?: string | null
  title: string
  message?: string | null
  type: NotificationType
  sendEmail: boolean
  actionButtons?: NotificationActionButton[] | null
  metadata?: Record<string, unknown> | null
  expiresAt?: string | null
}

// ─── SSE Event ────────────────────────────────────────────────────────────────

export interface SseNotificationEvent {
  notificationId: string
  title: string
  message: string | null
  type: NotificationType
  category: NotificationCategory
  createdAt: string
}

export interface SseUnreadCountEvent {
  count: number
}

export interface SseTicketResponse {
  ticket: string
  expiresInSeconds: number
  accessTokenExpiresAtEpochMs: number
  streamUrl: string
}
