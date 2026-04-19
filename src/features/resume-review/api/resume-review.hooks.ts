"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { showErrorToast, showSuccessToast } from "@/lib/show-toast"
import type { ApiError, NetworkError } from "@/lib/api-error"
import type {
  SubmitResumeReportRequest,
  ReassignResumeReviewRequest,
} from "./resume-review.types"
import {
  acceptReview,
  cancelBookingAdmin,
  getAnalytics,
  getAllPlans,
  getBooking,
  getReport,
  getStatusLog,
  getUploads,
  reassignReview,
  submitReport,
} from "./resume-review.api"

export const adminResumeReviewKeys = {
  allBookings: ["admin-resume-reviews"] as const,
  plans: ["admin-resume-review-plans"] as const,
  analytics: ["admin-resume-review-analytics"] as const,
  detail: (id: string) => ["admin-resume-review", "detail", id] as const,
  report: (id: string) => ["admin-resume-review", "report", id] as const,
  uploads: (id: string) => ["admin-resume-review", "uploads", id] as const,
  statusLog: (id: string) => ["admin-resume-review", "status-log", id] as const,
}

export function useAdminResumeReviewDetail(bookingId: string) {
  return useQuery({
    queryKey: adminResumeReviewKeys.detail(bookingId),
    queryFn: () => getBooking(bookingId),
    enabled: !!bookingId,
  })
}

export function useAdminResumeReviewReport(bookingId: string) {
  return useQuery({
    queryKey: adminResumeReviewKeys.report(bookingId),
    queryFn: () => getReport(bookingId),
    enabled: !!bookingId,
    retry: false,
  })
}

export function useAdminResumeReviewUploads(bookingId: string) {
  return useQuery({
    queryKey: adminResumeReviewKeys.uploads(bookingId),
    queryFn: () => getUploads(bookingId),
    enabled: !!bookingId,
  })
}

export function useAdminResumeReviewStatusLog(bookingId: string) {
  return useQuery({
    queryKey: adminResumeReviewKeys.statusLog(bookingId),
    queryFn: () => getStatusLog(bookingId),
    enabled: !!bookingId,
  })
}

export function useAdminResumeReviewPlans() {
  return useQuery({
    queryKey: adminResumeReviewKeys.plans,
    queryFn: getAllPlans,
    staleTime: 60 * 60 * 1000,
  })
}

export function useResumeReviewAnalytics() {
  return useQuery({
    queryKey: adminResumeReviewKeys.analytics,
    queryFn: getAnalytics,
  })
}

export function useAcceptResumeReview(onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (bookingId: string) => acceptReview(bookingId),
    onSuccess: (_r, bookingId) => {
      showSuccessToast("Review accepted and assigned to you")
      qc.invalidateQueries({ queryKey: adminResumeReviewKeys.detail(bookingId) })
      qc.invalidateQueries({ queryKey: adminResumeReviewKeys.allBookings })
      onSuccess?.()
    },
    onError: (e: ApiError | NetworkError) => showErrorToast(e),
  })
}

export function useReassignResumeReview(onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ bookingId, data }: { bookingId: string; data: ReassignResumeReviewRequest }) =>
      reassignReview(bookingId, data),
    onSuccess: (_r, { bookingId }) => {
      showSuccessToast("Review reassigned")
      qc.invalidateQueries({ queryKey: adminResumeReviewKeys.detail(bookingId) })
      onSuccess?.()
    },
    onError: (e: ApiError | NetworkError) => showErrorToast(e),
  })
}

export function useSubmitResumeReport(onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ bookingId, data }: { bookingId: string; data: SubmitResumeReportRequest }) =>
      submitReport(bookingId, data),
    onSuccess: (_r, { bookingId }) => {
      showSuccessToast("Report submitted")
      qc.invalidateQueries({ queryKey: adminResumeReviewKeys.detail(bookingId) })
      qc.invalidateQueries({ queryKey: adminResumeReviewKeys.report(bookingId) })
      onSuccess?.()
    },
    onError: (e: ApiError | NetworkError) => showErrorToast(e),
  })
}

export function useAdminCancelResumeReview(onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ bookingId, reason }: { bookingId: string; reason?: string }) =>
      cancelBookingAdmin(bookingId, reason ? { reason } : undefined),
    onSuccess: (_r, { bookingId }) => {
      showSuccessToast("Review cancelled")
      qc.invalidateQueries({ queryKey: adminResumeReviewKeys.detail(bookingId) })
      qc.invalidateQueries({ queryKey: adminResumeReviewKeys.allBookings })
      onSuccess?.()
    },
    onError: (e: ApiError | NetworkError) => showErrorToast(e),
  })
}

