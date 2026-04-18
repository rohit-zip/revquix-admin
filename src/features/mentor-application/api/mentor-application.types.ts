/**
 * ─── MENTOR APPLICATION TYPES ─────────────────────────────────────────────────
 *
 * TypeScript interfaces mirroring backend DTOs for
 * MentorApplicationController endpoints.
 */

// ─── Enums ────────────────────────────────────────────────────────────────────

export const MENTOR_APPLICATION_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  PERMANENTLY_REJECTED: "PERMANENTLY_REJECTED",
  WITHDRAWN: "WITHDRAWN",
} as const

export type MentorApplicationStatus =
  (typeof MENTOR_APPLICATION_STATUS)[keyof typeof MENTOR_APPLICATION_STATUS]

export const APPLICATION_STATUS_OPTIONS: { label: string; value: MentorApplicationStatus }[] = [
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Permanently Rejected", value: "PERMANENTLY_REJECTED" },
  { label: "Withdrawn", value: "WITHDRAWN" },
]

// ─── Requests ─────────────────────────────────────────────────────────────────

export interface MentorApplicationRequest {
  headline: string
  bio: string
  linkedinUrl: string
  yearsOfExperience: number
  currentCompany?: string
  currentRole?: string
  categoryIds: string[]
  skillIds: string[]
  portfolioUrl?: string
  whyMentor: string
}

export interface MentorApplicationRejectRequest {
  reason: string
}

// ─── Responses ────────────────────────────────────────────────────────────────

export interface MentorApplicationResponse {
  applicationId: string
  userId: string
  userName: string
  userEmail: string
  headline: string
  bio: string
  linkedinUrl: string
  portfolioUrl: string | null
  yearsOfExperience: number
  currentCompany: string | null
  currentRole: string | null
  whyMentor: string
  categoryIds: string[]
  skillIds: string[]
  resumeUrl: string | null
  status: MentorApplicationStatus
  rejectionReason: string | null
  reviewedByName: string | null
  reviewedAt: string | null
  attemptNumber: number
  createdAt: string
  /** Proposed mock-interview price in INR paise. Null for legacy applications. */
  proposedPriceInrPaise: number | null
  /** Proposed mock-interview price in USD cents. Null for legacy applications. */
  proposedPriceUsdCents: number | null
}

// ─── Limits ───────────────────────────────────────────────────────────────────

/**
 * Limits returned by GET /mentor-application/category-skill-limits.
 * Includes both category/skill caps and price bounds for the application.
 */
export interface ApplicationLimits {
  maxCategories: number
  maxSkills: number
}

