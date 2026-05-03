/**
 * ─── OFFER SERVICE API ────────────────────────────────────────────────────────
 *
 * API functions for AdminOfferServiceController endpoints.
 * Base path: /api/v1/admin/offers
 */

import { apiClient } from "@/lib/axios"
import type { GenericFilterRequest, GenericFilterResponse } from "@/core/filters/filter.types"
import type {
  CouponResponse,
  CreateOfferAddOnRequest,
  CreateOfferFormFieldRequest,
  CreateOfferPlanRequest,
  CreateOfferServiceRequest,
  CreatePlatformCouponRequest,
  OfferAddOnResponse,
  OfferFormFieldResponse,
  OfferPlanResponse,
  OfferServiceResponse,
  UpdateOfferAddOnRequest,
  UpdateOfferFormFieldRequest,
  UpdateOfferPlanRequest,
  UpdateOfferServiceRequest,
} from "./offer-service.types"

const BASE = "/admin/offers"

// ─── Services ──────────────────────────────────────────────────────────────────

/** POST /admin/offers/services/search — Paginated search of all offer services */
export const adminSearchOfferServices = (
  request: GenericFilterRequest,
  params: { page: number; size: number },
): Promise<GenericFilterResponse<OfferServiceResponse>> =>
  apiClient
    .post<GenericFilterResponse<OfferServiceResponse>>(
      `${BASE}/services/search?page=${params.page}&size=${params.size}`,
      request,
    )
    .then((r) => r.data)

/** GET /admin/offers/services/{serviceId} — Full admin detail for a service */
export const adminGetOfferService = (serviceId: string): Promise<OfferServiceResponse> =>
  apiClient
    .get<OfferServiceResponse>(`${BASE}/services/${serviceId}`)
    .then((r) => r.data)

/** POST /admin/offers/services — Create a new offer service */
export const adminCreateOfferService = (
  request: CreateOfferServiceRequest,
): Promise<OfferServiceResponse> =>
  apiClient
    .post<OfferServiceResponse>(`${BASE}/services`, request)
    .then((r) => r.data)

/** PUT /admin/offers/services/{serviceId} — Update an offer service */
export const adminUpdateOfferService = (
  serviceId: string,
  request: UpdateOfferServiceRequest,
): Promise<OfferServiceResponse> =>
  apiClient
    .put<OfferServiceResponse>(`${BASE}/services/${serviceId}`, request)
    .then((r) => r.data)

// ─── Plans ────────────────────────────────────────────────────────────────────

/** POST /admin/offers/plans — Create a plan for an offer service */
export const adminCreateOfferPlan = (
  request: CreateOfferPlanRequest,
): Promise<OfferPlanResponse> =>
  apiClient.post<OfferPlanResponse>(`${BASE}/plans`, request).then((r) => r.data)

/** PUT /admin/offers/plans/{planId} — Update an offer plan */
export const adminUpdateOfferPlan = (
  planId: string,
  request: UpdateOfferPlanRequest,
): Promise<OfferPlanResponse> =>
  apiClient.put<OfferPlanResponse>(`${BASE}/plans/${planId}`, request).then((r) => r.data)

// ─── Add-ons ──────────────────────────────────────────────────────────────────

/** POST /admin/offers/add-ons — Create an add-on for an offer service */
export const adminCreateOfferAddOn = (
  request: CreateOfferAddOnRequest,
): Promise<OfferAddOnResponse> =>
  apiClient.post<OfferAddOnResponse>(`${BASE}/add-ons`, request).then((r) => r.data)

/** PUT /admin/offers/add-ons/{addOnId} — Update an offer add-on */
export const adminUpdateOfferAddOn = (
  addOnId: string,
  request: UpdateOfferAddOnRequest,
): Promise<OfferAddOnResponse> =>
  apiClient.put<OfferAddOnResponse>(`${BASE}/add-ons/${addOnId}`, request).then((r) => r.data)

// ─── Form Fields ──────────────────────────────────────────────────────────────

/** POST /admin/offers/form-fields — Create a form field for an offer service */
export const adminCreateOfferFormField = (
  request: CreateOfferFormFieldRequest,
): Promise<OfferFormFieldResponse> =>
  apiClient
    .post<OfferFormFieldResponse>(`${BASE}/form-fields`, request)
    .then((r) => r.data)

/** PUT /admin/offers/form-fields/{fieldId} — Update an offer form field */
export const adminUpdateOfferFormField = (
  fieldId: string,
  request: UpdateOfferFormFieldRequest,
): Promise<OfferFormFieldResponse> =>
  apiClient
    .put<OfferFormFieldResponse>(`${BASE}/form-fields/${fieldId}`, request)
    .then((r) => r.data)

// ─── Platform Coupons ─────────────────────────────────────────────────────────

/** GET /admin/offers/coupons?page&size — List all platform coupons */
export const adminListPlatformCoupons = (params: {
  page: number
  size: number
}): Promise<{ content: CouponResponse[]; totalElements: number; totalPages: number }> =>
  apiClient
    .get<{ content: CouponResponse[]; totalElements: number; totalPages: number }>(
      `${BASE}/coupons?page=${params.page}&size=${params.size}`,
    )
    .then((r) => r.data)

/** POST /admin/offers/coupons — Create a platform coupon */
export const adminCreatePlatformCoupon = (
  request: CreatePlatformCouponRequest,
): Promise<CouponResponse> =>
  apiClient.post<CouponResponse>(`${BASE}/coupons`, request).then((r) => r.data)

/** PUT /admin/offers/coupons/{couponId}/deactivate — Deactivate a platform coupon */
export const adminDeactivatePlatformCoupon = (couponId: string): Promise<CouponResponse> =>
  apiClient
    .put<CouponResponse>(`${BASE}/coupons/${couponId}/deactivate`)
    .then((r) => r.data)
