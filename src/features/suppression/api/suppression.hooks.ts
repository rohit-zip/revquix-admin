/**
 * ─── EMAIL SUPPRESSION HOOKS ──────────────────────────────────────────────────
 *
 * React Query hooks for the do-not-mail console.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { showErrorToast, showSuccessToast } from "@/lib/show-toast"
import {
  addSuppression,
  downloadSuppressionCsv,
  getSuppressionHistory,
  getSuppressions,
  reactivateSuppression,
} from "./suppression.api"

/**
 * Normalises an unknown rejection into something showErrorToast accepts.
 *
 * Prefers the thrown error: an ApiError carries the server's own explanation, and these endpoints
 * refuse things with messages worth reading — "that address is already on the suppression list"
 * (RQ-VE-442) answers the question an admin actually had far better than any fallback string.
 */
function asError(e: unknown, fallback: string): Error {
  return e instanceof Error ? e : new Error(fallback)
}

export const suppressionKeys = {
  list: (page: number, size: number) => ["suppression", "list", page, size] as const,
  history: (email: string) => ["suppression", "history", email] as const,
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useSuppressions(page = 0, size = 50) {
  return useQuery({
    queryKey: suppressionKeys.list(page, size),
    queryFn: () => getSuppressions(page, size),
    /*
     * Short, and shorter than most admin lists on purpose. This list changes whenever anybody
     * anywhere clicks unsubscribe, and a stale copy shows an operator a shorter list than reality
     * — which invites them to mail somebody who has opted out. The backend sends `no-store` for
     * the same reason.
     */
    staleTime: 15 * 1000,
  })
}

/** Lazy — only fetched when a row's history drawer is opened. */
export function useSuppressionHistory(email: string | null) {
  return useQuery({
    queryKey: suppressionKeys.history(email ?? ""),
    queryFn: () => getSuppressionHistory(email!),
    enabled: !!email,
    staleTime: 30 * 1000,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useAddSuppression() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: addSuppression,
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ["suppression"] })
      showSuccessToast(`${row.email} will no longer receive marketing email`)
    },
    onError: (e: unknown) => showErrorToast(asError(e, "Could not add that address")),
  })
}

export function useReactivateSuppression() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: reactivateSuppression,
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ["suppression"] })
      // Worded as what it enables, not as "done". This is the one action in the console that lets
      // Revquix mail somebody who asked it not to, and the confirmation should say so out loud.
      showSuccessToast(`${row.email} can receive marketing email again`)
    },
    onError: (e: unknown) => showErrorToast(asError(e, "Could not reactivate that address")),
  })
}

export function useDownloadSuppressionCsv() {
  return useMutation({
    mutationFn: downloadSuppressionCsv,
    onError: (e: unknown) => showErrorToast(asError(e, "Could not export the list")),
  })
}
