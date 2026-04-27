/**
 * ─── MOCK INTERVIEW TYPES ─────────────────────────────────────────────────────
 *
 * TypeScript interfaces mirroring backend DTOs for
 * MockInterviewBookingController & MentorDiscoveryController.
 */

import type { CurrencyCode } from "@/features/professional-mentor/api/professional-mentor.types"

// ─── Enums ────────────────────────────────────────────────────────────────────

export const MOCK_INTERVIEW_BOOKING_STATUS = {
  PENDING_PAYMENT: "PENDING_PAYMENT",
  CONFIRMED: "CONFIRMED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED_BY_USER: "CANCELLED_BY_USER",
  CANCELLED_BY_MENTOR: "CANCELLED_BY_MENTOR",
  CANCELLED_BY_SYSTEM: "CANCELLED_BY_SYSTEM",
  NO_SHOW_USER: "NO_SHOW_USER",
  NO_SHOW_MENTOR: "NO_SHOW_MENTOR",
  PAYMENT_FAILED: "PAYMENT_FAILED",
  EXPIRED: "EXPIRED",
  PENDING_CONFIRMATION: "PENDING_CONFIRMATION",
  DISPUTED: "DISPUTED",
} as const

export type MockInterviewBookingStatus =
  (typeof MOCK_INTERVIEW_BOOKING_STATUS)[keyof typeof MOCK_INTERVIEW_BOOKING_STATUS]

