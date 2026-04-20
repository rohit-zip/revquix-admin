/**
 * ─── HOURLY SESSION API (Admin) ──────────────────────────────────────────────
 *
 * API calls for admin hourly session management.
 */

import { apiClient } from "@/lib/axios"
import type { GenericFilterRequest, GenericFilterResponse } from "@/core/filters/filter.types"
import type { HourlySessionBookingResponse } from "./hourly-session.types"

const BASE = "/hourly-session"

/** POST /hourly-session/admin/search — Admin: search all hourly sessions */
export const searchAllHourlySessions = (
  request: GenericFilterRequest,
  params: { page: number; size: number },
): Promise<GenericFilterResponse<HourlySessionBookingResponse>> =>
  apiClient
    .post<GenericFilterResponse<HourlySessionBookingResponse>>(
      `${BASE}/admin/search?page=${params.page}&size=${params.size}`,
      request,
    )
    .then((r) => r.data)

/** GET /hourly-session/{bookingId} — Get booking details */
export const getHourlySessionBooking = (bookingId: string): Promise<HourlySessionBookingResponse> =>
  apiClient
    .get<HourlySessionBookingResponse>(`${BASE}/${bookingId}`)
    .then((r) => r.data)

/** PUT /hourly-session/{bookingId}/cancel — Admin cancel booking */
export const adminCancelHourlySession = (
  bookingId: string,
  reason?: string,
): Promise<HourlySessionBookingResponse> =>
  apiClient
    .put<HourlySessionBookingResponse>(`${BASE}/${bookingId}/cancel`, { reason })
    .then((r) => r.data)

