/**
 * ─── MENTORSHIP V2 (PHASE 11) CUTOVER ADMIN TYPES ────────────────────────────
 *
 * Mirrors the Phase 11 backend DTOs one-for-one. Money is always minor units with an explicit currency,
 * formatted client-side only — the module-wide rule.
 */

export type CutoverStage = "DUAL_RUN" | "CUTOVER" | "DECOMMISSIONED"

export type BackfillSeverity = "INFO" | "WARNING" | "ERROR"

/**
 * One decision the migration made — including the deliberate no-ops.
 *
 * `detail` is a raw JSON string, not a parsed object. The shape differs per stage (a SERVICE row carries
 * prices and a title, an AVAILABILITY row carries a whole weekly pattern, a DUAL_RUN_CONFLICT row carries
 * two timestamps and a SQLSTATE), and inventing a union type for a diagnostic payload would mean every
 * future addition on the SQL side needed a matching TypeScript change or the field would silently drop.
 * The console renders it as formatted JSON, which is what someone debugging a migration wants anyway.
 */
export interface BackfillLedgerEntry {
  ledgerId: string
  runId: string
  runMode: "DRY_RUN" | "APPLY" | "ROLLBACK"
  stage: string
  mentorUserId?: string | null
  action: string
  targetTable?: string | null
  targetId?: string | null
  detail?: string | null
  reason?: string | null
  createdAt: string
  /** Server-computed. Never re-derived from `action` on the client. */
  severity: BackfillSeverity
}

export interface BackfillTally {
  stage: string
  action: string
  count: number
}

export interface BackfillRunReport {
  runId: string
  runMode: string
  dryRun: boolean
  scopedToMentorUserId?: string | null
  services: number
  bookingPreferences: number
  availabilityRules: number
  legacyIntervals: number
  /** Non-zero means at least one mentor is double-booked across the legacy and V2 systems. */
  conflicts: number
  tally?: BackfillTally[] | null
  /** Populated for a dry run, where the plan IS the deliverable. Omitted for large apply passes. */
  entries?: BackfillLedgerEntry[] | null
}

export interface BackfillRollbackResult {
  mentorUserId: string
  /** A refusal is a successful response, not an error — the console must display it in full. */
  refused: boolean
  refusedReason?: string | null
  rolledBackServices: number
  rolledBackAvailabilityRules: number
  releasedLegacyIntervals: number
  bookingPreferenceRetained: boolean
}

export interface CrossSystemDoubleBooking {
  mentorUserId: string
  v2IntervalId: string
  v2BookingId?: string | null
  v2StartsAt: string
  v2EndsAt: string
  legacySystem: string
  legacyBookingId?: string | null
  legacyStatus?: string | null
  legacyStartsAt: string
  legacyEndsAt: string
  overlapStartsAt: string
  overlapEndsAt: string
}

/**
 * One month/currency/system row of the revenue reconciliation.
 *
 * `buyerPlatformFeeRevenueMinor` is structurally 0 on the LEGACY leg because that mechanism did not exist
 * there. That zero is the finding, not a gap — it is what makes the V2 column's appearance explicable.
 * Never sum only one fee column: per ₹1,000 service the buyer goes from ₹1,000 to ₹1,100 while mentor
 * commission halves from ₹200 to ₹100, so commission alone reads as revenue halving and gross alone reads
 * as sales jumping 10%. Platform revenue per booking is in fact unchanged.
 */
export interface RevenueReconciliationRow {
  originSystem: "LEGACY" | "V2"
  periodMonth: string
  currency: string
  orderCount: number
  grossChargedMinor: number
  serviceAmountMinor: number
  buyerPlatformFeeRevenueMinor: number
  mentorCommissionRevenueMinor: number
  gstRemittedMinor: number
  mentorNetMinor: number
  refundedMinor: number
  refundedBuyerFeeMinor: number
  platformRevenueMinor: number
  /** ~20.00 on LEGACY, ~10.00 on V2 — the difference the two-column split exists to explain. */
  effectiveCommissionPct?: number | null
}

/** Every row must read `offendingRows: 0`. Non-zero means the finance report is wrong. */
export interface ReconciliationCheckRow {
  checkName: string
  offendingRows: number
  sampleIds?: string | null
  expectation: string
  passing: boolean
}

/**
 * One decommission-readiness condition.
 *
 * `blocking` separates the two kinds of unmet condition. A blocking row at non-zero refuses the archive
 * outright. An advisory row is informational — future open legacy slots still exist (an offer is not a
 * commitment), or mentors have not yet confirmed their migrated schedule.
 */
export interface DecommissionReadinessRow {
  checkName: string
  blocking: boolean
  observed: number
  satisfied: boolean
  detail: string
}

export interface ArchiveManifestRow {
  manifestId: number
  archiveRunId: string
  sourceTable: string
  archiveTable: string
  rowsInSource: number
  rowsArchived: number
  archivedAt: string
  /** archivedAt + 90 days. The master plan's retention rule, as data. */
  purgeEligibleAt: string
  sourceDroppedAt?: string | null
  note?: string | null
  purgeEligibleNow: boolean
  daysUntilPurgeEligible: number
  complete: boolean
}

export interface ArchiveRunResult {
  dryRun: boolean
  forced: boolean
  totalRowsInSource: number
  totalRowsArchived: number
  lines: {
    sourceTable: string
    archiveTable: string
    rowsInSource: number
    rowsArchived: number
    outcome: string
  }[]
}

export interface BackfillRunSummary {
  runId: string
  runMode: string
  startedAt?: string | null
  finishedAt?: string | null
  rows: number
}

/**
 * The Phase 11 snapshot.
 *
 * `crossSystemDoubleBookings`, `reconciliationChecks` and `invariantWarnings` are **assertions**, not
 * statistics — they must be empty / all-passing, and the panel renders them in red when they are not.
 * They are recomputed live on every view rather than trusted from when a migration ran, because the
 * dual-run window is weeks long and a cross-system double-booking is created by ordinary traffic.
 */
export interface AdminCutoverSnapshot {
  generatedAt: string

  stage: CutoverStage
  stageDescription: string
  legacyWritesBlocked: boolean
  legacyReadsAllowed: boolean
  archivePermittedByStage: boolean
  backfillEndpointEnabled: boolean

  ledgerRows: number
  recentRuns: BackfillRunSummary[]
  skippedIneligible: number
  adjustedRows: number

  activeLegacyMentors: number
  mentorsWithActiveV2Service: number
  mentorsWithEmptyStorefront: number
  activeV2Services: number

  backfilledSchedules: number
  schedulesAwaitingConfirmation: number
  schedulesConfirmed: number

  legacyBookingsStillOpen: number
  legacyOpenFutureSlots: number
  legacySlotsBlockedByV2: number
  v2IntervalsMirroringLegacy: number
  crossSystemDoubleBookings: CrossSystemDoubleBooking[]
  bridgeConflicts: BackfillLedgerEntry[]

  revenue: RevenueReconciliationRow[]
  reconciliationChecks: ReconciliationCheckRow[]

  readiness: DecommissionReadinessRow[]
  blockingReadinessFailures: number
  archiveManifest: ArchiveManifestRow[]
  archiveRetentionDays: number

  invariantWarnings: string[]
}
