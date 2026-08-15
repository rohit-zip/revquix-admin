export const LEAD_MAIL_CONTENT_TYPE = {
  TEXT: "TEXT",
  HTML: "HTML",
} as const

export type LeadMailContentType = (typeof LEAD_MAIL_CONTENT_TYPE)[keyof typeof LEAD_MAIL_CONTENT_TYPE]

/**
 * Campaign lifecycle, mirroring the backend `LeadMailCampaignStatus` enum and the
 * `ck_lmc_status` CHECK constraint in V225.
 *
 *   DRAFT -> QUEUED -> SENDING <-> PAUSED
 *                        |
 *                        +-> COMPLETED | PARTIAL_FAILURE | CANCELLED | INTERRUPTED
 *
 * IN_PROGRESS is the pre-V2 name for SENDING and is retained because historical campaign
 * rows still carry it — the backend never writes it for new campaigns.
 *
 * See docs/ADMIN_LEAD_MAILER_V2_ENHANCEMENT_PLAN.md §3.1.
 */
export const LEAD_MAIL_CAMPAIGN_STATUS = {
  DRAFT: "DRAFT",
  QUEUED: "QUEUED",
  SENDING: "SENDING",
  /** Legacy synonym for SENDING; present on pre-V2 rows only. */
  IN_PROGRESS: "IN_PROGRESS",
  PAUSED: "PAUSED",
  COMPLETED: "COMPLETED",
  PARTIAL_FAILURE: "PARTIAL_FAILURE",
  CANCELLED: "CANCELLED",
  INTERRUPTED: "INTERRUPTED",
} as const

export type LeadMailCampaignStatus =
  (typeof LEAD_MAIL_CAMPAIGN_STATUS)[keyof typeof LEAD_MAIL_CAMPAIGN_STATUS]

/**
 * Statuses after which no further dispatch happens without a new operator action.
 *
 * Exported as the single source of truth for "should we keep polling?" so that a status
 * added on the backend cannot leave a view polling a finished campaign forever — which is
 * exactly the defect this replaces (plan §0.4 defect 2).
 */
const TERMINAL_CAMPAIGN_STATUSES: ReadonlySet<string> = new Set<string>([
  LEAD_MAIL_CAMPAIGN_STATUS.COMPLETED,
  LEAD_MAIL_CAMPAIGN_STATUS.PARTIAL_FAILURE,
  LEAD_MAIL_CAMPAIGN_STATUS.CANCELLED,
  LEAD_MAIL_CAMPAIGN_STATUS.INTERRUPTED,
])

/** Mirrors `LeadMailCampaignStatus.isTerminal()` on the backend. */
export function isTerminalCampaignStatus(status: string | null | undefined): boolean {
  return status != null && TERMINAL_CAMPAIGN_STATUSES.has(status)
}

/** Mirrors `LeadMailCampaignStatus.isDispatching()` — treats legacy IN_PROGRESS as SENDING. */
export function isDispatchingCampaignStatus(status: string | null | undefined): boolean {
  return (
    status === LEAD_MAIL_CAMPAIGN_STATUS.SENDING ||
    status === LEAD_MAIL_CAMPAIGN_STATUS.IN_PROGRESS
  )
}

/**
 * Per-recipient delivery outcome, mirroring the backend `LeadMailDeliveryStatus` enum and the
 * `ck_lmr_delivery_status` CHECK constraint in V226.
 *
 * SKIPPED means "deliberately not mailed" (unsubscribed, or no name when the content used
 * {{name}}) and is deliberately NOT a failure — counting opt-outs as failures would make every
 * routine unsubscribe look like a deliverability incident.
 */
export const LEAD_MAIL_DELIVERY_STATUS = {
  PENDING: "PENDING",
  SENDING: "SENDING",
  SENT: "SENT",
  FAILED: "FAILED",
  SKIPPED: "SKIPPED",
} as const

export type LeadMailDeliveryStatus =
  (typeof LEAD_MAIL_DELIVERY_STATUS)[keyof typeof LEAD_MAIL_DELIVERY_STATUS]

