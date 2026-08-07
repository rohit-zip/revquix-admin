"use client"

/**
 * ─── ONE ORDER ────────────────────────────────────────────────────────────────
 *
 * The full money trail for a purchase: the buyer-side ledger, the mentor-side ledger, the linked
 * session, the intake answers and the refund history.
 *
 * <h3>Two ledgers, drawn side by side and never merged</h3>
 * `currency` is what the buyer was charged in; `mentorCurrency` is what the mentor earns in. On a
 * country-priced order those differ, and every figure on this page is rendered with the symbol of
 * whichever side it belongs to. That is not a formatting nicety — rendering a payout with the
 * buyer's symbol is how ₹71,910 becomes $71,910, which is a real regression this response's own
 * type comments were written to prevent.
 */

import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, XCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"
import { useInspectOrder, useOrderRefunds } from "@/features/mentorship-v2/api/commerce.hooks"
import { PersonCell, RefLink, StatusBadge, formatMinor, formatWhen, humanise } from "./console-format"

export default function OrderDetailView({ orderId }: { orderId: string }) {
  const router = useRouter()
  const query = useInspectOrder(orderId)
  const order = query.data
  const refunds = useOrderRefunds(orderId)

  if (query.isLoading) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        <Loader2 className="mx-auto mb-2 size-5 animate-spin" /> Loading order…
      </p>
    )
  }

  if (query.isError || !order) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={() => router.push(PATH_CONSTANTS.ADMIN_PM_ORDERS)}>
          <ArrowLeft className="size-4" /> Back to orders
        </Button>
        <Alert variant="destructive">
          <XCircle className="size-4" />
          <AlertTitle>No order found</AlertTitle>
          <AlertDescription>
            Nothing matches <span className="font-mono">{orderId}</span>.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const sameCurrency = order.currency === order.mentorCurrency

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2"
          onClick={() => router.push(PATH_CONSTANTS.ADMIN_PM_ORDERS)}
        >
          <ArrowLeft className="size-4" /> Orders
        </Button>
        <div>
          <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight">
            {order.orderNumber}
            <StatusBadge status={order.status} label={order.statusLabel} />
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {order.serviceTitle ?? humanise(order.serviceType)} ·{" "}
            <span className="font-mono text-xs">{order.orderId}</span>
          </p>
        </div>
      </header>

      {!sameCurrency ? (
        <Alert>
          <AlertTitle className="text-sm">
            This is a country-priced order — two currencies
          </AlertTitle>
          <AlertDescription className="text-xs">
            The buyer was charged in {order.currency}; the mentor earns in {order.mentorCurrency}.
            The two ledgers below are not comparable and must never be added.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Buyer ledger ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Buyer paid</CardTitle>
            <CardDescription>Everything below is in {order.currency}.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <Line label="Service price" value={formatMinor(order.basePriceMinor, order.currency)} />
            {order.discountAmountMinor > 0 ? (
              <Line
                label={`Coupon${order.couponCode ? ` (${order.couponCode})` : ""}`}
                value={`−${formatMinor(order.discountAmountMinor, order.currency)}`}
              />
            ) : null}
            <Line label="List amount" value={formatMinor(order.listAmountMinor, order.currency)} />
            {order.buyerPlatformFeeMinor > 0 ? (
              <Line
                label={`Platform fee${order.buyerPlatformFeeType ? ` (${order.buyerPlatformFeeType.toLowerCase()})` : ""}`}
                value={formatMinor(order.buyerPlatformFeeMinor, order.currency)}
              />
            ) : null}
            <Separator className="my-2" />
            <Line
              label="Charged"
              value={formatMinor(order.grossAmountMinor, order.currency)}
              strong
            />
            {order.refundedAmountMinor > 0 ? (
              <Line
                label="Refunded"
                value={`−${formatMinor(order.refundedAmountMinor, order.currency)}`}
                tone="destructive"
              />
            ) : null}
          </CardContent>
        </Card>

        {/* ── Mentor ledger ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mentor earns</CardTitle>
            <CardDescription>Everything below is in {order.mentorCurrency}.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <Line
              label="Sold for"
              value={formatMinor(order.mentorListAmountMinor, order.mentorCurrency)}
            />
            <Line
              label={`Commission (${order.platformFeePercentage}%)`}
              value={`−${formatMinor(order.platformFeeMinor, order.mentorCurrency)}`}
            />
            {order.taxMinor > 0 ? (
              <Line
                label="Tax on commission"
                value={`−${formatMinor(order.taxMinor, order.mentorCurrency)}`}
              />
            ) : null}
            <Separator className="my-2" />
            <Line
              label="Mentor net"
              value={formatMinor(order.mentorNetMinor, order.mentorCurrency)}
              strong
            />
            <p className="pt-2 text-xs text-muted-foreground">
              The buyer-side platform fee is not part of this arithmetic at any point — it never
              belonged to the mentor, so it is neither added to their gross nor deducted from it.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Parties &amp; payment</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Buyer">
            <PersonCell name={order.buyerName} userId={order.buyerUserId} />
          </Field>
          <Field label="Mentor">
            <PersonCell name={order.mentorName} userId={order.mentorUserId} />
          </Field>
          <Field label="Service">
            <RefLink
              id={order.serviceId}
              href={`${PATH_CONSTANTS.ADMIN_PM_SERVICES}/${order.serviceId}`}
            />
          </Field>
          <Field label="Gateway">{order.gateway}</Field>
          <Field label="Payment intent">{order.paymentIntentId ?? "—"}</Field>
          <Field label="Created">{formatWhen(order.createdAt)}</Field>
          <Field label="Paid">{formatWhen(order.paidAt)}</Field>
          <Field label="Completed">{formatWhen(order.completedAt)}</Field>
          <Field label="Cancelled">{formatWhen(order.cancelledAt)}</Field>
          {order.reservedUntil ? (
            <Field label="Slot reserved until">
              {formatWhen(order.reservedUntil)}
              {order.reservationSecondsRemaining !== null
                ? ` (${order.reservationSecondsRemaining}s left)`
                : ""}
            </Field>
          ) : null}
        </CardContent>
      </Card>

      {order.booking ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Session</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Booking">
              <RefLink
                id={order.booking.bookingId}
                href={`${PATH_CONSTANTS.ADMIN_PM_SESSIONS}/${order.booking.bookingId}`}
              />
            </Field>
            <Field label="Status">
              <StatusBadge status={order.booking.status} label={order.booking.statusLabel} />
            </Field>
            <Field label="Starts">{formatWhen(order.booking.startsAt)}</Field>
            <Field label="Meeting link">
              {order.booking.meetingLinkReady ? "Ready" : "Not ready"}
            </Field>
          </CardContent>
        </Card>
      ) : null}

      {refunds.data && refunds.data.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Refunds ({refunds.data.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {refunds.data.map((refund) => (
              <div key={refund.refundId} className="rounded-md border p-3 text-sm">
                <p className="flex flex-wrap items-center gap-2 font-medium">
                  {formatMinor(refund.amountMinor, order.currency)}
                  <Badge variant="outline" className="h-4 px-1 text-[10px]">
                    {refund.refundType}
                  </Badge>
                  <StatusBadge status={refund.status} />
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {refund.reason ?? "no reason recorded"} · initiated{" "}
                  {formatWhen(refund.initiatedAt)}
                  {refund.settledAt ? ` · settled ${formatWhen(refund.settledAt)}` : ""}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {order.intakeAnswers && order.intakeAnswers.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Intake answers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {order.intakeAnswers.map((answer) => (
              <div key={answer.responseId} className="text-sm">
                <p className="text-xs text-muted-foreground">
                  {answer.fieldLabel ?? answer.fieldKey}
                </p>
                <p className="mt-0.5">
                  {answer.valueText ??
                    (answer.valueJson ? answer.valueJson.join(", ") : null) ??
                    (answer.fileUrl ? (
                      <a
                        href={answer.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-2"
                      >
                        Open attachment
                      </a>
                    ) : (
                      "—"
                    ))}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

function Line({
  label,
  value,
  strong,
  tone,
}: {
  label: string
  value: string
  strong?: boolean
  tone?: "destructive"
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className={strong ? "font-medium" : "text-muted-foreground"}>{label}</span>
      <span
        className={
          tone === "destructive"
            ? "font-medium text-destructive"
            : strong
              ? "text-base font-semibold"
              : ""
        }
      >
        {value}
      </span>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-0.5 break-words text-sm font-medium">{children}</div>
    </div>
  )
}
