/**
 * ─── OFFER ORDER API ─────────────────────────────────────────────────────────
 *
 * API functions for AdminOfferOrderController endpoints.
 * Base path: /api/v1/admin/offers/orders
 */

import { apiClient } from "@/lib/axios"
import type { GenericFilterRequest, GenericFilterResponse } from "@/core/filters/filter.types"
import type {
  AssignOfferReviewerRequest,
  CompleteOfferOrderRequest,
  OfferCancelOrderRequest,
  OfferDeliverableResponse,
  OfferOrderSummaryResponse,
} from "./offer-service.types"

const BASE = "/admin/offers/orders"

/** POST /admin/offers/orders/search — Paginated search of all offer orders */
export const adminSearchOfferOrders = (
  request: GenericFilterRequest,
  params: { page: number; size: number },
): Promise<GenericFilterResponse<OfferOrderSummaryResponse>> =>
  apiClient
    .post<GenericFilterResponse<OfferOrderSummaryResponse>>(
      `${BASE}/search?page=${params.page}&size=${params.size}`,
      request,
    )
    .then((r) => r.data)

/** GET /admin/offers/orders/{orderId} — Get a single order (admin) */
export const adminGetOfferOrder = (orderId: string): Promise<OfferOrderSummaryResponse> =>
  apiClient.get<OfferOrderSummaryResponse>(`${BASE}/${orderId}`).then((r) => r.data)

/** GET /admin/offers/orders/{orderId}/deliverables — List deliverables for an order */
export const adminListOrderDeliverables = (
  orderId: string,
): Promise<OfferDeliverableResponse[]> =>
  apiClient
    .get<OfferDeliverableResponse[]>(`${BASE}/${orderId}/deliverables`)
    .then((r) => r.data)

/** PUT /admin/offers/orders/{orderId}/start-progress — CONFIRMED → IN_PROGRESS */
export const adminStartOfferOrderProgress = (
  orderId: string,
): Promise<OfferOrderSummaryResponse> =>
  apiClient.put<OfferOrderSummaryResponse>(`${BASE}/${orderId}/start-progress`).then((r) => r.data)

/** PUT /admin/offers/orders/{orderId}/complete — IN_PROGRESS → COMPLETED */
export const adminCompleteOfferOrder = (
  orderId: string,
  request?: CompleteOfferOrderRequest,
): Promise<OfferOrderSummaryResponse> =>
  apiClient
    .put<OfferOrderSummaryResponse>(`${BASE}/${orderId}/complete`, request ?? {})
    .then((r) => r.data)

/** PUT /admin/offers/orders/{orderId}/assign-reviewer — Assign a reviewer */
export const adminAssignOfferReviewer = (
  orderId: string,
  request: AssignOfferReviewerRequest,
): Promise<OfferOrderSummaryResponse> =>
  apiClient
    .put<OfferOrderSummaryResponse>(`${BASE}/${orderId}/assign-reviewer`, request)
    .then((r) => r.data)

/** PUT /admin/offers/orders/{orderId}/cancel — Cancel an order (admin) */
export const adminCancelOfferOrder = (
  orderId: string,
  request?: OfferCancelOrderRequest,
): Promise<OfferOrderSummaryResponse> =>
  apiClient
    .put<OfferOrderSummaryResponse>(`${BASE}/${orderId}/cancel`, request ?? {})
    .then((r) => r.data)

/** POST /admin/offers/orders/{orderId}/deliverables — Upload a deliverable */
export const adminUploadDeliverable = (
  orderId: string,
  file: File,
  description?: string,
): Promise<OfferDeliverableResponse> => {
  const formData = new FormData()
  formData.append("file", file)
  const params = description ? `?description=${encodeURIComponent(description)}` : ""
  return apiClient
    .post<OfferDeliverableResponse>(`${BASE}/${orderId}/deliverables${params}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data)
}

/** DELETE /admin/offers/orders/deliverables/{deliverableId} — Delete a deliverable */
export const adminDeleteDeliverable = (deliverableId: string): Promise<void> =>
  apiClient.delete(`${BASE}/deliverables/${deliverableId}`).then(() => undefined)