/** Why a recipient was deliberately not mailed. Mirrors the backend `LeadMailSkipReason`. */
export const LEAD_MAIL_SKIP_REASON = {
  UNSUBSCRIBED: "UNSUBSCRIBED",
  MISSING_NAME: "MISSING_NAME",
  SUPPRESSED_BOUNCE: "SUPPRESSED_BOUNCE",
  SUPPRESSED_COMPLAINT: "SUPPRESSED_COMPLAINT",
  MANUAL: "MANUAL",
  INVALID_EMAIL: "INVALID_EMAIL",
} as const

export type LeadMailSkipReason =
  (typeof LEAD_MAIL_SKIP_REASON)[keyof typeof LEAD_MAIL_SKIP_REASON]

/** How the recipient list was assembled. Mirrors the backend `LeadMailAudienceType`. */
export const LEAD_MAIL_AUDIENCE_TYPE = {
  MANUAL: "MANUAL",
  EXCEL: "EXCEL",
  USER_SEARCH: "USER_SEARCH",
  ALL_USERS: "ALL_USERS",
  /**
   * Everyone matching a saved interest-graph predicate (interest Phase 7).
   *
   * Server-resolved like ALL_USERS — the live predicate is re-run at send time and whatever the
   * browser previewed is never trusted. Unlike ALL_USERS it needs no typed-phrase confirmation: a
   * segment narrows by construction, and the backend refuses one that does not.
   */
  SEGMENT: "SEGMENT",
} as const

export type LeadMailAudienceType =
  (typeof LEAD_MAIL_AUDIENCE_TYPE)[keyof typeof LEAD_MAIL_AUDIENCE_TYPE]

/** Which render pipeline produced the email. Mirrors the backend `LeadMailTemplateKey`. */
export const LEAD_MAIL_TEMPLATE_KEY = {
  /** No branded wrapper — the body is sent verbatim. Pre-V2 behaviour and the default. */
  RAW: "RAW",
  BRANDED_BASIC: "BRANDED_BASIC",
  BRANDED_CTA: "BRANDED_CTA",
  BRANDED_ARTICLES: "BRANDED_ARTICLES",
  BRANDED_ANNOUNCEMENT: "BRANDED_ANNOUNCEMENT",
} as const

export type LeadMailTemplateKey =
  (typeof LEAD_MAIL_TEMPLATE_KEY)[keyof typeof LEAD_MAIL_TEMPLATE_KEY]

/**
 * What to do for a recipient with no name when the content uses {{name}}.
 * Mirrors the backend `LeadMailMissingNamePolicy`.
 */
export const LEAD_MAIL_MISSING_NAME_POLICY = {
  /** Record those recipients as SKIPPED and send to everyone else. The default for new sends. */
  SKIP_RECIPIENT: "SKIP_RECIPIENT",
  /** Reject the whole send (pre-V2 behaviour). */
  BLOCK_SEND: "BLOCK_SEND",
  /** Substitute a neutral fallback and send anyway. */
  USE_FALLBACK: "USE_FALLBACK",
} as const

export type LeadMailMissingNamePolicy =
  (typeof LEAD_MAIL_MISSING_NAME_POLICY)[keyof typeof LEAD_MAIL_MISSING_NAME_POLICY]

export const LEAD_MAIL_SEND_METHOD = {
  ZEPTO_MAIL: "ZEPTO_MAIL",
  SMTP: "SMTP",
} as const

export type LeadMailSendMethod = (typeof LEAD_MAIL_SEND_METHOD)[keyof typeof LEAD_MAIL_SEND_METHOD]

export const LEAD_MAIL_SMTP_ENCRYPTION_MODE = {
  SSL: "SSL",
  STARTTLS: "STARTTLS",
  NONE: "NONE",
} as const

export type LeadMailSmtpEncryptionMode =
  (typeof LEAD_MAIL_SMTP_ENCRYPTION_MODE)[keyof typeof LEAD_MAIL_SMTP_ENCRYPTION_MODE]

/**
 * Ad-hoc SMTP credentials (Phase 2, Option A) — held only in component-local state on
 * the compose screen for the current session, never persisted, never sent anywhere
 * except embedded in a test-connection/test-send/send request body.
 */
