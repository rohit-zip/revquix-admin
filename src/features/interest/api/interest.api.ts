/**
 * ─── INTEREST GRAPH API ───────────────────────────────────────────────────────
 *
 * All paths are relative to the apiClient baseURL (/api/v1).
 */

import { apiClient } from "@/lib/axios"
import type {
  AutoMatch,
  InterestEvidence,
  InterestFacetType,
  InterestOverview,
  InterestProfile,
  RecomputeResult,
  UnmappedTerm,
  UnmappedTermStatus,
} from "./interest.types"

const BASE = "/admin/interests"

// ═══════════════════════════════════════════════════════════════════════════════
// ONE USER
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /admin/interests/users/{userId} — the whole Interests tab in one call. */
export const getInterestProfile = (userId: string): Promise<InterestProfile> =>
  apiClient.get<InterestProfile>(`${BASE}/users/${userId}`).then((r) => r.data)

/**
 * GET /admin/interests/users/{userId}/evidence — the "why?" drawer.
 *
 * The single most important call here. Without it a facet is a number nobody can
 * check, and "System Design — 0.82" is not something an admin can act on.
 */
export const getInterestEvidence = (
  userId: string,
  facetType: InterestFacetType,
  facetKey: string,
): Promise<InterestEvidence[]> =>
  apiClient
    .get<InterestEvidence[]>(`${BASE}/users/${userId}/evidence`, {
      params: { facetType, facetKey },
    })
    .then((r) => r.data)

/**
 * POST /admin/interests/users/{userId}/recompute
 *
 * Safe to press twice: ingestion is idempotent on the evidence pointer, so runs that
 * already produced signals are skipped rather than re-folded.
 */
export const recomputeInterestProfile = (userId: string): Promise<RecomputeResult> =>
  apiClient.post<RecomputeResult>(`${BASE}/users/${userId}/recompute`).then((r) => r.data)

/** PATCH /admin/interests/users/{userId}/facets — suppress or restore one facet. */
export const setFacetSuppressed = (
  userId: string,
  body: {
    facetType: InterestFacetType
    facetKey: string
    suppressed: boolean
    reason?: string
  },
): Promise<void> =>
  apiClient.patch(`${BASE}/users/${userId}/facets`, body).then(() => undefined)

// ═══════════════════════════════════════════════════════════════════════════════
// CONSOLE
// ═══════════════════════════════════════════════════════════════════════════════

export const getInterestOverview = (): Promise<InterestOverview> =>
  apiClient.get<InterestOverview>(`${BASE}/overview`).then((r) => r.data)

export const getUnmappedTerms = (
  status: UnmappedTermStatus = "OPEN",
  page = 0,
  size = 50,
): Promise<{ content: UnmappedTerm[]; totalElements: number; totalPages: number }> =>
  apiClient
    .get(`${BASE}/unmapped`, { params: { status, page, size } })
    .then((r) => r.data)

export const resolveUnmappedTerm = (body: {
  facetType: InterestFacetType
  normalisedTerm: string
  targetKey?: string | null
  reject: boolean
}): Promise<void> =>
  apiClient.post(`${BASE}/unmapped/resolve`, body).then(() => undefined)

/** Worst-scoring matches first — that is where the wrong answers live. */
export const getAutoMatches = (limit = 100): Promise<AutoMatch[]> =>
  apiClient.get<AutoMatch[]>(`${BASE}/auto-matches`, { params: { limit } }).then((r) => r.data)

export const confirmAutoMatch = (body: {
  facetType: InterestFacetType
  rawTerm: string
  facetKey: string
}): Promise<void> =>
  apiClient.post(`${BASE}/auto-matches/confirm`, body).then(() => undefined)
