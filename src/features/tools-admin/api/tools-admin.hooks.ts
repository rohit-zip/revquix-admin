/**
 * ─── TOOLS ADMIN HOOKS (PHASE 8) ─────────────────────────────────────────────
 *
 * One decision governs most of this file: **an adjustment's success toast is derived from the
 * `outcome`, not from the HTTP status.** An over-cap request returns 200 with
 * `outcome: "PENDING_APPROVAL"`, and telling the operator "credits added" at that point would be a
 * lie that they would only discover when the user complained. Every mutation here reads the server's
 * own `message` field rather than composing its own, so the console and the audit trail cannot
 * disagree about what happened.
 */

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { showErrorToast, showSuccessToast } from "@/lib/show-toast";
import {
  adjustCredits,
  bulkGrantCredits,
  createCreditPackage,
  declineAdjustment,
  exportCreditLedger,
  forceReleaseHold,
  getContentLibraryStatus,
  getCreditGuardrails,
  getFraudQueue,
  getRubricDistribution,
  getToolAuditBatch,
  getToolAuditRow,
  getToolPricing,
  getToolSpend,
  getUserCreditProfile,
  getUserCreditStatement,
  getUserPasses,
  grantUserPass,
  inspectToolRun,
  lookupIpHash,
  markSubjectAbuse,
  refundRun,
  resolveCreditUser,
  retryRun,
  revokeToolsAccess,
  revokeUserPass,
  setCreditPackageActive,
  setFreeQuotaOverride,
  updateCreditPackage,
  whitelistSubject,
} from "./tools-admin.api";
import type {
  AdminAdjustmentResult,
  AdminBulkGrantRequest,
  AdminCreditAdjustmentRequest,
  AdminFreeQuotaOverrideRequest,
  AdminIpHashLookupRequest,
  AdminPackageUpsertRequest,
  AdminPassActionRequest,
  AdminRunActionRequest,
  AdminSubjectTriageRequest,
  ToolBrand,
} from "./tools-admin.types";
import type { GenericFilterRequest } from "@/core/filters/filter.types";

export const toolsAdminKeys = {
  all: ["tools-admin"] as const,
  guardrails: ["tools-admin", "guardrails"] as const,
  userProfile: (userId: string, brand?: string) =>
    ["tools-admin", "user-profile", userId, brand ?? "REVQUIX"] as const,
  userStatement: (userId: string, page: number, size: number) =>
    ["tools-admin", "user-statement", userId, page, size] as const,
  run: (runId: string) => ["tools-admin", "run", runId] as const,
  spend: (from?: string, to?: string, brand?: string) =>
    ["tools-admin", "spend", from ?? "", to ?? "", brand ?? "REVQUIX"] as const,
  fraud: (brand?: string) =>
    ["tools-admin", "fraud", brand ?? "REVQUIX"] as const,
  pricing: ["tools-admin", "pricing"] as const,
  passes: (userId: string) => ["tools-admin", "passes", userId] as const,
  rubric: (toolKey?: string, before?: string, after?: string) =>
    [
      "tools-admin",
      "rubric",
      toolKey ?? "",
      before ?? "",
      after ?? "",
    ] as const,
  contentLibrary: ["tools-admin", "content-library"] as const,
  auditRow: (auditId: string) => ["tools-admin", "audit", auditId] as const,
  auditBatch: (batchId: string) =>
    ["tools-admin", "audit-batch", batchId] as const,
};

/**
 * Invalidates everything under the tools-admin namespace.
 *
 * Deliberately coarse. An adjustment changes a balance, a statement, the guardrail allowance, the
 * fraud queue's negative-balance panel and the audit trail — enumerating those five would be a list
 * that silently goes stale the next time a panel is added, and the cost of over-invalidating a handful
 * of admin queries is a few requests nobody is waiting on.
 */
function useInvalidateToolsAdmin() {
  const qc = useQueryClient();
  return () => void qc.invalidateQueries({ queryKey: toolsAdminKeys.all });
}

/**
 * Success handling shared by every mutation that returns an `AdminAdjustmentResult`.
 *
 * Reads `outcome` rather than assuming a 200 means applied, and uses the server's `message` verbatim
 * so the toast, the audit row and the ledger cannot tell three different stories.
 */
function toastForOutcome(result: AdminAdjustmentResult) {
  if (result.outcome === "PENDING_APPROVAL") {
    showSuccessToast(result.message, {
      description: `Reference ${result.auditId}. A second, different administrator must apply it.`,
    });
    return;
  }
  if (result.outcome === "REJECTED") {
    // Not an error toast: the request was processed and the decision recorded. Rendering a recorded
    // decline as a failure would suggest something went wrong with the system rather than with the
    // request.
    showSuccessToast(result.message, {
      description: `Recorded as ${result.auditId}.`,
    });
    return;
  }
  showSuccessToast(result.message, { description: `Audit ${result.auditId}` });
}

