/**
 * ─── HOURLY SESSION HOOKS (Admin) ────────────────────────────────────────────
 *
 * React Query hooks for admin hourly session management.
 */

"use client"

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