export interface SmtpCredentialsInput {
  host: string
  port: number
  username: string
  password: string
  encryptionMode: LeadMailSmtpEncryptionMode
  fromAddress: string
  fromName?: string
}

export interface SmtpTestConnectionResponse {
  success: boolean
  message: string
}

/** Standalone test-connection request — identical fields to {@link SmtpCredentialsInput}. */
export type SmtpTestConnectionRequest = SmtpCredentialsInput

/**
 * The verified ZeptoMail sending domain. The admin chooses any local part (prefix); the
 * resulting sender address is `${prefix}@${LEAD_MAIL_SENDER_DOMAIN}`. Mirrors the backend's
 * `app.mail.zepto-mail.domain` — the domain itself is fixed server-side and never sent on the wire.
 */
export const LEAD_MAIL_SENDER_DOMAIN = "revquix.com"

/** Default from-prefix used to prefill the compose form. */
export const LEAD_MAIL_DEFAULT_FROM_PREFIX = "outreach"

export interface LeadMailRecipientInput {
  email: string
  name?: string | null
}

export interface LeadMailRecipientSuggestion {
  userId: string
  name: string | null
  email: string
  avatarUrl: string | null
}

/**
 * Which kind of post an attachment came from. Mirrors the backend `BlogKind`.
 * Decides the public URL shape (`/blog/{slug}` vs `/u/{username}/blog/{slug}`) and the card label.
 */
export const LEAD_MAIL_BLOG_KIND = {
  EDITORIAL: "EDITORIAL",
  COMMUNITY: "COMMUNITY",
} as const

export type LeadMailBlogKind = (typeof LEAD_MAIL_BLOG_KIND)[keyof typeof LEAD_MAIL_BLOG_KIND]

/**
 * One row of `GET /content/posts` — a post the admin may attach (Phase 6).
 *
 * The endpoint only ever returns PUBLISHED + PUBLIC posts, which is why there is no status field
 * here to filter on: that decision has already been made server-side, and offering the client a
 * status would invite it to re-implement a rule it cannot enforce.
 */
export interface LeadMailContentCandidate {
  blogId: string
  title: string
  slug: string
  excerpt?: string | null
  coverUrl?: string | null
  authorName?: string | null
  blogKind: LeadMailBlogKind
  readingTimeMinutes?: number | null
  publishedAt?: string | null
  /** Live post URL WITHOUT UTM parameters — this is the link the admin clicks while choosing. */
  publicUrl: string
}

/**
 * An article attached to a campaign, frozen as it was when the campaign left DRAFT.
 *
 * Never re-read from the live post: these fields are what the email actually carried, so a post
 * retitled or deleted six months later must not change what an archived campaign says it sent.
 */
export interface LeadMailCampaignContent {
  leadMailCampaignContentId: string
  blogId: string
  blogKind: LeadMailBlogKind
  position: number
  title: string
  excerpt?: string | null
  coverUrl?: string | null
  authorName?: string | null
  /** The absolute, UTM-tagged URL exactly as it appeared in the sent email. */
  url: string
  readingTimeMinutes?: number | null
}

/**
 * The layout fields shared by preview, test-send, send and draft (Phases 5 and 6).
 *
 * Extracted rather than repeated four times: these four requests have to agree about what an email
 * looks like, and four independent copies of the same six fields is how the preview stops matching
 * the send after somebody adds a seventh.
 */
export interface LeadMailBrandedFields {
  /** Defaults to RAW server-side when omitted — the pre-V2 verbatim-body behaviour. */
  templateKey?: LeadMailTemplateKey
  /** Inbox preview line. Rendered by the branded templates only. */
  preheader?: string
  /** Small uppercase label above a BRANDED_ANNOUNCEMENT headline. */
  eyebrow?: string
  /** Required for BRANDED_ANNOUNCEMENT at send time (RQ-VE-448). */
  headline?: string
  /** Required for BRANDED_CTA at send time. Stored only together with ctaUrl. */
  ctaLabel?: string
  ctaUrl?: string
  /** Blog post ids to attach, in render order. PUBLISHED + PUBLIC only (RQ-VE-447). */
  contentBlogIds?: string[]
}

