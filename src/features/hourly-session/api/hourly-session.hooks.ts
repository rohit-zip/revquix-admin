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
  allBookings: ["admin-hourly-session", "all-bookings"] as const,
  detail: (id: string) => ["admin-hourly-session", "detail", id] as const,
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
    onSuccess: (_, { bookingId }) => {
      queryClient.invalidateQueries({ queryKey: adminHourlySessionKeys.detail(bookingId) })
      queryClient.invalidateQueries({ queryKey: adminHourlySessionKeys.allBookings })
      showSuccessToast("Booking cancelled")
    },
    onError: (error: ApiError) => showErrorToast(error),
  })
}
