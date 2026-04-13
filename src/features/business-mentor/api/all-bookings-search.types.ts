/**
 * ─── ALL BOOKINGS SEARCH TYPES ───────────────────────────────────────────────
 *
 * Types for the admin all-bookings search endpoint.
 * POST /api/v1/business-mentor/bookings/all/search
 *
 * Re-exports BookingResponse (defined in business-mentor.types.ts) as the
 * canonical response type for this filter-based endpoint, keeping the
 * feature's type graph consistent.
 */

export type { BookingResponse, BookingStatus, BookingCategory } from "./business-mentor.types"