export interface LeadMailPreviewRequest extends LeadMailBrandedFields {
  subject: string
  body: string
  contentType: LeadMailContentType
  sampleName?: string
}

export interface LeadMailPreviewResponse {
  resolvedSubject: string
  resolvedBody: string
  /**
   * The complete email document, rendered server-side by the template the send will use.
   *
   * This is what belongs in the sandboxed iframe. A client-side approximation is worse than no
   * preview: it is the artefact an operator approves before mailing thousands of people, and an
   * approximation is only accidentally the same as what goes out.
   */
  fullHtml?: string
  /** The text/plain alternative part, as a client reading mail as text would receive it. */
  plainText?: string
}

export interface LeadMailTestSendRequest extends LeadMailBrandedFields {
  subject: string
  body: string
  contentType: LeadMailContentType
  sendMethod?: LeadMailSendMethod
  /** Required when sendMethod is ZEPTO_MAIL (or omitted); ignored for SMTP. */
  fromPrefix?: string
  /** Required when sendMethod is SMTP; never persisted. */
  smtpCredentials?: SmtpCredentialsInput
  replyToAddress: string
  replyToName?: string
  testEmail: string
  sampleName?: string
}

export interface LeadMailSendRequest extends LeadMailBrandedFields {
  /** Label shown in campaign history (requirement 7). Defaults to the subject server-side when omitted. */
  campaignName?: string
  subject: string
  body: string
  contentType: LeadMailContentType
  sendMethod?: LeadMailSendMethod
  /** Required when sendMethod is ZEPTO_MAIL (or omitted); ignored for SMTP. */
  fromPrefix?: string
  /** Required when sendMethod is SMTP; never persisted. */
  smtpCredentials?: SmtpCredentialsInput
  replyToAddress: string
  replyToName?: string
  /** Ignored when audienceType is ALL_USERS, which resolves its own audience server-side. */
  recipients: LeadMailRecipientInput[]
  /**
   * How this recipient list was assembled (Phase 3). Defaults to MANUAL when omitted — exactly
   * what every pre-Phase-3 caller of this endpoint already does. See
   * {@link LeadMailAudienceType} and `allUsersConfirmationPhrase` for the ALL_USERS case.
   */
  audienceType?: LeadMailAudienceType
  /**
   * Required, and checked verbatim, when audienceType is ALL_USERS. Render whatever
   * {@link LeadMailAllUsersCountResponse.confirmationPhrase} carries — never a hard-coded copy.
   */
  allUsersConfirmationPhrase?: string
  /**
   * Required when audienceType is SEGMENT. Ignored otherwise.
   *
   * No confirmation phrase counterpart, unlike ALL_USERS: a segment narrows by construction and the
   * backend refuses a definition that does not. The recipient list is resolved from the live
   * predicate at send time — whatever the browser previewed is never trusted.
   */
  segmentId?: string
  /**
   * Idempotency key. Generated once per composition and reused across retries — a fresh key per
   * click would defeat the guard. A second submission with the same key is rejected (RQ-VE-415),
   * which is what stops a double-clicked Send from mailing the whole list twice.
   */
  clientRequestId?: string
  /** Defaults to SKIP_RECIPIENT server-side. BLOCK_SEND reproduces the pre-V2 all-or-nothing behaviour. */
  missingNamePolicy?: LeadMailMissingNamePolicy
}

