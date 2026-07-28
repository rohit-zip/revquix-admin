/**
 * ─── MENTORSHIP V2 (PHASE 6) PACKAGE ADMIN HOOKS ─────────────────────────────
 */

"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { showErrorToast, showSuccessToast } from "@/lib/show-toast"
import { getPackageSnapshot, inspectEntitlement, runPackageLifecycleSweep } from "./packages.api"

export const packageAdminKeys = {
  all: ["mentorship-v2", "packages-admin"] as const,
  snapshot: ["mentorship-v2", "packages-admin", "snapshot"] as const,
  entitlement: (id: string) => ["mentorship-v2", "packages-admin", "entitlement", id] as const,
}

export function usePackageSnapshot() {
  return useQuery({
    queryKey: packageAdminKeys.snapshot,
    queryFn: getPackageSnapshot,
    // 15s, same reasoning as commerce.hooks.ts's snapshot: this panel is used to watch a
    // manual sweep happen in real time, so a longer stale time would show a reviewer state
    // from before their own test.
    staleTime: 15 * 1000,
  })
}

export function useInspectEntitlement(entitlementId: string) {
  return useQuery({
    queryKey: packageAdminKeys.entitlement(entitlementId),
    queryFn: () => inspectEntitlement(entitlementId),
    enabled: entitlementId.trim().length > 0,
    retry: false,
  })
}

export function useRunPackageLifecycleSweep() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: runPackageLifecycleSweep,
    onSuccess: (result) => {
      void qc.invalidateQueries({ queryKey: packageAdminKeys.all })
      const actions =
        result.clockPausesApplied +
        result.nudgesSent +
        result.autoPausesApplied +
        result.selfRefundsUnlocked +
        result.expiryRemindersSent +
        result.expiriesSettled
      showSuccessToast(
        actions > 0
          ? `Sweep applied ${actions} action(s)${result.failures > 0 ? ` (${result.failures} failure(s))` : ""}.`
          : "Sweep ran — nothing needed action right now.",
      )
    },
    onError: (error) => showErrorToast(error),
  })
}
