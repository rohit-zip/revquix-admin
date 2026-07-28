/**
 * ─── MENTORSHIP V2 (PHASE 10) SEMANTIC SEARCH ADMIN API ───────────────────────
 *
 * Backs `AdminMentorshipV2SemanticController`.
 *
 * Reads need `PERM_VIEW_MENTORSHIP_V2_INTERNALS`; writes need Phase 3's
 * `PERM_MANAGE_MENTORSHIP_V2_COMMERCE`. No new permission for this phase — see the controller's javadoc for
 * why accepting a skill suggestion is a catalogue edit of the kind that permission already covers rather than
 * a discretionary judgement of the kind Phase 7 needed its own permission for.
 *
 * Note what is deliberately absent: there is no endpoint to switch semantic search on, or to set the
 * experiment rollout. Those are configuration changes that go through a deploy, because the phase's exit
 * criterion is a product decision that may legitimately come back as "keep V1" — and a decision of that weight
 * should leave a trace in version control rather than in an audit log nobody reads.
 */

import { apiClient } from "@/lib/axios"
import type {
  AdminSemanticSnapshot,
  EmbeddingSweepReport,
  OfflineJobsReport,
  SemanticCapabilityProbe,
  SemanticQueryComparison,
} from "./semantic.types"

const BASE = "/admin/mentorship-v2/semantic"

export const getSemanticSnapshot = (): Promise<AdminSemanticSnapshot> =>
  apiClient.get<AdminSemanticSnapshot>(`${BASE}/snapshot`).then((r) => r.data)

/**
 * Runs the same query through keyword-only, hybrid, and raw vector retrieval.
 *
 * The primary diagnostic for this phase: the exit criterion is otherwise only answerable weeks later from
 * aggregate conversion numbers, and this makes a tuning change something you can reason about today.
 */
export const compareSemanticQuery = (
  q: string,
  size = 10,
): Promise<SemanticQueryComparison> =>
  apiClient
    .get<SemanticQueryComparison>(`${BASE}/compare`, { params: { q, size } })
    .then((r) => r.data)

/** Re-probes for pgvector so an operator can see their own fix without an application restart. */
export const refreshSemanticCapability = (): Promise<SemanticCapabilityProbe> =>
  apiClient.post<SemanticCapabilityProbe>(`${BASE}/capability/refresh`).then((r) => r.data)

export const runEmbeddingPass = (): Promise<EmbeddingSweepReport> =>
  apiClient.post<EmbeddingSweepReport>(`${BASE}/embeddings/run`).then((r) => r.data)

/** Destructive. Removes all semantic ranking until the next pass completes. */
export const clearEmbeddings = (): Promise<number> =>
  apiClient.post<number>(`${BASE}/embeddings/clear`).then((r) => r.data)

export const runOfflineJobs = (): Promise<OfflineJobsReport> =>
  apiClient.post<OfflineJobsReport>(`${BASE}/offline-jobs/run`).then((r) => r.data)

export const acceptSkillSuggestion = (suggestionId: number): Promise<void> =>
  apiClient.post(`${BASE}/suggestions/${suggestionId}/accept`).then(() => undefined)

export const rejectSkillSuggestion = (suggestionId: number): Promise<void> =>
  apiClient.post(`${BASE}/suggestions/${suggestionId}/reject`).then(() => undefined)

export const evictQueryEmbedding = (q: string): Promise<void> =>
  apiClient.post(`${BASE}/query-cache/evict`, undefined, { params: { q } }).then(() => undefined)
