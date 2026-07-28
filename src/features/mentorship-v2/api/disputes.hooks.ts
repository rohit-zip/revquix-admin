/**
 * ─── MENTORSHIP V2 (PHASE 7) DISPUTE ADMIN HOOKS ─────────────────────────────
 */

"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { showErrorToast, showSuccessToast } from "@/lib/show-toast"
import {
  assignDispute,
  getDisputeQueue,
  getDisputeSnapshot,
  getRefundableHeadroom,
  getResolutionCatalogue,
  inspectDispute,
  recomputeMentorReliability,
  replyOnDisputeAsAdmin,
  requestDisputeInfo,
  resolveDispute,
  runDisputeSlaSweep,
  tryAutoResolveDispute,
} from "./disputes.api"
import type { AdminDisputeMessageRequest, ResolveDisputeRequest } from "./disputes.types"

export const disputeAdminKeys = {
  all: ["mentorship-v2", "disputes-admin"] as const,
  snapshot: ["mentorship-v2", "disputes-admin", "snapshot"] as const,
  queue: (filters: Record<string, unknown>) =>
    ["mentorship-v2", "disputes-admin", "queue", filters] as const,
  one: (id: string) => ["mentorship-v2", "disputes-admin", "one", id] as const,
  refundable: (id: string) => ["mentorship-v2", "disputes-admin", "refundable", id] as const,
  catalogue: ["mentorship-v2", "disputes-admin", "catalogue"] as const,
}

function useInvalidateDisputeAdmin() {
  const qc = useQueryClient()
  return () => void qc.invalidateQueries({ queryKey: disputeAdminKeys.all })
}

// ─── Reads ──────────────────────────────────────────────────────────────────

export function useDisputeSnapshot() {
  return useQuery({
    queryKey: disputeAdminKeys.snapshot,
    queryFn: getDisputeSnapshot,
    // 15s, the same reasoning every prior phase's snapshot uses: this panel is watched while a
    // manual sweep runs, so a longer stale time would show state from before the reviewer's own test.
    staleTime: 15 * 1000,
  })
}

export function useDisputeQueue(filters: {
  status?: string
  mentorUserId?: string
  liveOnly?: boolean
  page?: number
  size?: number
}) {
  return useQuery({
    queryKey: disputeAdminKeys.queue(filters),
    queryFn: () => getDisputeQueue(filters),
    // Keeps the previous page rendered while the next loads, so paging the queue does not collapse
    // it to a spinner and shift the layout under the reviewer's cursor.
    placeholderData: (previous) => previous,
  })
}

export function useInspectDispute(disputeId: string) {
  return useQuery({
    queryKey: disputeAdminKeys.one(disputeId),
    queryFn: () => inspectDispute(disputeId),
    enabled: disputeId.trim().length > 0,
    retry: false,
  })
}

/**
 * How much the dispute's order can still refund.
 *
 * Fetched so the resolve form can validate an amount before submitting. The endpoint validates it
 * again and **refuses** an over-large amount rather than clamping it — silently refunding less than
 * an admin decided would make the record and the money disagree.
 */
export function useRefundableHeadroom(disputeId: string) {
  return useQuery({
    queryKey: disputeAdminKeys.refundable(disputeId),
    queryFn: () => getRefundableHeadroom(disputeId),
    enabled: disputeId.trim().length > 0,
    retry: false,
  })
}

export function useResolutionCatalogue() {
  return useQuery({
    queryKey: disputeAdminKeys.catalogue,
    queryFn: getResolutionCatalogue,
    // The catalogue is derived from a Java enum: it cannot change without a deploy.
    staleTime: 60 * 60 * 1000,
  })
}

// ─── Writes ─────────────────────────────────────────────────────────────────

export function useAssignDispute(disputeId: string) {
  const invalidate = useInvalidateDisputeAdmin()
  return useMutation({
    mutationFn: (adminUserId?: string) => assignDispute(disputeId, adminUserId),
    onSuccess: () => {
      invalidate()
      showSuccessToast("Assigned and moved to under review.")
    },
    onError: (error) => showErrorToast(error),
  })
}

export function useAdminReplyOnDispute(disputeId: string) {
  const invalidate = useInvalidateDisputeAdmin()
  return useMutation({
    mutationFn: (payload: AdminDisputeMessageRequest) => replyOnDisputeAsAdmin(disputeId, payload),
    onSuccess: (_data, variables) => {
      invalidate()
      showSuccessToast(variables.internal ? "Internal note saved." : "Reply sent to both parties.")
    },
    onError: (error) => showErrorToast(error),
  })
}

export function useRequestDisputeInfo(disputeId: string) {
  const invalidate = useInvalidateDisputeAdmin()
  return useMutation({
    mutationFn: (input: { fromBuyer: boolean; body: string }) =>
      requestDisputeInfo(disputeId, input.fromBuyer, { body: input.body }),
    onSuccess: (_data, variables) => {
      invalidate()
      showSuccessToast(
        variables.fromBuyer
          ? "Asked the customer — it is now on their pending-action list."
          : "Asked the mentor — it is now on their pending-action list.",
      )
    },
    onError: (error) => showErrorToast(error),
  })
}

export function useResolveDispute(disputeId: string) {
  const invalidate = useInvalidateDisputeAdmin()
  return useMutation({
    mutationFn: (payload: ResolveDisputeRequest) => resolveDispute(disputeId, payload),
    onSuccess: (dispute) => {
      invalidate()
      showSuccessToast(
        dispute.status === "REJECTED"
          ? "Declined. Payout hold lifted; nothing recorded against the mentor."
          : `Resolved as ${dispute.resolutionLabel ?? dispute.resolution}. Both parties notified, 72h appeal window open.`,
      )
    },
    onError: (error) => showErrorToast(error),
  })
}

export function useTryAutoResolveDispute(disputeId: string) {
  const invalidate = useInvalidateDisputeAdmin()
  return useMutation({
    mutationFn: () => tryAutoResolveDispute(disputeId),
    onSuccess: (dispute) => {
      invalidate()
      showSuccessToast(
        dispute.autoResolved
          ? `A rule fired: ${dispute.autoResolutionRule} → ${dispute.resolutionLabel}.`
          : "No mechanical rule applies to this dispute — it needs a human decision.",
      )
    },
    onError: (error) => showErrorToast(error),
  })
}

export function useRunDisputeSlaSweep() {
  const invalidate = useInvalidateDisputeAdmin()
  return useMutation({
    mutationFn: runDisputeSlaSweep,
    onSuccess: (report) => {
      invalidate()
      const actions =
        report.autoResolved +
        report.firstResponseBreaches +
        report.resolutionBreaches +
        report.payoutHoldsReleased
      showSuccessToast(
        actions > 0
          ? `Sweep applied ${actions} action(s).`
          : "Sweep ran — nothing needed action right now.",
      )
    },
    onError: (error) => showErrorToast(error),
  })
}

export function useRecomputeReliability() {
  const invalidate = useInvalidateDisputeAdmin()
  return useMutation({
    mutationFn: (mentorUserId: string) => recomputeMentorReliability(mentorUserId),
    onSuccess: () => {
      invalidate()
      showSuccessToast("Reliability recomputed.")
    },
    onError: (error) => showErrorToast(error),
  })
}
