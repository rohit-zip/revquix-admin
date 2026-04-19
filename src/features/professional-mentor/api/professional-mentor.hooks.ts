/**
 * ─── PROFESSIONAL MENTOR HOOKS ───────────────────────────────────────────────
 *
 * React Query hooks for Mentor Profile, Slots, Coupons, Payouts, and Discovery.
 */

"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { showErrorToast, showSuccessToast } from "@/lib/show-toast"
import type { ApiError, NetworkError } from "@/lib/api-error"
import type {
  BulkCancelSlotsRequest,
  CreateCouponRequest,
  OpenSlotsRequest,
  UpdateMentorProfileRequest,
  UpdatePricingRequest,
  AdminUpdateServiceFlagsRequest,
} from "./professional-mentor.types"
import {
  bulkCancelProfessionalSlots,
  cancelProfessionalSlot,
  completePayout,
  createCoupon,
  deactivateCoupon,
  deleteMentorResume,
  getMentorProfile,
  getMentorSlots,
  getMyCoupons,
  getMyMentorProfile,
  getAdminMentorRatings,
  getMyPayouts,
  getMyProfessionalSlots,
  getPayoutByBooking,
  getProfessionalSlotStats,
  openProfessionalSlots,
  processPayout,
  toggleAvailability,
  updateMentorProfile,
  updatePricing,
  uploadMentorResume,
  adminUpdateServiceFlags,
} from "./professional-mentor.api"

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const proMentorKeys = {
  profile: ["pro-mentor", "profile"] as const,
  slots: ["pro-mentor", "slots"] as const,
  slotStats: ["pro-mentor", "slot-stats"] as const,
  coupons: ["pro-mentor", "coupons"] as const,
  payouts: ["pro-mentor", "payouts"] as const,
  payoutByBooking: (bookingId: string) => ["pro-mentor", "payout-by-booking", bookingId] as const,
  mentorDetail: (id: string) => ["mentor-discovery", id] as const,
  mentorSlots: (id: string) => ["mentor-discovery", id, "slots"] as const,
  mentorSearch: ["mentor-discovery", "search"] as const,
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROFILE
// ═══════════════════════════════════════════════════════════════════════════════

export function useMentorProfile() {
  return useQuery({
    queryKey: proMentorKeys.profile,
    queryFn: getMyMentorProfile,
  })
}

export function useUpdateMentorProfile(onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateMentorProfileRequest) => updateMentorProfile(data),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Profile updated successfully")
      qc.invalidateQueries({ queryKey: proMentorKeys.profile })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

export function useUpdatePricing(onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdatePricingRequest) => updatePricing(data),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Pricing updated successfully")
      qc.invalidateQueries({ queryKey: proMentorKeys.profile })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

export function useToggleAvailability(onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: toggleAvailability,
    retry: false,
    onSuccess: (data) => {
      showSuccessToast(
        data.isAcceptingBookings
          ? "Now accepting bookings"
          : "No longer accepting bookings",
      )
      qc.invalidateQueries({ queryKey: proMentorKeys.profile })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

export function useUploadMentorResume(onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => uploadMentorResume(file),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Resume uploaded successfully")
      qc.invalidateQueries({ queryKey: proMentorKeys.profile })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

export function useDeleteMentorResume(onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteMentorResume,
    retry: false,
    onSuccess: () => {
      showSuccessToast("Resume deleted")
      qc.invalidateQueries({ queryKey: proMentorKeys.profile })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

/**
 * Admin hook: override per-service availability flags for any mentor.
 * Requires PERM_MANAGE_PROFESSIONAL_MENTORS.
 * Wire this to the mentor management UI when admin service-flag controls are built.
 */
export function useAdminUpdateServiceFlags(
  mentorProfileId: string,
  onSuccess?: () => void,
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: AdminUpdateServiceFlagsRequest) =>
      adminUpdateServiceFlags(mentorProfileId, data),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Mentor service flags updated")
      qc.invalidateQueries({ queryKey: proMentorKeys.mentorDetail(mentorProfileId) })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// MENTOR DISCOVERY
// ═══════════════════════════════════════════════════════════════════════════════

export function useMentorDetail(mentorProfileId: string) {
  return useQuery({
    queryKey: proMentorKeys.mentorDetail(mentorProfileId),
    queryFn: () => getMentorProfile(mentorProfileId),
    enabled: !!mentorProfileId,
  })
}

export function useMentorSlots(mentorProfileId: string) {
  return useQuery({
    queryKey: proMentorKeys.mentorSlots(mentorProfileId),
    queryFn: () => getMentorSlots(mentorProfileId),
    enabled: !!mentorProfileId,
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLOTS
// ═══════════════════════════════════════════════════════════════════════════════

export function useProfessionalSlots(page = 0, size = 20, from?: string, to?: string) {
  return useQuery({
    queryKey: [...proMentorKeys.slots, page, size, from, to],
    queryFn: () => getMyProfessionalSlots(page, size, from, to),
  })
}

export function useProfessionalSlotStats() {
  return useQuery({
    queryKey: proMentorKeys.slotStats,
    queryFn: getProfessionalSlotStats,
  })
}

export function useOpenProfessionalSlots(onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: OpenSlotsRequest) => openProfessionalSlots(data),
    retry: false,
    onSuccess: (data) => {
      showSuccessToast(`${data.length} slot(s) opened successfully`)
      qc.invalidateQueries({ queryKey: proMentorKeys.slots })
      qc.invalidateQueries({ queryKey: proMentorKeys.slotStats })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

export function useCancelProfessionalSlot(onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (slotId: string) => cancelProfessionalSlot(slotId),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Slot cancelled successfully")
      qc.invalidateQueries({ queryKey: proMentorKeys.slots })
      qc.invalidateQueries({ queryKey: proMentorKeys.slotStats })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

export function useBulkCancelProfessionalSlots(onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: BulkCancelSlotsRequest) => bulkCancelProfessionalSlots(data),
    retry: false,
    onSuccess: (data) => {
      showSuccessToast(`${data.cancelled} slot(s) cancelled`)
      qc.invalidateQueries({ queryKey: proMentorKeys.slots })
      qc.invalidateQueries({ queryKey: proMentorKeys.slotStats })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// COUPONS
// ═══════════════════════════════════════════════════════════════════════════════

export function useMyCoupons(page = 0, size = 20) {
  return useQuery({
    queryKey: [...proMentorKeys.coupons, page, size],
    queryFn: () => getMyCoupons(page, size),
  })
}

export function useCreateCoupon(onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateCouponRequest) => createCoupon(data),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Coupon created successfully")
      qc.invalidateQueries({ queryKey: proMentorKeys.coupons })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

export function useDeactivateCoupon(onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (couponId: string) => deactivateCoupon(couponId),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Coupon deactivated")
      qc.invalidateQueries({ queryKey: proMentorKeys.coupons })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAYOUTS
// ═══════════════════════════════════════════════════════════════════════════════

export function useMyPayouts(page = 0, size = 20) {
  return useQuery({
    queryKey: [...proMentorKeys.payouts, page, size],
    queryFn: () => getMyPayouts(page, size),
  })
}

/**
 * Fetches the payout record for a specific booking.
 * Returns `null` when no payout exists (e.g. cancelled before payment).
 */
export function usePayoutByBooking(bookingId: string, enabled = true) {
  return useQuery({
    queryKey: proMentorKeys.payoutByBooking(bookingId),
    queryFn: () => getPayoutByBooking(bookingId),
    enabled: enabled && !!bookingId,
    retry: false,
  })
}

export function useProcessPayout(onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payoutId: string) => processPayout(payoutId),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Payout marked as processing")
      qc.invalidateQueries({ queryKey: proMentorKeys.payouts })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

export function useCompletePayout(onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      payoutId,
      payoutReference,
      adminNote,
    }: {
      payoutId: string
      payoutReference: string
      adminNote?: string
    }) => completePayout(payoutId, payoutReference, adminNote),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Payout completed")
      qc.invalidateQueries({ queryKey: proMentorKeys.payouts })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// MENTOR RATINGS (Admin)
// ═══════════════════════════════════════════════════════════════════════════════

export function useAdminMentorRatings(mentorProfileId: string | undefined) {
  return useQuery({
    queryKey: ["admin", "mentor-ratings", mentorProfileId],
    queryFn: () => getAdminMentorRatings(mentorProfileId!),
    enabled: !!mentorProfileId,
  })
}

