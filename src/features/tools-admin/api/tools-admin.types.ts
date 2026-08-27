/**
 * ─── TOOLS ADMIN TYPES (PHASE 8) ─────────────────────────────────────────────
 *
 * Mirrors the backend DTOs under `com.revquix.backend.tools.admin.dto`.
 *
 * Two things in here are worth reading before using them, because both are places where the obvious
 * client-side assumption is wrong:
 *
 * 1. `AdminAdjustmentResult.outcome` can be `PENDING_APPROVAL` on an HTTP **200**. An over-cap
 *    adjustment is accepted and queued for a second administrator — that is a control working as
 *    designed, not a failure. Rendering it as an error would teach admins to route around the
 *    guardrail, and the workaround is a psql session with no cap, no audit row and no reason field.
 *
 * 2. `ipHash` is never an IP address and never can be. The backend stores
 *    `sha256(ip + dailySalt)`, so the console cannot display an address and must not imply it has
 *    one. What it can do is group by the hash within a day and hash an externally-obtained address
 *    for comparison — see `lookupIpHash`.
 */

import type { GenericFilterResponse } from "@/core/filters/filter.types";

// ─── Vocabulary (database contracts — do not rename loosely) ─────────────────

export type ToolBrand = "REVQUIX" | "ASTRO";

export type CreditEntryType =
  | "SIGNUP_GRANT"
  | "GRANT"
  | "EARN"
  | "PURCHASE"
  | "HOLD"
  | "DEBIT_COMMIT"
  | "HOLD_RELEASE"
  | "REFUND"
  | "ADMIN_ADJUST"
  | "EXPIRY"
  | "REVOKE";

export type ActorType = "SYSTEM" | "USER" | "ADMIN";

export type ToolRunStatus =
  | "PENDING"
  | "RUNNING"
  | "SUCCEEDED"
  | "FAILED"
  | "TIMED_OUT"
  | "REJECTED";

export type ToolSubjectType = "USER" | "ANON" | "IP";

export type AdminAdjustmentAction =
  | "ADD_CREDITS"
  | "REMOVE_CREDITS"
  | "REFUND"
  | "REVOKE"
  | "BULK_GRANT"
  | "REFUND_RUN"
  | "SET_FREE_QUOTA"
  | "FORCE_RELEASE_HOLD"
  | "MARK_ABUSE"
  | "REVOKE_TOOL_ACCESS"
  | "WHITELIST_SUBJECT"
  | "SET_TOOL_CREDIT_OVERRIDE"
  | "PUBLISH_RUBRIC"
  | "APPROVE_ADJUSTMENT"
  | "DECLINE_ADJUSTMENT";

/** The four actions the §8.2 form offers. Everything else is reached from another screen. */
export const ADJUSTMENT_ACTIONS = [
  "ADD_CREDITS",
  "REMOVE_CREDITS",
  "REFUND",
  "REVOKE",
] as const satisfies readonly AdminAdjustmentAction[];

export type AdminAdjustmentReasonCode =
  | "SUPPORT_GOODWILL"
  | "CAMPAIGN"
  | "MIGRATION"
  | "PARTNER"
  | "FRAUD"
  | "PAYMENT_REFUND"
  | "INTERNAL_TESTING"
  | "OTHER";

export type AdminAuditOutcome =
  | "APPLIED"
  | "REJECTED"
  | "REPLAYED"
  | "PENDING_APPROVAL";

/** Minimum free-text length per reason code, mirroring the server and `ck_acaa_reason_len`. */
export const MIN_REASON_LENGTH = 10;
export const MIN_REASON_LENGTH_UNCATEGORISED = 25;

export function minimumReasonLength(
  code: AdminAdjustmentReasonCode | "",
): number {
  return code === "OTHER" ? MIN_REASON_LENGTH_UNCATEGORISED : MIN_REASON_LENGTH;
}

// ─── §8.1 Ledger browser ─────────────────────────────────────────────────────

