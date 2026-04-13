/**
 * ─── BUSINESS MENTOR HOOKS ──────────────────────────────────────────────────
 *
 * React Query hooks for BusinessMentorController endpoints.
 * Follows existing app patterns: useMutation with toast feedback,
 * automatic query invalidation on success.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { showErrorToast, showSuccessToast } from "@/lib/show-toast"
import type { ApiError, NetworkError } from "@/lib/api-error"
import type { BookingStatus, BulkCancelSlotsRequest, OpenSlotsRequest } from "./business-mentor.types"
import {
  bulkCancelSlots,
  cancelSlot,
  getAllBookings,
  getMyBookings,
  getMySlots,
  getSlotStats,
  openSlots,
} from "./business-mentor.api"

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const mentorKeys = {
  slots: ["mentor", "slots"] as const,
  slotStats: ["mentor", "slot-stats"] as const,
  myBookings: ["mentor", "my-bookings"] as const,
  allBookings: ["mentor", "all-bookings"] as const,
}

// ─── Slot Queries ─────────────────────────────────────────────────────────────

export function useMySlots(page = 0, size = 10, from?: string, to?: string) {
  return useQuery({
    queryKey: [...mentorKeys.slots, page, size, from, to],
    queryFn: () => getMySlots(page, size, from, to),
  })
}

export function useSlotStats() {
  return useQuery({
    queryKey: mentorKeys.slotStats,
    queryFn: getSlotStats,
  })
}

// ─── Slot Mutations ───────────────────────────────────────────────────────────

export function useOpenSlots(onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: OpenSlotsRequest) => openSlots(data),
    retry: false,
    onSuccess: (data) => {
      showSuccessToast(`${data.length} slot(s) opened successfully`)
      qc.invalidateQueries({ queryKey: mentorKeys.slots })
      qc.invalidateQueries({ queryKey: mentorKeys.slotStats })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

export function useCancelSlot(onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (slotId: string) => cancelSlot(slotId),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Slot cancelled successfully")
      qc.invalidateQueries({ queryKey: mentorKeys.slots })
      qc.invalidateQueries({ queryKey: mentorKeys.slotStats })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

export function useBulkCancelSlots(onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: BulkCancelSlotsRequest) => bulkCancelSlots(data),
    retry: false,
    onSuccess: (data) => {
      showSuccessToast(data.message)
      qc.invalidateQueries({ queryKey: mentorKeys.slots })
      qc.invalidateQueries({ queryKey: mentorKeys.slotStats })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

// ─── Booking Queries ──────────────────────────────────────────────────────────

export function useMyBookings(page = 0, size = 10, status?: BookingStatus) {
  return useQuery({
    queryKey: [...mentorKeys.myBookings, page, size, status],
    queryFn: () => getMyBookings(page, size, status),
  })
}

export function useAllBookings(page = 0, size = 10, status?: BookingStatus) {
  return useQuery({
    queryKey: [...mentorKeys.allBookings, page, size, status],
    queryFn: () => getAllBookings(page, size, status),
  })
}

