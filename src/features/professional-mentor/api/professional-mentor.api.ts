/**
 * ─── PROFESSIONAL MENTOR API ─────────────────────────────────────────────────
 *
 * API calls for MentorProfileController, ProfessionalMentorSlotController,
 * CouponController, PayoutController, and MentorDiscoveryController.
 */

import { apiClient } from "@/lib/axios"
import type { GenericFilterRequest, GenericFilterResponse, PaginationParams } from "@/core/filters/filter.types"
import type {
  AdminUpdateServiceFlagsRequest,
  ApplyCouponRequest,
  BulkCancelSlotsRequest,
  CouponResponse,
  CouponValidationResponse,
  CreateCouponRequest,
  MentorPayoutResponse,
  MentorProfileResponse,
  OpenSlotsRequest,
  ProfessionalSlotResponse,
  SlotStatsResponse,
  SpringPageResponse,
  UpdateMentorProfileRequest,
  UpdatePricingRequest,
} from "./professional-mentor.types"

// ═══════════════════════════════════════════════════════════════════════════════
// MENTOR PROFILE
// ═══════════════════════════════════════════════════════════════════════════════

const PROFILE = "/professional-mentor/profile"

export const getMyMentorProfile = (): Promise<MentorProfileResponse> =>
  apiClient.get<MentorProfileResponse>(PROFILE).then((r) => r.data)

export const updateMentorProfile = (
  data: UpdateMentorProfileRequest,
): Promise<MentorProfileResponse> =>
  apiClient.put<MentorProfileResponse>(PROFILE, data).then((r) => r.data)

export const updatePricing = (data: UpdatePricingRequest): Promise<MentorProfileResponse> =>
  apiClient.put<MentorProfileResponse>(`${PROFILE}/pricing`, data).then((r) => r.data)

export const toggleAvailability = (): Promise<MentorProfileResponse> =>
  apiClient.put<MentorProfileResponse>(`${PROFILE}/toggle-availability`).then((r) => r.data)

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN — PER-MENTOR OVERRIDES
// ═══════════════════════════════════════════════════════════════════════════════

const ADMIN_PROFILE = "/professional-mentor/admin"

/**
 * Admin override: set per-service availability flags for any mentor.
 * PUT /professional-mentor/admin/{mentorProfileId}/service-flags
 */
export const adminUpdateServiceFlags = (
  mentorProfileId: string,
  data: AdminUpdateServiceFlagsRequest,
): Promise<MentorProfileResponse> =>
  apiClient
    .put<MentorProfileResponse>(`${ADMIN_PROFILE}/${mentorProfileId}/service-flags`, data)
    .then((r) => r.data)

export const uploadMentorResume = (file: File): Promise<MentorProfileResponse> => {
  const fd = new FormData()
  fd.append("file", file)
  return apiClient
    .post<MentorProfileResponse>(`${PROFILE}/resume`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data)
}

export const deleteMentorResume = (): Promise<void> =>
  apiClient.delete(`${PROFILE}/resume`).then(() => undefined)

// ═══════════════════════════════════════════════════════════════════════════════
// MENTOR DISCOVERY (Public-ish)
// ═══════════════════════════════════════════════════════════════════════════════

const MENTORS = "/mentors"

export const searchMentors = (
  request: GenericFilterRequest,
  params: { page: number; size: number },
): Promise<GenericFilterResponse<MentorProfileResponse>> =>
  apiClient
    .post<GenericFilterResponse<MentorProfileResponse>>(
      `${MENTORS}/search?page=${params.page}&size=${params.size}`,
      request,
    )
    .then((r) => r.data)

export const getMentorProfile = (mentorProfileId: string): Promise<MentorProfileResponse> =>
  apiClient.get<MentorProfileResponse>(`${MENTORS}/${mentorProfileId}`).then((r) => r.data)

export const getMentorSlots = (
  mentorProfileId: string,
): Promise<ProfessionalSlotResponse[]> =>
  apiClient
    .get<ProfessionalSlotResponse[]>(`${MENTORS}/${mentorProfileId}/slots`)
    .then((r) => r.data)

// ═══════════════════════════════════════════════════════════════════════════════
// PROFESSIONAL MENTOR SLOTS
// ═══════════════════════════════════════════════════════════════════════════════

const SLOTS = "/professional-mentor/slots"

export const openProfessionalSlots = (
  data: OpenSlotsRequest,
): Promise<ProfessionalSlotResponse[]> =>
  apiClient.post<ProfessionalSlotResponse[]>(SLOTS, data).then((r) => r.data)

