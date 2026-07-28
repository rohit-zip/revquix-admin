/**
 * ─── MENTORSHIP V2 (PHASE 3) COMMERCE API ────────────────────────────────────
 *
 * Backs AdminMentorshipV2CommerceController. Reads need
 * `PERM_VIEW_MENTORSHIP_V2_INTERNALS`; the sweeps and the refund need
 * `PERM_MANAGE_MENTORSHIP_V2_COMMERCE`, which is admin-only — granting someone read
 * access to debug a checkout must not also hand them the ability to move money.
 */

import { apiClient } from "@/lib/axios"
import type {
  AdminCommerceSnapshot,
  BookingStatusLogRow,
  CommerceOrderRow,
  IssueRefundPayload,
  RefundOutcome,
  RefundRow,
  SweepResult,
} from "./commerce.types"

const BASE = "/admin/mentorship-v2/commerce"

export const getCommerceSnapshot = (): Promise<AdminCommerceSnapshot> =>
  apiClient.get<AdminCommerceSnapshot>(`${BASE}/snapshot`).then((r) => r.data)

export const inspectCommerceOrder = (orderId: string): Promise<CommerceOrderRow> =>
  apiClient.get<CommerceOrderRow>(`${BASE}/orders/${orderId}`).then((r) => r.data)

export const getAdminBookingHistory = (bookingId: string): Promise<BookingStatusLogRow[]> =>
  apiClient.get<BookingStatusLogRow[]>(`${BASE}/bookings/${bookingId}/history`).then((r) => r.data)

export const getOrderRefunds = (orderId: string): Promise<RefundRow[]> =>
  apiClient.get<RefundRow[]>(`${BASE}/refunds`, { params: { orderId } }).then((r) => r.data)

export const runExpirySweep = (): Promise<SweepResult> =>
  apiClient.post<SweepResult>(`${BASE}/sweeps/expiry`).then((r) => r.data)

export const runReconciliation = (): Promise<SweepResult> =>
  apiClient.post<SweepResult>(`${BASE}/sweeps/reconciliation`).then((r) => r.data)

export const issueRefund = (payload: IssueRefundPayload): Promise<RefundOutcome> =>
  apiClient.post<RefundOutcome>(`${BASE}/refund`, payload).then((r) => r.data)
