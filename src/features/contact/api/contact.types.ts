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

export interface ContactQueryReplyResponse {
  replyId: string
  contactQueryId: string
  adminUserId: string | null
  subject: string
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
}
