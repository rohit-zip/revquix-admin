/**
 * ─── MOCK INTERVIEW HOOKS ────────────────────────────────────────────────────
 *
 * React Query hooks for MockInterviewBookingController endpoints.
 */

"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { showErrorToast, showSuccessToast } from "@/lib/show-toast"
import type { ApiError, NetworkError } from "@/lib/api-error"
import type {
  MockInterviewConfirmRequest,
  MockInterviewFeedbackRequest,
  MockInterviewIntakeRequest,
  MockInterviewReserveRequest,
} from "./mock-interview.types"
import {
  cancelBooking,
  confirmPayment,
  getCancellationPreview,
  getBooking,
  getMockFeedback,
  getRefundPolicy,
  reserveSlot,
  submitIntake,
  submitMockFeedback,
  uploadIntakeResume,
} from "./mock-interview.api"

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const mockInterviewKeys = {
  myBookings: ["mock-interview", "my-bookings"] as const,
  allBookings: ["mock-interview", "all-bookings"] as const,
  detail: (id: string) => ["mock-interview", "detail", id] as const,
  feedback: (bookingId: string) => ["mock-interview", "feedback", bookingId] as const,
  refundPolicy: ["mock-interview", "refund-policy"] as const,
  cancellationPreview: (id: string) => ["mock-interview", "cancellation-preview", id] as const,
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useMockBookingDetail(bookingId: string) {
  return useQuery({
    queryKey: mockInterviewKeys.detail(bookingId),
    queryFn: () => getBooking(bookingId),
    enabled: !!bookingId,
  })
}

/**
 * Fetches the cancellation / refund policy tiers from the backend.
 * The policy is environment-specific and rarely changes — stale for 1 hour.
 */
export function useRefundPolicy() {
  return useQuery({
    queryKey: mockInterviewKeys.refundPolicy,
    queryFn: getRefundPolicy,
    staleTime: 60 * 60 * 1000,      // 1 hour — policy rarely changes
    gcTime: 2 * 60 * 60 * 1000,     // 2 hours
    refetchOnWindowFocus: false,
    retry: false,
  })
}

/**
 * Fetches a real-time refund estimate for a specific booking.
 * Only active when `enabled` is true (i.e. the cancel dialog is open).
 */
export function useCancellationPreview(bookingId: string, enabled: boolean) {
  return useQuery({
    queryKey: mockInterviewKeys.cancellationPreview(bookingId),
    queryFn: () => getCancellationPreview(bookingId),
    enabled: enabled && !!bookingId,
    staleTime: 0,                    // always re-fetch — result changes over time
    refetchOnWindowFocus: true,
    retry: false,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useSubmitIntake(onSuccess?: (intakeId: string) => void) {
  return useMutation({
    mutationFn: (data: MockInterviewIntakeRequest) => submitIntake(data),
    retry: false,
    onSuccess: (result) => {
      showSuccessToast(result.message)
      onSuccess?.(result.intakeId)
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

export function useUploadIntakeResume() {
  return useMutation({
    mutationFn: ({ intakeId, file }: { intakeId: string; file: File }) =>
      uploadIntakeResume(intakeId, file),
    retry: false,
    onSuccess: () => showSuccessToast("Resume uploaded successfully"),
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

export function useReserveSlot() {
  return useMutation({
    mutationFn: (data: MockInterviewReserveRequest) => reserveSlot(data),
    retry: false,
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

export function useConfirmPayment(onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: MockInterviewConfirmRequest) => confirmPayment(data),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Payment confirmed! Your mock interview is booked.")
      qc.invalidateQueries({ queryKey: mockInterviewKeys.myBookings })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

export function useCancelMockBooking(onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ bookingId, reason }: { bookingId: string; reason?: string }) =>
      cancelBooking(bookingId, reason),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Booking cancelled")
      qc.invalidateQueries({ queryKey: mockInterviewKeys.myBookings })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

// ─── Feedback Hooks ───────────────────────────────────────────────────────────

export function useMockFeedback(bookingId: string) {
  return useQuery({
    queryKey: mockInterviewKeys.feedback(bookingId),
    queryFn: () => getMockFeedback(bookingId),
    enabled: !!bookingId,
    retry: false,
  })
}

export function useSubmitMockFeedback(onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ bookingId, data }: { bookingId: string; data: MockInterviewFeedbackRequest }) =>
      submitMockFeedback(bookingId, data),
    retry: false,
    onSuccess: (_result, variables) => {
      showSuccessToast("Feedback submitted successfully!")
      qc.invalidateQueries({ queryKey: mockInterviewKeys.feedback(variables.bookingId) })
      qc.invalidateQueries({ queryKey: mockInterviewKeys.detail(variables.bookingId) })
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}

