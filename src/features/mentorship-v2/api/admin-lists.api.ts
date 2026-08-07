/**
 * ─── ADMIN LIST ENDPOINTS ─────────────────────────────────────────────────────
 *
 * The six browsable projections behind the Professional Mentor console's tables, plus the
 * feedback-breach list.
 *
 * All six follow the house `GenericFilterRequest` → `GenericFilterResponse` contract, so they drop
 * straight into `useGenericSearch` + `DataExplorer` the way every other admin table in this app
 * already does. The API base path is still `/admin/mentorship-v2/**` — only the console's own routes
 * moved to `/professional-mentor/*`. Renaming sixteen controller mappings and their contract tests
 * would buy an operator nothing, since nobody reads an API path.
 */

import { apiClient } from "@/lib/axios"
import type {
  GenericFilterRequest,
  GenericFilterResponse,
  PaginationParams,
} from "@/core/filters/filter.types"
import type {
  AdminBookingRow,
  AdminEntitlementRow,
  AdminFeedbackBreachRow,
  AdminOrderRow,
  AdminRefundRow,
  AdminCatalogueRow,
} from "./admin-lists.types"
import type { DisputeRow } from "./disputes.types"

const BASE = "/admin/mentorship-v2"

/** Pagination rides in the query string, filters in the body — the contract every search endpoint uses. */
function search<T>(
  path: string,
  request: GenericFilterRequest,
  params: PaginationParams,
): Promise<GenericFilterResponse<T>> {
  return apiClient
    .post<GenericFilterResponse<T>>(
      `${BASE}${path}?page=${params.page}&size=${params.size}`,
      request,
    )
    .then((r) => r.data)
}

/** POST /admin/mentorship-v2/calls/bookings/search */
export const searchBookings = (request: GenericFilterRequest, params: PaginationParams) =>
  search<AdminBookingRow>("/calls/bookings/search", request, params)

/** POST /admin/mentorship-v2/commerce/orders/search */
export const searchOrders = (request: GenericFilterRequest, params: PaginationParams) =>
  search<AdminOrderRow>("/commerce/orders/search", request, params)

/** POST /admin/mentorship-v2/commerce/refunds/search */
export const searchRefunds = (request: GenericFilterRequest, params: PaginationParams) =>
  search<AdminRefundRow>("/commerce/refunds/search", request, params)

/** POST /admin/mentorship-v2/services/search */
export const searchServices = (request: GenericFilterRequest, params: PaginationParams) =>
  search<AdminCatalogueRow>("/services/search", request, params)

/** POST /admin/mentorship-v2/packages/entitlements/search */
export const searchEntitlements = (request: GenericFilterRequest, params: PaginationParams) =>
  search<AdminEntitlementRow>("/packages/entitlements/search", request, params)

/**
 * POST /admin/mentorship-v2/disputes/search
 *
 * The browsable dispute table. Distinct from `GET /disputes/queue`, which is the work-queue preset
 * (urgent band first, then oldest first) whose order is baked into its query on purpose — a
 * newest-first queue starves the cases closest to breaching. This endpoint sorts however the
 * operator asks, and `slaDueAt ASC` reproduces "breaching soonest" from data.
 */
export const searchDisputes = (request: GenericFilterRequest, params: PaginationParams) =>
  search<DisputeRow>("/disputes/search", request, params)

/**
 * GET /admin/mentorship-v2/calls/feedback-breaches
 *
 * Not paginated: the list is supposed to be empty, and a console that needs to page through it is
 * a console reporting an outage.
 */
export const getFeedbackBreaches = (limit = 100): Promise<AdminFeedbackBreachRow[]> =>
  apiClient
    .get<AdminFeedbackBreachRow[]>(`${BASE}/calls/feedback-breaches?limit=${limit}`)
    .then((r) => r.data)