export interface LeadMailExcelParseResponse {
  recipients: LeadMailRecipientInput[]
  skippedRowCount: number
  totalRowCount: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Audience builder (Phase 3): /parse-recipients, /recipients/annotate,
// /audience/users, /audience/all-users/count
// ─────────────────────────────────────────────────────────────────────────────

/**
 * One usable row from POST /parse-recipients. Carries a stable rowId so the review table can
 * address a single row for deletion or an inline name edit, unlike the plain
 * {@link LeadMailRecipientInput} rows the older /parse-excel response returns.
 */
export interface LeadMailParsedRow {
  rowId: string
  sourceRowNumber: number
  email: string
  name: string | null
}

/** A sheet row from /parse-recipients that repeated an earlier row's email address. */
export interface LeadMailDuplicateRow {
  sourceRowNumber: number
  email: string
  duplicateOfSourceRowNumber: number
}

/** A sheet row from /parse-recipients that could not be resolved to a usable email address. */
export interface LeadMailInvalidRow {
  sourceRowNumber: number
  rawEmail: string
  reason: string
}

/** Response for POST /parse-recipients — supersedes LeadMailExcelParseResponse's bare counts with per-row detail. */
export interface LeadMailParseRecipientsResponse {
  recipients: LeadMailParsedRow[]
  invalidRows: LeadMailInvalidRow[]
  duplicateRows: LeadMailDuplicateRow[]
  totalRowCount: number
}

/** Per-address annotation from POST /recipients/annotate (requirement 11). */
export interface LeadMailAnnotatedEmail {
  email: string
  /** Always false until Phase 4 (email suppression) ships. */
  unsubscribed: boolean
  /** Always null until Phase 4 ships. */
  unsubscribedAt: string | null
  isRevquixUser: boolean
  userId: string | null
  name: string | null
}

/** One row of GET /audience/users — the paginated Revquix-user search (requirement 4). */
export interface LeadMailAudienceUserResponse {
  userId: string
  name: string | null
  username: string
  email: string
  avatarUrl: string | null
  emailVerified: boolean
  joinedAt: string
  /** Always false until Phase 4 (email suppression) ships. */
  unsubscribed: boolean
}

/**
 * Dry-run eligible-recipient count for the ALL_USERS audience (requirement 5).
 *
 * `confirmationPhrase` is the exact text the send request must echo back in
 * `allUsersConfirmationPhrase` — always render this value rather than hard-coding a copy of it,
 * so the challenge can never silently drift out of agreement with what the server checks.
 */
export interface LeadMailAllUsersCountResponse {
  eligible: number
  /** Always 0 until Phase 4 (email suppression) ships. */
  excludedSuppressed: number
  excludedUnverified: number
  excludedDeleted: number
  totalConsidered: number
  confirmationPhrase: string
}

/** Create or replace a draft campaign. Only campaignName is required — a draft may be incomplete. */
export interface LeadMailDraftRequest extends LeadMailBrandedFields {
  campaignName: string
  subject?: string
  body?: string
  contentType?: LeadMailContentType
  sendMethod?: LeadMailSendMethod
  fromPrefix?: string
  replyToAddress?: string
  replyToName?: string
  preheader?: string
  missingNamePolicy?: LeadMailMissingNamePolicy
}

/**
 * Dispatch a saved draft. Content comes from the draft itself — only the audience, credentials and
 * idempotency key are supplied here.
 */
export interface LeadMailDraftSendRequest {
  /** Ignored when audienceType is ALL_USERS, which resolves its own audience server-side. */
  recipients: LeadMailRecipientInput[]
  /** See LeadMailSendRequest.audienceType. Defaults to MANUAL when omitted. */
  audienceType?: LeadMailAudienceType
  /** See LeadMailSendRequest.allUsersConfirmationPhrase. */
  allUsersConfirmationPhrase?: string
  /** Required when the draft's sendMethod is SMTP; never stored server-side. */
  smtpCredentials?: SmtpCredentialsInput
  missingNamePolicy?: LeadMailMissingNamePolicy
  clientRequestId?: string
}

/** Optional body for pause/resume/cancel/retry-failed. */
export interface LeadMailCampaignActionRequest {
  /** Recorded on the campaign when cancelling; ignored by the other actions. */
  reason?: string
  /** Required to resume or retry an SMTP campaign — credentials are never stored. */
  smtpCredentials?: SmtpCredentialsInput
}

/** Filters for the campaign-history list. All optional. */
export interface LeadMailCampaignListFilters {
  q?: string
  status?: LeadMailCampaignStatus[]
  sendMethod?: LeadMailSendMethod
  audienceType?: LeadMailAudienceType
  createdBy?: string
  /** ISO-8601 instant, inclusive lower bound on createdAt. */
  from?: string
  /** ISO-8601 instant, exclusive upper bound on createdAt. */
  to?: string
  /** Allow-listed field plus direction, e.g. "campaignName,asc". Unknown values fall back to newest-first. */
  sort?: string
}

/** Spring `Page` envelope, as returned by every paginated lead-mail endpoint. */
export interface LeadMailPage<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface LeadMailRecipientReportItem {
  leadMailRecipientId: string
  email: string
  name: string | null
  deliveryStatus: LeadMailDeliveryStatus
  errorMessage: string | null
  sentAt: string | null
  /**
   * Why this recipient was deliberately not mailed. Present only when deliveryStatus is
   * SKIPPED. Optional because the backend DTO does not expose it until Phase 1 — see
   * docs/ADMIN_LEAD_MAILER_V2_ENHANCEMENT_PLAN.md §2.2.
   */
  skipReason?: LeadMailSkipReason | null
  /** Dispatch attempts made. Greater than 1 only after a retry-failed run. */
  attemptCount?: number
}

export interface LeadMailCampaignSummaryResponse {
  leadMailCampaignId: string
  subject: string
  body: string
  contentType: LeadMailContentType
  sendMethod: LeadMailSendMethod
  fromPrefix: string | null
  replyToAddress: string
  replyToName: string | null
  recipientCount: number
  sentCount: number
  failedCount: number
  status: LeadMailCampaignStatus
  createdBy: string
  createdAt: string
  recipients: LeadMailRecipientReportItem[]

