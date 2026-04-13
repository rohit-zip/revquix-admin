/**
 * ──────────────────────────────────────────────────────────────────────────────
 * Booking API Types
 * ──────────────────────────────────────────────────────────────────────────────
 */

// ─── Request Types ────────────────────────────────────────────────────────────
export type BookingIntakeRequest = {
  fullName: string
  ccEmails: string
  category: "BUSINESS_STARTUP" | "HIRING_RECRUITMENT"
  businessServices?: string[]
  projectStage?: "IDEA" | "MVP" | "SCALING" | "ALREADY_RUNNING"
  budgetRange?: "BELOW_50K" | "BETWEEN_50K_2L" | "BETWEEN_2L_10L" | "ABOVE_10L"
  professionalLookingFor?: string[]
  experienceLevel?: string
  preferredDomain?: string
  hiringFor?: "FULL_TIME" | "FREELANCE" | "CONTRACT"
  rolesNeeded?: string[]
  hiringUrgency?: "IMMEDIATE" | "WITHIN_ONE_MONTH" | "EXPLORING"
}

// ─── Response Types ───────────────────────────────────────────────────────────

/** A single slot entry returned by the backend /available API (UTC instants). */
export type SlotEntry = {
  slotStartUtc: string   // ISO-8601 UTC instant, e.g. "2026-04-10T06:30:00Z"
  availableCount: number
}

/** Response from GET /bookings/available — flat list of UTC slot instants. */
export type AvailableSlotsResponse = {
  slots: SlotEntry[]
}

/** Frontend-derived grouping: slots grouped by local date for display. */
export type GroupedDateSlots = {
  date: string           // yyyy-MM-dd in viewer's local timezone
  slots: {
    time: string         // HH:mm in viewer's local timezone
    slotStartUtc: string // original UTC instant (needed for confirm API)
    availableCount: number
  }[]
}

export type BookingIntakeResponse = {
  intakeId: string
  message: string
}

export type ConfirmBookingRequest = {
  intakeId: string
  slotStartUtc: string  // ISO-8601 UTC instant, e.g. "2026-04-10T08:30:00Z"
}

export type BookingConfirmedResponse = {
  bookingId: string
  sessionId: string
  roomName: string
  meetingUrl: string
  scheduledAt: string   // ISO-8601 UTC instant
  durationMinutes: number
  mentorName: string
  mentorEmail: string
  message: string
}

// ─── Form State Types ────────────────────────────────────────────────────────
export type BookingFormState = {
  fullName: string
  email: string
  ccEmails: string[]
  category: "BUSINESS_STARTUP" | "HIRING_RECRUITMENT" | null
  // Business fields
  projectStage: "IDEA" | "MVP" | "SCALING" | "ALREADY_RUNNING" | null
  budgetRange: "BELOW_50K" | "BETWEEN_50K_2L" | "BETWEEN_2L_10L" | "ABOVE_10L" | null
  businessServices: string[]
  // Hiring fields
  hiringFor: "FULL_TIME" | "FREELANCE" | "CONTRACT" | null
  hiringUrgency: "IMMEDIATE" | "WITHIN_ONE_MONTH" | "EXPLORING" | null
  rolesNeeded: string[]
  // Additional
  description: string
}

export type FormStep = "category" | "services" | "slots"

