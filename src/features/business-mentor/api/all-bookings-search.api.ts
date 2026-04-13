/**
 * ─── ALL BOOKINGS SEARCH API ──────────────────────────────────────────────────
 *
 * Raw API call for the admin all-bookings search endpoint.
 * POST /api/v1/business-mentor/bookings/all/search?page={page}&size={size}
 *
 * Replaces the old GET /business-mentor/bookings/all?status={status} call
 * with a fully composable filter/sort/paginate request.
 */

import { apiClient } from "@/lib/axios"
import type {
  GenericFilterRequest,
  GenericFilterResponse,
  PaginationParams,
} from "@/core/filters/filter.types"
import type { BookingResponse } from "./all-bookings-search.types"

/**
 * POST /api/v1/business-mentor/bookings/all/search
 *
 * Searches all bookings in the system with filters, range filters,
 * join filters, and sort. Requires ROLE_ADMIN or PERM_VIEW_ALL_BOOKINGS.
 */
export const searchAllBookings = (
  request: GenericFilterRequest,
  params: PaginationParams,
): Promise<GenericFilterResponse<BookingResponse>> =>
  apiClient
    .post<GenericFilterResponse<BookingResponse>>(
      "/business-mentor/bookings/all/search",
      request,
      { params: { page: params.page, size: params.size } },
    )
    .then((r) => r.data)

