/**
 * ─── MENTORSHIP V2 (PHASE 6) PACKAGE ADMIN TYPES ─────────────────────────────
 *
 * Mirrors AdminPackageSnapshot, PackageEntitlementResponse and PackageLifecycleJob.SweepReport.
 *
 * `escrowInvariantViolations` and `invariantWarnings` are runtime **assertions**, not
 * statistics — the same discipline as commerce.types.ts's `unexpectedStatusKeys` /
 * `unresolvedStateMachineIds`. Both lists must always be empty; the view renders them in red
 * when they are not.
 */

export interface PackageRedemptionRow {
  redemptionId: string
  entitlementId: string
  bookingId: string
  orderId: string
  startsAt: string | null
  endsAt: string | null
  bookingStatus: string | null
  bookingStatusLabel: string | null
  redeemedAt: string
  revertedAt: string | null
}

export interface PackageEntitlementRow {
  entitlementId: string
  parentOrderId: string
  parentOrderNumber: string | null

  buyerUserId: string
  buyerName: string | null
  mentorUserId: string
  mentorName: string | null
  mentorUsername: string | null

  packageServiceId: string
  packageServiceTitle: string | null

  childServiceId: string
  childServiceTitle: string
  childServiceType: string | null
  childServiceSlug: string | null
  childServiceDurationMinutes: number | null
  childServiceStillBookable: boolean

  quantityTotal: number
  quantityRedeemed: number
  quantityRefunded: number
  quantityRemaining: number

  unitValueMinor: number
  currency: string
  currencySymbol: string

  expiresAt: string
  daysUntilExpiry: number
  clockPausedDays: number
  mentorAvailabilityBreachDays: number

  autoPaused: boolean
  selfRefundAvailable: boolean

  status: "ACTIVE" | "FULLY_REDEEMED" | "EXPIRED" | "REFUNDED"
  statusLabel: string

  canRedeem: boolean
  cannotRedeemReason: string | null

  canRequestSelfRefund: boolean
  cannotRequestSelfRefundReason: string | null

  redemptions: PackageRedemptionRow[] | null

  createdAt: string
}

export interface AdminPackageSnapshot {
  generatedAt: string

  totalEntitlements: number
  entitlementsByStatus: Record<string, number>
  totalRedemptions: number
  activeEntitlements: number
  overdueForExpiry: number
  entitlementsWithBreachDays: number
  autoPausedEntitlements: number
  selfRefundEligibleEntitlements: number

  unusedExpiryPolicy: string
  maxValidityDays: number
  nudgeAfterBreachDays: number
  autoPauseAfterBreachDays: number
  selfRefundAfterBreachDays: number
  lifecycleSweepCron: string

  /** Must always be empty. Rendered in red when it is not. */
  escrowInvariantViolations: string[]
  /** Must always be empty. Rendered in red when it is not. */
  invariantWarnings: string[]

  recentEntitlements: PackageEntitlementRow[]
}

export interface PackageSweepReport {
  ranAt: string
  clockPausesApplied: number
  nudgesSent: number
  autoPausesApplied: number
  selfRefundsUnlocked: number
  expiryRemindersSent: number
  expiriesSettled: number
  failures: number
  notes: string | null
}
