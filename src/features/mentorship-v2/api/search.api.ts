/**
 * ─── MENTORSHIP V2 (PHASE 9) SEARCH ADMIN API ─────────────────────────────────
 *
 * Backs `AdminMentorshipV2SearchController`.
 *
 * Reads need `PERM_VIEW_MENTORSHIP_V2_INTERNALS`; writes need Phase 3's
 * `PERM_MANAGE_MENTORSHIP_V2_COMMERCE`. No new permission was added for this phase — rebuilding derived
 * data and curating a synonym list are index maintenance, not a discretionary judgement about a named
 * party, so they sit on the same side of the line as forcing a reconciliation sweep.
 */

import { apiClient } from "@/lib/axios"
import type {
  AdminQueryTestResponse,
  AdminSearchSnapshot,
  ProjectionRebuildReport,
  ProjectionSweepReport,
  SaveSearchSynonymRequest,
  SearchDocumentRow,
  SearchSynonymRow,
} from "./search.types"

const BASE = "/admin/mentorship-v2/search"

export const getSearchSnapshot = (): Promise<AdminSearchSnapshot> =>
  apiClient.get<AdminSearchSnapshot>(`${BASE}/snapshot`).then((r) => r.data)

export const inspectSearchDocument = (serviceId: string): Promise<SearchDocumentRow> =>
  apiClient.get<SearchDocumentRow>(`${BASE}/documents/${serviceId}`).then((r) => r.data)

export const listSearchSynonyms = (): Promise<SearchSynonymRow[]> =>
  apiClient.get<SearchSynonymRow[]>(`${BASE}/synonyms`).then((r) => r.data)

/**
 * Runs the real marketplace pipeline and returns per-result scores.
 *
 * Deliberately not logged to search analytics on the server side — an admin testing a query is not a user
 * searching, and letting test queries into the corpus would pollute the very zero-result list this
 * console exists to help read.
 */
export const testSearchQuery = (params: {
  q?: string
  type?: string
  skills?: string
  sort?: string
  size?: number
}): Promise<AdminQueryTestResponse> =>
  apiClient.get<AdminQueryTestResponse>(`${BASE}/query-test`, { params }).then((r) => r.data)

export const runProjectionSweep = (): Promise<ProjectionSweepReport> =>
  apiClient.post<ProjectionSweepReport>(`${BASE}/sweeps/projection`).then((r) => r.data)

/**
 * Full rebuild. `includeAvailability` also recomputes every availability snapshot, which is the one
 * operation on this page that can take minutes — the hourly sweep does that on its own cadence, so the
 * fast rebuild is the sensible default and the slow one has to be chosen deliberately.
 */
export const reindexProjection = (includeAvailability: boolean): Promise<ProjectionRebuildReport> =>
  apiClient
    .post<ProjectionRebuildReport>(`${BASE}/reindex`, undefined, { params: { includeAvailability } })
    .then((r) => r.data)

export const refreshSearchDocument = (serviceId: string): Promise<SearchDocumentRow> =>
  apiClient.post<SearchDocumentRow>(`${BASE}/documents/${serviceId}/refresh`).then((r) => r.data)

export const saveSearchSynonym = (body: SaveSearchSynonymRequest): Promise<SearchSynonymRow> =>
  apiClient.put<SearchSynonymRow>(`${BASE}/synonyms`, body).then((r) => r.data)

export const deleteSearchSynonym = (synonymId: number): Promise<void> =>
  apiClient.delete(`${BASE}/synonyms/${synonymId}`).then(() => undefined)
