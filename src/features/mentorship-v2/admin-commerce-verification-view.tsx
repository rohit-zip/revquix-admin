"use client"

/**
 * ─── MENTORSHIP V2 · PHASE 3 COMMERCE VERIFICATION ───────────────────────────
 *
 * Six panels, each mapping to a stated Phase 3 exit criterion. The reason this page exists
 * rather than "check the database": every Phase 3 correctness claim is about behaviour under
 * a race — idempotent webhooks, no double-booking, no double payout, a refund that matches
 * its preview. A SQL console cannot verify any of those, because reproducing them requires
 * *doing* something.
 *
 *  1. **Invariants** — the two runtime assertions (`unexpectedStatusKeys`,
 *     `unresolvedStateMachineIds`) rendered in red. Both must always be empty. Carried
 *     forward from the Phase 2 panel, which does the same for service statuses so a
 *     reintroduced review gate surfaces in the UI rather than going unnoticed.
 *  2. **Money** — the two revenue lines side by side. Seeing them separately is the whole
 *     point of the §1.1 model: buyer platform fee (new, V2-only) and mentor commission
 *     (retuned 20 → 10) are independent, and a report that merged them would hide the change.
 *  3. **Reservations** — live and lapsed counts plus the on-demand expiry sweep, so the
 *     expiry path can be verified in seconds instead of waiting for the scheduler.
 *  4. **Webhook feed** — the last 50 deliveries with process results. A repeated
 *     `gatewayEventId` showing `IGNORED` on the second row *is* the idempotency proof.
 *  5. **Order inspector** — every snapshotted pricing column for one order, its booking's
 *     full transition log, and a manual refund with the proportional fee split shown.
 *  6. **State machines** — the transition tables rendered verbatim from the code that
 *     enforces them, so what a reviewer reads is not a hand-maintained copy.
 */

import { useState } from "react"
import {
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  Coins,
  Loader2,
  Play,
  RefreshCw,
  Receipt,
  Search,
  ShieldAlert,
  Undo2,
  Webhook,
  XCircle,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  useAdminBookingHistory,
  useCommerceSnapshot,
  useInspectOrder,
  useIssueRefund,
  useOrderRefunds,
  useRunExpirySweep,
  useRunReconciliation,
} from "./api/commerce.hooks"
import type { SweepResult } from "./api/commerce.types"

function formatMinor(minor?: number | null, currency?: string | null): string {
  if (minor === null || minor === undefined) return "—"
  const symbol = currency === "USD" ? "$" : "₹"
  return symbol + (minor / 100).toLocaleString()
}

