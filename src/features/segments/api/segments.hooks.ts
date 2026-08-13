/**
 * ─── INTEREST SEGMENT HOOKS ───────────────────────────────────────────────────
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { showErrorToast, showSuccessToast } from "@/lib/show-toast"
import {
  archiveSegment,
  createSegment,
  evaluateSegment,
  getSegment,
  getSegmentRuns,
  getSegments,
  previewDefinition,
  updateSegment,
} from "./segments.api"
import type { SegmentDefinition } from "./segments.types"

/**
 * Prefers the thrown error — the backend refuses these with messages worth reading.
 * "This segment does not narrow anything down yet" (RQ-VE-444) tells the operator exactly what to
 * do; a generic fallback does not.
 */
function asError(e: unknown, fallback: string): Error {
  return e instanceof Error ? e : new Error(fallback)
}

export const segmentKeys = {
  list: (page: number) => ["segments", "list", page] as const,
  detail: (id: string) => ["segments", "detail", id] as const,
  runs: (id: string) => ["segments", "runs", id] as const,
}

export function useSegments(page = 0, size = 25) {
  return useQuery({
    queryKey: segmentKeys.list(page),
    queryFn: () => getSegments(page, size),
    staleTime: 60 * 1000,
  })
}

export function useSegment(segmentId: string | null) {
  return useQuery({
    queryKey: segmentKeys.detail(segmentId ?? ""),
    queryFn: () => getSegment(segmentId!),
    enabled: !!segmentId,
    staleTime: 30 * 1000,
  })
}

export function useSegmentRuns(segmentId: string | null) {
  return useQuery({
    queryKey: segmentKeys.runs(segmentId ?? ""),
    queryFn: () => getSegmentRuns(segmentId!),
    enabled: !!segmentId,
    staleTime: 30 * 1000,
  })
}

export function useCreateSegment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createSegment,
    onSuccess: (segment) => {
      qc.invalidateQueries({ queryKey: ["segments"] })
      showSuccessToast(`Segment "${segment.name}" created`)
    },
    onError: (e: unknown) => showErrorToast(asError(e, "Could not create that segment")),
  })
}

export function useUpdateSegment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: {
      segmentId: string
      name: string
      description?: string
      definition: SegmentDefinition
    }) => updateSegment(vars.segmentId, vars),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["segments"] })
      // Worded as a prompt rather than a bare "saved": the backend clears the cached count on
      // update because it described the previous predicate, so the list will show "not evaluated"
      // until somebody runs it. Saying so stops that reading as data loss.
      showSuccessToast("Segment saved — evaluate it to see the new count")
    },
    onError: (e: unknown) => showErrorToast(asError(e, "Could not save that segment")),
  })
}

export function useArchiveSegment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: archiveSegment,
    onSuccess: (segment) => {
      qc.invalidateQueries({ queryKey: ["segments"] })
      showSuccessToast(`"${segment.name}" archived — past campaigns keep their link to it`)
    },
    onError: (e: unknown) => showErrorToast(asError(e, "Could not archive that segment")),
  })
}

export function useEvaluateSegment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: evaluateSegment,
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["segments"] })
      showSuccessToast(`${result.matchedCount} ${result.matchedCount === 1 ? "person" : "people"} match`)
    },
    onError: (e: unknown) => showErrorToast(asError(e, "Could not evaluate that segment")),
  })
}

/**
 * The builder's live count.
 *
 * A mutation rather than a query, deliberately: it is triggered by an explicit "Preview" press, not
 * by every keystroke. Auto-running it on each edit would issue a predicate query per character and
 * — worse — show a confident count for a half-typed facet key that happens to match nothing.
 */
export function usePreviewDefinition() {
  return useMutation({
    mutationFn: previewDefinition,
    onError: (e: unknown) => showErrorToast(asError(e, "Could not evaluate that definition")),
  })
}