// ─── §8.1 / §8.2 reads ───────────────────────────────────────────────────────

export function useCreditGuardrails() {
  return useQuery({
    queryKey: toolsAdminKeys.guardrails,
    queryFn: getCreditGuardrails,
    // Short, because the allowance is shown next to a form an admin is about to submit and a stale
    // figure would be read as the authoritative remaining budget. The server re-evaluates the cap on
    // every adjustment regardless, so a stale figure here can never let anything through.
    staleTime: 15 * 1000,
  });
}

export function useUserCreditProfile(userId: string, brand?: ToolBrand) {
  return useQuery({
    queryKey: toolsAdminKeys.userProfile(userId, brand),
    queryFn: () => getUserCreditProfile(userId, brand),
    enabled: userId.trim().length > 0,
    retry: false,
  });
}

export function useUserCreditStatement(
  userId: string,
  page = 0,
  size = 20,
  brand?: ToolBrand,
) {
  return useQuery({
    queryKey: toolsAdminKeys.userStatement(userId, page, size),
    queryFn: () => getUserCreditStatement(userId, page, size, brand),
    enabled: userId.trim().length > 0,
    placeholderData: (previous) => previous,
    retry: false,
  });
}

export function useResolveCreditUser() {
  return useMutation({
    mutationFn: (identifier: string) => resolveCreditUser(identifier),
    onError: (error) => showErrorToast(error),
  });
}

// ─── §8.1 export ─────────────────────────────────────────────────────────────

/**
 * Downloads the filtered ledger as CSV.
 *
 * The blob is built and revoked in the same handler. Leaving object URLs alive is a slow leak on a
 * page an operator keeps open all day while exporting repeatedly.
 */
