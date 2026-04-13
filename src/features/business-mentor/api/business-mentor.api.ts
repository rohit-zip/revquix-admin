/**
 * ─── BUSINESS MENTOR API ─────────────────────────────────────────────────────
 *
 * API calls for BusinessMentorController endpoints.
 * All paths are relative to the apiClient baseURL (/api/v1).
 */

import { apiClient } from "@/lib/axios"
import type {
  BookingResponse,
  BookingStatus,
  BulkCancelSlotsRequest,
  MentorSlotResponse,
  MentorSlotStatsResponse,
  OpenSlotsRequest,
  SpringPageResponse,
} from "./business-mentor.types"

// ═══════════════════════════════════════════════════════════════════════════════
// SLOT MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

/** POST /business-mentor/slots/open — Open availability slots for a date/time range */
export const openSlots = (data: OpenSlotsRequest): Promise<MentorSlotResponse[]> =>
  apiClient.post<MentorSlotResponse[]>("/business-mentor/slots/open", data).then((r) => r.data)

/** GET /business-mentor/slots/my — Paginated list of the mentor's own slots */
export const getMySlots = (
  page = 0,
  size = 10,
  from?: string,
  to?: string,
): Promise<SpringPageResponse<MentorSlotResponse>> =>
  apiClient
    .get<SpringPageResponse<MentorSlotResponse>>("/business-mentor/slots/my", {
      params: { page, size, ...(from && { from }), ...(to && { to }) },
    })
    .then((r) => r.data)

/** GET /business-mentor/slots/stats — Aggregate slot statistics */
export const getSlotStats = (): Promise<MentorSlotStatsResponse> =>
  apiClient.get<MentorSlotStatsResponse>("/business-mentor/slots/stats").then((r) => r.data)

/** DELETE /business-mentor/slots/{slotId} — Cancel a single unbooked slot */
export const cancelSlot = (slotId: string): Promise<void> =>
  apiClient.delete(`/business-mentor/slots/${slotId}`).then(() => undefined)

/** DELETE /business-mentor/slots/bulk — Bulk cancel unbooked slots in a date range */
export const bulkCancelSlots = (
  data: BulkCancelSlotsRequest,
): Promise<{ cancelledCount: number; message: string }> =>
  apiClient
    .delete<{ cancelledCount: number; message: string }>("/business-mentor/slots/bulk", {
      data,
    })
    .then((r) => r.data)

// ═══════════════════════════════════════════════════════════════════════════════
// BOOKING VIEWS
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /business-mentor/bookings/my — Bookings assigned to the current mentor */
export const getMyBookings = (
  page = 0,
  size = 10,
  status?: BookingStatus,
): Promise<SpringPageResponse<BookingResponse>> =>
  apiClient
    .get<SpringPageResponse<BookingResponse>>("/business-mentor/bookings/my", {
      params: { page, size, ...(status && { status }) },
    })
    .then((r) => r.data)

/** GET /business-mentor/bookings/all — All bookings system-wide */
export const getAllBookings = (
  page = 0,
  size = 10,
  status?: BookingStatus,
): Promise<SpringPageResponse<BookingResponse>> =>
  apiClient
    .get<SpringPageResponse<BookingResponse>>("/business-mentor/bookings/all", {
      params: { page, size, ...(status && { status }) },
    })
    .then((r) => r.data)

