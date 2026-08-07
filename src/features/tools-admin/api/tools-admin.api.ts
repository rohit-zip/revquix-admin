/**
 * ─── TOOLS ADMIN API (PHASE 8) ───────────────────────────────────────────────
 *
 * Backs the four Phase 8 controllers. Paths are relative to `apiClient`'s baseURL
 * (`…/api/v1`), so they start at `/admin/tools`.
 *
 * Permissions, enforced server-side on every endpoint (§8.9 criterion 9 — "the UI hiding a button
 * is not the control"):
 *
 *   `PERM_MANAGE_CREDITS`      ledger browser, adjustments, bulk grant, free-quota override,
 *                              pricing, fraud queue and its triage actions, run refund
 *   `PERM_MANAGE_TOOL_RUNS`    run inspector, hold release, retry, spend dashboard
 *   `PERM_MANAGE_TOOL_RUBRIC`  rubric distribution, content library
 *   any of the three           the audit trail
 *
 * The run **refund** deliberately needs the credits permission rather than the runs permission: it
 * writes to the ledger, and an on-call engineer who can see why runs are failing should not thereby
 * acquire the ability to move money. A reader holding only `PERM_MANAGE_TOOL_RUNS` gets the page and
 * a clean 403 on that one action.
 */

import { apiClient } from "@/lib/axios";
import type {
  GenericFilterRequest,
  PaginationParams,
} from "@/core/filters/filter.types";
import type {
  AdminAdjustmentResult,
  AdminAuditPage,
  AdminAuditRow,
  AdminBulkGrantRequest,
  AdminBulkGrantResult,
  AdminContentLibraryStatus,
  AdminCreditAdjustmentRequest,
  AdminFraudQueue,
  AdminReferralDecisionRequest,
  AdminReferralReview,
  AdminFreeQuotaOverrideRequest,
  AdminGuardrailStatus,
  AdminIpHashLookupRequest,
  AdminIpHashLookupResponse,
  AdminLedgerEntry,
  AdminLedgerPage,
  AdminPackageUpsertRequest,
  AdminPackageWriteResult,
  AdminPassActionRequest,
  AdminPassRow,
  AdminPricingCatalogue,
  AdminRetryRunResponse,
  AdminRubricDistribution,
  AdminRunActionRequest,
  AdminRunDetail,
  AdminRunPage,
  AdminSpendDashboard,
  AdminSubjectTriageRequest,
  AdminUserCreditProfile,
  ToolBrand,
} from "./tools-admin.types";

const CREDITS = "/admin/tools/credits";
const RUNS = "/admin/tools/runs";
const TOOLS = "/admin/tools";

// ─── §8.1 Ledger browser ─────────────────────────────────────────────────────

/**
 * A POST for a read, matching every other search endpoint in this application
 * (`POST /user/search`, `POST /admin/payments/search`): the filter is a structured body. Nothing
 * changes state, and a growing ledger is not cacheable anyway.
 */
export const searchCreditLedger = (
  request: GenericFilterRequest,
  params: PaginationParams,
): Promise<AdminLedgerPage> =>
  apiClient
    .post<AdminLedgerPage>(`${CREDITS}/search`, request, { params })
    .then((r) => r.data);

/**
 * CSV of the current filter, for finance and for disputes.
 *
 * Returns raw text. The server **refuses** rather than truncating when the filter matches more rows
 * than the export limit — a silently partial finance export is a reconciliation that is quietly
 * wrong, which is the worst failure available here.
 */
export const exportCreditLedger = (
  request: GenericFilterRequest,
): Promise<string> =>
  apiClient
    .post<string>(`${CREDITS}/export`, request, { responseType: "text" })
    .then((r) => r.data);

export const getUserCreditProfile = (
  userId: string,
  brand?: ToolBrand,
): Promise<AdminUserCreditProfile> =>
  apiClient
    .get<AdminUserCreditProfile>(`${CREDITS}/users/${userId}`, {
      params: brand ? { brand } : undefined,
    })
    .then((r) => r.data);

