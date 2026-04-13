/**
 * ─── ADMIN INTAKES API ────────────────────────────────────────────────────────
 */

import { apiClient } from "@/lib/axios"
import type {
  GenericFilterRequest,
  GenericFilterResponse,
  PaginationParams,
} from "@/core/filters/filter.types"
import type { IntakeActionRequest, IntakeResponse } from "./admin-intakes.types"

/**
 * POST /api/v1/business-mentor/intakes/search
 * Returns paginated list of unconfirmed intakes (isUsed = false).
 */
export const searchAllIntakes = (
  request: GenericFilterRequest,
  params: PaginationParams,
): Promise<GenericFilterResponse<IntakeResponse>> =>
  apiClient
    .post<GenericFilterResponse<IntakeResponse>>(
      "/business-mentor/intakes/search",
      request,
      { params: { page: params.page, size: params.size } },
    )
    .then((r) => r.data)

/**
 * PUT /api/v1/business-mentor/intakes/{intakeId}/action
 * Marks an intake as actioned (admin contacted the user).
 */
export const markIntakeActionTaken = (
  intakeId: string,
  request?: IntakeActionRequest,
): Promise<IntakeResponse> =>
  apiClient
    .put<IntakeResponse>(`/business-mentor/intakes/${intakeId}/action`, request ?? {})
    .then((r) => r.data)

