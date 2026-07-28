/**
 * ─── MENTORSHIP V2 (PHASE 9) SEARCH ADMIN HOOKS ────────────────────────────────
 */

"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { showErrorToast, showSuccessToast } from "@/lib/show-toast"
import {
  deleteSearchSynonym,
  getSearchSnapshot,
  inspectSearchDocument,
  listSearchSynonyms,
  refreshSearchDocument,
  reindexProjection,
  runProjectionSweep,
  saveSearchSynonym,
  testSearchQuery,
} from "./search.api"
import type { SaveSearchSynonymRequest } from "./search.types"

export const searchAdminKeys = {
  all: ["mentorship-v2", "search-admin"] as const,
  snapshot: ["mentorship-v2", "search-admin", "snapshot"] as const,
  synonyms: ["mentorship-v2", "search-admin", "synonyms"] as const,
  document: (serviceId: string) =>
    ["mentorship-v2", "search-admin", "document", serviceId] as const,
  queryTest: (signature: string) =>
    ["mentorship-v2", "search-admin", "query-test", signature] as const,
}

export function useSearchSnapshot() {
  return useQuery({
    queryKey: searchAdminKeys.snapshot,
    queryFn: getSearchSnapshot,
    // 15s, matching every prior phase's snapshot. This panel is watched while an admin runs a sweep or a
    // reindex, so a longer stale time would show them state from before their own action.
    staleTime: 15 * 1000,
  })
}

export function useSearchSynonyms() {
  return useQuery({
    queryKey: searchAdminKeys.synonyms,
    queryFn: listSearchSynonyms,
    staleTime: 30 * 1000,
  })
}

/**
 * Inspects one projection row.
 *
 * `retry: false` because a 404 here is a *finding*, not a transient failure: it means the service has no
 * projection row, which is exactly what the operator is trying to determine. Retrying three times before
 * reporting it would make the most important answer on this page the slowest one.
 */
export function useSearchDocument(serviceId: string, enabled: boolean) {
  return useQuery({
    queryKey: searchAdminKeys.document(serviceId),
    queryFn: () => inspectSearchDocument(serviceId),
    enabled: enabled && serviceId.trim().length > 0,
    retry: false,
    staleTime: 0,
  })
}

export function useQueryTest(
  params: { q?: string; type?: string; skills?: string; sort?: string; size?: number },
  enabled: boolean,
) {
  const signature = JSON.stringify(params)
  return useQuery({
    queryKey: searchAdminKeys.queryTest(signature),
    queryFn: () => testSearchQuery(params),
    enabled,
    // Never cached. The whole purpose is to observe the current ranking after a config or data change,
    // and a cached answer would show the behaviour from before it.
    staleTime: 0,
    gcTime: 0,
  })
}

export function useRunProjectionSweep() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: runProjectionSweep,
    onSuccess: (report) => {
      showSuccessToast(
        `Sweep complete — ${report.availabilityRefreshed} availability snapshot(s) refreshed, `
          + `${report.missingBackfilled} missing row(s) backfilled, `
          + `${report.orphansRemoved} orphan(s) removed.`,
      )
      // Invalidated rather than written back: the sweep report is not a snapshot, and every counter on
      // the page may have moved.
      void qc.invalidateQueries({ queryKey: searchAdminKeys.snapshot })
    },
    onError: (error) => showErrorToast(error),
  })
}

export function useReindexProjection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (includeAvailability: boolean) => reindexProjection(includeAvailability),
    onSuccess: (report) => {
      if (report.failures > 0) {
        // A partial rebuild is surfaced as an error even though the HTTP request succeeded. A rebuild that
        // silently skipped rows is the exact condition that leaves a real service invisible in the
        // marketplace, and a green toast reading "1,200 written" would bury it.
        showErrorToast(
          new Error(
            `Rebuild finished with ${report.failures} failure(s) — ${report.rowsWritten} of `
              + `${report.servicesScanned} row(s) written. Check the application log.`,
          ),
        )
      } else {
        showSuccessToast(
          `Rebuilt ${report.rowsWritten} of ${report.servicesScanned} row(s); `
            + `${report.orphansRemoved} orphan(s) removed.`,
        )
      }
      void qc.invalidateQueries({ queryKey: searchAdminKeys.snapshot })
    },
    onError: (error) => showErrorToast(error),
  })
}

export function useRefreshSearchDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (serviceId: string) => refreshSearchDocument(serviceId),
    onSuccess: (row) => {
      qc.setQueryData(searchAdminKeys.document(row.serviceId), row)
      void qc.invalidateQueries({ queryKey: searchAdminKeys.snapshot })
      showSuccessToast(
        row.listable
          ? `Rebuilt — this service is listable in the marketplace.`
          : `Rebuilt — this service is NOT listable. See the reason on the row below.`,
      )
    },
    onError: (error) => showErrorToast(error),
  })
}

export function useSaveSearchSynonym() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: SaveSearchSynonymRequest) => saveSearchSynonym(body),
    onSuccess: (row) => {
      void qc.invalidateQueries({ queryKey: searchAdminKeys.synonyms })
      void qc.invalidateQueries({ queryKey: searchAdminKeys.snapshot })
      showSuccessToast(
        `Saved “${row.term}” → “${row.expansion}”. The cached dictionary was evicted, so it is `
          + `testable straight away.`,
      )
    },
    onError: (error) => showErrorToast(error),
  })
}

export function useDeleteSearchSynonym() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (synonymId: number) => deleteSearchSynonym(synonymId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: searchAdminKeys.synonyms })
      void qc.invalidateQueries({ queryKey: searchAdminKeys.snapshot })
      showSuccessToast("Synonym rule deleted.")
    },
    onError: (error) => showErrorToast(error),
  })
}