export default function AdminCommerceVerificationView() {
  const snapshotQuery = useCommerceSnapshot()
  const snapshot = snapshotQuery.data

  const expirySweep = useRunExpirySweep()
  const reconciliation = useRunReconciliation()

  const [orderIdInput, setOrderIdInput] = useState("")
  const [activeOrderId, setActiveOrderId] = useState("")
  const orderQuery = useInspectOrder(activeOrderId)
  const order = orderQuery.data
  const historyQuery = useAdminBookingHistory(order?.booking?.bookingId ?? null)
  const refundsQuery = useOrderRefunds(activeOrderId || null)

  const [refundAmountMajor, setRefundAmountMajor] = useState("")
  const [refundReason, setRefundReason] = useState("")
  const refund = useIssueRefund()

  const [openMachineId, setOpenMachineId] = useState<string | null>(null)

  const invariantsBroken =
    (snapshot?.unexpectedStatusKeys.length ?? 0) > 0 ||
    (snapshot?.unresolvedStateMachineIds.length ?? 0) > 0

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <Receipt className="size-5" /> Commerce engine
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Verification surface for the checkout, webhook, reservation, refund and payout paths.
            Every number here is read live; the two sweep buttons and the refund form are the only
            things on this page that write anything.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void snapshotQuery.refetch()}
          disabled={snapshotQuery.isFetching}
        >
          {snapshotQuery.isFetching ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          Refresh
        </Button>
      </header>

      {snapshotQuery.isLoading ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            <Loader2 className="mx-auto mb-2 size-5 animate-spin" />
            Loading commerce snapshot…
          </CardContent>
        </Card>
      ) : snapshotQuery.isError ? (
        <Alert variant="destructive">
          <XCircle className="size-4" />
          <AlertTitle>Could not load the snapshot</AlertTitle>
          <AlertDescription>
            The Phase 3 tables may not be migrated yet. Run the app once against a database with
            V175–V180 applied, then refresh.
          </AlertDescription>
        </Alert>
      ) : snapshot ? (
        <>
          {/* ── 1. Invariants ── */}
          <Card className={invariantsBroken ? "border-destructive" : undefined}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldAlert className="size-4" /> Runtime invariants
              </CardTitle>
              <CardDescription>
                These are assertions, not statistics. Both lists must always be empty — that is what
                makes them worth rendering.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <InvariantRow
                label="Unexpected status keys"
                detail="A status outside the OrderStatus / BookingStatus enums means a migration and the code have drifted — or that a PENDING_REVIEW-style review-gate state was reintroduced, which decision #6 forbids."
                values={snapshot.unexpectedStatusKeys}
              />
              <InvariantRow
                label="Unresolved booking lifecycles"
                detail="A service_type_capability row naming a booking state machine that is not registered. Services of that type refuse checkout with a clean error rather than creating a booking with no lifecycle — but the row still needs fixing."
                values={snapshot.unresolvedStateMachineIds}
              />
            </CardContent>
          </Card>

          {/* ── 2. Money ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Coins className="size-4" /> The two revenue lines
              </CardTitle>
              <CardDescription>
                Shown separately on purpose. Under the §1.1 model the buyer-side fee is new and
                V2-only, while the mentor-side commission exists in both systems at different rates
                (20% legacy → 10% V2). A report that merged them would hide the change at cutover.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <Metric
                label="Gross charged (paid orders)"
                value={formatMinor(snapshot.grossPaidMinor, "INR")}
                hint="Service price + buyer platform fee, across every paid order."
              />
              <Metric
                label="Buyer platform fee, net of refunds"
                value={formatMinor(snapshot.netBuyerPlatformFeeMinor, "INR")}
                hint="Additive revenue charged to buyers. Never deducted from a mentor."
                tone="positive"
              />
              <Metric
                label="Mentor commission"
                value={formatMinor(snapshot.mentorCommissionMinor, "INR")}
                hint="Subtractive revenue deducted from mentor payouts. Never charged to a buyer."
                tone="positive"
              />
            </CardContent>
            <CardContent className="pt-0">
              <Separator className="mb-3" />
              <div className="grid gap-x-6 gap-y-1 text-xs text-muted-foreground sm:grid-cols-2">
                <span>
                  Buyer fee INR: flat {formatMinor(snapshot.feePolicy.inrFlatFeeMinor, "INR")} under{" "}
                  {formatMinor(snapshot.feePolicy.inrThresholdMinor, "INR")}, otherwise{" "}
                  {snapshot.feePolicy.inrPercentage}%
                </span>
                <span>
                  Buyer fee USD: flat {formatMinor(snapshot.feePolicy.usdFlatFeeMinor, "USD")} under{" "}
                  {formatMinor(snapshot.feePolicy.usdThresholdMinor, "USD")}, otherwise{" "}
                  {snapshot.feePolicy.usdPercentage}%
                </span>
                <span>
                  Mentor commission default: {snapshot.feePolicy.mentorSideDefaultPercentage}% · GST
                  on fee: {snapshot.feePolicy.mentorSideGstOnFeePercentage}%
                </span>
                <span>
                  Platform fee refunded proportionally:{" "}
                  {snapshot.feePolicy.buyerFeeRefundProportional ? "yes" : "no"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* ── 3. Reservations + sweeps ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="size-4" /> Reservations &amp; sweeps
              </CardTitle>
              <CardDescription>
                A reservation is a durable {snapshot.reservationTtlMinutes}-minute HELD interval plus
                a Redis key for the countdown. The sweeper trusts the database column, not Redis —
                Redis is allowed to lose keys and the mentor&apos;s slot must be released regardless.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <Metric label="Awaiting payment" value={String(snapshot.liveReservations)} />
                <Metric
                  label="Lapsed, awaiting sweep"
                  value={String(snapshot.lapsedReservationsAwaitingSweep)}
                  tone={snapshot.lapsedReservationsAwaitingSweep > 0 ? "warning" : undefined}
                  hint="Non-zero is normal between scheduler runs (every 2 minutes). Persistently non-zero means the scheduler is not running."
                />
                <Metric label="Bookings total" value={String(snapshot.totalBookings)} />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={expirySweep.isPending}
                  onClick={() => expirySweep.mutate()}
                >
                  {expirySweep.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Play className="size-4" />
                  )}
                  Run expiry sweep
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={reconciliation.isPending}
                  onClick={() => reconciliation.mutate()}
                >
                  {reconciliation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ArrowRightLeft className="size-4" />
                  )}
                  Run reconciliation
                </Button>
              </div>

              <SweepNotes title="Expiry sweep" result={expirySweep.data} />
              <SweepNotes title="Reconciliation" result={reconciliation.data} />
            </CardContent>
          </Card>

          {/* ── 4. Webhook feed ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Webhook className="size-4" /> Webhook deliveries (PayPal)
              </CardTitle>
              <CardDescription>
                The idempotency proof: replay the same event and the second row shows{" "}
                <code className="text-xs">IGNORED</code> with no second booking, payout or coupon
                redemption. {snapshot.webhookErrorCount} error(s),{" "}
                {snapshot.webhookBadSignatureCount} bad signature(s) recorded overall.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {snapshot.recentWebhooks.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No PayPal deliveries yet. This feed covers PayPal only — Razorpay is handled on the
                  single platform route (<code className="text-xs">/api/v1/webhooks/razorpay</code>)
                  and its deliveries are recorded in <code className="text-xs">payment_webhook_log</code>.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="text-left text-muted-foreground">
                      <tr>
                        <th className="pb-1.5 pr-3">Event</th>
                        <th className="pb-1.5 pr-3">Type</th>
                        <th className="pb-1.5 pr-3">Signature</th>
                        <th className="pb-1.5 pr-3">Result</th>
                        <th className="pb-1.5">Received</th>
                      </tr>
                    </thead>
                    <tbody>
                      {snapshot.recentWebhooks.map((delivery) => (
                        <tr key={delivery.eventId} className="border-t border-border/50">
                          <td className="max-w-[16rem] truncate py-1.5 pr-3 font-mono">
                            {delivery.gatewayEventId}
                          </td>
                          <td className="py-1.5 pr-3">{delivery.eventType}</td>
                          <td className="py-1.5 pr-3">
                            {delivery.signatureValid ? (
                              <Badge variant="outline">valid</Badge>
                            ) : (
                              <Badge variant="destructive">invalid</Badge>
                            )}
                          </td>
                          <td className="py-1.5 pr-3">
                            <Badge
                              variant={
                                delivery.processResult === "OK"
                                  ? "default"
                                  : delivery.processResult === "ERROR"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {delivery.processResult ?? "pending"}
                            </Badge>
                          </td>
                          <td className="py-1.5 text-muted-foreground">
                            {delivery.createdAt
                              ? new Date(delivery.createdAt).toLocaleString()
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── 5. Order inspector ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Search className="size-4" /> Order inspector
              </CardTitle>
              <CardDescription>
                Every snapshotted pricing column for one order. This is how a two-month-old order is
                reconciled against the §1.1 formula without trusting today&apos;s config.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Input
                  value={orderIdInput}
                  onChange={(event) => setOrderIdInput(event.target.value)}
                  placeholder="ORD00000001"
                  className="max-w-xs font-mono text-xs"
                  aria-label="Order id"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveOrderId(orderIdInput.trim())}
                  disabled={!orderIdInput.trim()}
                >
                  Load
                </Button>
                {snapshot.recentOrders.length > 0 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const latest = snapshot.recentOrders[0].orderId
                      setOrderIdInput(latest)
                      setActiveOrderId(latest)
                    }}
                  >
                    Use latest
                  </Button>
                ) : null}
              </div>

              {orderQuery.isError ? (
                <Alert variant="destructive">
                  <XCircle className="size-4" />
                  <AlertDescription>No order found with that id.</AlertDescription>
                </Alert>
              ) : null}

              {order ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm">{order.orderNumber}</span>
                    <Badge>{order.statusLabel}</Badge>
                    <Badge variant="outline">{order.gateway}</Badge>
                    {order.booking ? (
                      <Badge variant="secondary">
                        {order.booking.stateMachine} · {order.booking.statusLabel}
                      </Badge>
                    ) : null}
                  </div>

                  <div className="grid gap-x-6 gap-y-1 text-xs sm:grid-cols-2">
                    <Kv k="Service" v={order.serviceTitle ?? order.serviceId} />
                    <Kv k="Type" v={order.serviceType} />
                    <Kv k="Mentor" v={order.mentorName ?? order.mentorUserId} />
                    <Kv k="Buyer" v={order.buyerName ?? order.buyerUserId} />
                    {/* Named for the currency it is in. It used to be the mentor's own listed price
                        rendered with the buyer's symbol, which showed a ₹799 service as $799. */}
                    <Kv
                      k="Price before discount"
                      v={formatMinor(order.basePriceMinor, order.currency)}
                    />
                    <Kv
                      k="Discount"
                      v={`${formatMinor(order.discountAmountMinor, order.currency)}${
                        order.couponCode ? ` (${order.couponCode})` : ""
                      }`}
                    />
                    <Kv
                      k="List amount (fee base)"
                      v={formatMinor(order.listAmountMinor, order.currency)}
                    />
                    <Kv
                      k="Buyer platform fee"
                      v={`${formatMinor(order.buyerPlatformFeeMinor, order.currency)} (${
                        order.buyerPlatformFeeType ?? "—"
                      })`}
                    />
                    <Kv
                      k="Gross charged"
                      v={formatMinor(order.grossAmountMinor, order.currency)}
                      strong
                    />
                    {/* Every mentor-side row below is in mentorCurrency, not the buyer's. On a
                        cross-currency order these are different units, and the buyer's symbol over
                        the mentor's rupees is what this page exists to catch rather than commit. */}
                    <Kv
                      k="Mentor list amount"
                      v={formatMinor(order.mentorListAmountMinor, order.mentorCurrency)}
                    />
                    <Kv
                      k="Mentor commission"
                      v={`${formatMinor(order.platformFeeMinor, order.mentorCurrency)} @ ${
                        order.platformFeePercentage
                      }%`}
                    />
                    <Kv
                      k="GST on commission"
                      v={formatMinor(order.taxMinor, order.mentorCurrency)}
                    />
                    <Kv
                      k="Mentor net"
                      v={formatMinor(order.mentorNetMinor, order.mentorCurrency)}
                      strong
                    />
                    <Kv k="Refunded" v={formatMinor(order.refundedAmountMinor, order.currency)} />
                    <Kv
                      k="of which platform fee"
                      v={formatMinor(order.refundedBuyerFeeMinor, order.currency)}
                    />
                    <Kv k="Payment intent" v={order.paymentIntentId ?? "—"} />
                    <Kv k="Paid at" v={order.paidAt ? new Date(order.paidAt).toLocaleString() : "—"} />
                  </div>

                  <Alert>
                    <CheckCircle2 className="size-4" />
                    <AlertDescription className="text-xs">
                      {/* The mentor-side identity is stated against mentorListAmountMinor, which is
                          what ck_commerce_order_mentor_net_identity was re-anchored to in V234. It
                          read "= list − commission − tax" against the BUYER's list amount, which is
                          a different number in a different currency the moment FX is involved — so
                          the one line on this page whose job is to prove an invariant was quoting an
                          equation the database does not enforce and that cross-currency rows fail. */}
                      Buyer side: gross ({formatMinor(order.grossAmountMinor, order.currency)}) = list
                      ({formatMinor(order.listAmountMinor, order.currency)}) + buyer fee (
                      {formatMinor(order.buyerPlatformFeeMinor, order.currency)}). Mentor side:
                      net ({formatMinor(order.mentorNetMinor, order.mentorCurrency)}) = mentor list (
                      {formatMinor(order.mentorListAmountMinor, order.mentorCurrency)}) − commission (
                      {formatMinor(order.platformFeeMinor, order.mentorCurrency)}) − tax (
                      {formatMinor(order.taxMinor, order.mentorCurrency)}). Both are also enforced as
                      DB CHECK constraints, so a row that violated either could not have been inserted.
                    </AlertDescription>
                  </Alert>

                  {/* Transition log */}
                  {order.booking ? (
                    <div>
                      <p className="mb-1.5 text-xs font-medium">Booking transition log</p>
                      {historyQuery.isLoading ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <ol className="space-y-1.5 border-l border-border/60 pl-3">
                          {(historyQuery.data ?? []).map((entry) => (
                            <li key={entry.logId} className="text-xs">
                              <span className="font-medium">
                                {entry.fromStatus ? `${entry.fromStatus} → ` : "created → "}
                                {entry.toStatus}
                              </span>
                              <span className="text-muted-foreground">
                                {" "}
                                · {entry.actorType}
                                {entry.reason ? ` · ${entry.reason}` : ""}
                                {entry.createdAt
                                  ? ` · ${new Date(entry.createdAt).toLocaleString()}`
                                  : ""}
                              </span>
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  ) : null}

                  {/* Refunds */}
                  <div>
                    <p className="mb-1.5 text-xs font-medium">Refunds on this order</p>
                    {(refundsQuery.data ?? []).length === 0 ? (
                      <p className="text-xs text-muted-foreground">None.</p>
                    ) : (
                      <ul className="space-y-1 text-xs">
                        {(refundsQuery.data ?? []).map((row) => (
                          <li key={row.refundId}>
                            <span className="font-mono">{row.refundId}</span> · {row.refundType} ·{" "}
                            {row.status} · {formatMinor(row.amountMinor, order.currency)}
                            {row.reason ? ` · ${row.reason}` : ""}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Manual refund */}
                  <Separator />
                  <div className="space-y-2">
                    <p className="flex items-center gap-1.5 text-xs font-medium">
                      <Undo2 className="size-3.5" /> Issue a manual refund
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Enter the <strong>service</strong> amount only. The platform fee is refunded
                      proportionally and automatically — that keeps the fee treatment consistent and
                      makes it impossible to refund more fee than was charged. Leave the amount blank
                      to refund everything still refundable.
                    </p>
                    <div className="flex flex-wrap items-end gap-2">
                      <div>
                        <Label htmlFor="refund-amount" className="text-xs">
                          Service amount ({order.currencySymbol})
                        </Label>
                        <Input
                          id="refund-amount"
                          type="number"
                          min="0"
                          step="0.01"
                          value={refundAmountMajor}
                          onChange={(event) => setRefundAmountMajor(event.target.value)}
                          placeholder="blank = all"
                          className="mt-1 w-40 text-xs"
                        />
                      </div>
                      <div className="min-w-[16rem] flex-1">
                        <Label htmlFor="refund-reason" className="text-xs">
                          Reason (required)
                        </Label>
                        <Textarea
                          id="refund-reason"
                          rows={2}
                          value={refundReason}
                          onChange={(event) => setRefundReason(event.target.value)}
                          className="mt-1 text-xs"
                          placeholder="Goodwill after a support escalation…"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={!refundReason.trim() || refund.isPending}
                        onClick={() =>
                          refund.mutate({
                            orderId: order.orderId,
                            serviceAmountMinor: refundAmountMajor.trim()
                              ? Math.round(Number(refundAmountMajor) * 100)
                              : null,
                            reason: refundReason.trim(),
                            refundType: refundAmountMajor.trim() ? "PARTIAL" : "FULL",
                          })
                        }
                      >
                        {refund.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                        Refund
                      </Button>
                    </div>
                    {refund.data ? (
                      <Alert>
                        <CheckCircle2 className="size-4" />
                        <AlertDescription className="text-xs">
                          Service {formatMinor(refund.data.serviceRefundMinor, refund.data.currency)}{" "}
                          + platform fee{" "}
                          {formatMinor(refund.data.buyerFeeRefundMinor, refund.data.currency)} ={" "}
                          <strong>
                            {formatMinor(refund.data.totalRefundMinor, refund.data.currency)}
                          </strong>
                          . Order is now {refund.data.orderStatusAfter}.
                          {refund.data.gatewayBypassed
                            ? " No gateway call was needed (zero-amount order)."
                            : ` Gateway refund id ${refund.data.gatewayRefundId}.`}
                        </AlertDescription>
                      </Alert>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* ── 6. State machines ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ArrowRightLeft className="size-4" /> Booking lifecycles
              </CardTitle>
              <CardDescription>
                Rendered verbatim from <code className="text-xs">BookingStateMachine.describe()</code>
                , so what you read here is what the code enforces — not a hand-maintained copy of it.
                An undeclared transition throws a 409; a terminal status has no outgoing transitions
                by construction.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {snapshot.stateMachines.map((machine) => (
                <div key={machine.id} className="rounded-lg border border-border/60">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm"
                    onClick={() =>
                      setOpenMachineId((prev) => (prev === machine.id ? null : machine.id))
                    }
                  >
                    <span className="font-medium">{machine.id}</span>
                    <span className="text-xs text-muted-foreground">
                      initial {machine.initialStatus} · {machine.transitionCount} transitions ·{" "}
                      {machine.terminalStatuses.length} terminal
                    </span>
                  </button>
                  {openMachineId === machine.id ? (
                    <pre className="overflow-x-auto border-t border-border/60 bg-muted/40 p-3 text-[11px] leading-relaxed">
                      {machine.table}
                    </pre>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* ── Recent orders ── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent orders</CardTitle>
              <CardDescription>
                Counts by status: {Object.entries(snapshot.ordersByStatus).map(([key, value]) => `${key} ${value}`).join(" · ") || "none yet"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {snapshot.recentOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No orders yet. Complete a checkout from a mentor&apos;s public service page.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="text-left text-muted-foreground">
                      <tr>
                        <th className="pb-1.5 pr-3">Order</th>
                        <th className="pb-1.5 pr-3">Status</th>
                        <th className="pb-1.5 pr-3">Service</th>
                        <th className="pb-1.5 pr-3">Gross</th>
                        <th className="pb-1.5 pr-3">Buyer fee</th>
                        <th className="pb-1.5">Mentor net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {snapshot.recentOrders.map((row) => (
                        <tr key={row.orderId} className="border-t border-border/50">
                          <td className="py-1.5 pr-3">
                            <button
                              type="button"
                              className="font-mono hover:underline"
                              onClick={() => {
                                setOrderIdInput(row.orderId)
                                setActiveOrderId(row.orderId)
                              }}
                            >
                              {row.orderNumber}
                            </button>
                          </td>
                          <td className="py-1.5 pr-3">{row.statusLabel}</td>
                          <td className="max-w-[14rem] truncate py-1.5 pr-3">
                            {row.serviceTitle ?? row.serviceId}
                          </td>
                          <td className="py-1.5 pr-3">
                            {formatMinor(row.grossAmountMinor, row.currency)}
                          </td>
                          <td className="py-1.5 pr-3">
                            {formatMinor(row.buyerPlatformFeeMinor, row.currency)}
                          </td>
                          <td className="py-1.5">
                            {formatMinor(row.mentorNetMinor, row.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}

function InvariantRow({
  label,
  detail,
  values,
}: {
  label: string
  detail: string
  values: string[]
}) {
  const broken = values.length > 0
  return (
    <div className="flex items-start gap-2">
      {broken ? (
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
      ) : (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-500" />
      )}
      <div className="min-w-0">
        <p className={broken ? "text-sm font-medium text-destructive" : "text-sm font-medium"}>
          {label}: {broken ? values.join(", ") : "none"}
        </p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  )
}

function Metric({
  label,
  value,
  hint,
  tone,
}: {
  label: string
  value: string
  hint?: string
  tone?: "positive" | "warning"
}) {
  return (
    <div className="rounded-lg border border-border/60 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={
          tone === "positive"
            ? "mt-0.5 text-lg font-semibold text-emerald-600 dark:text-emerald-500"
            : tone === "warning"
              ? "mt-0.5 text-lg font-semibold text-amber-600 dark:text-amber-500"
              : "mt-0.5 text-lg font-semibold"
        }
      >
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

function SweepNotes({ title, result }: { title: string; result?: SweepResult }) {
  if (!result) return null
  return (
    <div className="rounded-lg border border-border/60 p-3">
      <p className="text-xs font-medium">
        {title}: examined {result.examined}, actioned {result.actioned}
      </p>
      {result.notes.length > 0 ? (
        <ul className="mt-1 space-y-0.5 text-[11px] text-muted-foreground">
          {result.notes.map((note, index) => (
            <li key={`${title}-${index}`}>{note}</li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function Kv({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{k}</span>
      <span className={strong ? "font-semibold" : undefined}>{v}</span>
    </div>
  )
}
