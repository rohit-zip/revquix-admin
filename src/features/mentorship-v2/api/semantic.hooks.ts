/**
 * ─── MENTORSHIP V2 (PHASE 10) SEMANTIC SEARCH ADMIN HOOKS ─────────────────────
 */

"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { showErrorToast, showSuccessToast } from "@/lib/show-toast"
import {
  acceptSkillSuggestion,
  clearEmbeddings,
  compareSemanticQuery,
  evictQueryEmbedding,
  getSemanticSnapshot,
  refreshSemanticCapability,
  rejectSkillSuggestion,
  fetchCorpusCoverage,
  runEmbeddingPass,
  runMentorEmbeddingPass,
  runOfflineJobs,
} from "./semantic.api"

export const semanticAdminKeys = {
  all: ["mentorship-v2", "semantic-admin"] as const,
  snapshot: ["mentorship-v2", "semantic-admin", "snapshot"] as const,
  compare: (signature: string) =>
    ["mentorship-v2", "semantic-admin", "compare", signature] as const,
  coverage: (corpus: string) =>
    ["mentorship-v2", "semantic-admin", "coverage", corpus] as const,
}

/** Coverage for one corpus. Polled separately from the snapshot, which is SERVICE-only. */
export function useCorpusCoverage(corpus: "SERVICE" | "MENTOR") {
  return useQuery({
    queryKey: semanticAdminKeys.coverage(corpus),
    queryFn: () => fetchCorpusCoverage(corpus),
    staleTime: 30_000,
  })
}

/**
 * Runs the MENTOR pass.
 *
 * Reports the outcome from the counters the sweep itself returned rather than assuming success: a
 * pass that skipped entirely (no pgvector, no embedding column, semantic disabled) is not an error,
 * but it is emphatically not "embedded 0 rows" either, and conflating the two is how a dormant
 * corpus goes unnoticed.
 */
export function useRunMentorEmbeddingPass() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: runMentorEmbeddingPass,
    onSuccess: (counters) => {
      const skipped = counters?.skipped as string | undefined
      if (skipped) {
        showErrorToast(new Error(`The mentor pass did not run — ${skipped}`))
      } else {
        const embedded = Number(counters?.embedded ?? 0)
        const failed = Number(counters?.failed ?? 0)
        if (failed > 0) {
          showErrorToast(new Error(`Embedded ${embedded}, but ${failed} failed. Check the run history.`))
        } else {
          showSuccessToast(`Mentor pass complete — embedded ${embedded}.`)
        }
      }
      void qc.invalidateQueries({ queryKey: semanticAdminKeys.coverage("MENTOR") })
      void qc.invalidateQueries({ queryKey: semanticAdminKeys.snapshot })
    },
    onError: showErrorToast,
  })
}

export function useSemanticSnapshot() {
  return useQuery({
    queryKey: semanticAdminKeys.snapshot,
    queryFn: getSemanticSnapshot,
    // 15s, matching every prior phase's snapshot. This panel is watched while an admin runs an embedding
    // pass, so a longer stale time would show state from before their own action.
    staleTime: 15 * 1000,
  })
}

export function useSemanticComparison(query: string, size: number, enabled: boolean) {
  return useQuery({
    queryKey: semanticAdminKeys.compare(`${query}::${size}`),
    queryFn: () => compareSemanticQuery(query, size),
    enabled: enabled && query.trim().length > 0,
    // Never cached, and gcTime 0. The entire purpose is to observe current behaviour after a config or data
    // change; a cached answer would show the behaviour from before it, which is worse than no answer because
    // it looks authoritative.
    staleTime: 0,
    gcTime: 0,
    retry: false,
  })
}

export function useRefreshSemanticCapability() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: refreshSemanticCapability,
    onSuccess: (probe) => {
      if (probe.available) {
        showSuccessToast(
          `pgvector ${probe.pgvectorVersion ?? ""} detected — vector(${probe.columnDimensions}) column and `
            + `HNSW index are both present.`,
        )
      } else {
        // An error toast even though the request succeeded: the operator clicked this expecting a fix to be
        // detected, and a green toast saying "probed successfully" while the answer is still "unavailable"
        // would be actively misleading.
        showErrorToast(new Error(probe.reason ?? "Semantic search is still unavailable."))
      }
      void qc.invalidateQueries({ queryKey: semanticAdminKeys.snapshot })
    },
    onError: (error) => showErrorToast(error),
  })
}

export function useRunEmbeddingPass() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: runEmbeddingPass,
    onSuccess: (report) => {
      if (report.skippedEntirely) {
        showErrorToast(new Error(`The pass did not run — ${report.skippedReason}`))
      } else if (report.failed > 0) {
        showErrorToast(
          new Error(
            `Embedded ${report.embedded}, but ${report.failed} failed. `
              + (report.firstError ? `First error: ${report.firstError}` : "Check the run history."),
          ),
        )
      } else {
        showSuccessToast(
          `Embedded ${report.embedded} of ${report.candidates} candidate(s); `
            + `${report.skippedUnchanged} unchanged and skipped.`,
        )
      }
      void qc.invalidateQueries({ queryKey: semanticAdminKeys.snapshot })
    },
    onError: (error) => showErrorToast(error),
  })
}

export function useClearEmbeddings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: clearEmbeddings,
    onSuccess: (cleared) => {
      showSuccessToast(
        `Cleared ${cleared} embedding(s). Semantic ranking is off until the next pass completes — `
          + `run one now if this was not intentional.`,
      )
      void qc.invalidateQueries({ queryKey: semanticAdminKeys.snapshot })
    },
    onError: (error) => showErrorToast(error),
  })
}

export function useRunOfflineJobs() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: runOfflineJobs,
    onSuccess: (report) => {
      showSuccessToast(
        `Mined ${report.synonymMining.rulesProposed} inactive synonym rule(s), proposed `
          + `${report.skillTagging.suggestionsProposed} skill tag(s), found `
          + `${report.intentClustering.clustersFound} intent cluster(s). Nothing is live until reviewed.`,
      )
      void qc.invalidateQueries({ queryKey: semanticAdminKeys.snapshot })
    },
    onError: (error) => showErrorToast(error),
  })
}

export function useAcceptSkillSuggestion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (suggestionId: number) => acceptSkillSuggestion(suggestionId),
    onSuccess: () => {
      showSuccessToast("Skill attached. It becomes searchable on the next projection refresh.")
      void qc.invalidateQueries({ queryKey: semanticAdminKeys.snapshot })
    },
    onError: (error) => showErrorToast(error),
  })
}

export function useRejectSkillSuggestion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (suggestionId: number) => rejectSkillSuggestion(suggestionId),
    onSuccess: () => {
      showSuccessToast("Rejected. The nightly job will not propose it again.")
      void qc.invalidateQueries({ queryKey: semanticAdminKeys.snapshot })
    },
    onError: (error) => showErrorToast(error),
  })
}

export function useEvictQueryEmbedding() {
  return useMutation({
    mutationFn: (q: string) => evictQueryEmbedding(q),
    onSuccess: () =>
      showSuccessToast("Cached vector evicted — the next comparison will re-embed this query."),
    onError: (error) => showErrorToast(error),
  })
}
