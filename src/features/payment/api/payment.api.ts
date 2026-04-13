/**
 * ─── PAYMENT API ──────────────────────────────────────────────────────────────
 *
 * API calls for PaymentController endpoints.
 */

import { apiClient } from "@/lib/axios"
import type { GenericFilterRequest, GenericFilterResponse } from "@/core/filters/filter.types"
import type { PaymentOrderResponse, PaymentWebhookLogResponse, MentorWalletSummaryResponse } from "./payment.types"

const BASE = "/payments"

// ─── User ─────────────────────────────────────────────────────────────────────

/** GET /payments/pending — Pending payment orders (page reload recovery) */
export const getPendingPayments = (): Promise<PaymentOrderResponse[]> =>
  apiClient.get<PaymentOrderResponse[]>(`${BASE}/pending`).then((r) => r.data)

/** GET /payments/status/{razorpayOrderId} — Poll payment status */
export const getPaymentStatus = (razorpayOrderId: string): Promise<PaymentOrderResponse> =>
  apiClient
    .get<PaymentOrderResponse>(`${BASE}/status/${razorpayOrderId}`)
    .then((r) => r.data)

/** GET /payments/history — Get my payment history */
export const getPaymentHistory = (): Promise<PaymentOrderResponse[]> =>
  apiClient.get<PaymentOrderResponse[]>(`${BASE}/history`).then((r) => r.data)

/** GET /payments/{paymentOrderId} — Get a single payment order detail */
export const getPaymentDetail = (paymentOrderId: string): Promise<PaymentOrderResponse> =>
  apiClient.get<PaymentOrderResponse>(`${BASE}/${paymentOrderId}`).then((r) => r.data)

// ─── Admin ────────────────────────────────────────────────────────────────────

/** POST /payments/admin/search — Admin search all payment orders with filters */
export const adminSearchPayments = (
  request: GenericFilterRequest,
  params: { page: number; size: number },
): Promise<GenericFilterResponse<PaymentOrderResponse>> =>
  apiClient
    .post<GenericFilterResponse<PaymentOrderResponse>>(
      `${BASE}/admin/search?page=${params.page}&size=${params.size}`,
      request,
    )
    .then((r) => r.data)

/** GET /payments/admin/{paymentOrderId} — Admin: get a single payment order by ID */
export const getAdminPaymentDetail = (paymentOrderId: string): Promise<PaymentOrderResponse> =>
  apiClient.get<PaymentOrderResponse>(`${BASE}/admin/${paymentOrderId}`).then((r) => r.data)

/** POST /payments/admin/webhooks/search — Admin: search webhook logs with filters */
export const searchWebhookLogs = (
  request: GenericFilterRequest,
  params: { page: number; size: number },
): Promise<GenericFilterResponse<PaymentWebhookLogResponse>> =>
  apiClient
    .post<GenericFilterResponse<PaymentWebhookLogResponse>>(
      `${BASE}/admin/webhooks/search?page=${params.page}&size=${params.size}`,
      request,
    )
    .then((r) => r.data)

/** GET /payments/admin/webhooks/{id} — Admin: get a single webhook log by ID */
export const getWebhookLogById = (id: number): Promise<PaymentWebhookLogResponse> =>
  apiClient.get<PaymentWebhookLogResponse>(`${BASE}/admin/webhooks/${id}`).then((r) => r.data)

// ─── Mentor Wallets ───────────────────────────────────────────────────────────

const WALLETS = "/wallets"

/** GET /wallets/my — Get my wallet summary (mentor) */
export const getMyWallet = (): Promise<MentorWalletSummaryResponse> =>
  apiClient.get<MentorWalletSummaryResponse>(`${WALLETS}/my`).then((r) => r.data)

/** GET /wallets/admin/summary — Admin: get all mentor wallet summaries */
export const getAllMentorWallets = (): Promise<MentorWalletSummaryResponse[]> =>
  apiClient.get<MentorWalletSummaryResponse[]>(`${WALLETS}/admin/summary`).then((r) => r.data)

/** GET /wallets/admin/{mentorUserId} — Admin: get wallet for a specific mentor */
export const getMentorWallet = (mentorUserId: string): Promise<MentorWalletSummaryResponse> =>
  apiClient.get<MentorWalletSummaryResponse>(`${WALLETS}/admin/${mentorUserId}`).then((r) => r.data)

/** PUT /wallets/admin/{mentorProfileId}/commission — Admin: update per-mentor commission */
export const updateMentorCommission = (
  mentorProfileId: string,
  commissionPercentage: number | null,
): Promise<Record<string, string>> =>
  apiClient
    .put<Record<string, string>>(`${WALLETS}/admin/${mentorProfileId}/commission`, {
      commissionPercentage,
    })
    .then((r) => r.data)

// ─── Admin Refund ─────────────────────────────────────────────────────────────

/** POST /payments/admin/{paymentOrderId}/refund — Admin: initiate manual refund */
export const adminRefund = (
  paymentOrderId: string,
  amountMinor: number,
  reason: string,
): Promise<Record<string, unknown>> =>
  apiClient
    .post<Record<string, unknown>>(`${BASE}/admin/${paymentOrderId}/refund`, {
      amountMinor,
      reason,
    })
    .then((r) => r.data)

/** GET /payments/admin/{paymentOrderId}/refunds — Admin: get refund history for a payment order */
export const getRefundHistory = (
  paymentOrderId: string,
): Promise<Record<string, unknown>[]> =>
  apiClient
    .get<Record<string, unknown>[]>(`${BASE}/admin/${paymentOrderId}/refunds`)
    .then((r) => r.data)

/** GET /payments/admin/{paymentOrderId}/refundable — Admin: get remaining refundable amount */
export const getRemainingRefundable = (
  paymentOrderId: string,
): Promise<{ remainingRefundable: number }> =>
  apiClient
    .get<{ remainingRefundable: number }>(`${BASE}/admin/${paymentOrderId}/refundable`)
    .then((r) => r.data)