export interface AdminLedgerEntry {
  entryId: string;
  brand: ToolBrand;
  userId: string;
  entryType: CreditEntryType;
  delta: number;
  /**
   * ADVISORY snapshot. Written best-effort inside the same transaction as the insert, so under
   * concurrent grants two rows can legitimately disagree about the running total while `SUM(delta)`
   * stays exactly right. Never reconcile against it — it is here because it is useful in a support
   * conversation, not because it is authoritative.
   */
  balanceAfter: number | null;
  refType: string | null;
  refId: string | null;
  note: string | null;
  actorType: ActorType;
  actorId: string | null;
  idempotencyKey: string;
  expiresAt: string | null;
  createdAt: string;
  /** Present when an administrative action produced this row — links to the audit trail. */
  adminAuditId: string | null;
}

export interface AdminOpenHold {
  holdEntryId: string;
  credits: number;
  runId: string | null;
  runStatus: string | null;
  createdAt: string;
  ageMinutes: number;
}

export interface AdminUserCreditProfile {
  userId: string;
  brand: ToolBrand;
  balance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  expiringSoon: number;
  creditsOnHold: number;
  openHolds: AdminOpenHold[];
  runsBlocked: boolean;
  freeRunsRemainingToday: number;
  freeRunCustomQuota: number | null;
  hasActivePass: boolean;
  hasToolsPermission: boolean;
}

// ─── §8.2 Adjustments ────────────────────────────────────────────────────────

export interface AdminCreditAdjustmentRequest {
  userId: string;
  action: AdminAdjustmentAction;
  /** Always positive. The action sets the sign, so a stray minus cannot debit a user. */
  amount: number;
  reasonCode: AdminAdjustmentReasonCode;
  reason: string;
  statementNote?: string;
  paymentIntentId?: string;
  brand?: ToolBrand;
  idempotencyKey?: string;
  /** Set when a SECOND administrator is applying a held request. */
  approvalOfAuditId?: string;
}

export interface GuardrailBreach {
  cap: "SINGLE_ADJUSTMENT" | "DAILY_TOTAL";
  limit: number;
  requested: number;
  alreadyMovedToday: number;
  requiresSecondApproval: boolean;
}

export interface AdminAdjustmentResult {
  auditId: string;
  action: AdminAdjustmentAction;
  /** May be `PENDING_APPROVAL` on a 200 — see the file header. */
  outcome: AdminAuditOutcome;
  entryId: string | null;
  delta: number | null;
  balanceAfter: number | null;
  balanceNegative: boolean;
  guardrail: GuardrailBreach | null;
  message: string;
}

export interface AdminBulkGrantRequest {
  /** Operator-chosen and required — it is what makes a re-submission idempotent. */
  batchId: string;
  userIds: string[];
  amount: number;
  reasonCode: AdminAdjustmentReasonCode;
  reason: string;
  statementNote?: string;
  brand?: ToolBrand;
}

export interface AdminBulkGrantResult {
  batchId: string;
  requested: number;
  granted: number;
  /** Non-zero on a re-submission — the visible proof that idempotency worked. */
  alreadyGranted: number;
  failed: number;
  creditsMoved: number;
  failures: { userId: string; reason: string }[];
  auditId: string;
}

export interface AdminFreeQuotaOverrideRequest {
  subjectType: ToolSubjectType;
  subjectKey: string;
  /** `null` clears, `-1` is unlimited, `>0` is a cap. `0` is rejected by the server. */
  customQuota: number | null;
  reasonCode: AdminAdjustmentReasonCode;
  reason: string;
  brand?: ToolBrand;
}

export interface AdminGuardrailStatus {
  adminUserId: string;
  dailyGrantCap: number;
  movedInWindow: number;
  remainingToday: number;
  singleAdjustmentCap: number;
  pendingApprovals: AdminAuditRow[];
  pendingRaisedBySelf: number;
  bulkGrantMaxUsers: number;
  maxExportRows: number;
}

// ─── §8.3 Run inspector ──────────────────────────────────────────────────────

