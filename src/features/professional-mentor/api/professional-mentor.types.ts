/**
 * ─── PROFESSIONAL MENTOR TYPES ────────────────────────────────────────────────
 *
 * TypeScript interfaces mirroring backend DTOs for
 * Professional Mentor, Slots, Coupons, and Payouts.
 */

import type { SpringPageResponse } from "@/features/admin/api/admin-access.types"

export type { SpringPageResponse }

// ─── Enums ────────────────────────────────────────────────────────────────────

export const DISCOUNT_TYPE = {
  PERCENTAGE: "PERCENTAGE",
  FLAT_INR: "FLAT_INR",
  FLAT_USD: "FLAT_USD",
} as const
export type DiscountType = (typeof DISCOUNT_TYPE)[keyof typeof DISCOUNT_TYPE]

export const PAYOUT_STATUS = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  ON_HOLD: "ON_HOLD",
} as const
export type PayoutStatus = (typeof PAYOUT_STATUS)[keyof typeof PAYOUT_STATUS]

export const CURRENCY_CODE = { INR: "INR", USD: "USD" } as const
export type CurrencyCode = (typeof CURRENCY_CODE)[keyof typeof CURRENCY_CODE]

export const MEETING_PROVIDER = { GOOGLE_MEET: "GOOGLE_MEET", MANUAL_GOOGLE_MEET: "MANUAL_GOOGLE_MEET" } as const
export type MeetingProvider = (typeof MEETING_PROVIDER)[keyof typeof MEETING_PROVIDER]

// ─── Category / Skill ─────────────────────────────────────────────────────────

export interface CategoryDto {
  categoryId: string
  name: string
  description: string | null
}

export interface SkillDto {
  skillId: string
  name: string
  categoryId: string
}

// ─── Mentor Profile ───────────────────────────────────────────────────────────

export interface MentorProfileResponse {
  mentorProfileId: string
  userId: string
  userName: string
  userEmail: string
  avatarUrl: string | null
  headline: string
  bio: string
  linkedinUrl: string
  portfolioUrl: string | null
  yearsOfExperience: number
  currentCompany: string | null
  currentRole: string | null
  priceInrPaise: number | null
  priceUsdCents: number | null
  hourlySessionPriceInrPaise: number | null
  hourlySessionPriceUsdCents: number | null
  averageRating: number
  totalSessions: number
  totalReviews: number
  isActive: boolean
  isAcceptingBookings: boolean
  /** Whether the mentor has individually enabled mock interview bookings. */
  isAcceptingMockInterviews: boolean
  /** Whether the mentor has individually enabled hourly session bookings. */
  isAcceptingHourlySessions: boolean
  /** True when at least one of the two services is enabled; used as a filterable flag. */
  hasAnyServiceEnabled: boolean
  categories: CategoryDto[]
  skills: SkillDto[]
  resumeUrl: string | null
  createdAt: string
}

export interface UpdateMentorProfileRequest {
  headline?: string
  bio?: string
  linkedinUrl?: string
  portfolioUrl?: string
  currentCompany?: string
  currentRole?: string
  yearsOfExperience?: number
  categoryIds?: string[]
  skillIds?: string[]
}

export interface UpdatePricingRequest {
  priceInrPaise: number
  priceUsdCents: number
}

/**
 * Request body for admin-level per-service flag overrides.
 * Sent to PUT /professional-mentor/admin/{mentorProfileId}/service-flags
 */
export interface AdminUpdateServiceFlagsRequest {
  isAcceptingMockInterviews: boolean
  isAcceptingHourlySessions: boolean
}

// ─── Mentor Rating ────────────────────────────────────────────────────────────

export type ProfessionalSessionType = "MOCK_INTERVIEW" | "HOURLY_SESSION"

export interface MentorRatingResponse {
  ratingId: string
  mentorProfileId: string
  mentorName: string
  sessionId: string
  sessionType: ProfessionalSessionType
  userName: string
  userEmail: string
  rating: number
  comment: string
  submittedAt: string
  createdAt: string
}

// ─── Professional Mentor Slots ────────────────────────────────────────────────

export interface ProfessionalSlotResponse {
  slotId: string
  mentorUserId: string
  slotStartUtc: string
  mentorTimezone: string
  durationMinutes: number
  isBooked: boolean
  isCancelled: boolean
  priceInrPaise: number | null
  priceUsdCents: number | null
  createdAt: string
}

export interface OpenSlotsRequest {
  startDate: string
  endDate?: string
  startTime: string
  endTime: string
  timezone: string
}

export interface BulkCancelSlotsRequest {
  from: string
  to: string
}

export interface SlotStatsResponse {
  totalOpened: number
  totalBooked: number
  totalAvailable: number
  totalCancelled: number
}

// ─── Coupons ──────────────────────────────────────────────────────────────────

export interface CouponResponse {
  couponId: string
  code: string
  mentorUserId: string
  discountType: DiscountType
  discountValue: number
  maxDiscountInrPaise: number | null
  maxDiscountUsdCents: number | null
  minOrderInrPaise: number | null
  minOrderUsdCents: number | null
  maxTotalRedemptions: number | null
  maxRedemptionsPerUser: number
  totalRedemptions: number
  validFrom: string
  validUntil: string
  isActive: boolean
  applicableContexts: string
  isMentorSpecific: boolean
  createdAt: string
}

export interface CreateCouponRequest {
  code: string
  discountType: DiscountType
  discountValue: number
  maxDiscountInrPaise?: number
  maxDiscountUsdCents?: number
  minOrderInrPaise?: number
  minOrderUsdCents?: number
  maxTotalRedemptions?: number
  maxRedemptionsPerUser?: number
  validFrom: string
  validUntil: string
  applicableContexts?: string[]
  isMentorSpecific?: boolean
  /** Optional list of email addresses this coupon is restricted to. */
  targetedEmails?: string[]
}

export interface CouponValidationResponse {
  couponCode: string
  discountType: string
  discountValue: number
  maxDiscountDisplay: string | null
  minOrderDisplay: string | null
  originalAmountDisplay: string
  discountAmountDisplay: string
  finalAmountDisplay: string
  currency: string
  discountAmountMinor: number
  finalAmountMinor: number
  isValid: boolean
  message: string
}

export interface ApplyCouponRequest {
  couponCode: string
  amountMinor: number
  currency: string
  mentorProfileId: string
}

// ─── Payouts ──────────────────────────────────────────────────────────────────

export interface MentorPayoutResponse {
  payoutId: string
  mentorUserId: string
  paymentOrderId: string
  grossAmountMinor: number | null
  platformFeeMinor: number | null
  gstAmountMinor: number | null
  payoutAmountMinor: number
  currency: CurrencyCode
  commissionPercentage: number
  status: PayoutStatus
  payoutReference: string | null
  paidAt: string | null
  adminNote: string | null
  createdAt: string
}

