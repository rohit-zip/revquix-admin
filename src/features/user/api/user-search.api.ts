/**
 * ─── USER SEARCH API ──────────────────────────────────────────────────────────
 *
 * Raw API call for the admin user search endpoint.
 */

import { apiClient } from "@/lib/axios"
import type { GenericFilterRequest, GenericFilterResponse, PaginationParams } from "@/core/filters/filter.types"
import type { AdminUserResponse } from "./user-search.types"

/**
 * POST /api/v1/user/search?page={page}&size={size}
 *
 * Searches users with filters, range filters, join filters, search, and sort.
 */
export const searchUsers = (
  request: GenericFilterRequest,
  params: PaginationParams,
): Promise<GenericFilterResponse<AdminUserResponse>> =>
  apiClient
    .post<GenericFilterResponse<AdminUserResponse>>(
      "/user/search",
      request,
      { params: { page: params.page, size: params.size } },
    )
    .then((r) => r.data)

