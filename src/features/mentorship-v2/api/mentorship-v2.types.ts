/**
 * ─── MENTORSHIP V2 (PHASE 0) VERIFICATION TYPES ─────────────────────────────
 *
 * TypeScript interfaces mirroring AdminMentorshipV2VerificationController's DTOs.
 * See docs/PROFESSIONAL_MENTOR_V2_IMPLEMENTATION_STRATEGY.md §3 "Phase 0" for the
 * full design this page verifies.
 */

export interface PhaseStatusEntry {
  phaseNumber: number
  phaseName: string
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETE"
  migrationsRange: string
}

export interface MentorshipV2HealthResponse {
  schemaExists: boolean
  btreeGistExtensionExists: boolean
  serviceTypeCapabilityCount: number
  pricingZoneCount: number
  pricingZoneCountryCount: number
  fxRateCount: number
  phases: PhaseStatusEntry[]
}

export interface PricingZoneResponse {
  zoneCode: string
  label: string
  defaultMultiplier: number
  displayCurrency: string
  countryCodes: string[]
}

export interface FxRateResponse {
  baseCurrency: string
  quoteCurrency: string
  rate: number
  source: string
  fetchedAt: string
}

export type CurrencyCode = "INR" | "USD"

export interface PricingQuotePreviewRequest {
  amountMinor: number
  currency: CurrencyCode
  commissionOverridePercentage?: number | null
  mentorUserId?: string | null
}

export interface PricingQuotePreviewResponse {
  quoteLogId: string
  currency: string
  listAmountMinor: number
  buyerPlatformFeeMinor: number
  buyerPlatformFeeType: "FLAT" | "PERCENTAGE"
  grossAmountMinor: number
  mentorCommissionPercentage: number
  mentorCommissionMinor: number
  gstOnCommissionMinor: number
  mentorNetMinor: number
  zeroAmount: boolean
  createdAt: string
}
