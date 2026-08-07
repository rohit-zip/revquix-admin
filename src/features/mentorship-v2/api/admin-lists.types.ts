/**
 * ─── ADMIN LIST ROW TYPES ─────────────────────────────────────────────────────
 *
 * The row shapes behind the Professional Mentor console's tables. One per backend
 * `Admin*Row` DTO — see `dto/response/mentorship/Admin*Row.java`.
 *
 * These are deliberately NOT the inspector payloads. `BookingSessionDiagnosticsResponse` and
 * `CommerceOrderResponse` carry the full case file (join ledger, notification log, state-machine
 * trace) which a table paints none of; drawing fifty rows from those would ship two orders of
 * magnitude more JSON than the screen uses.
 */

/** One row of the sessions table. */
export interface AdminBookingRow {
  bookingId: string
  orderId: string
  orderNumber: string | null

  serviceId: string
  serviceTitle: string | null
  serviceType: string | null

  mentorUserId: string
  mentorName: string | null
  buyerUserId: string
  buyerName: string | null

  status: string
  statusLabel: string

  startsAt: string | null
  endsAt: string | null
  durationMinutes: number | null

  meetingLinkSource: string | null
  hasMeetingLink: boolean
  meetingLinkError: string | null

  mentorJoined: boolean
  buyerJoined: boolean

  feedbackRequired: boolean
  feedbackDeadlineAt: string | null
  feedbackSubmitted: boolean

  completedAt: string | null
  cancelledAt: string | null
  cancelledBy: string | null
  createdAt: string

  currency: string | null
  amountMinor: number | null

  /** Set when a live dispute exists — the row links straight to it. */
  disputeId: string | null

  // Derived server-side; see the DTO for why these are not computed here.
  feedbackOverdue: boolean
  meetingLinkMissing: boolean
  needsAttention: boolean
}

/**
 * One row of the orders table.
 *
 * **Two currencies, never summed.** `chargeCurrency`/`grossAmountMinor` is what the buyer paid;
 * `baseCurrency`/`mentorNetMinor` is what the mentor earns. On a country-priced order they differ,
 * and a column that adds them means nothing.
 */
export interface AdminOrderRow {
  orderId: string
  orderNumber: string | null

  buyerUserId: string
  buyerName: string | null
  mentorUserId: string
  mentorName: string | null

  serviceId: string | null
  serviceTitle: string | null
  serviceType: string | null

  status: string
  statusLabel: string

  chargeCurrency: string | null
  chargeCurrencySymbol: string | null
  listAmountMinor: number | null
  discountAmountMinor: number | null
  buyerPlatformFeeMinor: number | null
  grossAmountMinor: number | null
  refundedAmountMinor: number | null

  baseCurrency: string | null
  baseCurrencySymbol: string | null
  platformFeeMinor: number | null
  taxMinor: number | null
  mentorNetMinor: number | null

  pricingZone: string | null
  buyerCountry: string | null
  couponCode: string | null
  gateway: string | null

  bookingId: string | null

  createdAt: string
  paidAt: string | null
  completedAt: string | null
  cancelledAt: string | null

  refunded: boolean
}

/** One row of the service-catalogue table. */
export interface AdminCatalogueRow {
  serviceId: string
  mentorUserId: string
  mentorName: string | null
  mentorUsername: string | null

  title: string | null
  slug: string | null
  serviceType: string | null
  status: string | null
  visibility: string | null

  baseCurrency: string | null
  basePriceMinor: number | null
  usdPriceMinor: number | null
  countryPricingEnabled: boolean

  viewCount: number | null
  orderCount: number | null
  completedCount: number | null
  reviewCount: number | null
  avgRating: number | null

  publishedAt: string | null
  archivedAt: string | null
  createdAt: string

  /** A marketplace projection row exists. Published-but-not-indexed is the common support case. */
  indexed: boolean
}

/** One row of the package-entitlements table. */
export interface AdminEntitlementRow {
  entitlementId: string
  parentOrderId: string

  buyerUserId: string
  buyerName: string | null
  mentorUserId: string
  mentorName: string | null

  packageServiceId: string | null
  childServiceId: string | null
  childServiceTitle: string | null

  quantityTotal: number | null
  quantityRedeemed: number | null
  quantityRefunded: number | null
  quantityRemaining: number

  currency: string | null
  unitValueMinor: number | null
  escrowMinor: number

  status: string | null
  expiresAt: string | null
  expired: boolean

  mentorAvailabilityBreachDays: number | null
  autoPausedAt: string | null
  selfRefundAvailableAt: string | null

  createdAt: string
}

/** One row of the refunds table. */
export interface AdminRefundRow {
  refundId: string
  orderId: string
  orderNumber: string | null

  buyerUserId: string | null
  buyerName: string | null
  mentorUserId: string | null
  mentorName: string | null

  refundType: string | null
  status: string | null
  reason: string | null

  currency: string | null
  currencySymbol: string | null
  amountMinor: number | null

  gatewayRefundId: string | null
  initiatedBy: string | null
  initiatedByName: string | null

  initiatedAt: string | null
  settledAt: string | null
}

/**
 * One session whose mentor missed the feedback deadline and which the breach sweep has not yet
 * converted into a dispute.
 *
 * **This list is supposed to be empty.** The sweep runs every two minutes and turns each of these
 * into a real `FEEDBACK_NOT_SUBMITTED` dispute with a payout hold. A row where `sweepOverdue` is
 * true has outlived a sweep interval, which is a statement about the job, not about the mentor —
 * which is why the table carries no admin action.
 */
export interface AdminFeedbackBreachRow {
  bookingId: string
  orderId: string

  mentorUserId: string
  mentorName: string | null
  buyerUserId: string
  buyerName: string | null

  serviceId: string | null
  serviceTitle: string | null

  endsAt: string | null
  feedbackWindowStartedAt: string | null
  feedbackDeadlineAt: string | null

  overdueHours: number
  sweepOverdue: boolean

  payoutHeld: boolean
  payoutId: string | null
  payoutStatus: string | null
}