  // ─── V2 fields ───────────────────────────────────────────────────────────
  // Still declared optional even though the backend now always populates them: a response cached
  // in the browser from before this deploy will not carry them, so every consumer must coalesce.
  // See docs/ADMIN_LEAD_MAILER_V2_ENHANCEMENT_PLAN.md §2.1.

  /** Admin-chosen campaign label (requirement 7). Falls back to `subject` for display. */
  campaignName?: string | null
  /** Recipients deliberately not mailed — the third terminal outcome alongside sent/failed. */
  skippedCount?: number
  audienceType?: LeadMailAudienceType
  templateKey?: LeadMailTemplateKey
  missingNamePolicy?: LeadMailMissingNamePolicy
  preheader?: string | null
  /** In-flight message ceiling actually used for this send (5 for SMTP). */
  sendConcurrency?: number
  /** Mirrors the backend's `status.isDispatching()`. */
  dispatching?: boolean
  /** Mirrors the backend's `status.isTerminal()`. Authoritative for "stop polling". */
  terminal?: boolean
  /** Resolved display name of the sending admin, so no surface has to show a raw USR id. */
  createdByName?: string | null
  startedAt?: string | null
  finishedAt?: string | null
  cancelledAt?: string | null
  cancelledBy?: string | null
  cancelledByName?: string | null
  /** Campaign-level cause for a CANCELLED or INTERRUPTED outcome. */
  failureReason?: string | null
  /** True when `recipients` holds only the first page — use the recipients endpoint for the rest. */
  recipientsTruncated?: boolean

  // ─── Branded template fields (Phase 5) ───────────────────────────────────
  // Returned even when the current templateKey does not use them, so switching a draft from
  // BRANDED_CTA to BRANDED_BASIC and back does not lose the button the operator already wrote.

  eyebrow?: string | null
  headline?: string | null
  ctaLabel?: string | null
  ctaUrl?: string | null

  /** Attached articles in render order, frozen as snapshots. Empty when nothing is attached. */
  attachedContent?: LeadMailCampaignContent[]
}

export interface LeadMailCampaignListItemResponse {
  leadMailCampaignId: string
  subject: string
  sendMethod: LeadMailSendMethod
  recipientCount: number
  sentCount: number
  failedCount: number
  status: LeadMailCampaignStatus
  createdBy: string
  createdAt: string

  // ─── V2 fields (optional — see LeadMailCampaignSummaryResponse) ───────────
  campaignName?: string | null
  skippedCount?: number
  audienceType?: LeadMailAudienceType
  templateKey?: LeadMailTemplateKey
  /** Resolved display name of the sending admin, so the list need not show a raw USR id. */
  createdByName?: string | null
  /** Mirrors the backend's `status.isTerminal()`. */
  terminal?: boolean
  /** True while the campaign is a DRAFT and therefore still editable. */
  editable?: boolean
  startedAt?: string | null
  finishedAt?: string | null
}
