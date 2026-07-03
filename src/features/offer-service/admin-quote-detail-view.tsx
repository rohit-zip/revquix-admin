/**
 * ─── ADMIN QUOTE DETAIL VIEW ─────────────────────────────────────────────────
 *
 * View and manage a single custom quote: send, cancel, and (once paid) jump to
 * the standard order-fulfilment screen.
 * Route: /custom-quotes/[orderId]
 */

"use client"

import { useState } from "react"
import type { ElementType } from "react"
import Link from "next/link"
import { useRouter } from "nextjs-toploader/app"
import {
  ArrowLeft,
  Send,
  XCircle,
  ExternalLink,
  Loader2,
  Mail,
  Clock,
  CheckCircle2,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"
import { OfferStatusBadge } from "./components/offer-status-badge"
import { useAdminQuoteDetail, useAdminSendQuote, useAdminCancelQuote } from "./api/quote.hooks"

function formatAmount(minor: number | null | undefined, currency: string) {
  if (minor == null) return "—"
  if (currency === "USD") return `$${(minor / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
  return `₹${(minor / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
}

function formatDate(iso: string | null | undefined, withTime = false) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  })
}

const QUOTE_PHASE = ["QUOTE_DRAFT", "QUOTE_SENT", "QUOTE_DECLINED", "QUOTE_EXPIRED", "QUOTE_CANCELLED"]

export default function AdminQuoteDetailView({ orderId }: { orderId: string }) {
  const router = useRouter()
  const { data: quote, isLoading, isError } = useAdminQuoteDetail(orderId)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState("")

  const sendMutation = useAdminSendQuote(orderId)
  const cancelMutation = useAdminCancelQuote(orderId, () => {
    setCancelOpen(false)
    setCancelReason("")
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }
  if (isError || !quote) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Quote not found.</p>
        <Button variant="outline" asChild>
          <Link href={PATH_CONSTANTS.ADMIN_CUSTOM_QUOTES}>← Back to Custom Quotes</Link>
        </Button>
      </div>
    )
  }

  const currency = quote.currency || "INR"
  const isDraft = quote.status === "QUOTE_DRAFT"
  const isSent = quote.status === "QUOTE_SENT"
  const isQuotePhase = QUOTE_PHASE.includes(quote.status)
  const isPaid = !isQuotePhase && quote.status !== "PENDING_PAYMENT"
  const lineItems = quote.lineItems ?? []
  const subtotal = lineItems.reduce((s, li) => s + li.lineTotalMinor, 0)
  const discount = quote.couponDiscountSnapshot ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(PATH_CONSTANTS.ADMIN_CUSTOM_QUOTES)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{quote.quoteTitle ?? "Custom quote"}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="rounded-full border bg-muted/60 px-2.5 py-1 font-mono text-xs text-muted-foreground">
                {quote.quoteNumber ?? quote.orderId}
              </span>
              <OfferStatusBadge status={quote.status} />
              {quote.quoteRevisionNo ? (
                <span className="text-xs text-muted-foreground">rev. {quote.quoteRevisionNo}</span>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {isDraft && (
            <Button
              className="gap-2"
              disabled={sendMutation.isPending}
              onClick={() => sendMutation.mutate()}
            >
              {sendMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send Quote
            </Button>
          )}
          {(isDraft || isSent) && (
            <Button
              variant="outline"
              className="gap-2 border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => setCancelOpen(true)}
            >
              <XCircle className="h-4 w-4" />
              Cancel
            </Button>
          )}
          {(isPaid || quote.status === "PENDING_PAYMENT") && (
            <Button variant="outline" className="gap-2" asChild>
              <Link href={`${PATH_CONSTANTS.ADMIN_OFFER_ORDER_DETAIL}/${quote.orderId}`}>
                <ExternalLink className="h-4 w-4" />
                Manage fulfilment
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main */}
        <div className="space-y-6">
          {quote.quoteSummary && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Scope of Work</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {quote.quoteSummary}
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Line Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {lineItems.map((li, idx) => (
                <div key={idx} className="flex items-start justify-between gap-4 rounded-lg border p-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{li.title}</p>
                    {li.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{li.description}</p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {li.quantity} × {formatAmount(li.unitPriceMinor, currency)}
                    </p>
                  </div>
                  <div className="shrink-0 font-semibold text-sm">
                    {formatAmount(li.lineTotalMinor, currency)}
                  </div>
                </div>
              ))}
              <Separator />
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatAmount(subtotal, currency)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount{quote.appliedCouponCode ? ` (${quote.appliedCouponCode})` : ""}</span>
                    <span>−{formatAmount(discount, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 text-base font-bold">
                  <span>Total</span>
                  <span>{formatAmount(quote.finalAmountCharged, currency)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recipient</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{quote.userName ?? "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span className="truncate">{quote.targetEmail ?? quote.userEmail}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Total" value={formatAmount(quote.finalAmountCharged, currency)} strong />
              <Row label="Valid until" value={formatDate(quote.quoteValidUntil)} />
              <Row label="Coupon allowed" value={quote.quoteAllowCoupon ? "Yes" : "No"} />
              <Separator />
              <FunnelRow icon={Send} label="Sent" value={formatDate(quote.quoteSentAt, true)} />
              <FunnelRow icon={Clock} label="Viewed" value={formatDate(quote.quoteViewedAt, true)} />
              <FunnelRow icon={CheckCircle2} label="Accepted" value={formatDate(quote.quoteAcceptedAt, true)} />
              {quote.quoteDeclinedAt && (
                <FunnelRow icon={XCircle} label="Declined" value={formatDate(quote.quoteDeclinedAt, true)} />
              )}
              {quote.quoteCreatedByName && <Row label="Created by" value={quote.quoteCreatedByName} />}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cancel dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this quote?</DialogTitle>
            <DialogDescription>
              The recipient will no longer be able to accept it. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Reason (optional)"
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              Keep quote
            </Button>
            <Button
              variant="destructive"
              disabled={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate(cancelReason.trim() || undefined)}
            >
              {cancelMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cancel quote"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? "font-bold" : ""}>{value}</span>
    </div>
  )
}

function FunnelRow({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <span className="text-xs">{value}</span>
    </div>
  )
}
