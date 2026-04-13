/**
 * ─── ADMIN PAYMENT DETAIL VIEW ────────────────────────────────────────────────
 *
 * Admin detail page for a single payment order.
 * Shows everything the user sees + payer info, Razorpay fee/tax breakdown,
 * granular method details (card network/issuer, UPI VPA, bank, wallet),
 * and all Razorpay reference IDs needed for manual refunds.
 *
 * Route: /admin/payments/[paymentOrderId]
 */

"use client"

import React from "react"
import { useRouter } from "nextjs-toploader/app"
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Hash,
  IndianRupee,
  Mail,
  Phone,
  Printer,
  Receipt,
  RefreshCw,
  Shield,
  Smartphone,
  Tag,
  User,
  Wallet,
  XCircle,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { useAdminPaymentDetail } from "./api/payment.hooks"
import type { PaymentOrderResponse, PaymentStatus } from "./api/payment.types"
import PaymentInvoice from "./payment-invoice"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  })
}

function formatAmount(minor: number, currency: string) {
  if (currency === "INR") return `₹${(minor / 100).toLocaleString("en-IN")}`
  return `$${(minor / 100).toFixed(2)}`
}

function getStatusConfig(status: PaymentStatus) {
  const map: Record<string, { label: string; icon: React.ReactNode; badgeCls: string }> = {
    CREATED: {
      label: "Created",
      icon: <Clock className="h-4 w-4 text-muted-foreground" />,
      badgeCls: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    },
    AUTHORIZED: {
      label: "Authorized",
      icon: <CheckCircle2 className="h-4 w-4 text-blue-500" />,
      badgeCls: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    },
    CAPTURED: {
      label: "Paid",
      icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
      badgeCls: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    },
    FAILED: {
      label: "Failed",
      icon: <XCircle className="h-4 w-4 text-destructive" />,
      badgeCls: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    },
    REFUND_INITIATED: {
      label: "Refund Initiated",
      icon: <RefreshCw className="h-4 w-4 text-amber-500" />,
      badgeCls: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
    },
    REFUNDED: {
      label: "Refunded",
      icon: <RefreshCw className="h-4 w-4 text-blue-500" />,
      badgeCls: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    },
    PARTIALLY_REFUNDED: {
      label: "Partially Refunded",
      icon: <RefreshCw className="h-4 w-4 text-amber-500" />,
      badgeCls: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
    },
  }
  return map[status] ?? {
    label: status,
    icon: <Clock className="h-4 w-4 text-muted-foreground" />,
    badgeCls: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  }
}

function getPaymentMethodIcon(method: string | null) {
  switch (method) {
    case "upi": return <Smartphone className="h-5 w-5 text-purple-500" />
    case "card": return <CreditCard className="h-5 w-5 text-blue-500" />
    case "netbanking": return <Banknote className="h-5 w-5 text-green-500" />
    case "wallet": return <Wallet className="h-5 w-5 text-orange-500" />
    case "emi": return <IndianRupee className="h-5 w-5 text-indigo-500" />
    default: return <CreditCard className="h-5 w-5 text-muted-foreground" />
  }
}

function getPaymentMethodLabel(method: string | null) {
  const map: Record<string, string> = {
    upi: "UPI", card: "Card", netbanking: "Net Banking", wallet: "Wallet", emi: "EMI",
  }
  return method ? (map[method] ?? method) : "Not Available"
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false)
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => {
          navigator.clipboard.writeText(text)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        }}>
          {copied ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent><p className="text-xs">{copied ? "Copied!" : "Copy to clipboard"}</p></TooltipContent>
    </Tooltip>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-9 rounded-md" />
        <div className="space-y-2"><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-72" /></div>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <Skeleton className="h-32 rounded-lg" /><Skeleton className="h-32 rounded-lg" /><Skeleton className="h-32 rounded-lg" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-72 rounded-lg" /><Skeleton className="h-72 rounded-lg" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-48 rounded-lg" /><Skeleton className="h-48 rounded-lg" />
      </div>
    </div>
  )
}

