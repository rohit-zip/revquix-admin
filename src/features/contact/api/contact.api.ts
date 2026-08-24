import { apiClient } from "@/lib/axios"
import type {
  AwaitingParty,
  ContactInquiryType,
  ContactNoteRequest,
  ContactQueryReplyResponse,
  ContactQueryResponse,
  ContactQueryStatus,
  ContactReplyRequest,
  ContactStatusUpdateRequest,
  SupportSlaSummaryResponse,
  SupportSource,
} from "./contact.types"

const BASE = "/admin/contact-queries"

export interface ContactQueryPageResponse {
  content: ContactQueryResponse[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

/**
 * Filters travel as one object rather than as positional arguments.
 *
 * This was `(page, size, status, inquiryType, q)` and Phase 2 adds two more. Six positional
 * parameters of which four are optional strings is a call site where a transposition compiles
 * cleanly and silently filters by the wrong thing.
 */
export interface ContactQueryFilters {
  page: number
  size: number
  status?: ContactQueryStatus
  inquiryType?: ContactInquiryType
  /** `STAFF` is the work queue: the member spoke last and nobody has answered. */
  awaitingParty?: AwaitingParty
  /** Splits sales leads from support tickets, which share this table. */
  source?: SupportSource
  q?: string
}

export const getContactQueries = (
  filters: ContactQueryFilters,
): Promise<ContactQueryPageResponse> =>
  apiClient
    .get<ContactQueryPageResponse>(BASE, {
      params: {
        page: filters.page,
        size: filters.size,
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.inquiryType ? { inquiryType: filters.inquiryType } : {}),
        ...(filters.awaitingParty ? { awaitingParty: filters.awaitingParty } : {}),
        ...(filters.source ? { source: filters.source } : {}),
        ...(filters.q ? { q: filters.q } : {}),
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

// ─── First-response SLA (Phase 4) ────────────────────────────────────────────

export const getSupportSlaSummary = (
  days = 30,
  targetHours = 24,
): Promise<SupportSlaSummaryResponse> =>
  apiClient
    .get<SupportSlaSummaryResponse>(`${BASE}/sla-summary`, { params: { days, targetHours } })
    .then((r) => r.data)