export const getUserCreditStatement = (
  userId: string,
  page = 0,
  size = 20,
  brand?: ToolBrand,
): Promise<{ userId: string; entries: AdminLedgerEntry[] }> =>
  apiClient
    .get<{ userId: string; entries: AdminLedgerEntry[] }>(
      `${CREDITS}/users/${userId}/statement`,
      {
        params: { page, size, ...(brand ? { brand } : {}) },
      },
    )
    .then((r) => r.data);

/**
 * Resolves an id, email or username to a user id.
 *
 * §8.1's filter offers "user (id / email / name)" while the ledger stores only an id. Resolving first
 * and filtering on the id costs one round trip and avoids a cross-schema join on a financial table —
 * and it lets the console show which account it landed on, which matters when two people share a
 * name.
 */
export const resolveCreditUser = (
  identifier: string,
): Promise<{ identifier: string; resolved: boolean; userId: string }> =>
  apiClient
    .get<{ identifier: string; resolved: boolean; userId: string }>(
      `${CREDITS}/resolve-user`,
      {
        params: { identifier },
      },
    )
    .then((r) => r.data);

// ─── §8.2 Adjustments ────────────────────────────────────────────────────────

export const getCreditGuardrails = (): Promise<AdminGuardrailStatus> =>
  apiClient
    .get<AdminGuardrailStatus>(`${CREDITS}/guardrails`)
    .then((r) => r.data);

/**
 * Applies one adjustment.
 *
 * A 200 with `outcome: "PENDING_APPROVAL"` means the request was accepted and is queued for a second
 * administrator. Callers must not treat that as success-and-done.
 */
export const adjustCredits = (
  payload: AdminCreditAdjustmentRequest,
): Promise<AdminAdjustmentResult> =>
  apiClient
    .post<AdminAdjustmentResult>(`${CREDITS}/adjust`, payload)
    .then((r) => r.data);

export const declineAdjustment = (
  auditId: string,
  reason?: string,
): Promise<AdminAdjustmentResult> =>
  apiClient
    .post<AdminAdjustmentResult>(
      `${CREDITS}/adjustments/${auditId}/decline`,
      undefined,
      {
        params: reason ? { reason } : undefined,
      },
    )
    .then((r) => r.data);

export const bulkGrantCredits = (
  payload: AdminBulkGrantRequest,
): Promise<AdminBulkGrantResult> =>
  apiClient
    .post<AdminBulkGrantResult>(`${CREDITS}/bulk-grant`, payload)
    .then((r) => r.data);

export const setFreeQuotaOverride = (
  payload: AdminFreeQuotaOverrideRequest,
): Promise<AdminAdjustmentResult> =>
  apiClient
    .post<AdminAdjustmentResult>(`${CREDITS}/free-quota`, payload)
    .then((r) => r.data);

// ─── §8.3 Run inspector ──────────────────────────────────────────────────────

export const searchToolRuns = (
  request: GenericFilterRequest,
  params: PaginationParams,
): Promise<AdminRunPage> =>
  apiClient
    .post<AdminRunPage>(`${RUNS}/search`, request, { params })
    .then((r) => r.data);

export const inspectToolRun = (runId: string): Promise<AdminRunDetail> =>
  apiClient.get<AdminRunDetail>(`${RUNS}/${runId}`).then((r) => r.data);

/**
 * Hashes an externally-obtained IP address for use as a run filter.
 *
 * A POST because an address must travel in a **body**, not a query string: a query string lands in
 * access logs, browser history and any proxy in between, which would reintroduce the exposure the
 * hashing design exists to remove. The response does not echo the address back either.
 */
export const lookupIpHash = (
  payload: AdminIpHashLookupRequest,
): Promise<AdminIpHashLookupResponse> =>
  apiClient
    .post<AdminIpHashLookupResponse>(`${RUNS}/ip-hash`, payload)
    .then((r) => r.data);

