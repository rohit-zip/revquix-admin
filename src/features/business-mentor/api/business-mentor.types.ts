/**
 * ─── BUSINESS MENTOR TYPES ───────────────────────────────────────────────────
 *
 * TypeScript interfaces mirroring backend DTOs for
 * BusinessMentorController endpoints.
 */

import type { SpringPageResponse } from "@/features/admin/api/admin-access.types"

// Re-export for convenience
export type { SpringPageResponse }

// ─── Enums ────────────────────────────────────────────────────────────────────

export const BOOKING_STATUS = {
  CONFIRMED: "CONFIRMED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED_BY_USER: "CANCELLED_BY_USER",
  CANCELLED_BY_MENTOR: "CANCELLED_BY_MENTOR",
  NO_SHOW: "NO_SHOW",
} as const

export type BookingStatus = (typeof BOOKING_STATUS)[keyof typeof BOOKING_STATUS]

export const BOOKING_STATUS_OPTIONS: { label: string; value: BookingStatus }[] = [
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled by User", value: "CANCELLED_BY_USER" },
  { label: "Cancelled by Mentor", value: "CANCELLED_BY_MENTOR" },
  { label: "No Show", value: "NO_SHOW" },
]

export const BOOKING_CATEGORY = {
  BUSINESS_STARTUP: "BUSINESS_STARTUP",
  PROFESSIONAL_DEVELOPER: "PROFESSIONAL_DEVELOPER",
  HIRING_RECRUITMENT: "HIRING_RECRUITMENT",
} as const

export type BookingCategory = (typeof BOOKING_CATEGORY)[keyof typeof BOOKING_CATEGORY]

// ─── Requests ─────────────────────────────────────────────────────────────────

export interface OpenSlotsRequest {
  startDate: string // yyyy-MM-dd
  endDate?: string  // yyyy-MM-dd (optional, defaults to startDate)
  startTime: string // HH:mm
  endTime: string   // HH:mm
  timezone: string  // IANA timezone e.g. "Asia/Kolkata"
}

export interface BulkCancelSlotsRequest {
  from: string // ISO-8601 UTC instant
  to: string   // ISO-8601 UTC instant
}

// ─── Responses ────────────────────────────────────────────────────────────────

export interface MentorSlotResponse {
  slotId: string
  mentorId: string
  mentorName: string
  slotStartUtc: string
  mentorTimezone: string
  durationMinutes: number
  isBooked: boolean
  isCancelled: boolean
}

export interface MentorSlotStatsResponse {
  totalOpened: number
  totalBooked: number
  totalAvailable: number
  totalCancelled: number
}

export interface BookingResponse {
  bookingId: string
  sessionId: string
  status: BookingStatus
  category: BookingCategory

  // User info
  userName: string
  userEmail: string

  // Mentor info
  mentorName: string
  mentorEmail: string

  // Scheduling
  scheduledAt: string
  durationMinutes: number
  meetingTimezone: string

  // Meeting details
  roomName: string | null
  meetingUrl: string | null

  // Cancellation
  cancellationReason: string | null
  cancelledAt: string | null

  // Join window
  allowedJoinAt: string | null

  // Outcome
  meetingOutcome: string | null
  outcomeWrittenAt: string | null

  // Feedback
  hasFeedback: boolean

  // Audit
  createdAt: string
}

