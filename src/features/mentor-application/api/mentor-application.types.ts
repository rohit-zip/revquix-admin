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

// ─── Shared sub-types ────────────────────────────────────────────────────────

export interface CompanyDto {
  companyId: string
  name: string
  domain: string | null
  logoUrl: string | null
  isVerified: boolean
}

export interface ExperienceResponse {
  experienceId: string
  role: string
  company: CompanyDto | null
  startYear: number
  startMonth: number
  endYear: number | null
  endMonth: number | null
  isCurrent: boolean
  description: string | null
  location: string | null
  skills: { skillId: string; name: string }[]
  createdAt: string
  updatedAt: string
}

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
  /** Proposed hourly session price in INR paise. Null if not provided. */
  proposedHourlyPriceInrPaise: number | null
  /** Proposed hourly session price in USD cents. Null if not provided. */
  proposedHourlyPriceUsdCents: number | null
  /** Work experience entries from the applicant's profile at time of review. */
  experiences: ExperienceResponse[]
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

