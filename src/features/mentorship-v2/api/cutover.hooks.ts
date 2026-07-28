/**
 * ─── MENTORSHIP V2 (PHASE 11) CUTOVER ADMIN HOOKS ────────────────────────────
 */

"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { showErrorToast, showSuccessToast } from "@/lib/show-toast"
import {
  getCutoverReadiness,
  getCutoverRevenue,
  getCutoverSnapshot,
  getLedgerForMentor,
  getLedgerForRun,
  runArchive,
  runBackfill,
  rollbackBackfill,
} from "./cutover.api"

export const cutoverAdminKeys = {
  all: ["mentorship-v2", "cutover-admin"] as const,
  snapshot: ["mentorship-v2", "cutover-admin", "snapshot"] as const,
  revenue: ["mentorship-v2", "cutover-admin", "revenue"] as const,
  readiness: ["mentorship-v2", "cutover-admin", "readiness"] as const,
  ledgerMentor: (id: string) => ["mentorship-v2", "cutover-admin", "ledger", "mentor", id] as const,
  ledgerRun: (id: string) => ["mentorship-v2", "cutover-admin", "ledger", "run", id] as const,
}

export function useCutoverSnapshot() {
  return useQuery({
    queryKey: cutoverAdminKeys.snapshot,
    queryFn: getCutoverSnapshot,
    // 15s, same reasoning as every other Phase snapshot in this console: this panel is used to watch a
    // manual backfill or archive happen, so a longer stale time would show a reviewer state from before
    // their own action.
    staleTime: 15 * 1000,
  })
}

export function useCutoverRevenue() {
  return useQuery({
    queryKey: cutoverAdminKeys.revenue,
    queryFn: getCutoverRevenue,
    staleTime: 60 * 1000,
  })
}

export function useCutoverReadiness() {
  return useQuery({
    queryKey: cutoverAdminKeys.readiness,
    queryFn: getCutoverReadiness,
    staleTime: 15 * 1000,
  })
}

export function useLedgerForMentor(mentorUserId: string) {
  return useQuery({
    queryKey: cutoverAdminKeys.ledgerMentor(mentorUserId),
    queryFn: () => getLedgerForMentor(mentorUserId),
    enabled: mentorUserId.trim().length > 0,
    retry: false,
  })
}

export function useLedgerForRun(runId: string) {
  return useQuery({
    queryKey: cutoverAdminKeys.ledgerRun(runId),
    queryFn: () => getLedgerForRun(runId),
    enabled: runId.trim().length > 0,
    retry: false,
  })
}

export function useRunBackfill() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: { dryRun: boolean; mentorUserId?: string }) => runBackfill(params),
    onSuccess: (report) => {
      void qc.invalidateQueries({ queryKey: cutoverAdminKeys.all })
      const created =
        report.services + report.bookingPreferences + report.availabilityRules + report.legacyIntervals

      // A dry run that would create nothing is the expected result on an already-migrated database, so it
      // is reported as reassurance rather than as a null result the reviewer has to interpret.
      if (report.dryRun) {
        showSuccessToast(
          created === 0
            ? "Dry run complete — nothing to do, every mentor is already migrated"
            : `Dry run complete — would create ${created} row(s). Nothing was written.`,
        )
      } else {
        showSuccessToast(
          created === 0
            ? "Backfill complete — no changes were needed"
            : `Backfill applied — ${created} row(s) created`,
        )
      }

      if (report.conflicts > 0) {
        showErrorToast(
          new Error(
            `${report.conflicts} cross-system conflict(s) detected. At least one mentor is double-booked ` +
              `across the legacy and V2 systems — see the conflicts panel.`,
          ),
        )
      }
    },
    onError: (error) => showErrorToast(error),
  })
}

export function useRollbackBackfill() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (mentorUserId: string) => rollbackBackfill(mentorUserId),
    onSuccess: (result) => {
      void qc.invalidateQueries({ queryKey: cutoverAdminKeys.all })
      // A refusal arrives as a successful response, so it must be surfaced as a problem here or it would
      // read as "rollback done" when nothing was rolled back.
      if (result.refused) {
        showErrorToast(new Error(result.refusedReason ?? "Rollback was refused."))
        return
      }
      showSuccessToast(
        `Rolled back ${result.mentorUserId} — ${result.rolledBackServices} service(s), ` +
          `${result.rolledBackAvailabilityRules} rule(s), ${result.releasedLegacyIntervals} interval(s) released`,
      )
    },
    onError: (error) => showErrorToast(error),
  })
}

export function useRunArchive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: { dryRun: boolean; force: boolean }) => runArchive(params),
    onSuccess: (result) => {
      void qc.invalidateQueries({ queryKey: cutoverAdminKeys.all })
      showSuccessToast(
        result.dryRun
          ? `Dry run complete — would archive ${result.totalRowsInSource} row(s). Nothing was copied.`
          : `Archived ${result.totalRowsArchived} of ${result.totalRowsInSource} row(s). Source tables left in place.`,
      )
    },
    onError: (error) => showErrorToast(error),
  })
}
