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

/** From-address prefixes configured on the backend (app.mail.zepto-mail.lead-outreach). MVP has exactly one. */
export const LEAD_MAIL_FROM_PREFIXES: { label: string; value: string }[] = [
  { label: "outreach@revquix.com", value: "outreach" },
]

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
  fromPrefix: string
  replyToAddress: string
  replyToName?: string
  testEmail: string
  sampleName?: string
}

export interface LeadMailSendRequest {
  subject: string
  body: string
  contentType: LeadMailContentType
  fromPrefix: string
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
  fromPrefix: string
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
  recipientCount: number
  sentCount: number
  failedCount: number
  status: LeadMailCampaignStatus
  createdBy: string
  createdAt: string
}
