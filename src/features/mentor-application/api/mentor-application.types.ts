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

// `MentorApplicationRequest` is deliberately absent. Submitting an application is
// revquix-web's job (its wizard sends `{ whyMentor }` and nothing else); the admin
// console only reviews. The old copy here still declared `bio`, `yearsOfExperience`,
// `categoryIds` and `skillIds` as required, none of which the backend accepts or
// requires any more, so keeping it around was a contract that lied.

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
  /**
   * Profile bio snapshot. Nullable: a bio is not an application requirement, so an
   * applicant can legitimately have submitted without one.
   */
  bio: string | null
  linkedinUrl: string
  portfolioUrl: string | null
  /** Total years of experience snapshot. Nullable — not an application requirement. */
  yearsOfExperience: number | null
  currentCompany: string | null
  currentRole: string | null
  whyMentor: string
  categoryIds: string[]
  skillIds: string[]
  /**
   * Presigned resume URL. Nullable: the resume upload was removed from the
   * application flow, so this is only set when the applicant already had one on
   * their profile.
   */
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

// The `ApplicationLimits` type was removed with the applicant-side API surface:
// GET /mentor-application/category-skill-limits exists to help someone building an
// application, which is not something the admin console does.