export interface AdminRunRow {
  runId: string;
  brand: ToolBrand;
  userId: string | null;
  anonId: string | null;
  toolKey: string;
  status: ToolRunStatus;
  creditsHeld: number;
  holdEntryId: string | null;
  servedFromCache: boolean;
  latencyMs: number | null;
  promptTokens: number | null;
  completionTokens: number | null;
  cachedTokens: number | null;
  costMicroUsd: number | null;
  costPaise: number | null;
  provider: string | null;
  model: string | null;
  errorCode: string | null;
  rubricVersion: string | null;
  promptVersion: string | null;
  /** `sha256(ip + dailySalt)`. NEVER an address. Comparable only within its own UTC day. */
  ipHash: string | null;
  createdAt: string;
  updatedAt: string;
  hasOpenHold: boolean;
}

export interface RunTimelineEvent {
  label: string;
  at: string;
  deltaMs: number | null;
  detail: string | null;
}

export interface AdminRunDetail {
  run: AdminRunRow;
  timeline: RunTimelineEvent[];
  /** PII-redacted before storage AND truncated here. See the server DTO for the full argument. */
  inputPreview: string | null;
  inputPreviewTruncated: boolean;
  extractedChars: number | null;
  report: Record<string, unknown> | null;
  reportPartial: boolean;
  score: number | null;
  ledgerEntries: AdminLedgerEntry[];
  adminActions: AdminAuditRow[];
  sameIpHashRunsToday: number;
}

export interface AdminRunActionRequest {
  reasonCode: AdminAdjustmentReasonCode;
  reason: string;
  /** Refund only. Defaults to the run's own cost and may not exceed it. */
  amount?: number;
}

export interface AdminIpHashLookupRequest {
  ip: string;
  /** Required in effect — the salt rotates daily, so a lookup must name its day. */
  utcDate?: string;
}

export interface AdminIpHashLookupResponse {
  ipHash: string;
  utcDate: string;
  matchingRuns: number;
  distinctSubjects: number;
  correlationNote: string;
  saltConfigured: boolean;
}

export interface AdminRetryRunResponse {
  runId: string;
  toolKey: string;
  assetId: string;
  subjectUserId: string | null;
  subjectAnonId: string | null;
  retryable: boolean;
  message: string;
}

// ─── §8.4 Spend dashboard ────────────────────────────────────────────────────

export interface SpendCeilingGauge {
  ceilingUsd: number;
  spentMicroUsd: number;
  spentPaise: number;
  percentUsed: number;
  warning: boolean;
  breached: boolean;
}

export interface SpendDailyPoint {
  day: string;
  runs: number;
  costMicroUsd: number;
  costPaise: number;
  promptTokens: number;
  cachedTokens: number;
  completionTokens: number;
  cacheHits: number;
  failures: number;
  degraded: number;
}

export interface SpendToolPoint {
  toolKey: string;
  runs: number;
  costMicroUsd: number;
  costPaise: number;
  cacheHitPercent: number;
  cacheBelowTarget: boolean;
  failurePercent: number;
  degradedPercent: number;
  cachedTokenPercent: number;
  medianCostPaise: number;
  p95CostPaise: number;
  aboveCostTarget: boolean;
  medianLatencyMs: number;
  p95LatencyMs: number;
}

export interface SpendModelPoint {
  provider: string;
  model: string;
  runs: number;
  costMicroUsd: number;
  costPaise: number;
}

export interface SpendErrorPoint {
  errorCode: string;
  label: string;
  runs: number;
}

export interface SpendTotals {
  runs: number;
  costMicroUsd: number;
  costPaise: number;
  cacheHits: number;
  failures: number;
  degraded: number;
  cacheHitPercent: number;
  failurePercent: number;
  degradedPercent: number;
  promptTokens: number;
  cachedTokens: number;
  completionTokens: number;
  cachedTokenPercent: number;
}

export interface AdminSpendDashboard {
  from: string;
  to: string;
  microUsdPerPaise: number;
  ceiling: SpendCeilingGauge;
  daily: SpendDailyPoint[];
  tools: SpendToolPoint[];
  models: SpendModelPoint[];
  errors: SpendErrorPoint[];
  totals: SpendTotals;
  /** `null` means "no signal yet", which is not the same as "healthy". */
  embeddingUnavailableCount: number | null;
}

