/**
 * ─── SESSION DISPUTES HOOKS ───────────────────────────────────────────────────
 *
 * React Query hooks for admin session dispute management.
 */

"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { showErrorToast, showSuccessToast } from "@/lib/show-toast"
import type { ApiError, NetworkError } from "@/lib/api-error"
import {
  getDisputes,
  getDisputeById,
  markUnderReview,
  resolveDispute,
} from "./session-disputes.api"
import type { DisputeResolveRequest, DisputeStatus } from "./session-disputes.types"

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const disputeKeys = {
  all: ["session-disputes"] as const,
  list: (page: number, size: number, status?: DisputeStatus) =>
    ["session-disputes", "list", page, size, status] as const,
  detail: (id: string) => ["session-disputes", "detail", id] as const,
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useDisputesList(page: number, size: number, status?: DisputeStatus) {
  return useQuery({
    queryKey: disputeKeys.list(page, size, status),
    queryFn: () => getDisputes(page, size, status),
  })
}

export function useDisputeDetail(disputeId: string) {
  return useQuery({
    queryKey: disputeKeys.detail(disputeId),
    queryFn: () => getDisputeById(disputeId),
    enabled: !!disputeId,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useMarkUnderReview() {
  const queryClient = useQueryClient()
  return useMutation<
    Awaited<ReturnType<typeof markUnderReview>>,
    ApiError | NetworkError,
    string
  >({
    mutationFn: markUnderReview,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: disputeKeys.all })
      queryClient.setQueryData(disputeKeys.detail(data.disputeId), data)
      showSuccessToast("Dispute marked as Under Review")
    },
    onError: (err) => showErrorToast(err),
  })
}

export function useResolveDispute() {
  const queryClient = useQueryClient()
  return useMutation<
    Awaited<ReturnType<typeof resolveDispute>>,
    ApiError | NetworkError,
    { disputeId: string; request: DisputeResolveRequest }
  >({
    mutationFn: ({ disputeId, request }) => resolveDispute(disputeId, request),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: disputeKeys.all })
      queryClient.setQueryData(disputeKeys.detail(data.disputeId), data)
      showSuccessToast("Dispute resolved successfully")
    },
    onError: (err) => showErrorToast(err),
  })
}
