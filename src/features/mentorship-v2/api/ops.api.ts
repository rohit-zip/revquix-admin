/**
 * ─── PHASE 2 OPS ENDPOINTS ────────────────────────────────────────────────────
 *
 * Job health and history, the admin action audit, reference lookup, service moderation and the
 * bulk actions.
 */

import { apiClient } from "@/lib/axios"
import type {
  GenericFilterRequest,
  GenericFilterResponse,
  PaginationParams,
} from "@/core/filters/filter.types"
import type { AdminCatalogueRow } from "./admin-lists.types"
import type {
  AdminAuditRow,
  BulkAssignResult,
  JobHealthRow,
  JobRunRow,
  LookupResult,
} from "./ops.types"

const BASE = "/admin/mentorship-v2"

// ─── Jobs ─────────────────────────────────────────────────────────────────────

/** GET /jobs — every scheduled job, with its schedule, last run and staleness. */
export const getJobHealth = (): Promise<JobHealthRow[]> =>
  apiClient.get<JobHealthRow[]>(`${BASE}/jobs`).then((r) => r.data)

/** GET /jobs/{jobName}/runs — recent executions of one job, newest first. */
export const getJobRuns = (jobName: string, limit = 25): Promise<JobRunRow[]> =>
  apiClient.get<JobRunRow[]>(`${BASE}/jobs/${jobName}/runs?limit=${limit}`).then((r) => r.data)

/**
 * POST /jobs/{jobName}/run — run one job now.
 *
 * Recorded as MANUAL. That matters: if a manual run wrote an indistinguishable SUCCESS, the act of
 * investigating a dead scheduler would reset the clock that proves it dead.
 */
export const runJob = (jobName: string): Promise<Record<string, unknown>> =>
  apiClient.post<Record<string, unknown>>(`${BASE}/jobs/${jobName}/run`).then((r) => r.data)

// ─── Audit ────────────────────────────────────────────────────────────────────

/** POST /jobs/audit/search — every administrative write against the subsystem. */
export const searchAudit = (
  request: GenericFilterRequest,
  params: PaginationParams,
): Promise<GenericFilterResponse<AdminAuditRow>> =>
  apiClient
    .post<GenericFilterResponse<AdminAuditRow>>(
      `${BASE}/jobs/audit/search?page=${params.page}&size=${params.size}`,
      request,
    )
    .then((r) => r.data)

// ─── Lookup ───────────────────────────────────────────────────────────────────

/** GET /lookup?ref= — resolve BKG/ORD/DSP/MSV/PEN/MPO to its detail page. */
export const lookupReference = (ref: string): Promise<LookupResult> =>
  apiClient
    .get<LookupResult>(`${BASE}/lookup?ref=${encodeURIComponent(ref)}`)
    .then((r) => r.data)

// ─── Service moderation ───────────────────────────────────────────────────────

/**
 * POST /services/{serviceId}/suspend — take a listing off the market directly.
 *
 * The mentor cannot lift this: SUSPENDED is a separate status from the mentor-owned PAUSED, and
 * `publish()` refuses to move it.
 */
export const suspendService = (serviceId: string, reason: string): Promise<AdminCatalogueRow> =>
  apiClient
    .post<AdminCatalogueRow>(`${BASE}/services/${serviceId}/suspend`, { reason })
    .then((r) => r.data)

/** POST /services/{serviceId}/unsuspend — returns the service to DRAFT so the publish gate reruns. */
export const unsuspendService = (serviceId: string, reason?: string): Promise<AdminCatalogueRow> =>
  apiClient
    .post<AdminCatalogueRow>(`${BASE}/services/${serviceId}/unsuspend`, reason ? { reason } : {})
    .then((r) => r.data)

// ─── Bulk actions ─────────────────────────────────────────────────────────────

/** POST /disputes/bulk-assign — assign a batch to yourself, one at a time, skipping what cannot move. */
export const bulkAssignDisputes = (disputeIds: string[]): Promise<BulkAssignResult> =>
  apiClient
    .post<BulkAssignResult>(`${BASE}/disputes/bulk-assign`, disputeIds)
    .then((r) => r.data)