export const forceReleaseHold = (
  runId: string,
  payload: AdminRunActionRequest,
): Promise<AdminAdjustmentResult> =>
  apiClient
    .post<AdminAdjustmentResult>(`${RUNS}/${runId}/release-hold`, payload)
    .then((r) => r.data);

export const refundRun = (
  runId: string,
  payload: AdminRunActionRequest,
): Promise<AdminAdjustmentResult> =>
  apiClient
    .post<AdminAdjustmentResult>(`${RUNS}/${runId}/refund`, payload)
    .then((r) => r.data);

/**
 * Locates a run's input so it can be re-submitted.
 *
 * Does **not** create a run — see the server's OpenAPI description. `tool_run` stores a hash of the
 * input rather than the input, so this either returns the asset reference or refuses with
 * `INPUT_NOT_RECONSTRUCTIBLE`.
 */
export const retryRun = (
  runId: string,
  payload: AdminRunActionRequest,
): Promise<AdminRetryRunResponse> =>
  apiClient
    .post<AdminRetryRunResponse>(`${RUNS}/${runId}/retry`, payload)
    .then((r) => r.data);

// ─── §8.4 Spend ──────────────────────────────────────────────────────────────

export const getToolSpend = (params: {
  from?: string;
  to?: string;
  brand?: ToolBrand;
}): Promise<AdminSpendDashboard> =>
  apiClient
    .get<AdminSpendDashboard>(`${TOOLS}/spend`, { params })
    .then((r) => r.data);

// ─── §8.7 Fraud ──────────────────────────────────────────────────────────────

export const getFraudQueue = (brand?: ToolBrand): Promise<AdminFraudQueue> =>
  apiClient
    .get<AdminFraudQueue>(`${TOOLS}/fraud`, {
      params: brand ? { brand } : undefined,
    })
    .then((r) => r.data);

export const revokeToolsAccess = (
  payload: AdminSubjectTriageRequest,
): Promise<AdminAdjustmentResult> =>
  apiClient
    .post<AdminAdjustmentResult>(`${TOOLS}/fraud/revoke-tools-access`, payload)
    .then((r) => r.data);

export const markSubjectAbuse = (
  payload: AdminSubjectTriageRequest,
): Promise<AdminAdjustmentResult> =>
  apiClient
    .post<AdminAdjustmentResult>(`${TOOLS}/fraud/mark-abuse`, payload)
    .then((r) => r.data);

export const whitelistSubject = (
  payload: AdminSubjectTriageRequest,
): Promise<AdminAdjustmentResult> =>
  apiClient
    .post<AdminAdjustmentResult>(`${TOOLS}/fraud/whitelist`, payload)
    .then((r) => r.data);

// ─── Referral review ─────────────────────────────────────────────────────────

/**
 * Referrals awaiting a human decision, plus the funnel that says whether the guard's thresholds
 * are right. This queue is what makes granting on conversion safe: an ambiguous signal is held for
 * review rather than silently refused, which is only an improvement if someone can see it.
 */
export const getReferralReview = (): Promise<AdminReferralReview> =>
  apiClient
    .get<AdminReferralReview>(`${TOOLS}/referrals/review`)
    .then((r) => r.data);

/** Pays a held referral. Re-runs the ordinary grant with the heuristic rules suppressed. */
export const releaseReferral = (
  payload: AdminReferralDecisionRequest,
): Promise<{ attemptId: string; granted: boolean }> =>
  apiClient
    .post<{ attemptId: string; granted: boolean }>(`${TOOLS}/referrals/release`, payload)
    .then((r) => r.data);

/** Refuses a held referral. Terminal, and silent to both parties. */
export const rejectReferral = (
  payload: AdminReferralDecisionRequest,
): Promise<{ attemptId: string; status: string }> =>
  apiClient
    .post<{ attemptId: string; status: string }>(`${TOOLS}/referrals/reject`, payload)
    .then((r) => r.data);