// ─── §8.7 Fraud queue ────────────────────────────────────────────────────────

export interface FraudNegativeBalanceRow {
  userId: string;
  balance: number;
  lifetimeSpent: number;
  runsBlocked: boolean;
}

export interface FraudAbnormalRateRow {
  subjectType: string;
  subjectKey: string;
  runs: number;
  creditsHeld: number;
  distinctIpHashes: number;
  lastRunAt: string;
}

export interface FraudIpClusterRow {
  ipHash: string;
  runs: number;
  distinctSubjects: number;
  distinctUsers: number;
  firstRunAt: string;
  lastRunAt: string;
}

export interface FraudQuotaExhaustionRow {
  subjectType: string;
  subjectKey: string;
  daysAtCap: number;
  peakUsed: number;
  lastDate: string;
}

export interface FraudThresholds {
  abnormalRunsPerDay: number;
  quotaExhaustionDays: number;
  ipClusterMinSubjects: number;
  windowDays: number;
}

export interface FraudReferralClusterRow {
  referrerUserId: string;
  /** Every attempt this referrer has produced, in any status. */
  refereeCount: number;
  /** How many were rejected or are held. Ranked on this, not on the total - a referrer with
   *  thirty conversions and one hold is the programme working, and would otherwise top the list. */
  rejectedCount: number;
  /** The most recent rule to fire. Per-attempt detail lives in the referral review queue. */
  reasonCode: string | null;
}

export interface AdminFraudQueue {
  negativeBalances: FraudNegativeBalanceRow[];
  abnormalRunRates: FraudAbnormalRateRow[];
  ipClusters: FraudIpClusterRow[];
  quotaExhaustion: FraudQuotaExhaustionRow[];
  recentTriage: AdminAuditRow[];
  referralClusters: FraudReferralClusterRow[];
  /** Non-null only while the panel cannot be computed. Now always null. */
  referralUnavailableReason: string | null;
  ipCorrelationNote: string;
  thresholds: FraudThresholds;
}

export interface AdminSubjectTriageRequest {
  subjectType: ToolSubjectType;
  subjectKey: string;
  reasonCode: AdminAdjustmentReasonCode;
  reason: string;
}

// ─── §8.5 Pricing ────────────────────────────────────────────────────────────

export interface AdminPackageRow {
  packageId: string;
  /** The machine code, and the identifier every purchase records. Immutable once created. */
  code: string;
  /** `PACK` grants credits; `PASS` bypasses debits for a window and grants none. */
  kind: "PACK" | "PASS";
  label: string;
  description: string;
  credits: number | null;
  passDays: number | null;
  passDailyRunCap: number | null;
  priceMinor: number;
  currency: string;
  mrpMinor: number | null;
  /**
   * USD price in cents, or `null` when this SKU is not sold on the international rail.
   *
   * Hand-set, never converted: ₹99 is about $1.12 and PayPal's cross-border fee (4.4% + $0.30)
   * makes $0.35 of that a fee, so a converted entry SKU loses money. Null means an international
   * buyer is told the pack is not available in their currency - which is the only safe reading,
   * since the rupee figure read as cents would charge a hundredth of the intended amount.
   */
  priceUsdMinor: number | null;
  mrpUsdMinor: number | null;
  active: boolean;
  featured: boolean;
  displayOrder: number;
  /**
   * Rupees per credit implied by this row; `null` for a pass.
   *
   * This is the figure §10.2's "never price a credit below 10× marginal cost" rule is stated in, so
   * it sits next to `marginalCostPaise` and a repricing can be checked against reality rather than
   * against the estimate in the plan.
   */
  pricePerCredit: number | null;
}

/**
 * Create or edit a SKU (§8.5, §10.6 criterion 6).
 *
 * `code` and `kind` are accepted on create and ignored on edit: a code is referenced by every
 * historical purchase and by every pass sold under it, and a pack that became a pass would silently
 * reinterpret every past purchase of it.
 *
 * A reason of at least 10 characters is mandatory — enforced by the API and by
 * `ck_acaa_reason_len` at the database. A price edit changes what every subsequent buyer is charged,
 * needs no second approval, and this table holds only current state, so the audit row is the only
 * place the previous price will ever exist.
 */
