/**
 * ─── EMAIL SUPPRESSION TYPES ──────────────────────────────────────────────────
 *
 * Mirrors `EmailSuppressionResponse` on the backend. See
 * `docs/ADMIN_LEAD_MAILER_V2_ENHANCEMENT_PLAN.md` §6.
 */

/** Why an address is on the list. */
export type EmailSuppressionReason =
  | "UNSUBSCRIBED"
  | "HARD_BOUNCE"
  | "SPAM_COMPLAINT"
  | "MANUAL"

/**
 * How the suppression arrived.
 *
 * `PROVIDER_WEBHOOK` is in the backend enum and the database CHECK constraint but nothing writes
 * it yet — bounce and complaint ingestion needs a ZeptoMail webhook, which is a later phase. It is
 * listed here so the badge map is exhaustive when that lands rather than rendering blank.
 */
export type EmailSuppressionSource =
  | "EMAIL_LINK"
  | "ONE_CLICK_HEADER"
  | "ADMIN"
  | "PROVIDER_WEBHOOK"

export interface EmailSuppression {
  emailSuppressionId: string
  /** Full address, not masked. The public unsubscribe page masks; this console must not. */
  email: string
  userId: string | null
  reason: EmailSuppressionReason
  source: EmailSuppressionSource
  leadMailCampaignId: string | null
  /**
   * The recipient's own words from the unsubscribe page.
   *
   * ⚠ Untrusted free text from an unauthenticated public endpoint. Render as text — never as
   * markup, and never into a `dangerouslySetInnerHTML`.
   */
  note: string | null
  /** Wire name is pinned with @JsonProperty on the backend; do not rename either side alone. */
  active: boolean
  reactivatedAt: string | null
  reactivatedBy: string | null
  createdAt: string
}

export interface SuppressionPage {
  content: EmailSuppression[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}