function DetailField({ label, value, mono = false, copyable = false }: {
  label: string; value: React.ReactNode; mono?: boolean; copyable?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <div className="flex items-center gap-1 text-right min-w-0">
        <span className={`text-sm break-all ${mono ? "font-mono text-xs" : ""}`}>{value ?? "—"}</span>
        {copyable && typeof value === "string" && value !== "—" && <CopyButton text={value} />}
      </div>
    </div>
  )
}

// ─── Method Detail Card ───────────────────────────────────────────────────────

function MethodDetailCard({ payment }: { payment: PaymentOrderResponse }) {
  const { paymentMethod } = payment
  if (!paymentMethod) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {getPaymentMethodIcon(paymentMethod)}
          {getPaymentMethodLabel(paymentMethod)} Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <DetailField label="Method" value={getPaymentMethodLabel(paymentMethod)} />
        {payment.paymentMethodDetail && (
          <><Separator /><DetailField label="Summary" value={payment.paymentMethodDetail} /></>
        )}
        {paymentMethod === "upi" && payment.upiVpa && (
          <><Separator /><DetailField label="UPI VPA" value={payment.upiVpa} mono copyable /></>
        )}
        {paymentMethod === "card" && (
          <>
            {payment.cardNetwork && (<><Separator /><DetailField label="Network" value={payment.cardNetwork} /></>)}
            {payment.cardType && (<><Separator /><DetailField label="Type" value={payment.cardType} /></>)}
            {payment.cardLast4 && (<><Separator /><DetailField label="Last 4 Digits" value={`•••• ${payment.cardLast4}`} mono /></>)}
            {payment.cardIssuer && (<><Separator /><DetailField label="Issuer" value={payment.cardIssuer} /></>)}
          </>
        )}
        {paymentMethod === "netbanking" && payment.bankName && (
          <><Separator /><DetailField label="Bank" value={payment.bankName} /></>
        )}
        {paymentMethod === "wallet" && payment.walletName && (
          <><Separator /><DetailField label="Wallet" value={payment.walletName} /></>
        )}
        {paymentMethod === "emi" && payment.bankName && (
          <><Separator /><DetailField label="Bank" value={payment.bankName} /></>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface AdminPaymentDetailViewProps {
  paymentOrderId: string
}

export default function AdminPaymentDetailView({ paymentOrderId }: AdminPaymentDetailViewProps) {
  const router = useRouter()
  const { data: payment, isLoading, isError, error } = useAdminPaymentDetail(paymentOrderId)

  if (isLoading) return <DetailSkeleton />

  if (isError || !payment) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" className="gap-2" onClick={() => router.push("/admin/payments")}>
          <ArrowLeft className="h-4 w-4" /> Back to All Payments
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive/50 mb-4" />
            <h2 className="text-lg font-semibold">Payment Not Found</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {error instanceof Error ? error.message : `Could not load payment ${paymentOrderId}`}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statusConfig = getStatusConfig(payment.status)
  const hasRefund = payment.status === "REFUNDED" || payment.status === "REFUND_INITIATED" || payment.status === "PARTIALLY_REFUNDED"
  const hasDiscount = payment.discountAmountMinor && payment.discountAmountMinor > 0
  const showInvoice = payment.status === "CAPTURED" || hasRefund

  return (
    <PaymentInvoice payment={payment}>
      {(printInvoice) => (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="gap-2" onClick={() => router.push("/admin/payments")}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Payment Details</h1>
              <Badge variant="secondary" className="gap-1 text-xs">
                <Shield className="h-3 w-3" /> Admin
              </Badge>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig.badgeCls}`}>
                {statusConfig.icon} {statusConfig.label}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5 font-mono">{payment.paymentOrderId}</p>
          </div>
        </div>
        {showInvoice && (
          <Button variant="outline" size="sm" className="gap-2" onClick={printInvoice}>
            <Printer className="h-4 w-4" /> Print Invoice
          </Button>
        )}
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
              <IndianRupee className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className="text-2xl font-bold">{formatAmount(payment.amountMinor, payment.currency)}</p>
              {hasDiscount && <p className="text-xs text-green-600">Discount: -{formatAmount(payment.discountAmountMinor!, payment.currency)}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
              {getPaymentMethodIcon(payment.paymentMethod)}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payment Method</p>
              <p className="text-lg font-semibold">{getPaymentMethodLabel(payment.paymentMethod)}</p>
              {payment.paymentMethodDetail && <p className="text-xs text-muted-foreground truncate max-w-45">{payment.paymentMethodDetail}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              {statusConfig.icon}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="text-lg font-semibold">{statusConfig.label}</p>
              <p className="text-xs text-muted-foreground">{formatDateTime(payment.createdAt)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Detail Cards Row 1: Order Info + Pricing ── */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><Receipt className="h-4 w-4" /> Order Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <DetailField label="Order ID" value={payment.paymentOrderId} mono copyable />
            <Separator />
            <DetailField label="Razorpay Order ID" value={payment.razorpayOrderId ?? "—"} mono copyable={!!payment.razorpayOrderId} />
            <Separator />
            <DetailField label="Razorpay Payment ID" value={payment.razorpayPaymentId ?? "—"} mono copyable={!!payment.razorpayPaymentId} />
            <Separator />
            <DetailField label="Payment Context" value={<Badge variant="outline" className="text-xs">{payment.paymentContext.replace(/_/g, " ")}</Badge>} />
            <Separator />
            <DetailField label="Booking ID" value={payment.contextEntityId} mono copyable />
            <Separator />
            <DetailField label="Currency" value={payment.currency} />
            {payment.razorpayRefundId && (
              <><Separator /><DetailField label="Refund ID" value={payment.razorpayRefundId} mono copyable /></>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><Tag className="h-4 w-4" /> Pricing &amp; Fees</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <DetailField label="Gross Amount" value={<span className="font-semibold">{formatAmount(payment.amountMinor, payment.currency)}</span>} />
            <Separator />
            {hasDiscount ? (
              <>
                <DetailField label="Discount" value={<span className="text-green-600 font-medium">-{formatAmount(payment.discountAmountMinor!, payment.currency)}</span>} />
                <Separator />
                <DetailField label="Coupon" value={<Badge variant="secondary" className="text-xs font-mono">{payment.appliedCouponCode}</Badge>} />
                <Separator />
              </>
            ) : (
              <><DetailField label="Discount" value="None" /><Separator /></>
            )}
            <DetailField
              label="Razorpay Fee"
              value={payment.razorpayFee != null && payment.razorpayFee > 0 ? formatAmount(payment.razorpayFee, payment.currency) : "—"}
            />
            <Separator />
            <DetailField
              label="Tax (GST on Fee)"
              value={payment.razorpayTax != null && payment.razorpayTax > 0 ? formatAmount(payment.razorpayTax, payment.currency) : "—"}
            />
            {payment.razorpayFee != null && payment.razorpayFee > 0 && (
              <>
                <Separator />
                <DetailField
                  label="Net Settlement"
                  value={<span className="font-semibold">{formatAmount(payment.amountMinor - payment.razorpayFee, payment.currency)}</span>}
                />
              </>
            )}
            {payment.failureReason && (
              <>
                <Separator />
                <div className="py-2">
                  <p className="text-sm text-muted-foreground mb-2">Failure Reason</p>
                  <pre className="text-xs bg-destructive/10 text-destructive p-3 rounded-md overflow-auto max-h-32 whitespace-pre-wrap break-all">{payment.failureReason}</pre>
                </div>
              </>
            )}
            {/* Refund details */}
            {hasRefund && (
              <>
                <Separator />
                <DetailField
                  label="Refund Amount"
                  value={
                    payment.refundAmountMinor != null && payment.refundAmountMinor > 0 ? (
                      <span className="font-semibold text-amber-600">
                        {formatAmount(payment.refundAmountMinor, payment.currency)}
                      </span>
                    ) : (
                      "Processing…"
                    )
                  }
                />
                {payment.refundAmountMinor != null && payment.amountMinor > 0 && payment.refundAmountMinor < payment.amountMinor && (
                  <>
                    <Separator />
                    <DetailField
                      label="Refund %"
                      value={`${Math.round((payment.refundAmountMinor / payment.amountMinor) * 100)}% of paid amount`}
                    />
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Detail Cards Row 2: Payer Info + Method Details ── */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><User className="h-4 w-4" /> Payer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {payment.userName && (
              <><DetailField
                label="User Name"
                value={payment.userName}
              /><Separator /></>
            )}
            {payment.userEmail && (
              <><DetailField
                label="User Email"
                value={<span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-muted-foreground" />{payment.userEmail}</span>}
                copyable
              /><Separator /></>
            )}
            <DetailField
              label="Payer Email"
              value={payment.payerEmail ? (
                <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-muted-foreground" />{payment.payerEmail}</span>
              ) : "—"}
              copyable={!!payment.payerEmail}
            />
            <Separator />
            <DetailField
              label="Contact"
              value={payment.payerContact ? (
                <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-muted-foreground" />{payment.payerContact}</span>
              ) : "—"}
              copyable={!!payment.payerContact}
            />
          </CardContent>
        </Card>

        <MethodDetailCard payment={payment} />
      </div>

      {/* ── Timeline ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><Calendar className="h-4 w-4" /> Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative pl-6">
            <TimelineItem icon={<Hash className="h-3.5 w-3.5" />} label="Order Created" timestamp={formatDateTime(payment.createdAt)} isActive />
            {payment.capturedAt && (
              <TimelineItem icon={<CheckCircle2 className="h-3.5 w-3.5 text-green-500" />} label="Payment Captured" timestamp={formatDateTime(payment.capturedAt)} isActive />
            )}
            {payment.failedAt && (
              <TimelineItem icon={<XCircle className="h-3.5 w-3.5 text-destructive" />} label="Payment Failed" timestamp={formatDateTime(payment.failedAt)} isActive description={payment.failureReason ?? undefined} />
            )}
            {hasRefund && (
              <TimelineItem
                icon={<RefreshCw className="h-3.5 w-3.5 text-amber-500" />}
                label={payment.status === "REFUNDED" ? "Refund Completed" : payment.status === "REFUND_INITIATED" ? "Refund Initiated" : "Partially Refunded"}
                timestamp={formatDateTime(payment.refundedAt)}
                isActive
                description={[
                  payment.refundAmountMinor != null && payment.refundAmountMinor > 0
                    ? `Amount: ${formatAmount(payment.refundAmountMinor, payment.currency)}`
                    : null,
                  payment.razorpayRefundId
                    ? `Refund ID: ${payment.razorpayRefundId}`
                    : null,
                ].filter(Boolean).join(" · ") || undefined}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
      )}
    </PaymentInvoice>
  )
}

// ─── Timeline Item ────────────────────────────────────────────────────────────

function TimelineItem({ icon, label, timestamp, isActive, description }: {
  icon: React.ReactNode; label: string; timestamp: string; isActive?: boolean; description?: string
}) {
  return (
    <div className="relative pb-6 last:pb-0">
      <div className="absolute -left-6 top-0 flex h-full w-6 items-start justify-center">
        <div className="h-full w-px bg-border last:hidden" />
      </div>
      <div className="absolute -left-8.25 top-1 flex h-5 w-5 items-center justify-center rounded-full border bg-background">
        {icon}
      </div>
      <div className={isActive ? "" : "opacity-50"}>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{timestamp}</p>
        {description && <p className="text-xs text-muted-foreground mt-1 font-mono break-all">{description}</p>}
      </div>
    </div>
  )
}