export function useExportCreditLedger() {
  return useMutation({
    mutationFn: (request: GenericFilterRequest) => exportCreditLedger(request),
    onSuccess: (csv) => {
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `credit-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      showSuccessToast("Export downloaded.");
    },
    onError: (error) => showErrorToast(error),
  });
}

// ─── §8.2 writes ─────────────────────────────────────────────────────────────

export function useAdjustCredits() {
  const invalidate = useInvalidateToolsAdmin();
  return useMutation({
    mutationFn: (payload: AdminCreditAdjustmentRequest) =>
      adjustCredits(payload),
    onSuccess: (result) => {
      invalidate();
      toastForOutcome(result);
    },
    onError: (error) => showErrorToast(error),
  });
}

export function useDeclineAdjustment() {
  const invalidate = useInvalidateToolsAdmin();
  return useMutation({
    mutationFn: (input: { auditId: string; reason?: string }) =>
      declineAdjustment(input.auditId, input.reason),
    onSuccess: (result) => {
      invalidate();
      toastForOutcome(result);
    },
    onError: (error) => showErrorToast(error),
  });
}

export function useBulkGrantCredits() {
  const invalidate = useInvalidateToolsAdmin();
  return useMutation({
    mutationFn: (payload: AdminBulkGrantRequest) => bulkGrantCredits(payload),
    onSuccess: (result) => {
      invalidate();
      // The three counts are reported separately because "500 processed" is not a useful answer to an
      // operator who has just re-submitted a batch. A second submission reads 0 granted / 500 already
      // granted, which is the visible proof that idempotency worked.
      const parts = [`${result.granted} granted`];
      if (result.alreadyGranted > 0)
        parts.push(`${result.alreadyGranted} already granted`);
      if (result.failed > 0) parts.push(`${result.failed} failed`);
      showSuccessToast(`Batch ${result.batchId}: ${parts.join(", ")}.`, {
        description: `${result.creditsMoved} credit(s) moved. Audit ${result.auditId}.`,
      });
    },
    onError: (error) => showErrorToast(error),
  });
}

export function useSetFreeQuotaOverride() {
  const invalidate = useInvalidateToolsAdmin();
  return useMutation({
    mutationFn: (payload: AdminFreeQuotaOverrideRequest) =>
      setFreeQuotaOverride(payload),
    onSuccess: (result) => {
      invalidate();
      toastForOutcome(result);
    },
    onError: (error) => showErrorToast(error),
  });
}

// ─── §8.3 run inspector ──────────────────────────────────────────────────────

export function useInspectToolRun(runId: string) {
  return useQuery({
    queryKey: toolsAdminKeys.run(runId),
    queryFn: () => inspectToolRun(runId),
    enabled: runId.trim().length > 0,
    retry: false,
  });
}

export function useLookupIpHash() {
  return useMutation({
    mutationFn: (payload: AdminIpHashLookupRequest) => lookupIpHash(payload),
    onSuccess: (result) => {
      showSuccessToast(
        result.matchingRuns > 0
          ? `${result.matchingRuns} run(s) from that address on ${result.utcDate}.`
          : `No runs from that address on ${result.utcDate}.`,
        {
          description: result.saltConfigured
            ? undefined
            : "The IP salt is not configured in this environment, so this hash will not match runs " +
              "recorded by a configured one.",
        },
      );
    },
    onError: (error) => showErrorToast(error),
  });
}

export function useForceReleaseHold() {
  const invalidate = useInvalidateToolsAdmin();
  return useMutation({
    mutationFn: (input: { runId: string; payload: AdminRunActionRequest }) =>
      forceReleaseHold(input.runId, input.payload),
    onSuccess: (result) => {
      invalidate();
      toastForOutcome(result);
    },
    onError: (error) => showErrorToast(error),
  });
}

export function useRefundRun() {
  const invalidate = useInvalidateToolsAdmin();
  return useMutation({
    mutationFn: (input: { runId: string; payload: AdminRunActionRequest }) =>
      refundRun(input.runId, input.payload),
    onSuccess: (result) => {
      invalidate();
      toastForOutcome(result);
    },
    onError: (error) => showErrorToast(error),
  });
}

export function useRetryRun() {
  return useMutation({
    mutationFn: (input: { runId: string; payload: AdminRunActionRequest }) =>
      retryRun(input.runId, input.payload),
    onSuccess: (result) => {
      // Deliberately not a "retried" toast: the endpoint locates the input, it does not create a run.
      // See the server's OpenAPI description for why the admin plane owns no second path that can.
      showSuccessToast(
        "Input located — re-submit it through the tool's own endpoint.",
        {
          description: `Asset ${result.assetId}. ${result.message}`,
        },
      );
    },
    onError: (error) => showErrorToast(error),
  });
}

// ─── §8.4 spend ──────────────────────────────────────────────────────────────

export function useToolSpend(params: {
  from?: string;
  to?: string;
  brand?: ToolBrand;
}) {
  return useQuery({
    queryKey: toolsAdminKeys.spend(params.from, params.to, params.brand),
    queryFn: () => getToolSpend(params),
    // 60s: this panel is watched during an incident, and the ceiling gauge is the only place a
    // degradation is visible at all — a breach serves users a thinner report with a 200, so nothing
    // else surfaces it.
    staleTime: 60 * 1000,
    placeholderData: (previous) => previous,
  });
}

// ─── §8.7 fraud ──────────────────────────────────────────────────────────────

export function useFraudQueue(brand?: ToolBrand) {
  return useQuery({
    queryKey: toolsAdminKeys.fraud(brand),
    queryFn: () => getFraudQueue(brand),
    staleTime: 60 * 1000,
  });
}

export function useRevokeToolsAccess() {
  const invalidate = useInvalidateToolsAdmin();
  return useMutation({
    mutationFn: (payload: AdminSubjectTriageRequest) =>
      revokeToolsAccess(payload),
    onSuccess: (result) => {
      invalidate();
      toastForOutcome(result);
    },
    onError: (error) => showErrorToast(error),
  });
}

export function useMarkSubjectAbuse() {
  const invalidate = useInvalidateToolsAdmin();
  return useMutation({
    mutationFn: (payload: AdminSubjectTriageRequest) =>
      markSubjectAbuse(payload),
    onSuccess: (result) => {
      invalidate();
      toastForOutcome(result);
    },
    onError: (error) => showErrorToast(error),
  });
}

export function useWhitelistSubject() {
  const invalidate = useInvalidateToolsAdmin();
  return useMutation({
    mutationFn: (payload: AdminSubjectTriageRequest) =>
      whitelistSubject(payload),
    onSuccess: (result) => {
      invalidate();
      toastForOutcome(result);
    },
    onError: (error) => showErrorToast(error),
  });
}

// ─── §8.5 / §8.6 / §8.8 governance ───────────────────────────────────────────

export function useToolPricing() {
  return useQuery({
    queryKey: toolsAdminKeys.pricing,
    queryFn: getToolPricing,
    // The tool list is derived from a Java enum and the overrides from application config: neither
    // can change without a deploy or a config reload.
    staleTime: 5 * 60 * 1000,
  });
}

// ─── §8.5 write half — lit up by Phase 10 ────────────────────────────────────
//
// Each mutation seeds the pricing cache with the catalogue the server returned rather than
// invalidating and refetching. That is not a micro-optimisation: it makes it impossible for the
// screen to render a stale price beside a success toast, which is the one confusion a pricing
// editor must not create.

export function useCreateCreditPackage(onDone?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AdminPackageUpsertRequest) =>
      createCreditPackage(payload),
    retry: false,
    onSuccess: (result) => {
      showSuccessToast(result.message);
      qc.setQueryData(toolsAdminKeys.pricing, result.catalogue);
      onDone?.();
    },
    onError: (error) => showErrorToast(error),
  });
}

export function useUpdateCreditPackage(onDone?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      packageId,
      payload,
    }: {
      packageId: string;
      payload: AdminPackageUpsertRequest;
    }) => updateCreditPackage(packageId, payload),
    retry: false,
    onSuccess: (result) => {
      showSuccessToast(result.message);
      qc.setQueryData(toolsAdminKeys.pricing, result.catalogue);
      onDone?.();
    },
    onError: (error) => showErrorToast(error),
  });
}

export function useSetCreditPackageActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      packageId,
      active,
      payload,
    }: {
      packageId: string;
      active: boolean;
      payload: AdminPackageUpsertRequest;
    }) => setCreditPackageActive(packageId, active, payload),
    retry: false,
    onSuccess: (result) => {
      showSuccessToast(result.message);
      qc.setQueryData(toolsAdminKeys.pricing, result.catalogue);
    },
    onError: (error) => showErrorToast(error),
  });
}

// ─── §8.2 "Grant / revoke a pass" — lit up by Phase 10 ───────────────────────

export function useUserPasses(userId: string, enabled = true) {
  return useQuery({
    queryKey: toolsAdminKeys.passes(userId),
    queryFn: () => getUserPasses(userId),
    enabled: enabled && userId.trim().length > 0,
    // Short, because `coveringNow` is time-sensitive: a pass lapses on the minute and an operator
    // reading a stale "covering" beside an expired window would draw the wrong conclusion.
    staleTime: 30 * 1000,
  });
}

export function useGrantUserPass(onDone?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AdminPassActionRequest) => grantUserPass(payload),
    retry: false,
    onSuccess: (pass) => {
      showSuccessToast(
        `Pass ${pass.packageCode} granted until ${pass.endsAt.slice(0, 10)}.`,
      );
      qc.invalidateQueries({ queryKey: toolsAdminKeys.passes(pass.userId) });
      qc.invalidateQueries({ queryKey: toolsAdminKeys.all });
      onDone?.();
    },
    onError: (error) => showErrorToast(error),
  });
}

export function useRevokeUserPass(onDone?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      passId,
      payload,
    }: {
      passId: string;
      payload: AdminPassActionRequest;
    }) => revokeUserPass(passId, payload),
    retry: false,
    onSuccess: (pass) => {
      showSuccessToast("Pass revoked.");
      qc.invalidateQueries({ queryKey: toolsAdminKeys.passes(pass.userId) });
      qc.invalidateQueries({ queryKey: toolsAdminKeys.all });
      onDone?.();
    },
    onError: (error) => showErrorToast(error),
  });
}

export function useRubricDistribution(params: {
  toolKey?: string;
  before?: string;
  after?: string;
  brand?: ToolBrand;
}) {
  return useQuery({
    queryKey: toolsAdminKeys.rubric(
      params.toolKey,
      params.before,
      params.after,
    ),
    queryFn: () => getRubricDistribution(params),
    staleTime: 60 * 1000,
    placeholderData: (previous) => previous,
  });
}

export function useContentLibraryStatus() {
  return useQuery({
    queryKey: toolsAdminKeys.contentLibrary,
    queryFn: getContentLibraryStatus,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Audit trail ─────────────────────────────────────────────────────────────

export function useToolAuditRow(auditId: string) {
  return useQuery({
    queryKey: toolsAdminKeys.auditRow(auditId),
    queryFn: () => getToolAuditRow(auditId),
    enabled: auditId.trim().length > 0,
    // An audit row is immutable by construction, so it can be cached indefinitely for the session.
    staleTime: Infinity,
    retry: false,
  });
}

export function useToolAuditBatch(batchId: string) {
  return useQuery({
    queryKey: toolsAdminKeys.auditBatch(batchId),
    queryFn: () => getToolAuditBatch(batchId),
    enabled: batchId.trim().length > 0,
    staleTime: Infinity,
    retry: false,
  });
}