export const BOOKING_STATUS_OPTIONS: { label: string; value: MockInterviewBookingStatus }[] = [
  { label: "Pending Payment", value: "PENDING_PAYMENT" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled by User", value: "CANCELLED_BY_USER" },
  { label: "Cancelled by Mentor", value: "CANCELLED_BY_MENTOR" },
  { label: "Cancelled (System)", value: "CANCELLED_BY_SYSTEM" },
  { label: "No Show (User)", value: "NO_SHOW_USER" },
  { label: "No Show (Mentor)", value: "NO_SHOW_MENTOR" },
  { label: "Payment Failed", value: "PAYMENT_FAILED" },
  { label: "Expired", value: "EXPIRED" },
  { label: "Awaiting Confirmation", value: "PENDING_CONFIRMATION" },
  { label: "Under Dispute", value: "DISPUTED" },
]

export const EXPERIENCE_LEVEL = {
  FRESHER: "FRESHER",
  JUNIOR: "JUNIOR",
  MID: "MID",
  SENIOR: "SENIOR",
  LEAD: "LEAD",
  PRINCIPAL: "PRINCIPAL",
} as const
export type ExperienceLevel = (typeof EXPERIENCE_LEVEL)[keyof typeof EXPERIENCE_LEVEL]

export const INTERVIEW_FOCUS_AREA = {
  DSA: "DSA",
  SYSTEM_DESIGN: "SYSTEM_DESIGN",
  BEHAVIORAL: "BEHAVIORAL",
  TECHNICAL_DEEP_DIVE: "TECHNICAL_DEEP_DIVE",
  CODING_ROUND: "CODING_ROUND",
  HR_ROUND: "HR_ROUND",
  CASE_STUDY: "CASE_STUDY",
  MACHINE_CODING: "MACHINE_CODING",
  LOW_LEVEL_DESIGN: "LOW_LEVEL_DESIGN",
  HIGH_LEVEL_DESIGN: "HIGH_LEVEL_DESIGN",
  DOMAIN_SPECIFIC: "DOMAIN_SPECIFIC",
} as const
export type InterviewFocusArea = (typeof INTERVIEW_FOCUS_AREA)[keyof typeof INTERVIEW_FOCUS_AREA]

export const FOCUS_AREA_OPTIONS: { label: string; value: InterviewFocusArea }[] = [
  { label: "DSA / Algorithms", value: "DSA" },
  { label: "System Design", value: "SYSTEM_DESIGN" },
  { label: "Behavioral", value: "BEHAVIORAL" },
  { label: "Technical Deep Dive", value: "TECHNICAL_DEEP_DIVE" },
  { label: "Coding Round", value: "CODING_ROUND" },
  { label: "HR Round", value: "HR_ROUND" },
  { label: "Case Study", value: "CASE_STUDY" },
  { label: "Machine Coding", value: "MACHINE_CODING" },
  { label: "Low Level Design", value: "LOW_LEVEL_DESIGN" },
  { label: "High Level Design", value: "HIGH_LEVEL_DESIGN" },
  { label: "Domain Specific", value: "DOMAIN_SPECIFIC" },
]

export const EXPERIENCE_LEVEL_OPTIONS: { label: string; value: ExperienceLevel }[] = [
  { label: "Fresher (0-1 Yrs)", value: "FRESHER" },
  { label: "Junior (1-3 Yrs)", value: "JUNIOR" },
  { label: "Mid-Level (3-5 Yrs)", value: "MID" },
  { label: "Senior (5-8 Yrs)", value: "SENIOR" },
  { label: "Lead (8-12 Yrs)", value: "LEAD" },
  { label: "Principal (12+ Yrs)", value: "PRINCIPAL" },
]

// ─── Refund Policy ────────────────────────────────────────────────────────────

export interface RefundTierResponse {
  /** Minimum hours before the session start for this tier to apply */
  hoursBefore: number
  /** Refund percentage (0–100) when this tier applies */
  refundPercentage: number
  /** Human-readable label, e.g. "24+ hours before: 90% refund" */
  label: string
}

export interface RefundPolicyResponse {
  /** Sorted tiers (most generous first) */
  tiers: RefundTierResponse[]
  /** Plain-text summary for display */
  summary: string
}

export interface CancellationPreviewResponse {
  bookingId: string
  /** Hours remaining until the session starts (negative if past) */
  hoursUntilSlot: number
  /** Refund percentage that will be applied (0–100) */
  refundPercentage: number
  /** Refund amount in minor units (paise / cents) */
  refundAmountMinor: number
  /** Formatted refund amount for display, e.g. "₹900.00" */
  refundAmountDisplay: string
  /** Amount paid in minor units */
  paidAmountMinor: number
  /** Formatted paid amount, e.g. "₹1,000.00" */
  paidAmountDisplay: string
  currency: string
  /** Human-readable tier label that matched */
  applicableTierLabel: string
  /** True when at least some refund will be issued */
  refundEligible: boolean
  /** True when the session has already started — no refund possible */
  sessionAlreadyStarted: boolean
}

// ─── Requests ─────────────────────────────────────────────────────────────────

export interface MockInterviewIntakeRequest {
  mentorProfileId: string
  fullName: string
  description: string
  targetCompany?: string
  targetRole?: string
  experienceLevel?: ExperienceLevel
  focusAreas?: string[]
  additionalNotes?: string
  linkedinUrl?: string
  githubUrl?: string
}

export interface MockInterviewReserveRequest {
  intakeId: string
  slotId: string
  couponCode?: string
}

export interface MockInterviewConfirmRequest {
  razorpayOrderId: string
  razorpayPaymentId: string
  razorpaySignature: string
}

// ─── Responses ────────────────────────────────────────────────────────────────

export interface MockInterviewBookingResponse {
  bookingId: string
  intakeId: string
  userId: string
  userName: string
  mentorUserId: string
  mentorName: string
  mentorProfileId: string
  status: MockInterviewBookingStatus
  currency: CurrencyCode
  originalAmountMinor: number
  discountAmountMinor: number
  finalAmountMinor: number
  couponCode: string | null
  paymentOrderId: string | null
  razorpayOrderId: string | null
  razorpayPaymentId: string | null
  paymentStatus: string | null
  razorpayRefundId: string | null
  refundAmountMinor: number | null
  refundedAt: string | null
  cancellationReason: string | null
  cancelledAt: string | null
  slotStartUtc: string
  durationMinutes: number
  sessionId: string | null
  /** How the meeting link was generated: GOOGLE_MEET or MANUAL_GOOGLE_MEET */
  meetingProvider: "GOOGLE_MEET" | "MANUAL_GOOGLE_MEET" | null
  /** True when the mentor hasn't set the meeting link yet (manual mode) */
  meetingUrlPending: boolean
  /** UTC instant when the join window opens for participants (slotStartUtc - 30 min) */
  allowedJoinAt: string | null
  createdAt: string
  // ── Intake details (user's submission data) ─────────────────────────
  description: string | null
  targetCompany: string | null
  targetRole: string | null
  experienceLevel: ExperienceLevel | null
  focusAreas: string[] | null
  additionalNotes: string | null
  linkedinUrl: string | null
  githubUrl: string | null
  resumeUrl: string | null
  // ── Feedback status ─────────────────────────────────────────────────
  feedbackSubmitted: boolean | null
}

export interface ReserveSlotResponse {
  bookingId: string
  paymentOrderId: string
  razorpayOrderId: string
  razorpayKeyId: string
  amountMinor: number
  currency: CurrencyCode
  originalAmountDisplay: string
  discountAmountDisplay: string
  finalAmountDisplay: string
  couponCode: string | null
}

// ─── Mock Interview Feedback ──────────────────────────────────────────────────

export const QUICK_TAGS = {
  NEEDS_PRACTICE: "NEEDS_PRACTICE",
  ALMOST_READY: "ALMOST_READY",
  JOB_READY: "JOB_READY",
  LACKS_FUNDAMENTALS: "LACKS_FUNDAMENTALS",
  STRONG_COMMUNICATOR: "STRONG_COMMUNICATOR",
  GREAT_PROBLEM_SOLVER: "GREAT_PROBLEM_SOLVER",
  NEEDS_CONFIDENCE: "NEEDS_CONFIDENCE",
  HIGH_POTENTIAL: "HIGH_POTENTIAL",
} as const
export type QuickTag = (typeof QUICK_TAGS)[keyof typeof QUICK_TAGS]

export const QUICK_TAG_OPTIONS: { label: string; value: QuickTag; color: string }[] = [
  { label: "Needs Practice", value: "NEEDS_PRACTICE", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  { label: "Almost Ready", value: "ALMOST_READY", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  { label: "Job Ready", value: "JOB_READY", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  { label: "Lacks Fundamentals", value: "LACKS_FUNDAMENTALS", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  { label: "Strong Communicator", value: "STRONG_COMMUNICATOR", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { label: "Great Problem Solver", value: "GREAT_PROBLEM_SOLVER", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  { label: "Needs Confidence", value: "NEEDS_CONFIDENCE", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { label: "High Potential", value: "HIGH_POTENTIAL", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
]

export const CANDIDATE_LEVEL = {
  BEGINNER: "BEGINNER",
  INTERMEDIATE: "INTERMEDIATE",
  ADVANCED: "ADVANCED",
  JOB_READY: "JOB_READY",
} as const
export type CandidateLevel = (typeof CANDIDATE_LEVEL)[keyof typeof CANDIDATE_LEVEL]

export const CANDIDATE_LEVEL_OPTIONS: { label: string; value: CandidateLevel }[] = [
  { label: "Beginner", value: "BEGINNER" },
  { label: "Intermediate", value: "INTERMEDIATE" },
  { label: "Advanced", value: "ADVANCED" },
  { label: "Job Ready", value: "JOB_READY" },
]

export interface SectionFeedback {
  feedback?: string
  rating?: number
  highlights?: string[]
}

export interface MockInterviewFeedbackRequest {
  scoreCommunication: number
  scoreConfidence: number
  scoreTechnicalAccuracy: number
  scoreProblemSolving: number
  scoreClarityOfThought: number
  scoreBodyLanguage: number
  scoreTimeManagement: number
  scoreQuestionUnderstanding: number
  sectionIntroduction?: SectionFeedback
  sectionTechnical?: SectionFeedback
  sectionBehavioral?: SectionFeedback
  sectionClosing?: SectionFeedback
  strengths?: string[]
  improvements?: string[]
  actionPlan?: string[]
  currentLevel?: string
  recommendedRoles?: string[]
  hireabilityScore?: number
  benchmarkingPercentile?: number
  benchmarkingSummary?: string
  bestMoment?: string
  weakestMoment?: string
  mentorNotesHtml?: string
  quickTags?: string[]
  overallRating: number
  summary: string
}

export interface SectionFeedbackDto {
  feedback: string | null
  rating: number | null
  highlights: string[]
}

export interface MockInterviewFeedbackResponse {
  feedbackId: string
  bookingId: string
  mentorName: string
  mentorUserId: string
  userName: string
  userUserId: string
  scoreCommunication: number
  scoreConfidence: number
  scoreTechnicalAccuracy: number
  scoreProblemSolving: number
  scoreClarityOfThought: number
  scoreBodyLanguage: number
  scoreTimeManagement: number
  scoreQuestionUnderstanding: number
  sectionIntroduction: SectionFeedbackDto | null
  sectionTechnical: SectionFeedbackDto | null
  sectionBehavioral: SectionFeedbackDto | null
  sectionClosing: SectionFeedbackDto | null
  strengths: string[]
  improvements: string[]
  actionPlan: string[]
  currentLevel: string | null
  recommendedRoles: string[]
  hireabilityScore: number | null
  benchmarkingPercentile: number | null
  benchmarkingSummary: string | null
  bestMoment: string | null
  weakestMoment: string | null
  mentorNotesHtml: string | null
  quickTags: string[]
  overallRating: number
  summary: string
  submittedAt: string
  updatedAt: string
}


