import { apiClient } from "@/lib/axios"
import type {
  LeadMailCampaignListItemResponse,
  LeadMailCampaignSummaryResponse,
  LeadMailExcelParseResponse,
  LeadMailPreviewRequest,
  LeadMailPreviewResponse,
  LeadMailRecipientSuggestion,
  LeadMailSendRequest,
  LeadMailTestSendRequest,
} from "./lead-mail.types"

const BASE = "/admin/lead-mail"

export interface LeadMailCampaignPageResponse {
  content: LeadMailCampaignListItemResponse[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export const parseLeadMailExcel = (file: File): Promise<LeadMailExcelParseResponse> => {
  const formData = new FormData()
  formData.append("file", file)
  return apiClient
    .post<LeadMailExcelParseResponse>(`${BASE}/parse-excel`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data)
}

export const searchLeadMailRecipients = (query: string): Promise<LeadMailRecipientSuggestion[]> =>
  apiClient
    .get<LeadMailRecipientSuggestion[]>(`${BASE}/search-recipients`, { params: { q: query } })
    .then((r) => r.data)

export const previewLeadMail = (request: LeadMailPreviewRequest): Promise<LeadMailPreviewResponse> =>
  apiClient.post<LeadMailPreviewResponse>(`${BASE}/preview`, request).then((r) => r.data)

export const testSendLeadMail = (request: LeadMailTestSendRequest): Promise<void> =>
  apiClient.post<void>(`${BASE}/test-send`, request).then(() => undefined)

export const sendLeadMail = (request: LeadMailSendRequest): Promise<LeadMailCampaignSummaryResponse> =>
  apiClient.post<LeadMailCampaignSummaryResponse>(`${BASE}/send`, request).then((r) => r.data)

export const getLeadMailCampaign = (campaignId: string): Promise<LeadMailCampaignSummaryResponse> =>
  apiClient.get<LeadMailCampaignSummaryResponse>(`${BASE}/campaigns/${campaignId}`).then((r) => r.data)

export const listLeadMailCampaigns = (
  page: number,
  size: number,
): Promise<LeadMailCampaignPageResponse> =>
  apiClient
    .get<LeadMailCampaignPageResponse>(`${BASE}/campaigns`, { params: { page, size } })
    .then((r) => r.data)
