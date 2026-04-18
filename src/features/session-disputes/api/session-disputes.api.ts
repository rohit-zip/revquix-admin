/**
 * ─── SESSION DISPUTES API ─────────────────────────────────────────────────────
 *
 * Admin API calls for SessionDisputeController.
 * Base: /admin/session-disputes
 */

import { apiClient } from "@/lib/axios"
import type { SessionDisputeResponse, DisputeResolveRequest, DisputeStatus } from "./session-disputes.types"

const BASE = "/admin/session-disputes"

export interface DisputePageResponse {
  content: SessionDisputeResponse[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

/**
 * GET /admin/session-disputes
 * Returns a paginated list, optionally filtered by status.
 */
export const getDisputes = (
  page: number,
  size: number,
  status?: DisputeStatus,
): Promise<DisputePageResponse> =>
  apiClient
    .get<DisputePageResponse>(BASE, {
      params: { page, size, ...(status ? { status } : {}) },
    })
    .then((r) => r.data)

/**
 * GET /admin/session-disputes/{disputeId}
 */
export const getDisputeById = (disputeId: string): Promise<SessionDisputeResponse> =>
  apiClient
    .get<SessionDisputeResponse>(`${BASE}/${disputeId}`)
    .then((r) => r.data)

/**
 * PUT /admin/session-disputes/{disputeId}/under-review
 * Moves a dispute to UNDER_REVIEW.
 */
export const markUnderReview = (disputeId: string): Promise<SessionDisputeResponse> =>
  apiClient
    .put<SessionDisputeResponse>(`${BASE}/${disputeId}/under-review`)
    .then((r) => r.data)

/**
 * PUT /admin/session-disputes/{disputeId}/resolve
 * Resolves a dispute with one of: MARK_COMPLETED, MARK_NO_SHOW_USER, MARK_NO_SHOW_MENTOR.
 */
export const resolveDispute = (
  disputeId: string,
  request: DisputeResolveRequest,
): Promise<SessionDisputeResponse> =>
  apiClient
    .put<SessionDisputeResponse>(`${BASE}/${disputeId}/resolve`, request)
    .then((r) => r.data)