// ─── §8.5 / §8.6 / §8.8 Governance ───────────────────────────────────────────

export const getToolPricing = (): Promise<AdminPricingCatalogue> =>
  apiClient.get<AdminPricingCatalogue>(`${TOOLS}/pricing`).then((r) => r.data);

// ─── §8.5 write half — lit up by Phase 10 ────────────────────────────────────
//
// There is deliberately no `deletePackage`. Deactivation only: a deleted SKU orphans every
// `user_pass.package_code` and every `payment_order.context_entity_id` that names it, which turns a
// purchase record into an unexplainable one and leaves a later refund unable to work out how many
// credits to revoke.

export const createCreditPackage = (
  payload: AdminPackageUpsertRequest,
): Promise<AdminPackageWriteResult> =>
  apiClient
    .post<AdminPackageWriteResult>(`${TOOLS}/packages`, payload)
    .then((r) => r.data);

export const updateCreditPackage = (
  packageId: string,
  payload: AdminPackageUpsertRequest,
): Promise<AdminPackageWriteResult> =>
  apiClient
    .put<AdminPackageWriteResult>(`${TOOLS}/packages/${packageId}`, payload)
    .then((r) => r.data);

export const setCreditPackageActive = (
  packageId: string,
  active: boolean,
  payload: AdminPackageUpsertRequest,
): Promise<AdminPackageWriteResult> =>
  apiClient
    .post<AdminPackageWriteResult>(
      `${TOOLS}/packages/${packageId}/active`,
      payload,
      {
        params: { active },
      },
    )
    .then((r) => r.data);

// ─── §8.2 "Grant / revoke a pass" — lit up by Phase 10 ───────────────────────

export const getUserPasses = (userId: string): Promise<AdminPassRow[]> =>
  apiClient
    .get<AdminPassRow[]>(`${TOOLS}/passes`, { params: { userId } })
    .then((r) => r.data);

export const grantUserPass = (
  payload: AdminPassActionRequest,
): Promise<AdminPassRow> =>
  apiClient
    .post<AdminPassRow>(`${TOOLS}/passes/grant`, payload)
    .then((r) => r.data);

export const revokeUserPass = (
  passId: string,
  payload: AdminPassActionRequest,
): Promise<AdminPassRow> =>
  apiClient
    .post<AdminPassRow>(`${TOOLS}/passes/${passId}/revoke`, payload)
    .then((r) => r.data);

export const getRubricDistribution = (params: {
  toolKey?: string;
  before?: string;
  after?: string;
  brand?: ToolBrand;
}): Promise<AdminRubricDistribution> =>
  apiClient
    .get<AdminRubricDistribution>(`${TOOLS}/rubric`, { params })
    .then((r) => r.data);

export const getContentLibraryStatus = (): Promise<AdminContentLibraryStatus> =>
  apiClient
    .get<AdminContentLibraryStatus>(`${TOOLS}/content-library`)
    .then((r) => r.data);

// ─── Audit trail ─────────────────────────────────────────────────────────────

export const searchToolAudit = (
  request: GenericFilterRequest,
  params: PaginationParams,
): Promise<AdminAuditPage> =>
  apiClient
    .post<AdminAuditPage>(`${TOOLS}/audit/search`, request, { params })
    .then((r) => r.data);

export const getToolAuditRow = (auditId: string): Promise<AdminAuditRow> =>
  apiClient.get<AdminAuditRow>(`${TOOLS}/audit/${auditId}`).then((r) => r.data);

export const getToolAuditBatch = (
  batchId: string,
): Promise<{ batchId: string; rows: AdminAuditRow[] }> =>
  apiClient
    .get<{
      batchId: string;
      rows: AdminAuditRow[];
    }>(`${TOOLS}/audit/batches/${batchId}`)
    .then((r) => r.data);
