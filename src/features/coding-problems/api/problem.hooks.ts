/**
 * ─── CODING PROBLEM HOOKS (admin console) ────────────────────────────────────
 *
 * React Query over `AdminProblemController`.
 *
 * ─── Every mutation writes the response straight into the detail cache ──────
 *
 * All six lifecycle endpoints return the updated `ProblemDetail`, including its recomputed
 * `availableActions`. Seeding the cache with it rather than only invalidating means the buttons
 * change in the same frame as the status — a refetch would leave "Approve" clickable for a beat
 * on a problem that is already published, and clicking it produces a 409 the reviewer cannot
 * explain.
 */

"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { showErrorToast, showSuccessToast } from "@/lib/show-toast"
import type { ApiError, NetworkError } from "@/lib/api-error"

import {
  approveProblem,
  getProblem,
  getQueueSize,
  listProblems,
  publishProblem,
  republishProblem,
  requestProblemChanges,
  retireProblem,
  saveApproach,
  unlistProblem,
} from "./problem.api"
import type { ProblemDetail, ProblemStatus, ReviewDecisionRequest } from "./problem.types"

// ─── Query keys ───────────────────────────────────────────────────────────────

export const problemKeys = {
  all: ["coding-problem"] as const,
  list: (status: ProblemStatus, page: number) => ["coding-problem", "list", status, page] as const,
  queueSize: ["coding-problem", "queue-size"] as const,
  detail: (problemId: string) => ["coding-problem", problemId] as const,
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useProblemList(status: ProblemStatus, page: number, size = 20) {
  return useQuery({
    queryKey: problemKeys.list(status, page),
    queryFn: () => listProblems({ status, page, size }),
    // The queue is a shared work list — a second reviewer may have taken something since this tab
    // was opened, and a stale row leads to a 409 on a problem somebody else already approved.
    staleTime: 30_000,
  })
}

export function useProblemQueueSize() {
  return useQuery({
    queryKey: problemKeys.queueSize,
    queryFn: getQueueSize,
    staleTime: 60_000,
  })
}

/**
 * One problem, in full.
 *
 * ⚠ Polls while the machine gate is running. Verification is asynchronous on a pool of one and
 * takes tens of seconds; without this the reviewer sees "VERIFYING" until they reload, which reads
 * as a hang. Polling stops the moment it resolves — an idle detail page issues no requests.
 */
export function useProblemDetail(problemId: string) {
  return useQuery({
    queryKey: problemKeys.detail(problemId),
    queryFn: () => getProblem(problemId),
    enabled: !!problemId,
    refetchInterval: (query) =>
      query.state.data?.verificationStatus === "VERIFYING" ? 4_000 : false,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

type MutationOptions = { onSuccess?: (problem: ProblemDetail) => void }

/**
 * The shape every lifecycle mutation shares.
 *
 * `retry: false` throughout: these are not idempotent reads. A retried approve on a request that
 * actually succeeded would hit the state machine a second time and answer 409 — which the reviewer
 * would read as their approval having failed.
 */
function useLifecycleMutation<TVariables>(
  mutationFn: (variables: TVariables) => Promise<ProblemDetail>,
  successMessage: (problem: ProblemDetail) => string,
  options?: MutationOptions,
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn,
    retry: false,
    onSuccess: (problem) => {
      qc.setQueryData(problemKeys.detail(problem.problemId), problem)
      // Every list and the queue badge: a problem leaving IN_REVIEW changes both, and which lists
      // it enters depends on where it went.
      void qc.invalidateQueries({ queryKey: problemKeys.all })
      showSuccessToast(successMessage(problem))
      options?.onSuccess?.(problem)
    },
    onError: (error: ApiError | NetworkError | Error) => showErrorToast(error),
  })
}

export function useApproveProblem(options?: MutationOptions) {
  return useLifecycleMutation<{ problemId: string; note?: string }>(
    ({ problemId, note }) => approveProblem(problemId, { note }),
    (problem) => `Published as #${problem.number} — ${problem.title}`,
    options,
  )
}

export function useRequestProblemChanges(options?: MutationOptions) {
  return useLifecycleMutation<{ problemId: string; note: string }>(
    ({ problemId, note }) => requestProblemChanges(problemId, { note }),
    () => "Sent back to the author with your note.",
    options,
  )
}

export function usePublishProblem(options?: MutationOptions) {
  return useLifecycleMutation<string>(
    (problemId) => publishProblem(problemId),
    (problem) => `Published as #${problem.number}.`,
    options,
  )
}

export function useUnlistProblem(options?: MutationOptions) {
  return useLifecycleMutation<{ problemId: string; note?: string }>(
    ({ problemId, note }) => unlistProblem(problemId, { note }),
    () => "Unlisted. The URL still works; it is out of every list.",
    options,
  )
}

export function useRetireProblem(options?: MutationOptions) {
  return useLifecycleMutation<{ problemId: string; note?: string }>(
    ({ problemId, note }) => retireProblem(problemId, { note }),
    () => "Retired. Anyone who already solved it keeps their record.",
    options,
  )
}

export function useRepublishProblem(options?: MutationOptions) {
  return useLifecycleMutation<string>(
    (problemId) => republishProblem(problemId),
    (problem) => `Live again as #${problem.number}.`,
    options,
  )
}

export function useSaveApproach(problemId: string, onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { bodyHtml: string; published: boolean }) => saveApproach(problemId, data),
    retry: false,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: problemKeys.detail(problemId) })
      showSuccessToast("Approach saved.")
      onSuccess?.()
    },
    onError: (error: ApiError | NetworkError | Error) => showErrorToast(error),
  })
}

export type { ReviewDecisionRequest }
