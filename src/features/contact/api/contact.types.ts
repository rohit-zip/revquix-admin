export const CONTACT_QUERY_STATUS = {
  NEW: "NEW",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  SPAM: "SPAM",
  ARCHIVED: "ARCHIVED",
} as const

export type ContactQueryStatus = (typeof CONTACT_QUERY_STATUS)[keyof typeof CONTACT_QUERY_STATUS]

export const CONTACT_INQUIRY_TYPE = {
  GENERAL: "GENERAL",
  PROJECT_INQUIRY: "PROJECT_INQUIRY",
  HIRING_SUPPORT: "HIRING_SUPPORT",
  MENTORSHIP_PROFESSIONAL: "MENTORSHIP_PROFESSIONAL",
  TECHNICAL_SUPPORT_HELP: "TECHNICAL_SUPPORT_HELP",
  BILLING_PAYMENTS: "BILLING_PAYMENTS",
  PARTNERSHIP: "PARTNERSHIP",
  PRESS_MEDIA: "PRESS_MEDIA",
  FEEDBACK: "FEEDBACK",
  OTHER: "OTHER",
} as const

export type ContactInquiryType = (typeof CONTACT_INQUIRY_TYPE)[keyof typeof CONTACT_INQUIRY_TYPE]

export const INQUIRY_TYPE_LABELS: Record<ContactInquiryType, string> = {
  GENERAL: "General",
  PROJECT_INQUIRY: "Project Inquiry",
  HIRING_SUPPORT: "Hiring Support",
  MENTORSHIP_PROFESSIONAL: "Mentorship",
  TECHNICAL_SUPPORT_HELP: "Technical Support",
  BILLING_PAYMENTS: "Billing & Payments",
  PARTNERSHIP: "Partnership",
  PRESS_MEDIA: "Press & Media",
  FEEDBACK: "Feedback",
  OTHER: "Other",
}

export const INQUIRY_TYPE_OPTIONS: { label: string; value: ContactInquiryType }[] =
  (Object.keys(INQUIRY_TYPE_LABELS) as ContactInquiryType[]).map((value) => ({
    value,
    label: INQUIRY_TYPE_LABELS[value],
  }))

export const STATUS_LABELS: Record<ContactQueryStatus, string> = {
  NEW: "New",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  SPAM: "Spam",
  ARCHIVED: "Archived",
}

export type ContactReplyDeliveryStatus = "SENT" | "FAILED"

export type BudgetRange = "BELOW_50K" | "BETWEEN_50K_2L" | "BETWEEN_2L_10L" | "ABOVE_10L"
export type HiringUrgency = "IMMEDIATE" | "WITHIN_ONE_MONTH" | "EXPLORING"
export type HiringFor = "FULL_TIME" | "FREELANCE" | "CONTRACT"
export type PreferredContactMethod = "EMAIL" | "PHONE" | "WHATSAPP"

/**
 * Which way a message travelled. Stored explicitly on the row, never inferred from
 * `adminUserId === null` — that column is `ON DELETE SET NULL`, so a staff reply whose author's
 * account was later removed reaches exactly that state, and inferring would reattribute it to the
 * customer.
 */
export type SupportMessageDirection = "STAFF_TO_USER" | "USER_TO_STAFF"

/** Who the ticket is waiting on. `STAFF` is the support work queue. */
export type AwaitingParty = "STAFF" | "USER" | "NONE"

/** Which front door the row came through. One table, two audiences. */
export type SupportSource = "PUBLIC_CONTACT_PAGE" | "WORKSPACE_HELP"

/**
 * What a ticket is about.
 *
 * Disputes are deliberately absent and stay that way — they are a separate flow with their own
 * thread, clocks, evidence and automated resolution, and support neither binds to nor routes
 * into them.
 */
export type SupportRelatedEntityType = "BOOKING" | "PAYMENT"

export interface ContactQueryReplyResponse {
  replyId: string
  contactQueryId: string
  adminUserId: string | null
  direction: SupportMessageDirection
  authorUserId: string | null
  /** A staff note on the thread. Never sent, never shown to the member. */
  internalNote: boolean
  /** Null on a member's message — they have no subject line to write. */
  subject: string | null
  bodyHtml: string
  deliveryStatus: ContactReplyDeliveryStatus
  sentAt: string | null
  createdAt: string
}

