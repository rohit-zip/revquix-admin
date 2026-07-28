/**
 * ─── MENTORSHIP V2 (PHASE 4) CALL LIFECYCLE HOOKS ────────────────────────────
 */

"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { showErrorToast, showSuccessToast } from "@/lib/show-toast"
import {
  forceCompleteBooking,
  forceSubmitFeedback,
  getCallSnapshot,
  inspectBookingSession,
  moderateReview,
  runLifecycleSweep,
} from "./calls.api"
import type { ForceSubmitFeedbackRequest } from "./calls.types"

export const callKeys = {
  all: ["mentorship-v2", "calls"] as const,
  snapshot: ["mentorship-v2", "calls", "snapshot"] as const,
  booking: (bookingId: string) => ["mentorship-v2", "calls", "booking", bookingId] as const,
}

export function useCallSnapshot() {
  return useQuery({
    queryKey: callKeys.snapshot,
    queryFn: getCallSnapshot,
    // 15s, same reasoning as the Phase 3 commerce panel: this page is used to watch a
    // sweep run happen in near-real-time, and a long stale time would show state from
    // before the reviewer's own manual sweep.
    staleTime: 15 * 1000,
  })
}

export function useInspectBookingSession(bookingId: string) {
  return useQuery({
    queryKey: callKeys.booking(bookingId),
    queryFn: () => inspectBookingSession(bookingId),
    enabled: bookingId.trim().length > 0,
    retry: false,
  })
}

function useInvalidateCalls() {
  const qc = useQueryClient()
  return () => {
    void qc.invalidateQueries({ queryKey: callKeys.all })
  }
}

export function useRunLifecycleSweep() {
  const invalidate = useInvalidateCalls()
  return useMutation({
    mutationFn: runLifecycleSweep,
    onSuccess: (report) => {
      invalidate()
      const actions =
        report.linksResolved +
        report.linkNudgesSent +
        report.remindersSent +
        report.attendanceWindowsOpened +
        report.autoCompleted +
        report.feedbackRemindersSent +
        report.feedbackBreaches
      showSuccessToast(
        actions > 0
          ? `Sweep ran: ${report.linksResolved} link(s) resolved, ${report.remindersSent} reminder(s), ` +
              `${report.attendanceWindowsOpened} attendance window(s) opened, ${report.autoCompleted} auto-completed, ` +
              `${report.feedbackRemindersSent} feedback reminder(s), ${report.feedbackBreaches} feedback breach(es).`
          : "Sweep ran — nothing needed doing right now.",
      )
    },
    onError: (error) => showErrorToast(error),
  })
}

export function useForceCompleteBooking() {
  const invalidate = useInvalidateCalls()
  return useMutation({
    mutationFn: ({ bookingId, reason }: { bookingId: string; reason?: string }) =>
      forceCompleteBooking(bookingId, reason),
    onSuccess: () => {
      invalidate()
      showSuccessToast("Booking force-completed.")
    },
    onError: (error) => showErrorToast(error),
  })
}

export function useModerateReview() {
  const invalidate = useInvalidateCalls()
  return useMutation({
    mutationFn: ({
      reviewId,
      hidden,
      reason,
    }: {
      reviewId: string
      hidden: boolean
      reason?: string
    }) => moderateReview(reviewId, hidden, reason),
    onSuccess: (_result, variables) => {
      invalidate()
      showSuccessToast(variables.hidden ? "Review hidden." : "Review unhidden.")
    },
    onError: (error) => showErrorToast(error),
  })
}

/** Phase 5: files the mentor's structured feedback report on their behalf. */
export function useForceSubmitFeedback() {
  const invalidate = useInvalidateCalls()
  return useMutation({
    mutationFn: ({
      bookingId,
      payload,
    }: {
      bookingId: string
      payload: ForceSubmitFeedbackRequest
    }) => forceSubmitFeedback(bookingId, payload),
    onSuccess: () => {
      invalidate()
      showSuccessToast("Feedback filed on the mentor's behalf. The candidate has been notified.")
    },
    onError: (error) => showErrorToast(error),
  })
}
