/**
 * ─── MENTORSHIP V2 (PHASE 2) SERVICE CATALOG TYPES ──────────────────────────
 *
 * Mirrors AdminMentorshipV2ServiceController's DTOs.
 */

export type IsoInstant = string

export interface AdminServiceRow {
  serviceId: string
  mentorUserId: string
  mentorUsername?: string | null
  serviceType: string
  title: string
  slug: string
  status: string
  visibility: string
  baseCurrency: string
  basePriceMinor: number
  durationMinutes?: number | null
  skillCount: number
  formFieldCount: number
  publishable: boolean
  blockingReasons: string[]
  publicUrl?: string | null
  publishedAt?: IsoInstant | null
  updatedAt?: IsoInstant | null
}

export interface AdminServiceCatalogSnapshot {
  totalServices: number
  /**
   * DRAFT / ACTIVE / PAUSED / ARCHIVED → count. There is deliberately no PENDING_REVIEW
   * bucket: decision #6 removed the marketplace review gate. A new key appearing here
   * would mean one was reintroduced.
   */
  countsByStatus: Record<string, number>
  countsByType: Record<string, number>
  servicesWithCover: number
  servicesWithIntakeForm: number
  packagesWithChildren: number
  recentServices: AdminServiceRow[]
  computedAt?: IsoInstant | null
}

export interface PublishCheckItem {
  key: string
  label: string
  passed: boolean
  detail?: string | null
  notApplicable: boolean
}

export interface ServicePublishCheck {
  serviceId: string
  publishable: boolean
  checks: PublishCheckItem[]
  blockingReasons: string[]
}

export interface SanitiserProbeResult {
  input?: string | null
  sanitisedOutput?: string | null
  inputLength: number
  plainTextLength: number
  modified: boolean
  /** Dangerous constructs present in the input and confirmed gone from the output. */
  strippedConstructs: string[]
  /** Should always be empty. Rendered in red when it is not. */
  survivingConstructs: string[]
  wouldPassPublishLengthCheck: boolean
  publishMinimumChars: number
  maximumChars: number
  checkedAt?: IsoInstant | null
}

export interface ServiceTypeCapabilityRow {
  serviceType: string
  label: string
  description: string
  icon: string
  requiresScheduling: boolean
  requiresDuration: boolean
  maxDurationMinutes?: number | null
  requiresMeetingLink: boolean
  requiresMentorFeedback: boolean
  isBundle: boolean
  hasValidityWindow: boolean
  supportsDynamicForm: boolean
  supportsDiscountCodes: boolean
  bookingStateMachine?: string | null
  fulfilmentHandler?: string | null
  enabled: boolean
  displayOrder?: number | null
  /** False when the row is enabled but no fulfilment handler bean exists — a misconfiguration. */
  handlerAvailable: boolean
}

export interface ServiceTemplateRow {
  templateId: string
  serviceType: string
  label: string
  tagline: string
  icon: string
  title: string
  shortDescription: string
  descriptionHtml: string
  ctaLabel: string
  durationMinutes?: number | null
  suggestedPriceMinor?: number | null
  currency: string
  suggestedSkills: string[]
}
