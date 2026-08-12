/**
 * ─── INTEREST GRAPH HOOKS ─────────────────────────────────────────────────────
 *
 * React Query hooks for the admin interest surface.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { showErrorToast, showSuccessToast } from "@/lib/show-toast"
import {
  confirmAutoMatch,
  getAutoMatches,
  getInterestEvidence,
  getInterestOverview,
  getInterestProfile,
  getUnmappedTerms,
  recomputeInterestProfile,
  resolveUnmappedTerm,
  setFacetSuppressed,
} from "./interest.api"
import type { InterestFacetType, UnmappedTermStatus } from "./interest.types"


// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Normalises an unknown rejection into something showErrorToast accepts.
 *
 * Prefers the thrown error itself: an ApiError carries the server's own explanation,
 * and the backend refuses some of these actions with a message worth reading — e.g.
 * confirming a non-ROLE auto-match, which has no alias table to record the decision in.
 * The fallback only applies when nothing threw an Error at all.
 */
function asError(e: unknown, fallback: string): Error {
  return e instanceof Error ? e : new Error(fallback)
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const interestKeys = {
  profile: (userId: string) => ["interest", "profile", userId] as const,
  evidence: (userId: string, facetType: string, facetKey: string) =>
    ["interest", "evidence", userId, facetType, facetKey] as const,
  overview: () => ["interest", "overview"] as const,
  unmapped: (status: string, page: number) => ["interest", "unmapped", status, page] as const,
  autoMatches: (limit: number) => ["interest", "auto-matches", limit] as const,
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useInterestProfile(userId: string, enabled = true) {
  return useQuery({
    queryKey: interestKeys.profile(userId),
    queryFn: () => getInterestProfile(userId),
    enabled: enabled && !!userId,
    // The profile changes when a tool run lands, which is minutes apart at best.
    staleTime: 60 * 1000,
  })
}

/**
 * Lazy — only fetched when a drawer is actually opened.
 *
 * A user can have thirty facets and prefetching all their evidence would be thirty
 * queries to render one screen nobody has clicked into yet.
 */
export function useInterestEvidence(
  userId: string,
  facetType: InterestFacetType | null,
  facetKey: string | null,
) {
  return useQuery({
    queryKey: interestKeys.evidence(userId, facetType ?? "", facetKey ?? ""),
    queryFn: () => getInterestEvidence(userId, facetType!, facetKey!),
    enabled: !!userId && !!facetType && !!facetKey,
    staleTime: 5 * 60 * 1000,
  })
}

export function useInterestOverview() {
  return useQuery({
    queryKey: interestKeys.overview(),
    queryFn: getInterestOverview,
    staleTime: 2 * 60 * 1000,
  })
}

export function useUnmappedTerms(status: UnmappedTermStatus = "OPEN", page = 0, size = 50) {
  return useQuery({
    queryKey: interestKeys.unmapped(status, page),
    queryFn: () => getUnmappedTerms(status, page, size),
    staleTime: 60 * 1000,
  })
}

export function useAutoMatches(limit = 100) {
  return useQuery({
    queryKey: interestKeys.autoMatches(limit),
    queryFn: () => getAutoMatches(limit),
    staleTime: 60 * 1000,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useRecomputeInterestProfile(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => recomputeInterestProfile(userId),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: interestKeys.profile(userId) })
      showSuccessToast(
        result.runsIngested > 0
          ? `Rebuilt from ${result.runsIngested} run(s) — ${result.facetCount} facet(s)`
          : `Nothing new to ingest — ${result.facetCount} facet(s)`,
      )
    },
    onError: (e: unknown) => showErrorToast(asError(e, "Could not recompute this profile")),
  })
}

export function useSetFacetSuppressed(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: {
      facetType: InterestFacetType
      facetKey: string
      suppressed: boolean
      reason?: string
    }) => setFacetSuppressed(userId, body),
    onSuccess: (_data, body) => {
      qc.invalidateQueries({ queryKey: interestKeys.profile(userId) })
      showSuccessToast(body.suppressed ? "Facet suppressed" : "Facet restored")
    },
    onError: (e: unknown) => showErrorToast(asError(e, "Could not update this facet")),
  })
}

export function useResolveUnmappedTerm() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: resolveUnmappedTerm,
    onSuccess: (_data, body) => {
      qc.invalidateQueries({ queryKey: ["interest", "unmapped"] })
      qc.invalidateQueries({ queryKey: interestKeys.overview() })
      showSuccessToast(body.reject ? "Term rejected" : "Term mapped")
    },
    onError: (e: unknown) => showErrorToast(asError(e, "Could not resolve this term")),
  })
}

export function useConfirmAutoMatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: confirmAutoMatch,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["interest", "auto-matches"] })
      showSuccessToast("Alias created — this term now resolves exactly")
    },
    onError: (e: unknown) => showErrorToast(asError(e, "Could not confirm this match")),
  })
}
