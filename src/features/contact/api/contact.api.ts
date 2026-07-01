import { apiClient } from "@/lib/axios"
import type {
  ContactInquiryType,
  ContactNoteRequest,
  ContactQueryReplyResponse,
  ContactQueryResponse,
  ContactQueryStatus,
  ContactReplyRequest,
  ContactStatusUpdateRequest,
} from "./contact.types"

const BASE = "/admin/contact-queries"

export interface ContactQueryPageResponse {
  content: ContactQueryResponse[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export const getContactQueries = (
  page: number,
  size: number,
  status?: ContactQueryStatus,
  inquiryType?: ContactInquiryType,
  q?: string,
): Promise<ContactQueryPageResponse> =>
  apiClient
    .get<ContactQueryPageResponse>(BASE, {
      params: {
        page,
        size,
        ...(status ? { status } : {}),
        ...(inquiryType ? { inquiryType } : {}),
        ...(q ? { q } : {}),
      },
    })
    .then((r) => r.data)

export const getContactQueryById = (contactQueryId: string): Promise<ContactQueryResponse> =>
  apiClient.get<ContactQueryResponse>(`${BASE}/${contactQueryId}`).then((r) => r.data)

export const updateContactStatus = (
  contactQueryId: string,
  request: ContactStatusUpdateRequest,
): Promise<ContactQueryResponse> =>
  apiClient.put<ContactQueryResponse>(`${BASE}/${contactQueryId}/status`, request).then((r) => r.data)

export const updateContactNote = (
  contactQueryId: string,
  request: ContactNoteRequest,
): Promise<ContactQueryResponse> =>
  apiClient.put<ContactQueryResponse>(`${BASE}/${contactQueryId}/note`, request).then((r) => r.data)

export const replyToContactQuery = (
  contactQueryId: string,
  request: ContactReplyRequest,
): Promise<ContactQueryReplyResponse> =>
  apiClient.post<ContactQueryReplyResponse>(`${BASE}/${contactQueryId}/reply`, request).then((r) => r.data)
