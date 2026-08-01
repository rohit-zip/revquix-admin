import { apiClient } from "@/lib/axios"
import type {
  LeadMailAllUsersCountResponse,
  LeadMailAnnotatedEmail,
  LeadMailAudienceUserResponse,
  LeadMailCampaignActionRequest,
  LeadMailCampaignListFilters,
  LeadMailCampaignListItemResponse,
  LeadMailCampaignSummaryResponse,
  LeadMailDeliveryStatus,
  LeadMailDraftRequest,
  LeadMailDraftSendRequest,
  LeadMailExcelParseResponse,
  LeadMailPage,
  LeadMailParseRecipientsResponse,
  LeadMailPreviewRequest,
  LeadMailPreviewResponse,
  LeadMailRecipientReportItem,
  LeadMailRecipientSuggestion,
  LeadMailSendRequest,
  LeadMailTestSendRequest,
  SmtpTestConnectionRequest,
  SmtpTestConnectionResponse,
} from "./lead-mail.types"

const BASE = "/admin/lead-mail"

export type LeadMailCampaignPageResponse = LeadMailPage<LeadMailCampaignListItemResponse>
export type LeadMailRecipientPageResponse = LeadMailPage<LeadMailRecipientReportItem>

export const parseLeadMailExcel = (file: File): Promise<LeadMailExcelParseResponse> => {
  const formData = new FormData()
  formData.append("file", file)
  return apiClient
    .post<LeadMailExcelParseResponse>(`${BASE}/parse-excel`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data)
}

// ─────────────────────────────────────────────────────────────────────────────
// Audience builder (Phase 3)
// ─────────────────────────────────────────────────────────────────────────────

/** Supersedes parseLeadMailExcel for the review table: xlsx AND csv, with per-row detail. */
export const parseLeadMailRecipients = (file: File): Promise<LeadMailParseRecipientsResponse> => {
  const formData = new FormData()
  formData.append("file", file)
  return apiClient
    .post<LeadMailParseRecipientsResponse>(`${BASE}/parse-recipients`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data)
}

/**
 * Downloads the sample recipient template and hands it to the browser.
 *
 * Same reasoning as `downloadLeadMailCampaignRecipientsCsv`: fetched through `apiClient` (not a
 * plain navigation) so the bearer token is attached, and the object URL is revoked immediately
 * after the click.
 */
export const downloadLeadMailRecipientTemplate = async (): Promise<void> => {
  const response = await apiClient.get<Blob>(`${BASE}/recipients/template.csv`, { responseType: "blob" })
  const url = URL.createObjectURL(response.data)
  try {
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "lead-mail-recipients-template.csv"
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  } finally {
    URL.revokeObjectURL(url)
  }
}

/**
 * Annotates up to 2000 email addresses with Revquix-user and suppression status (requirement 11).
 *
 * The caller is responsible for chunking a larger list into batches of well under 2000 — the
 * review table does this in batches of 500 so a 2000-row upload does not become one slow request.
 */
export const annotateLeadMailRecipients = (emails: string[]): Promise<LeadMailAnnotatedEmail[]> =>
  apiClient
    .post<LeadMailAnnotatedEmail[]>(`${BASE}/recipients/annotate`, { emails })
    .then((r) => r.data)

/** Paginated Revquix-user search behind the "Search users" audience tab (requirement 4). */
export const searchLeadMailAudienceUsers = (
  page: number,
  size: number,
  q?: string,
  emailVerified?: boolean,
  joinedFrom?: string,
  joinedTo?: string,
): Promise<LeadMailPage<LeadMailAudienceUserResponse>> =>
  apiClient
    .get<LeadMailPage<LeadMailAudienceUserResponse>>(`${BASE}/audience/users`, {
      params: {
        page,
        size,
        q: q || undefined,
        emailVerified: emailVerified ?? undefined,
        joinedFrom: joinedFrom || undefined,
        joinedTo: joinedTo || undefined,
      },
    })
    .then((r) => r.data)

/**
 * Dry-run eligible-recipient count for the ALL_USERS audience (requirement 5).
 *
 * Requires PERM_SEND_LEAD_MAIL_ALL_USERS — callers without it should not render the ALL_USERS
 * audience option at all rather than call this and handle a 403.
 */
export const countLeadMailAllUsersEligible = (): Promise<LeadMailAllUsersCountResponse> =>
  apiClient.get<LeadMailAllUsersCountResponse>(`${BASE}/audience/all-users/count`).then((r) => r.data)

export const searchLeadMailRecipients = (query: string): Promise<LeadMailRecipientSuggestion[]> =>
  apiClient
    .get<LeadMailRecipientSuggestion[]>(`${BASE}/search-recipients`, { params: { q: query } })
    .then((r) => r.data)

export const previewLeadMail = (request: LeadMailPreviewRequest): Promise<LeadMailPreviewResponse> =>
  apiClient.post<LeadMailPreviewResponse>(`${BASE}/preview`, request).then((r) => r.data)

export const testSmtpConnection = (
  request: SmtpTestConnectionRequest,
): Promise<SmtpTestConnectionResponse> =>
  apiClient.post<SmtpTestConnectionResponse>(`${BASE}/smtp/test-connection`, request).then((r) => r.data)

export const testSendLeadMail = (request: LeadMailTestSendRequest): Promise<void> =>
  apiClient.post<void>(`${BASE}/test-send`, request).then(() => undefined)

export const sendLeadMail = (request: LeadMailSendRequest): Promise<LeadMailCampaignSummaryResponse> =>
  apiClient.post<LeadMailCampaignSummaryResponse>(`${BASE}/send`, request).then((r) => r.data)

