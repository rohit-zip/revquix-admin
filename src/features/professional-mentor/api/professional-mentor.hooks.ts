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
  bulkProcessPayouts,
  cancelProfessionalSlot,
  completePayout,
  createCoupon,
  deactivateCoupon,
  deleteMentorResume,
  downloadPayoutsCsv,
  getCommissionRevenue,
  getMentorEarningsBreakdown,
  getMentorProfile,
  getMentorSlots,
  getMyCoupons,
  getMyMentorProfile,
  getAdminMentorRatings,
  getMyPayouts,
  getMyProfessionalSlots,
  getPayoutAuditLog,
  getPayoutByBooking,
  getPayoutStats,
  getMonthlyPayoutSummary,
  getProfessionalSlotStats,
  holdPayout,
  openProfessionalSlots,
  overridePayoutAmount,
  processPayout,
  releasePayout,
  searchPayouts,
  getPayoutsForMentor,
  getMentorProfileByUserId,
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
  payoutStats: ["pro-mentor", "payout-stats"] as const,
  payoutByBooking: (bookingId: string) => ["pro-mentor", "payout-by-booking", bookingId] as const,
  payoutAuditLog: (payoutId: string) => ["pro-mentor", "payout-audit-log", payoutId] as const,
  mentorPayouts: (mentorUserId: string, page: number) =>
    ["pro-mentor", "mentor-payouts", mentorUserId, page] as const,
  mentorProfileByUserId: (userId: string) => ["pro-mentor", "profile-by-userid", userId] as const,
  mentorDetail: (id: string) => ["mentor-discovery", id] as const,
  mentorSlots: (id: string) => ["mentor-discovery", id, "slots"] as const,
  mentorSearch: ["mentor-discovery", "search"] as const,
  // Phase 8 — Reports
  monthlySummary: (from?: string, to?: string) => ["pro-mentor", "reports", "monthly-summary", from, to] as const,
  commissionRevenue: (from?: string, to?: string) => ["pro-mentor", "reports", "commission-revenue", from, to] as const,
  mentorEarnings: (from?: string, to?: string) => ["pro-mentor", "reports", "mentor-earnings", from, to] as const,
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

// ═══════════════════════════════════════════════════════════════════════════════
// PAYOUTS — Phase 2 Additions
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Fetches aggregate payout statistics (counts + amounts by status).
 * Used for the admin payout analytics cards.
 */
export function usePayoutStats() {
  return useQuery({
    queryKey: proMentorKeys.payoutStats,
    queryFn: getPayoutStats,
    staleTime: 30_000, // stats are relatively stable; refresh every 30s
  })
}

/**
 * Fetches the full audit trail for a specific payout.
 */
export function usePayoutAuditLog(payoutId: string | null) {
  return useQuery({
    queryKey: proMentorKeys.payoutAuditLog(payoutId ?? ""),
    queryFn: () => getPayoutAuditLog(payoutId!),
    enabled: !!payoutId,
  })
}

/**
 * Bulk-processes a list of PENDING payout IDs (transitions them to PROCESSING).
 */
export function useBulkProcessPayouts(onSuccess?: (processed: number) => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payoutIds: string[]) => bulkProcessPayouts(payoutIds),
    retry: false,
    onSuccess: (data) => {
      showSuccessToast(`${data.processed} payout(s) moved to Processing${data.skipped > 0 ? ` (${data.skipped} skipped)` : ""}`)
      qc.invalidateQueries({ queryKey: proMentorKeys.payouts })
      qc.invalidateQueries({ queryKey: proMentorKeys.payoutStats })
      onSuccess?.(data.processed)
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

/**
 * Manually places a payout ON_HOLD (admin).
 */
export function useHoldPayout(onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ payoutId, reason }: { payoutId: string; reason?: string }) =>
      holdPayout(payoutId, reason),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Payout placed on hold")
      qc.invalidateQueries({ queryKey: proMentorKeys.payouts })
      qc.invalidateQueries({ queryKey: proMentorKeys.payoutStats })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

/**
 * Releases a payout from ON_HOLD back to PENDING (admin).
 */
export function useReleasePayout(onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payoutId: string) => releasePayout(payoutId),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Payout released — status restored to Pending")
      qc.invalidateQueries({ queryKey: proMentorKeys.payouts })
      qc.invalidateQueries({ queryKey: proMentorKeys.payoutStats })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

/**
 * Admin: override the payout amount for a PENDING or ON_HOLD payout (Phase 5).
 */
export function useOverridePayoutAmount(onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ payoutId, overrideAmountMinor, reason }: {
      payoutId: string
      overrideAmountMinor: number
      reason: string
    }) => overridePayoutAmount(payoutId, { overrideAmountMinor, reason }),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Payout amount override saved")
      qc.invalidateQueries({ queryKey: proMentorKeys.payouts })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

/**
 * Fetches paginated payout history for a specific mentor (admin wallet detail).
 */
export function useMentorPayouts(mentorUserId: string, page: number = 0, size: number = 10) {
  return useQuery({
    queryKey: proMentorKeys.mentorPayouts(mentorUserId, page),
    queryFn: () => getPayoutsForMentor(mentorUserId, page, size),
    enabled: !!mentorUserId,
  })
}

/**
 * Admin: fetch a professional mentor's full profile by their userId.
 */
export function useMentorProfileByUserId(userId: string) {
  return useQuery({
    queryKey: proMentorKeys.mentorProfileByUserId(userId),
    queryFn: () => getMentorProfileByUserId(userId),
    enabled: !!userId,
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAYOUT REPORTS (Phase 8)
// ═══════════════════════════════════════════════════════════════════════════════

/** Monthly COMPLETED payout aggregate (count, amounts) grouped by year/month. */
export function useMonthlyPayoutSummary(from?: string, to?: string) {
  return useQuery({
    queryKey: proMentorKeys.monthlySummary(from, to),
    queryFn: () => getMonthlyPayoutSummary(from, to),
    staleTime: 5 * 60 * 1000, // 5 min — reports are not real-time
  })
}

/** Platform commission revenue grouped by year/month. */
export function useCommissionRevenue(from?: string, to?: string) {
  return useQuery({
    queryKey: proMentorKeys.commissionRevenue(from, to),
    queryFn: () => getCommissionRevenue(from, to),
    staleTime: 5 * 60 * 1000,
  })
}

/** Per-mentor cumulative earnings from COMPLETED payouts. */
export function useMentorEarningsBreakdown(from?: string, to?: string) {
  return useQuery({
    queryKey: proMentorKeys.mentorEarnings(from, to),
    queryFn: () => getMentorEarningsBreakdown(from, to),
    staleTime: 5 * 60 * 1000,
  })
}

/** Trigger a CSV download of payouts (client-side blob save). */
export function useDownloadPayoutsCsv() {
  return useMutation({
    mutationFn: ({
      from,
      to,
      status,
    }: {
      from?: string
      to?: string
      status?: string
    }) => downloadPayoutsCsv(from, to, status),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `payouts-export-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      showSuccessToast("CSV downloaded successfully")
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}
