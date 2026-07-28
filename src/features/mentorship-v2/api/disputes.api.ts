/**
 * ─── MENTORSHIP V2 (PHASE 7) DISPUTE ADMIN API ───────────────────────────────
 *
 * Backs `AdminMentorshipV2DisputeController`.
 *
 * Two permissions, deliberately split: reads need `PERM_VIEW_MENTORSHIP_V2_INTERNALS` (seeing a
 * queue is how an on-call engineer debugs an SLA sweep), while every write needs the new
 * `PERM_MANAGE_MENTORSHIP_DISPUTES` (V190) — resolving a dispute is a discretionary judgement that
 * moves money between two named parties and can suspend a mentor's services. A reader holding only
 * the first gets the page and a clean 403 on the action buttons, which is better than hiding
 * controls whose absence would be confusing.
 */

import { apiClient } from "@/lib/axios"
import type {
  AdminDisputeMessageRequest,
  AdminDisputeSnapshot,
  DisputeRow,
  DisputeSlaSweepReport,
  PagedResponse,
  ResolutionOption,
  ResolveDisputeRequest,
} from "./disputes.types"

const BASE = "/admin/mentorship-v2/disputes"

// ─── Reads ──────────────────────────────────────────────────────────────────

export const getDisputeSnapshot = (): Promise<AdminDisputeSnapshot> =>
  apiClient.get<AdminDisputeSnapshot>(`${BASE}/snapshot`).then((r) => r.data)

export const getDisputeQueue = (params: {
  status?: string
  mentorUserId?: string
  assignedAdminId?: string
  liveOnly?: boolean
  page?: number
  size?: number
}): Promise<PagedResponse<DisputeRow>> =>
  apiClient.get<PagedResponse<DisputeRow>>(`${BASE}/queue`, { params }).then((r) => r.data)

export const inspectDispute = (disputeId: string): Promise<DisputeRow> =>
  apiClient.get<DisputeRow>(`${BASE}/${disputeId}`).then((r) => r.data)

export const getRefundableHeadroom = (disputeId: string): Promise<{ refundableMinor: number }> =>
  apiClient
    .get<{ refundableMinor: number }>(`${BASE}/${disputeId}/refundable`)
    .then((r) => r.data)

export const getResolutionCatalogue = (): Promise<ResolutionOption[]> =>
  apiClient.get<ResolutionOption[]>(`${BASE}/resolution-catalogue`).then((r) => r.data)

// ─── Writes ─────────────────────────────────────────────────────────────────

export const assignDispute = (disputeId: string, adminUserId?: string): Promise<DisputeRow> =>
  apiClient
    .post<DisputeRow>(`${BASE}/${disputeId}/assign`, undefined, {
      params: adminUserId ? { adminUserId } : undefined,
    })
    .then((r) => r.data)

export const replyOnDisputeAsAdmin = (
  disputeId: string,
  payload: AdminDisputeMessageRequest,
): Promise<DisputeRow> =>
  apiClient.post<DisputeRow>(`${BASE}/${disputeId}/messages`, payload).then((r) => r.data)

export const requestDisputeInfo = (
  disputeId: string,
  fromBuyer: boolean,
  payload: AdminDisputeMessageRequest,
): Promise<DisputeRow> =>
  apiClient
    .post<DisputeRow>(`${BASE}/${disputeId}/request-info`, payload, { params: { fromBuyer } })
    .then((r) => r.data)

export const resolveDispute = (
  disputeId: string,
  payload: ResolveDisputeRequest,
): Promise<DisputeRow> =>
  apiClient.post<DisputeRow>(`${BASE}/${disputeId}/resolve`, payload).then((r) => r.data)

export const tryAutoResolveDispute = (disputeId: string): Promise<DisputeRow> =>
  apiClient.post<DisputeRow>(`${BASE}/${disputeId}/try-auto-resolve`).then((r) => r.data)

export const runDisputeSlaSweep = (): Promise<DisputeSlaSweepReport> =>
  apiClient.post<DisputeSlaSweepReport>(`${BASE}/sweeps/sla`).then((r) => r.data)

export const recomputeMentorReliability = (mentorUserId: string): Promise<void> =>
  apiClient.post<void>(`${BASE}/reliability/${mentorUserId}/recompute`).then((r) => r.data)
