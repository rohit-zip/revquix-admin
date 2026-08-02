/**
 * ─── MENTORSHIP V2 (PHASE 3) COMMERCE TYPES ──────────────────────────────────
 *
 * Mirrors AdminCommerceSnapshot and friends. Two fields are runtime assertions rather
 * than data — `unexpectedStatusKeys` and `unresolvedStateMachineIds` — and the view
 * renders both in red. Both must always be empty.
 */

export interface WebhookDelivery {
  eventId: string
  gatewayEventId: string
  eventType: string
  signatureValid: boolean
  processResult: string | null
  createdAt: string | null
  processedAt: string | null
}

export interface StateMachineView {
  id: string
  initialStatus: string
  terminalStatuses: string[]
  /** The transition table, rendered verbatim from the code that enforces it. */
  table: string
  transitionCount: number
}

export interface FeePolicyView {
  buyerSideEnabled: boolean
  inrThresholdMinor: number
  inrFlatFeeMinor: number
  inrPercentage: number
  usdThresholdMinor: number
  usdFlatFeeMinor: number
  usdPercentage: number
  mentorSideDefaultPercentage: number
  mentorSideGstOnFeePercentage: number
  buyerFeeRefundProportional: boolean
}

export interface RefundRow {
  refundId: string
  orderId: string | null
  refundType: string
  status: string
  amountMinor: number
  gatewayRefundId: string | null
  reason: string | null
  initiatedAt: string | null
  settledAt: string | null
}

export interface CommerceOrderRow {
  orderId: string
  orderNumber: string
  status: string
  statusLabel: string
  serviceId: string
  serviceType: string
  serviceTitle: string | null
  serviceSlug: string | null
  mentorUserId: string
  mentorName: string | null
  mentorUsername: string | null
  buyerUserId: string
  buyerName: string | null
  /** The buyer's public handle. Their email is no longer returned on this response at all. */
  buyerUsername: string | null
  currency: string
  currencySymbol: string
  basePriceMinor: number
  discountAmountMinor: number
  couponCode: string | null
  listAmountMinor: number
  buyerPlatformFeeMinor: number
  buyerPlatformFeeType: string | null
  grossAmountMinor: number
  platformFeeMinor: number
  platformFeePercentage: number
  taxMinor: number
  mentorNetMinor: number
  refundedAmountMinor: number
  refundedBuyerFeeMinor: number
  gateway: string
  paymentIntentId: string | null
  reservedUntil: string | null
  reservationSecondsRemaining: number | null
  createdAt: string | null
  paidAt: string | null
  cancelledAt: string | null
  expiredAt: string | null
  completedAt: string | null
  booking: {
    bookingId: string
    status: string
    statusLabel: string
    stateMachine: string
    startsAt: string | null
    endsAt: string | null
    durationMinutes: number | null
    intervalId?: string | null
    /**
     * Whether a joining link exists — the address itself is not in this payload for anyone, admin
     * included. It is released only by the participant-facing join endpoint, in exchange for a
     * recorded join event. `AdminCallInspectionService`'s snapshot is the admin route to the raw URL.
     */
    meetingLinkReady: boolean
    canCancel: boolean
  } | null
  intakeAnswers:
    | {
        responseId: string
        fieldKey: string
        fieldLabel: string | null
        valueText: string | null
        valueJson: string[] | null
        fileUrl: string | null
      }[]
    | null
}

export interface AdminCommerceSnapshot {
  generatedAt: string
  schemaReady: boolean
  schemaProblems: string[]

  totalOrders: number
  ordersByStatus: Record<string, number>
  totalBookings: number
  bookingsByStatus: Record<string, number>
  /** Must be empty. A non-empty list means migration/code drift or a reintroduced review gate. */
  unexpectedStatusKeys: string[]

  grossPaidMinor: number
  /** Buyer-side platform fee earned, net of refunds — the V2-only revenue line. */
  netBuyerPlatformFeeMinor: number
  mentorCommissionMinor: number

  liveReservations: number
  lapsedReservationsAwaitingSweep: number
  reservationTtlMinutes: number
  recentWebhooks: WebhookDelivery[]
  webhookErrorCount: number
  webhookBadSignatureCount: number

  stateMachines: StateMachineView[]
  /** Must be empty. A capability row naming a lifecycle that does not exist. */
  unresolvedStateMachineIds: string[]

  feePolicy: FeePolicyView

  recentOrders: CommerceOrderRow[]
  recentRefunds: RefundRow[]
}

export interface BookingStatusLogRow {
  logId: string
  fromStatus: string | null
  toStatus: string
  actorType: string
  actorId: string | null
  reason: string | null
  metadata: Record<string, unknown> | null
  createdAt: string | null
}

export interface SweepResult {
  examined: number
  actioned: number
  notes: string[]
}

export interface IssueRefundPayload {
  orderId: string
  /** Service-price amount only. The platform fee is derived proportionally server-side. */
  serviceAmountMinor?: number | null
  reason: string
  refundType?: string
}

/** What the refund endpoint returns — the split, the new order totals and a buyer-facing message. */
export interface RefundOutcome {
  refundId: string | null
  orderId: string
  gatewayRefundId: string | null
  refundType: string
  status: string
  currency: string
  serviceRefundMinor: number
  buyerFeeRefundMinor: number
  totalRefundMinor: number
  orderRefundedTotalMinor: number
  orderRemainingRefundableMinor: number
  orderStatusAfter: string
  reason: string | null
  initiatedAt: string | null
  gatewayBypassed: boolean
  message: string | null
}
