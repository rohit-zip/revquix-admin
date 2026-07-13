export const LEAD_MAIL_CONTENT_TYPE = {
  TEXT: "TEXT",
  HTML: "HTML",
} as const

export type LeadMailContentType = (typeof LEAD_MAIL_CONTENT_TYPE)[keyof typeof LEAD_MAIL_CONTENT_TYPE]

export const LEAD_MAIL_CAMPAIGN_STATUS = {
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  PARTIAL_FAILURE: "PARTIAL_FAILURE",
} as const

export type LeadMailCampaignStatus =
  (typeof LEAD_MAIL_CAMPAIGN_STATUS)[keyof typeof LEAD_MAIL_CAMPAIGN_STATUS]

export const LEAD_MAIL_DELIVERY_STATUS = {
  PENDING: "PENDING",
  SENT: "SENT",
  FAILED: "FAILED",
} as const

export type LeadMailDeliveryStatus =
  (typeof LEAD_MAIL_DELIVERY_STATUS)[keyof typeof LEAD_MAIL_DELIVERY_STATUS]

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

export interface LeadMailPreviewRequest {
  subject: string
  body: string
  contentType: LeadMailContentType
  sampleName?: string
}

export interface LeadMailPreviewResponse {
  resolvedSubject: string
  resolvedBody: string
}

export interface LeadMailTestSendRequest {
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

export interface LeadMailSendRequest {
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
  recipients: LeadMailRecipientInput[]
}

export interface LeadMailExcelParseResponse {
  recipients: LeadMailRecipientInput[]
  skippedRowCount: number
  totalRowCount: number
}

export interface LeadMailRecipientReportItem {
  leadMailRecipientId: string
  email: string
  name: string | null
  deliveryStatus: LeadMailDeliveryStatus
  errorMessage: string | null
  sentAt: string | null
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
}