export const getLeadMailCampaign = (campaignId: string): Promise<LeadMailCampaignSummaryResponse> =>
  apiClient.get<LeadMailCampaignSummaryResponse>(`${BASE}/campaigns/${campaignId}`).then((r) => r.data)

/**
 * Campaign history with optional filters and sort.
 *
 * `status` is repeated rather than comma-joined (`?status=A&status=B`) because Spring binds a
 * `List<Enum>` from repeated parameters; a single comma-joined value would arrive as one unparseable
 * enum name. `paramsSerializer` with `indexes: null` is what makes axios emit that form instead of
 * `status[0]=A`.
 */
export const listLeadMailCampaigns = (
  page: number,
  size: number,
  filters: LeadMailCampaignListFilters = {},
): Promise<LeadMailCampaignPageResponse> =>
  apiClient
    .get<LeadMailCampaignPageResponse>(`${BASE}/campaigns`, {
      params: {
        page,
        size,
        q: filters.q || undefined,
        status: filters.status?.length ? filters.status : undefined,
        sendMethod: filters.sendMethod || undefined,
        audienceType: filters.audienceType || undefined,
        createdBy: filters.createdBy || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
        sort: filters.sort || undefined,
      },
      paramsSerializer: { indexes: null },
    })
    .then((r) => r.data)

// ─────────────────────────────────────────────────────────────────────────────
// Send report
// ─────────────────────────────────────────────────────────────────────────────

export const listLeadMailCampaignRecipients = (
  campaignId: string,
  page: number,
  size: number,
  deliveryStatus?: LeadMailDeliveryStatus,
  q?: string,
): Promise<LeadMailRecipientPageResponse> =>
  apiClient
    .get<LeadMailRecipientPageResponse>(`${BASE}/campaigns/${campaignId}/recipients`, {
      params: { page, size, deliveryStatus: deliveryStatus || undefined, q: q || undefined },
    })
    .then((r) => r.data)

/**
 * Downloads the send report as CSV and hands it to the browser.
 *
 * Fetched through `apiClient` rather than by pointing `window.location` at the URL, because the
 * endpoint requires the bearer token that only the axios interceptor attaches — a plain navigation
 * would arrive unauthenticated and render a 401 page.
 *
 * The object URL is revoked immediately after the click. Skipping that leaks the whole blob for the
 * life of the document, which for a large export is megabytes per download.
 */
export const downloadLeadMailCampaignRecipientsCsv = async (
  campaignId: string,
  fallbackFileName: string,
): Promise<void> => {
  const response = await apiClient.get<Blob>(`${BASE}/campaigns/${campaignId}/recipients.csv`, {
    responseType: "blob",
  })

  // Prefer the server's filename — it carries the campaign name and id.
  const disposition = String(response.headers?.["content-disposition"] ?? "")
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition)
  const fileName = match?.[1] ? decodeURIComponent(match[1]) : fallbackFileName

  const url = URL.createObjectURL(response.data)
  try {
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = fileName
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  } finally {
    URL.revokeObjectURL(url)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Drafts
// ─────────────────────────────────────────────────────────────────────────────

export const createLeadMailDraft = (
  request: LeadMailDraftRequest,
): Promise<LeadMailCampaignSummaryResponse> =>
  apiClient.post<LeadMailCampaignSummaryResponse>(`${BASE}/campaigns`, request).then((r) => r.data)

export const updateLeadMailDraft = (
  campaignId: string,
  request: LeadMailDraftRequest,
): Promise<LeadMailCampaignSummaryResponse> =>
  apiClient
    .put<LeadMailCampaignSummaryResponse>(`${BASE}/campaigns/${campaignId}`, request)
    .then((r) => r.data)

export const deleteLeadMailDraft = (campaignId: string): Promise<void> =>
  apiClient.delete<void>(`${BASE}/campaigns/${campaignId}`).then(() => undefined)

export const cloneLeadMailCampaign = (campaignId: string): Promise<LeadMailCampaignSummaryResponse> =>
  apiClient
    .post<LeadMailCampaignSummaryResponse>(`${BASE}/campaigns/${campaignId}/clone`)
    .then((r) => r.data)

export const sendLeadMailDraft = (
  campaignId: string,
  request: LeadMailDraftSendRequest,
): Promise<LeadMailCampaignSummaryResponse> =>
  apiClient
    .post<LeadMailCampaignSummaryResponse>(`${BASE}/campaigns/${campaignId}/send`, request)
    .then((r) => r.data)

// ─────────────────────────────────────────────────────────────────────────────
// Lifecycle
// ─────────────────────────────────────────────────────────────────────────────

const campaignAction = (
  campaignId: string,
  action: "pause" | "resume" | "cancel" | "retry-failed",
  request?: LeadMailCampaignActionRequest,
): Promise<LeadMailCampaignSummaryResponse> =>
  apiClient
    .post<LeadMailCampaignSummaryResponse>(`${BASE}/campaigns/${campaignId}/${action}`, request ?? {})
    .then((r) => r.data)

export const pauseLeadMailCampaign = (campaignId: string) => campaignAction(campaignId, "pause")

export const resumeLeadMailCampaign = (
  campaignId: string,
  request?: LeadMailCampaignActionRequest,
) => campaignAction(campaignId, "resume", request)

export const cancelLeadMailCampaign = (
  campaignId: string,
  request?: LeadMailCampaignActionRequest,
) => campaignAction(campaignId, "cancel", request)

export const retryFailedLeadMailRecipients = (
  campaignId: string,
  request?: LeadMailCampaignActionRequest,
) => campaignAction(campaignId, "retry-failed", request)
