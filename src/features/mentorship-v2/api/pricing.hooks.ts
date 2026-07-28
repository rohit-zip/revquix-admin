/**
 * ─── MENTORSHIP V2 (PHASE 8) PRICING ADMIN HOOKS ──────────────────────────────
 */

"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { showErrorToast, showSuccessToast } from "@/lib/show-toast"
import {
  getPricingSnapshot,
  mapCountry,
  refreshFxRates,
  unmapCountry,
  updateZone,
} from "./pricing.api"

export const pricingAdminKeys = {
  all: ["mentorship-v2", "pricing-admin"] as const,
  snapshot: ["mentorship-v2", "pricing-admin", "snapshot"] as const,
}

export function usePricingSnapshot() {
  return useQuery({
    queryKey: pricingAdminKeys.snapshot,
    queryFn: getPricingSnapshot,
    // 15s, the same reasoning every prior phase's snapshot uses: this panel is watched while an admin
    // forces an FX fetch, so a longer stale time would show state from before their own action.
    staleTime: 15 * 1000,
  })
}

/**
 * Every mutation writes the returned snapshot straight into the cache.
 *
 * The endpoints all return the refreshed snapshot precisely so the panel does not have to invalidate
 * and refetch — which matters here because a zone edit changes derived numbers on other rows (country
 * counts, warnings, invariants), and a refetch race could briefly show the old ones next to the new.
 */
function useSnapshotMutation<TInput>(
  fn: (input: TInput) => Promise<Awaited<ReturnType<typeof getPricingSnapshot>>>,
  successMessage: (input: TInput) => string,
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: (snapshot, input) => {
      qc.setQueryData(pricingAdminKeys.snapshot, snapshot)
      showSuccessToast(successMessage(input))
    },
    onError: (error) => showErrorToast(error),
  })
}

export function useUpdateZone() {
  return useSnapshotMutation<{
    zoneCode: string
    defaultMultiplier?: string
    label?: string
    displayCurrency?: string
    active?: boolean
  }>(
    ({ zoneCode, ...params }) => updateZone(zoneCode, params),
    ({ zoneCode }) => `${zoneCode} updated. New quotes use it immediately; existing orders are untouched.`,
  )
}

export function useMapCountry() {
  return useSnapshotMutation<{ countryCode: string; zoneCode: string }>(
    ({ countryCode, zoneCode }) => mapCountry(countryCode, zoneCode),
    ({ countryCode, zoneCode }) => `${countryCode} now prices in ${zoneCode}.`,
  )
}

export function useUnmapCountry() {
  return useSnapshotMutation<string>(
    (countryCode) => unmapCountry(countryCode),
    (countryCode) => `${countryCode} unmapped — buyers there now pay the mentor's home price.`,
  )
}

export function useRefreshFxRates() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: refreshFxRates,
    onSuccess: (report) => {
      void qc.invalidateQueries({ queryKey: pricingAdminKeys.all })
      showSuccessToast(
        report.failures > 0
          ? `Stored ${report.ratesStored} rate(s) with ${report.failures} failure(s) — existing rates were kept.`
          : `Stored ${report.ratesStored} rate(s).`,
      )
    },
    onError: (error) => showErrorToast(error),
  })
}
