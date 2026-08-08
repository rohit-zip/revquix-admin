"use client"

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
 * ─── HOURLY SESSION HOOKS (Admin) ────────────────────────────────────────────
 *
 * React Query hooks for admin hourly session management.
 */


import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { showErrorToast, showSuccessToast } from "@/lib/show-toast"
import type { ApiError } from "@/lib/api-error"
import {
  adminCancelHourlySession,
  getHourlySessionBooking,
} from "./hourly-session.api"

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const adminHourlySessionKeys = {
  /** Root prefix — invalidating this hits ALL hourly booking caches (lists, details). */
  all: ["hourly-booking"] as const,
  allBookings: ["hourly-booking", "all-bookings"] as const,
  detail: (id: string) => ["hourly-booking", "detail", id] as const,
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useAdminHourlyBooking(bookingId: string) {
  return useQuery({
    queryKey: adminHourlySessionKeys.detail(bookingId),
    queryFn: () => getHourlySessionBooking(bookingId),
    enabled: !!bookingId,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useAdminCancelHourlySession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ bookingId, reason }: { bookingId: string; reason?: string }) =>
      adminCancelHourlySession(bookingId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminHourlySessionKeys.all })
      showSuccessToast("Booking cancelled")
    },
    onError: (error: ApiError) => showErrorToast(error),
  })
}
