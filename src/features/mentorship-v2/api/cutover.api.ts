/**
 * ─── MENTORSHIP V2 (PHASE 11) CUTOVER ADMIN API ──────────────────────────────
 *
 * Backs AdminMentorshipV2CutoverController. Reads need `PERM_VIEW_MENTORSHIP_V2_INTERNALS`; the backfill,
 * rollback and archive actions need `PERM_MANAGE_MENTORSHIP_V2_COMMERCE` (admin-only) — a backfill run
 * creates live purchasable services, a rollback deletes them, and an archive copies production data into
 * a new schema.
 *
 * The write actions are ADDITIONALLY gated server-side by `app.mentorship.cutover.backfill-endpoint-enabled`,
 * which defaults to false. So holding the permission is not sufficient, and the console surfaces that
 * distinction rather than letting a 409 look like a bug.
 */

import { apiClient } from "@/lib/axios"
import type {
  AdminCutoverSnapshot,
  ArchiveRunResult,
  BackfillLedgerEntry,
  BackfillRollbackResult,
  BackfillRunReport,
  DecommissionReadinessRow,
  RevenueReconciliationRow,
} from "./cutover.types"

const BASE = "/admin/mentorship-v2/cutover"

// ─── Reads ────────────────────────────────────────────────────────────────────

export const getCutoverSnapshot = (): Promise<AdminCutoverSnapshot> =>
  apiClient.get<AdminCutoverSnapshot>(`${BASE}/snapshot`).then((r) => r.data)

export const getCutoverRevenue = (): Promise<RevenueReconciliationRow[]> =>
  apiClient.get<RevenueReconciliationRow[]>(`${BASE}/revenue`).then((r) => r.data)

export const getCutoverReadiness = (): Promise<DecommissionReadinessRow[]> =>
  apiClient.get<DecommissionReadinessRow[]>(`${BASE}/readiness`).then((r) => r.data)

/**
 * Everything the migration ever did to one mentor.
 *
 * This is the query the ledger exists for — "mentor X says their migrated prices are wrong" is answerable
 * from here, including the source values each decision was made from, without re-reading a legacy table
 * that may have changed since.
 */
export const getLedgerForMentor = (mentorUserId: string): Promise<BackfillLedgerEntry[]> =>
  apiClient
    .get<BackfillLedgerEntry[]>(`${BASE}/ledger/mentors/${encodeURIComponent(mentorUserId)}`)
    .then((r) => r.data)

export const getLedgerForRun = (runId: string): Promise<BackfillLedgerEntry[]> =>
  apiClient
    .get<BackfillLedgerEntry[]>(`${BASE}/ledger/runs/${encodeURIComponent(runId)}`)
    .then((r) => r.data)

// ─── Writes ───────────────────────────────────────────────────────────────────

/**
 * Runs `mentorship.backfill_run(dryRun, mentorUserId)` — the same SQL function the V204 migration executed,
 * not a Java or TypeScript reimplementation of it. Idempotent: a second apply pass writes nothing and
 * records SKIPPED_EXISTS for everything already present.
 */
export const runBackfill = (params: {
  dryRun: boolean
  mentorUserId?: string
}): Promise<BackfillRunReport> =>
  apiClient
    .post<BackfillRunReport>(`${BASE}/backfill`, undefined, {
      params: { dryRun: params.dryRun, mentorUserId: params.mentorUserId || undefined },
    })
    .then((r) => r.data)

/** Refuses if any commerce order references a backfilled service. The refusal is a 200 with a reason. */
export const rollbackBackfill = (mentorUserId: string): Promise<BackfillRollbackResult> =>
  apiClient
    .post<BackfillRollbackResult>(`${BASE}/backfill/rollback/${encodeURIComponent(mentorUserId)}`)
    .then((r) => r.data)

/**
 * Copies the legacy tables into the `legacy` schema. Never drops anything — dropping is a separate,
 * later, manifest-gated migration that deliberately does not exist yet.
 */
export const runArchive = (params: {
  dryRun: boolean
  force: boolean
}): Promise<ArchiveRunResult> =>
  apiClient
    .post<ArchiveRunResult>(`${BASE}/archive`, undefined, {
      params: { dryRun: params.dryRun, force: params.force },
    })
    .then((r) => r.data)
