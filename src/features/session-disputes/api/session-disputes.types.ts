/**
 * ─── SESSION DISPUTES TYPES ───────────────────────────────────────────────────
 *
 * TypeScript interfaces mirroring backend DTOs for
 * SessionDisputeController (/api/v1/admin/session-disputes).
 */

// ─── Enums ────────────────────────────────────────────────────────────────────

export const DISPUTE_STATUS = {
  OPEN: "OPEN",
  UNDER_REVIEW: "UNDER_REVIEW",
  RESOLVED_COMPLETED: "RESOLVED_COMPLETED",
  RESOLVED_NO_SHOW_USER: "RESOLVED_NO_SHOW_USER",
  RESOLVED_NO_SHOW_MENTOR: "RESOLVED_NO_SHOW_MENTOR",
} as const

export type DisputeStatus = (typeof DISPUTE_STATUS)[keyof typeof DISPUTE_STATUS]

export const DISPUTE_STATUS_OPTIONS: { label: string; value: DisputeStatus }[] = [
  { label: "Open", value: "OPEN" },
  { label: "Under Review", value: "UNDER_REVIEW" },
  { label: "Resolved — Completed", value: "RESOLVED_COMPLETED" },
  { label: "Resolved — No Show (User)", value: "RESOLVED_NO_SHOW_USER" },
  { label: "Resolved — No Show (Mentor)", value: "RESOLVED_NO_SHOW_MENTOR" },
]

export const PARTICIPANT_ROLE = {
  USER: "USER",
  MENTOR: "MENTOR",
} as const

export type ParticipantRole = (typeof PARTICIPANT_ROLE)[keyof typeof PARTICIPANT_ROLE]

// ─── Dispute resolution options sent to backend ───────────────────────────────

export const DISPUTE_RESOLUTION = {
  MARK_COMPLETED: "MARK_COMPLETED",
  MARK_NO_SHOW_USER: "MARK_NO_SHOW_USER",
  MARK_NO_SHOW_MENTOR: "MARK_NO_SHOW_MENTOR",
} as const

export type DisputeResolution = (typeof DISPUTE_RESOLUTION)[keyof typeof DISPUTE_RESOLUTION]

export const DISPUTE_RESOLUTION_OPTIONS: { label: string; value: DisputeResolution; description: string }[] = [
  {
    label: "Mark as Completed",
    value: "MARK_COMPLETED",
    description: "Both parties attended; mark booking as Completed.",
  },
  {
    label: "Mark User as No Show",
    value: "MARK_NO_SHOW_USER",
    description: "User did not attend the session.",
  },
  {
    label: "Mark Mentor as No Show",
    value: "MARK_NO_SHOW_MENTOR",
    description: "Mentor did not attend the session.",
  },
]

// ─── Response DTOs ─────────────────────────────────────────────────────────────

export interface SessionDisputeResponse {
  disputeId: string
  sessionId: string
  bookingId: string
  bookingType: "MOCK_INTERVIEW" | "HOURLY_SESSION"
  disputeStatus: DisputeStatus
  raisedByRole: ParticipantRole
  userResponded: boolean
  mentorResponded: boolean
  adminNote: string | null
  resolvedAt: string | null
  resolvedByUserId: string | null
  createdAt: string
  updatedAt: string
}

// ─── Request DTOs ─────────────────────────────────────────────────────────────

export interface DisputeResolveRequest {
  resolution: DisputeResolution
  adminNote?: string
}