export const getMyProfessionalSlots = (
  page = 0,
  size = 20,
  from?: string,
  to?: string,
): Promise<SpringPageResponse<ProfessionalSlotResponse>> =>
  apiClient
    .get<SpringPageResponse<ProfessionalSlotResponse>>(SLOTS, {
      params: { page, size, ...(from && { from }), ...(to && { to }) },
    })
    .then((r) => r.data)

export const getProfessionalSlotStats = (): Promise<SlotStatsResponse> =>
  apiClient.get<SlotStatsResponse>(`${SLOTS}/stats`).then((r) => r.data)

export const cancelProfessionalSlot = (slotId: string): Promise<void> =>
  apiClient.delete(`${SLOTS}/${slotId}`).then(() => undefined)

export const bulkCancelProfessionalSlots = (
  data: BulkCancelSlotsRequest,
): Promise<{ cancelled: number }> =>
  apiClient.post<{ cancelled: number }>(`${SLOTS}/bulk-cancel`, data).then((r) => r.data)

export const searchMyProfessionalSlots = (
  request: GenericFilterRequest,
  params: PaginationParams,
): Promise<GenericFilterResponse<ProfessionalSlotResponse>> =>
  apiClient
    .post<GenericFilterResponse<ProfessionalSlotResponse>>(
      `${SLOTS}/search?page=${params.page}&size=${params.size}`,
      request,
    )
    .then((r) => r.data)

// ═══════════════════════════════════════════════════════════════════════════════
// COUPONS
// ═══════════════════════════════════════════════════════════════════════════════

const COUPONS = "/coupons"

export const createCoupon = (data: CreateCouponRequest): Promise<CouponResponse> =>
  apiClient.post<CouponResponse>(COUPONS, data).then((r) => r.data)

export const getMyCoupons = (
  page = 0,
  size = 20,
): Promise<SpringPageResponse<CouponResponse>> =>
  apiClient
    .get<SpringPageResponse<CouponResponse>>(`${COUPONS}/my`, { params: { page, size } })
    .then((r) => r.data)

export const deactivateCoupon = (couponId: string): Promise<CouponResponse> =>
  apiClient.put<CouponResponse>(`${COUPONS}/${couponId}/deactivate`).then((r) => r.data)

export const validateCoupon = (
  data: ApplyCouponRequest,
): Promise<CouponValidationResponse> =>
  apiClient.post<CouponValidationResponse>(`${COUPONS}/validate`, data).then((r) => r.data)

export const searchCoupons = (
  request: GenericFilterRequest,
  params: { page: number; size: number },
): Promise<GenericFilterResponse<CouponResponse>> =>
  apiClient
    .post<GenericFilterResponse<CouponResponse>>(
      `${COUPONS}/admin/search?page=${params.page}&size=${params.size}`,
      request,
    )
    .then((r) => r.data)

// ═══════════════════════════════════════════════════════════════════════════════
// PAYOUTS
// ═══════════════════════════════════════════════════════════════════════════════

const PAYOUTS = "/payouts"

export const getMyPayouts = (
  page = 0,
  size = 20,
): Promise<SpringPageResponse<MentorPayoutResponse>> =>
  apiClient
    .get<SpringPageResponse<MentorPayoutResponse>>(`${PAYOUTS}/my`, { params: { page, size } })
    .then((r) => r.data)

export const processPayout = (payoutId: string): Promise<MentorPayoutResponse> =>
  apiClient.put<MentorPayoutResponse>(`${PAYOUTS}/${payoutId}/process`).then((r) => r.data)

export const completePayout = (
  payoutId: string,
  payoutReference: string,
  adminNote?: string,
): Promise<MentorPayoutResponse> =>
  apiClient
    .put<MentorPayoutResponse>(`${PAYOUTS}/${payoutId}/complete`, {
      payoutReference,
      adminNote,
    })
    .then((r) => r.data)

/** GET /payouts/booking/{bookingId} — Get payout details for a specific booking (mentor/admin) */
export const getPayoutByBooking = (bookingId: string): Promise<MentorPayoutResponse> =>
  apiClient
    .get<MentorPayoutResponse>(`${PAYOUTS}/booking/${bookingId}`)
    .then((r) => r.data)

// Admin: Search all payouts with GenericFilter (M-7)
export const searchPayouts = (
  request: GenericFilterRequest,
  params: { page: number; size: number },
): Promise<GenericFilterResponse<MentorPayoutResponse>> =>
  apiClient
    .post<GenericFilterResponse<MentorPayoutResponse>>(
      `${PAYOUTS}/admin/search?page=${params.page}&size=${params.size}`,
      request,
    )
    .then((r) => r.data)
