/**
 * ─── MENTORSHIP V2 (PHASE 0) VERIFICATION HOOKS ─────────────────────────────
 *
 * React Query hooks for AdminMentorshipV2VerificationController endpoints.
 */

"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { showErrorToast, showSuccessToast } from "@/lib/show-toast"
import type { ApiError, NetworkError } from "@/lib/api-error"
import {
  getMentorshipV2FxRates,
  getMentorshipV2Health,
  getMentorshipV2RecentQuotes,
  getMentorshipV2Zones,
  previewMentorshipV2PricingQuote,
} from "./mentorship-v2.api"
import type { PricingQuotePreviewRequest } from "./mentorship-v2.types"

export const mentorshipV2Keys = {
  health: ["mentorship-v2", "health"] as const,
  zones: ["mentorship-v2", "zones"] as const,
  fxRates: ["mentorship-v2", "fx-rates"] as const,
  recentQuotes: (limit: number) => ["mentorship-v2", "pricing-quote", "recent", limit] as const,
}

/** Phase 0 schema/config health snapshot. */
export function useMentorshipV2Health() {
  return useQuery({
    queryKey: mentorshipV2Keys.health,
    queryFn: getMentorshipV2Health,
  })
}

/** Seeded pricing zones with mapped countries. */
export function useMentorshipV2Zones() {
  return useQuery({
    queryKey: mentorshipV2Keys.zones,
    queryFn: getMentorshipV2Zones,
  })
}

/** Seeded FX rates. */
export function useMentorshipV2FxRates() {
  return useQuery({
    queryKey: mentorshipV2Keys.fxRates,
    queryFn: getMentorshipV2FxRates,
  })
}

/** Most recently computed pricing-quote previews, newest first. */
export function useMentorshipV2RecentQuotes(limit = 10) {
  return useQuery({
    queryKey: mentorshipV2Keys.recentQuotes(limit),
    queryFn: () => getMentorshipV2RecentQuotes(limit),
  })
}

/** Runs a live amount/currency through PricingEngine and returns the full fee breakdown. */
export function usePreviewMentorshipV2PricingQuote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (request: PricingQuotePreviewRequest) => previewMentorshipV2PricingQuote(request),
    retry: false,
    onSuccess: () => {
      showSuccessToast("Quote computed")
      qc.invalidateQueries({ queryKey: ["mentorship-v2", "pricing-quote", "recent"] })
    },
    onError: (error: ApiError | NetworkError) => showErrorToast(error),
  })
}
