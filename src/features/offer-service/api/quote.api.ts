/**
 * ─── CUSTOM QUOTE API ────────────────────────────────────────────────────────
 *
 * API functions for AdminCustomQuoteController.
 * Base path: /api/v1/admin/offers/quotes
 */

import { apiClient } from "@/lib/axios"
import type { GenericFilterRequest, GenericFilterResponse, PaginationParams } from "@/core/filters/filter.types"
import type {
  CreateQuoteRequest,
  OfferCancelOrderRequest,
  OfferOrderDetailResponse,
  OfferOrderSummaryResponse,
  UpdateQuoteRequest,
} from "./offer-service.types"

const BASE = "/admin/offers/quotes"

/** POST /admin/offers/quotes — create a draft quote */
export const adminCreateQuote = (request: CreateQuoteRequest): Promise<OfferOrderDetailResponse> =>
  apiClient.post<OfferOrderDetailResponse>(BASE, request).then((r) => r.data)

/** PUT /admin/offers/quotes/{orderId} — update / revise a quote */
export const adminUpdateQuote = (
  orderId: string,
  request: UpdateQuoteRequest,
): Promise<OfferOrderDetailResponse> =>
  apiClient.put<OfferOrderDetailResponse>(`${BASE}/${orderId}`, request).then((r) => r.data)

/** POST /admin/offers/quotes/{orderId}/send — send the quote to its recipient */
export const adminSendQuote = (orderId: string): Promise<OfferOrderDetailResponse> =>
  apiClient.post<OfferOrderDetailResponse>(`${BASE}/${orderId}/send`).then((r) => r.data)

/** PUT /admin/offers/quotes/{orderId}/cancel — cancel a quote */
export const adminCancelQuote = (
  orderId: string,
  request?: OfferCancelOrderRequest,
): Promise<OfferOrderSummaryResponse> =>
  apiClient
    .put<OfferOrderSummaryResponse>(`${BASE}/${orderId}/cancel`, request ?? {})
    .then((r) => r.data)

/** POST /admin/offers/quotes/search — paginated search of custom quotes */
export const adminSearchQuotes = (
  request: GenericFilterRequest,
  params: PaginationParams,
): Promise<GenericFilterResponse<OfferOrderSummaryResponse>> =>
  apiClient
    .post<GenericFilterResponse<OfferOrderSummaryResponse>>(
      `${BASE}/search?page=${params.page}&size=${params.size}`,
      request,
    )
    .then((r) => r.data)

/** GET /admin/offers/quotes/{orderId} — full quote detail (admin) */
export const adminGetQuote = (orderId: string): Promise<OfferOrderDetailResponse> =>
  apiClient.get<OfferOrderDetailResponse>(`${BASE}/${orderId}`).then((r) => r.data)
