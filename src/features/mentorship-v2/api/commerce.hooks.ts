/**
 * ─── MENTORSHIP V2 (PHASE 3) COMMERCE HOOKS ──────────────────────────────────
 */

"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { showErrorToast, showSuccessToast } from "@/lib/show-toast"
import {
  getAdminBookingHistory,
  getCommerceSnapshot,
  getOrderRefunds,
  inspectCommerceOrder,
  issueRefund,
  runExpirySweep,
  runReconciliation,
} from "./commerce.api"
import type { IssueRefundPayload } from "./commerce.types"

export const commerceKeys = {
  all: ["mentorship-v2", "commerce"] as const,
  snapshot: ["mentorship-v2", "commerce", "snapshot"] as const,
  order: (orderId: string) => ["mentorship-v2", "commerce", "order", orderId] as const,
  history: (bookingId: string) => ["mentorship-v2", "commerce", "history", bookingId] as const,
  refunds: (orderId: string) => ["mentorship-v2", "commerce", "refunds", orderId] as const,
}

export function useCommerceSnapshot() {
  return useQuery({
    queryKey: commerceKeys.snapshot,
    queryFn: getCommerceSnapshot,
    // 15s: the panel is used to watch a checkout happen in real time (initiate → pay →
    // confirm), so a long stale time would show a reviewer the state from before their
    // own test and make idempotency look broken when it is not.
    staleTime: 15 * 1000,
  })
}

export function useInspectOrder(orderId: string) {
  return useQuery({
    queryKey: commerceKeys.order(orderId),
    queryFn: () => inspectCommerceOrder(orderId),
    enabled: orderId.trim().length > 0,
    retry: false,
  })
}

export function useAdminBookingHistory(bookingId: string | null) {
  return useQuery({
    queryKey: commerceKeys.history(bookingId ?? "none"),
    queryFn: () => getAdminBookingHistory(bookingId as string),
    enabled: !!bookingId,
    retry: false,
  })
}

export function useOrderRefunds(orderId: string | null) {
  return useQuery({
    queryKey: commerceKeys.refunds(orderId ?? "none"),
    queryFn: () => getOrderRefunds(orderId as string),
    enabled: !!orderId,
    retry: false,
  })
}

function useInvalidateCommerce() {
  const qc = useQueryClient()
  return () => {
    void qc.invalidateQueries({ queryKey: commerceKeys.all })
  }
}

export function useRunExpirySweep() {
  const invalidate = useInvalidateCommerce()
  return useMutation({
    mutationFn: runExpirySweep,
    onSuccess: (result) => {
      invalidate()
      showSuccessToast(
        result.actioned > 0
          ? `Released ${result.actioned} of ${result.examined} lapsed reservation(s).`
          : "No lapsed reservations to release.",
      )
    },
    onError: (error) => showErrorToast(error),
  })
}

export function useRunReconciliation() {
  const invalidate = useInvalidateCommerce()
  return useMutation({
    mutationFn: runReconciliation,
    onSuccess: (result) => {
      invalidate()
      showSuccessToast(
        result.actioned > 0
          ? `Settled ${result.actioned} of ${result.examined} unresolved order(s) from the gateway.`
          : `Checked ${result.examined} order(s); nothing needed settling.`,
      )
    },
    onError: (error) => showErrorToast(error),
  })
}

export function useIssueRefund() {
  const invalidate = useInvalidateCommerce()
  return useMutation({
    mutationFn: (payload: IssueRefundPayload) => issueRefund(payload),
    onSuccess: (result) => {
      invalidate()
      showSuccessToast(result.message ?? "Refund issued.")
    },
    onError: (error) => showErrorToast(error),
  })
}