export interface AdminPackageUpsertRequest {
  code?: string;
  kind?: "PACK" | "PASS";
  label?: string;
  description?: string;
  credits?: number | null;
  passDays?: number | null;
  passDailyRunCap?: number | null;
  priceMinor?: number;
  mrpMinor?: number | null;
  /** USD price in cents. Send `null` to withdraw the SKU from the international rail. */
  priceUsdMinor?: number | null;
  mrpUsdMinor?: number | null;
  currency?: string;
  active?: boolean;
  featured?: boolean;
  displayOrder?: number;
  reasonCode: AdminAdjustmentReasonCode;
  reason: string;
}

export interface AdminPackageWriteResult {
  message: string;
  catalogue: AdminPricingCatalogue;
}

/** §8.2 "Grant / revoke a pass". */
export interface AdminPassActionRequest {
  userId?: string;
  packageCode?: string;
  overrideDays?: number | null;
  reasonCode: AdminAdjustmentReasonCode;
  reason: string;
}

export interface AdminPassRow {
  passId: string;
  userId: string;
  packageCode: string;
  startsAt: string;
  endsAt: string;
  dailyRunCap: number;
  status: "ACTIVE" | "EXPIRED" | "REVOKED";
  /**
   * Whether this pass bypasses the credit debit right now.
   *
   * Can legitimately be `false` while `status` is still `ACTIVE` — cover is enforced on read
   * (`ends_at > now`) while the status column is relabelled hourly by the expiry sweeper. The
   * disagreement is information, not a bug, so both are rendered.
   */
  coveringNow: boolean;
  daysRemaining: number;
  /** `null` for an admin comp. A null here is exactly what distinguishes a comp from a purchase. */
  paymentOrderId: string | null;
  revokedReason: string | null;
  createdAt: string;
}

export interface AdminToolPriceRow {
  toolKey: string;
  slug: string;
  tier: "FREE" | "FREE_DAILY" | "CREDIT" | "FREE_PLUS_CREDIT";
  layer: "L1" | "L1_L2" | "L3" | "L1_L3" | "L1_L2_L3";
  launched: boolean;
  defaultCredits: number;
  effectiveCredits: number;
  /** An override of `0` is real — it makes a paid tool free for a promo window. */
  overridden: boolean;
  approxInr: number | null;
}

export interface AdminPricingCatalogue {
  packageEditorAvailable: boolean;
  packageEditorUnavailableReason: string | null;
  packages: AdminPackageRow[];
  toolPrices: AdminToolPriceRow[];
  inrPerCreditReference: number | null;
  marginalCostPaise: number | null;
}

// ─── §8.6 Rubric ─────────────────────────────────────────────────────────────

export interface RubricCorpusEntry {
  toolKey: string;
  rubricVersion: string;
  reports: number;
  firstSeen: string;
  lastSeen: string;
  active: boolean;
}

export interface RubricBucket {
  bucket: number;
  label: string;
  reports: number;
  percent: number;
}

export interface RubricBandCount {
  band: string;
  range: string;
  reports: number;
  percent: number;
}

export interface RubricVersionDistribution {
  rubricVersion: string;
  reports: number;
  meanScore: number;
  medianScore: number;
  minScore: number;
  maxScore: number;
  partialReports: number;
  buckets: RubricBucket[];
  bands: RubricBandCount[];
}

export interface RubricBucketDelta {
  bucket: number;
  label: string;
  beforePercent: number;
  afterPercent: number;
  deltaPercent: number;
}

export interface AdminRubricDistribution {
  toolKey: string | null;
  activeRubricVersion: string;
  activePromptVersion: string;
  corpus: RubricCorpusEntry[];
  before: RubricVersionDistribution | null;
  after: RubricVersionDistribution | null;
  deltas: RubricBucketDelta[] | null;
  meanShift: number | null;
  /** `false` when the two corpora are too different in size for the comparison to mean anything. */
  comparableCorpus: boolean;
  comparabilityNote: string | null;
}

