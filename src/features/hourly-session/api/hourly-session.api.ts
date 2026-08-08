/**
 * ⚠️ PROFESSIONAL MENTOR V1 — RETIRED SURFACE
 *
 * Part of the legacy (V1) mentorship stack that Professional Mentor V2 replaced. Nothing
 * advertises it: no sidebar entry, no command-palette row, no avatar-menu item, and every public
 * "Book session" CTA resolves to the mentor's V2 storefront instead.
 *
 * It stays mounted deliberately. `app.mentorship.cutover.stage` is still `DUAL_RUN`, legacy
 * bookings that already exist have to stay readable, and notification mail already delivered
 * carries deep links straight into these pages. `LegacyV1Notice` renders on each one to name its
 * V2 successor.
 *
 * Deletion is gated on `legacy.archive_readiness()` reading zero blocking rows, the cutover stage
 * reaching `DECOMMISSIONED`, and the 90-day `archive-retention-days` window.
 *
 * @deprecated Superseded by Professional Mentor V2. Do not add features here.
 */

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

