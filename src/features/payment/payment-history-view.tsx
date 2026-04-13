/**
 * ─── PAYMENT HISTORY VIEW ────────────────────────────────────────────────────
 *
 * User's payment history with status badges, amount formatting, and refund info.
 */

"use client"

import React from "react"
import { useRouter } from "nextjs-toploader/app"
import { CreditCard, RefreshCw } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip"

import { usePaymentHistory } from "./api/payment.hooks"
import type { PaymentStatus } from "./api/payment.types"

function getPaymentBadge(status: PaymentStatus) {
  const map: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    CREATED: { variant: "secondary", label: "Created" },
    AUTHORIZED: { variant: "secondary", label: "Authorized" },
    CAPTURED: { variant: "default", label: "Paid" },
    FAILED: { variant: "destructive", label: "Failed" },
    REFUND_INITIATED: { variant: "outline", label: "Refund Initiated" },
    REFUNDED: { variant: "outline", label: "Refunded" },
    PARTIALLY_REFUNDED: { variant: "outline", label: "Partially Refunded" },
  }
  const info = map[status] ?? { variant: "outline", label: status }
  return <Badge variant={info.variant}>{info.label}</Badge>
}

function formatAmount(minor: number, currency: string) {
  if (currency === "INR") return `₹${(minor / 100).toLocaleString("en-IN")}`
  return `$${(minor / 100).toFixed(2)}`
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
  })
}

export default function PaymentHistoryView() {
  const { data: payments, isLoading } = usePaymentHistory()
  const router = useRouter()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payment History</h1>
        <p className="text-muted-foreground">View all your payment transactions and refund statuses.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Context</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Refund</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !payments?.length ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    <CreditCard className="mx-auto mb-2 h-8 w-8 opacity-50" />
                    <p className="text-sm">No payment transactions yet.</p>
                    <p className="text-xs mt-1">Payments will appear here after you book a mock interview.</p>
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((p) => (
                  <TableRow
                    key={p.paymentOrderId}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => router.push(`/payments/history/${p.paymentOrderId}`)}
                  >
                    <TableCell className="font-mono text-xs">
                      {p.razorpayOrderId ?? p.paymentOrderId}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {p.paymentContext.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatAmount(p.amountMinor, p.currency)}
                    </TableCell>
                    <TableCell>
                      {p.discountAmountMinor && p.discountAmountMinor > 0
                        ? <span className="text-green-600">-{formatAmount(p.discountAmountMinor, p.currency)}</span>
                        : "—"}
                    </TableCell>
                    <TableCell>{getPaymentBadge(p.status)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(p.createdAt)}
                    </TableCell>
                    <TableCell>
                      {(p.status === "REFUNDED" || p.status === "REFUND_INITIATED" || p.status === "PARTIALLY_REFUNDED") ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex items-center gap-1 text-xs text-amber-600 cursor-default">
                              <RefreshCw className="h-3 w-3" />
                              {p.refundAmountMinor != null && p.refundAmountMinor > 0
                                ? formatAmount(p.refundAmountMinor, p.currency)
                                : p.status === "REFUNDED" ? "Refunded" : p.status === "REFUND_INITIATED" ? "Processing" : "Partial"}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {p.refundAmountMinor != null && p.refundAmountMinor > 0 && (
                              <p className="text-xs">Refund: {formatAmount(p.refundAmountMinor, p.currency)}</p>
                            )}
                            {p.razorpayRefundId && <p className="text-xs">Refund ID: {p.razorpayRefundId}</p>}
                            {p.refundedAt && <p className="text-xs">Refunded: {formatDate(p.refundedAt)}</p>}
                          </TooltipContent>
                        </Tooltip>
                      ) : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