export interface ContactQueryResponse {
  contactQueryId: string
  ticketRef: string
  name: string
  email: string
  phone: string | null
  inquiryType: ContactInquiryType
  subject: string | null
  message: string
  company: string | null
  budgetRange: BudgetRange | null
  hiringUrgency: HiringUrgency | null
  hiringFor: HiringFor | null
  preferredContactMethod: PreferredContactMethod | null
  relatedService: string | null
  status: ContactQueryStatus
  source: SupportSource
  awaitingParty: AwaitingParty
  lastMessageAt: string
  /**
   * What the ticket is about, when the member arrived from a "Get help with this" control.
   *
   * May dangle: this is deliberately not a foreign key, because a ticket has to outlive the
   * record it concerns (bookings archive on a 90-day window). Render it as a reference, and do
   * not assume the target still resolves.
   */
  relatedEntityType: SupportRelatedEntityType | null
  relatedEntityId: string | null
  userId: string | null
  authenticatedSubmission: boolean
  marketingOptIn: boolean
  internalNote: string | null
  assignedAdminId: string | null
  firstRespondedAt: string | null
  resolvedAt: string | null
  resolvedByUserId: string | null
  ipAddress: string | null
  userAgent: string | null
  referrerUrl: string | null
  pageUrl: string | null
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  locale: string | null
  createdAt: string
  updatedAt: string
  repliesCount: number
  replies: ContactQueryReplyResponse[] | null
}

export interface ContactStatusUpdateRequest {
  status: ContactQueryStatus
}

export interface ContactNoteRequest {
  internalNote: string
}

export interface ContactReplyRequest {
  subject?: string
  body: string
  /**
   * Record a staff note on the thread instead of replying to the member.
   *
   * An internal note lands in the conversation in order but is excluded from every member-facing
   * read, does not satisfy the first-response SLA, does not move the ticket out of the queue, and
   * sends no mail. It is the per-message version of the single `internalNote` column on the
   * ticket, which has no position relative to the conversation it is about.
   */
  internalNote?: boolean
}

export const AWAITING_LABELS: Record<AwaitingParty, string> = {
  STAFF: "Waiting on us",
  USER: "Waiting on them",
  NONE: "Nobody waiting",
}

export const SOURCE_LABELS: Record<SupportSource, string> = {
  PUBLIC_CONTACT_PAGE: "Contact page",
  WORKSPACE_HELP: "Workspace help",
}

export const RELATED_ENTITY_LABELS: Record<SupportRelatedEntityType, string> = {
  BOOKING: "Session",
  PAYMENT: "Payment",
}

// ─── First-response SLA (Phase 4) ────────────────────────────────────────────

export interface SupportSlaMetrics {
  bucket: string
  ticketCount: number
  respondedCount: number
  /** Queue depth right now, not a rate. */
  awaitingStaff: number
  /** Null when nothing in the window was answered — "no data", not a perfect score. */
  medianMinutes: number | null
  p90Minutes: number | null
  /** Unanswered and already past target — breaches happening now. */
  breachedOpen: number
  /** Answered, but late — breaches that already happened. */
  breachedLate: number
  withinTargetPercent: number | null
}

export interface SupportSlaSummaryResponse {
  windowDays: number
  /**
   * Clock hours, deliberately stricter than the "24 business hours" the public page promises —
   * so a green number here is unambiguously a promise kept.
   */
  targetHours: number
  buckets: SupportSlaMetrics[]
}

export const SLA_BUCKET_LABELS: Record<string, string> = {
  ALL: "All tickets",
  WORKSPACE_HELP: "Workspace help",
  PUBLIC_CONTACT_PAGE: "Contact page",
}

/** Minutes to something a person reads at a glance. */
export function formatDuration(minutes: number | null): string {
  if (minutes === null) return "—"
  if (minutes < 60) return `${Math.round(minutes)}m`
  const hours = minutes / 60
  if (hours < 24) {
    const whole = Math.floor(hours)
    const rem = Math.round(minutes - whole * 60)
    return rem === 0 ? `${whole}h` : `${whole}h ${rem}m`
  }
  return `${(hours / 24).toFixed(1)}d`
}
