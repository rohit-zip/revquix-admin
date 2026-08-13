/**
 * ─── INTEREST SEGMENT API ─────────────────────────────────────────────────────
 *
 * Saved audience predicates. All paths relative to the apiClient baseURL (/api/v1).
 *
 * Behind `PERM_MANAGE_SEGMENTS`, deliberately not the interest view permission: reading somebody's
 * interest profile and deciding who gets mailed are different powers.
 */

import { apiClient } from "@/lib/axios"
import type { Segment, SegmentDefinition, SegmentPage, SegmentRun } from "./segments.types"

const BASE = "/admin/segments"

export const getSegments = (page = 0, size = 25): Promise<SegmentPage> =>
  apiClient.get<SegmentPage>(BASE, { params: { page, size } }).then((r) => r.data)

export const getSegment = (segmentId: string): Promise<Segment> =>
  apiClient.get<Segment>(`${BASE}/${segmentId}`).then((r) => r.data)

export const createSegment = (body: {
  name: string
  description?: string
  definition: SegmentDefinition
}): Promise<Segment> => apiClient.post<Segment>(BASE, body).then((r) => r.data)

export const updateSegment = (
  segmentId: string,
  body: { name: string; description?: string; definition: SegmentDefinition },
): Promise<Segment> => apiClient.put<Segment>(`${BASE}/${segmentId}`, body).then((r) => r.data)

/** Retires a segment without detaching the campaigns that used it. There is no delete. */
export const archiveSegment = (segmentId: string): Promise<Segment> =>
  apiClient.post<Segment>(`${BASE}/${segmentId}/archive`).then((r) => r.data)

/**
 * Runs a saved segment now, records the run, and refreshes the cached count.
 *
 * ⚠ Returns how many people MATCH, not how many will receive mail. Account eligibility,
 * suppression and the frequency caps are applied by the mailer and reported on the campaign.
 */
export const evaluateSegment = (segmentId: string): Promise<{ matchedCount: number }> =>
  apiClient
    .post<{ matchedCount: number }>(`${BASE}/${segmentId}/evaluate`)
    .then((r) => r.data)

/** Evaluates an unsaved definition — powers the live count in the builder. Records no run. */
export const previewDefinition = (
  definition: SegmentDefinition,
): Promise<{ matchedCount: number }> =>
  apiClient
    .post<{ matchedCount: number }>(`${BASE}/preview`, definition)
    .then((r) => r.data)

export const getSegmentRuns = (segmentId: string): Promise<SegmentRun[]> =>
  apiClient.get<SegmentRun[]>(`${BASE}/${segmentId}/runs`).then((r) => r.data)