// ─── §8.8 Content library ────────────────────────────────────────────────────

export interface ContentCollectionStatus {
  collection: string;
  label: string;
  toolReference: string;
  ownedByPhase: string;
  available: boolean;
  rowCount: number | null;
  publishedCount: number | null;
  unavailableReason: string | null;
}

export interface AdminContentLibraryStatus {
  collections: ContentCollectionStatus[];
  contentVersusRunNote: string;
}

// ─── Audit trail ─────────────────────────────────────────────────────────────

export interface AdminAuditRow {
  auditId: string;
  adminUserId: string;
  approvedByAdminId: string | null;
  action: AdminAdjustmentAction;
  targetUserId: string | null;
  delta: number | null;
  entryId: string | null;
  runId: string | null;
  batchId: string | null;
  reasonCode: AdminAdjustmentReasonCode;
  reason: string;
  outcome: AdminAuditOutcome;
  rejectionReason: string | null;
  parentAuditId: string | null;
  adminIpHash: string | null;
  userAgent: string | null;
  /** Populated only on the single-row read. */
  requestPayload: Record<string, unknown> | null;
  createdAt: string;
}

// ─── Paged aliases ───────────────────────────────────────────────────────────

export type AdminLedgerPage = GenericFilterResponse<AdminLedgerEntry>;
export type AdminRunPage = GenericFilterResponse<AdminRunRow>;
export type AdminAuditPage = GenericFilterResponse<AdminAuditRow>;

// ─── Referral review ─────────────────────────────────────────────────────────

/** Which rule the guard fired. Mirrors `ReferralRejectionReason`. */
export type ReferralRejectionReason =
  | "SELF_REFERRAL"
  | "EMAIL_ROOT_MATCH"
  | "IP_HASH_MATCH"
  | "DEVICE_HASH_MATCH"
  | "RUN_IP_OVERLAP"
  | "VELOCITY_EXCEEDED"
  | "REFERRER_NOT_ESTABLISHED"
  | "MONTHLY_CAP_EXCEEDED"
  | "REFERRER_NOT_FOUND";

export type ReferralAttemptStatus =
  | "PENDING"
  | "ELIGIBLE"
  | "HELD"
  | "GRANTED"
  | "REJECTED";

/**
 * One referral awaiting a human decision.
 *
 * The referrer-history counts are the part that turns a signal into a judgement: the tripped rule
 * alone cannot tell a household apart from a farm. One held attempt from someone with one other
 * referral is a flatmate; the same rule firing on their ninth is a pattern.
 */
export interface AdminReferralReviewRow {
  attemptId: string;
  referrerUserId: string;
  referrerEmail: string | null;
  refereeUserId: string;
  refereeEmail: string | null;
  reasonCode: ReferralRejectionReason | null;
  referralSource: string | null;
  createdAt: string;
  referrerTotalAttempts: number;
  referrerGrantedAttempts: number;
  referrerBlockedAttempts: number;
  sharedRegistrationIp: boolean;
  sharedDevice: boolean;
}

export interface AdminReferralRuleCount {
  status: ReferralAttemptStatus;
  reasonCode: ReferralRejectionReason;
  count: number;
}

export interface AdminReferralGuardConfig {
  monthlyCap: number;
  /** 0 = credits land on conversion. Non-zero is the fraud-wave lever. */
  grantDelayHours: number;
  ipMatchAction: "HOLD" | "REJECT";
  velocityPerHour: number;
  velocityPerDay: number;
  referrerMinAccountAgeHours: number;
  requireReferrerHasRun: boolean;
}

export interface AdminReferralReview {
  held: AdminReferralReviewRow[];
  statusCounts: Record<ReferralAttemptStatus, number>;
  /** Read this before tuning any threshold - a spike in IP_HASH_MATCH is usually one campus. */
  rejectionsByRule: AdminReferralRuleCount[];
  windowDays: number;
  guardConfig: AdminReferralGuardConfig;
}

export interface AdminReferralDecisionRequest {
  attemptId: string;
  /** Mandatory. For a rejection it is the only explanation that will ever exist. */
  reason: string;
}
