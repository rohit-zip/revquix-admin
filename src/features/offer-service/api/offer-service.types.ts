/**
 * ─── OFFER SERVICE TYPES ──────────────────────────────────────────────────────
 *
 * TypeScript interfaces mirroring backend DTOs for the Global Offer Service
 * feature.  All fields are typed to exactly match the Java response/request DTOs.
 */

// ─── Enums ────────────────────────────────────────────────────────────────────

export const OFFER_ORDER_STATUS = {
  PENDING_PAYMENT: "PENDING_PAYMENT",
  PAYMENT_FAILED: "PAYMENT_FAILED",
  CONFIRMED: "CONFIRMED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED_BY_USER: "CANCELLED_BY_USER",
  CANCELLED_BY_REVQUIX: "CANCELLED_BY_REVQUIX",
  EXPIRED: "EXPIRED",
} as const

export type OfferOrderStatus = (typeof OFFER_ORDER_STATUS)[keyof typeof OFFER_ORDER_STATUS]

export const OFFER_ORDER_STATUS_OPTIONS: { label: string; value: OfferOrderStatus }[] = [
  { label: "Pending Payment", value: "PENDING_PAYMENT" },
  { label: "Payment Failed", value: "PAYMENT_FAILED" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled by User", value: "CANCELLED_BY_USER" },
  { label: "Cancelled by Revquix", value: "CANCELLED_BY_REVQUIX" },
  { label: "Expired", value: "EXPIRED" },
]

export const OFFER_PLAN_TIER = {
  BASIC: "BASIC",
  STANDARD: "STANDARD",
  PREMIUM: "PREMIUM",
} as const

export type OfferPlanTier = (typeof OFFER_PLAN_TIER)[keyof typeof OFFER_PLAN_TIER]

export const OFFER_PLAN_TIER_OPTIONS: { label: string; value: OfferPlanTier }[] = [
  { label: "Basic", value: "BASIC" },
  { label: "Standard", value: "STANDARD" },
  { label: "Premium", value: "PREMIUM" },
]

export const OFFER_FORM_FIELD_TYPE = {
  TEXT: "TEXT",
  TEXTAREA: "TEXTAREA",
  DROPDOWN: "DROPDOWN",
  RADIO: "RADIO",
  CHECKBOX_GROUP: "CHECKBOX_GROUP",
  FILE_UPLOAD: "FILE_UPLOAD",
  DATE: "DATE",
} as const

export type OfferFormFieldType = (typeof OFFER_FORM_FIELD_TYPE)[keyof typeof OFFER_FORM_FIELD_TYPE]

export const OFFER_SERVICE_CATEGORY_OPTIONS = [
  { label: "Career", value: "CAREER" },
  { label: "Technical", value: "TECHNICAL" },
  { label: "Design", value: "DESIGN" },
  { label: "Business", value: "BUSINESS" },
  { label: "Other", value: "OTHER" },
]

export const DISCOUNT_TYPE_OPTIONS = [
  { label: "Percentage", value: "PERCENTAGE" },
  { label: "Flat Amount", value: "FLAT" },
]

// ─── Response Types ────────────────────────────────────────────────────────────

export interface OfferPlanResponse {
  planId: string
  serviceId: string
  planTier: OfferPlanTier
  displayName: string
  tagline: string | null
  features: string | null      // JSON array string
  priceInrPaise: number
  priceUsdCents: number
  slaHours: number
  isActive: boolean
  sortOrder: number
}

export interface OfferAddOnResponse {
  addOnId: string
  serviceId: string
  displayName: string
  description: string | null
  priceInrPaise: number
  priceUsdCents: number
  requiredPlanTiers: string | null   // JSON array string or null = all tiers
  isActive: boolean
  sortOrder: number
}

export interface OfferFormFieldResponse {
  fieldId: string
  serviceId: string
  fieldKey: string
  fieldLabel: string
  fieldType: OfferFormFieldType
  placeholder: string | null
  helperText: string | null
  isRequired: boolean
  validationRules: string | null
  options: string | null
  allowedMimeTypes: string | null
  maxFileSizeMb: number | null
  sortOrder: number
  isEnabled: boolean
}

export interface OfferServiceResponse {
  serviceId: string
  slug: string
  displayName: string
  shortDescription: string
  longDescription: string | null
  coverImageUrl: string | null
  serviceCategory: string
  isEnabled: boolean
  isDraft: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
  plans: OfferPlanResponse[] | null
  addOns: OfferAddOnResponse[] | null
  formFields: OfferFormFieldResponse[] | null
  averageRating: number | null
  ratingCount: number
}

export interface OfferOrderSummaryResponse {
  orderId: string
  serviceId: string
  serviceName: string
  planTier: OfferPlanTier
  planDisplayName: string
  status: OfferOrderStatus
  currency: string
  finalAmountCharged: number
  slaDeadline: string | null
  confirmedAt: string | null
  completedAt: string | null
  cancelledAt: string | null
  cancellationReason: string | null
  createdAt: string
  ratingEligible: boolean
}

export interface OfferDeliverableResponse {
  deliverableId: string
  orderId: string
  originalFilename: string
  mimeType: string
  fileSizeBytes: number
  description: string | null
  uploadedByUserId: string
  createdAt: string
  downloadUrl: string | null
}

export interface CouponResponse {
  couponId: string
  code: string
  mentorUserId: string | null
  discountType: string
  discountValue: number
  maxDiscountInrPaise: number | null
  maxDiscountUsdCents: number | null
  minOrderInrPaise: number | null
  minOrderUsdCents: number | null
  maxTotalRedemptions: number | null
  maxRedemptionsPerUser: number | null
  totalRedemptions: number
  validFrom: string
  validUntil: string
  isActive: boolean
  applicableContexts: string | null
  isMentorSpecific: boolean
  createdAt: string
}

// ─── Request Types ─────────────────────────────────────────────────────────────

export interface CreateOfferServiceRequest {
  slug: string
  displayName: string
  shortDescription: string
  longDescription?: string
  coverImageUrl?: string
  serviceCategory: string
  isEnabled?: boolean
  isDraft?: boolean
  sortOrder?: number
}

export interface UpdateOfferServiceRequest {
  displayName?: string
  shortDescription?: string
  longDescription?: string
  coverImageUrl?: string
  serviceCategory?: string
  isEnabled?: boolean
  isDraft?: boolean
  sortOrder?: number
}

export interface CreateOfferPlanRequest {
  serviceId: string
  planTier: string
  displayName: string
  tagline?: string
  features?: string
  priceInrPaise: number
  priceUsdCents: number
  slaHours?: number
  isActive?: boolean
  sortOrder?: number
}

export interface UpdateOfferPlanRequest {
  displayName?: string
  tagline?: string
  features?: string
  priceInrPaise?: number
  priceUsdCents?: number
  slaHours?: number
  isActive?: boolean
  sortOrder?: number
}

export interface CreateOfferAddOnRequest {
  serviceId: string
  displayName: string
  description?: string
  priceInrPaise: number
  priceUsdCents: number
  requiredPlanTiers?: string
  isActive?: boolean
  sortOrder?: number
}

export interface UpdateOfferAddOnRequest {
  displayName?: string
  description?: string
  priceInrPaise?: number
  priceUsdCents?: number
  requiredPlanTiers?: string
  isActive?: boolean
  sortOrder?: number
}

export interface CreateOfferFormFieldRequest {
  serviceId: string
  fieldKey: string
  fieldLabel: string
  fieldType: string
  placeholder?: string
  helperText?: string
  isRequired?: boolean
  validationRules?: string
  options?: string
  allowedMimeTypes?: string
  maxFileSizeMb?: number
  sortOrder?: number
  isEnabled?: boolean
}

export interface UpdateOfferFormFieldRequest {
  fieldLabel?: string
  fieldType?: string
  placeholder?: string
  helperText?: string
  isRequired?: boolean
  validationRules?: string
  options?: string
  allowedMimeTypes?: string
  maxFileSizeMb?: number
  sortOrder?: number
  isEnabled?: boolean
}

export interface CreatePlatformCouponRequest {
  code: string
  discountType: string
  discountValue: number
  maxDiscountInrPaise?: number
  maxDiscountUsdCents?: number
  minOrderInrPaise?: number
  minOrderUsdCents?: number
  maxTotalRedemptions?: number
  maxRedemptionsPerUser?: number
  validFrom: string
  validUntil: string
}

export interface AssignOfferReviewerRequest {
  reviewerUserId: string
}

export interface CompleteOfferOrderRequest {
  internalNotes?: string
}

export interface OfferCancelOrderRequest {
  reason?: string
}
