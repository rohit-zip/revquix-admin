/**
 * ─── ADMIN PAYMENTS VIEW ─────────────────────────────────────────────────────
 *
 * Admin panel to search and view all payment orders across all users.
 */

"use client"

import React from "react"
import { useRouter } from "nextjs-toploader/app"
import { Badge } from "@/components/ui/badge"
import {
  TableCell, TableRow,
} from "@/components/ui/table"
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip"
import { RefreshCw } from "lucide-react"

import { useGenericSearch } from "@/core/filters"
import type { FilterConfig } from "@/core/filters/filter.types"
import { DataExplorer, type DataColumn } from "@/components/data-explorer"
import { adminSearchPayments } from "./api/payment.api"
import type { PaymentOrderResponse, PaymentStatus } from "./api/payment.types"

// ─── Config ───────────────────────────────────────────────────────────────────

const PAYMENT_FILTER_CONFIG: FilterConfig = {
  searchableFields: [],
  filterFields: [
    {
      field: "status",
      label: "Status",
      type: "STRING",
      operators: ["EQUALS"],
      options: [
        { label: "Created", value: "CREATED" },
        { label: "Authorized", value: "AUTHORIZED" },
        { label: "Captured", value: "CAPTURED" },
        { label: "Failed", value: "FAILED" },
        { label: "Refund Initiated", value: "REFUND_INITIATED" },
        { label: "Refunded", value: "REFUNDED" },
        { label: "Partially Refunded", value: "PARTIALLY_REFUNDED" },
      ],
    },
    {
      field: "paymentContext",
      label: "Context",
      type: "STRING",
      operators: ["EQUALS"],
      options: [
        { label: "Mock Interview", value: "MOCK_INTERVIEW" },
        { label: "Resume Review", value: "RESUME_REVIEW" },
        { label: "Career Coaching", value: "CAREER_COACHING" },
      ],
    },
  ],
  rangeFilterFields: [
    { field: "createdAt", label: "Payment Date", type: "INSTANT" },
    { field: "capturedAt", label: "Captured Date", type: "INSTANT" },
  ],
  sortFields: [
    { field: "createdAt", label: "Payment Date" },
    { field: "status", label: "Status" },
  ],
  joinFilterFields: [],
  defaultSort: [{ field: "createdAt", direction: "DESC" }],
  defaultPageSize: 20,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPaymentBadge(status: PaymentStatus) {
  const map: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    CREATED: { variant: "secondary", label: "Created" },
    AUTHORIZED: { variant: "secondary", label: "Authorized" },
    CAPTURED: { variant: "default", label: "Paid" },
    FAILED: { variant: "destructive", label: "Failed" },
    REFUND_INITIATED: { variant: "outline", label: "Refund Initiated" },
    REFUNDED: { variant: "outline", label: "Refunded" },
    PARTIALLY_REFUNDED: { variant: "outline", label: "Partial Refund" },
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
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

// ─── Columns ──────────────────────────────────────────────────────────────────

const columns: DataColumn<PaymentOrderResponse>[] = [
  { key: "paymentOrderId", header: "Payment ID", sortable: false },
  { key: "razorpayOrderId", header: "Razorpay Order", sortable: false },
  { key: "paymentContext", header: "Context", sortable: false },
  { key: "amountMinor", header: "Amount", sortable: false },
  { key: "status", header: "Status", sortable: true },
  { key: "createdAt", header: "Date", sortable: true },
  { key: "actions", header: "Refund", sortable: false },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminPaymentsView() {
  const router = useRouter()
  const search = useGenericSearch<PaymentOrderResponse>({
    queryKey: "admin-payments",
    searchFn: adminSearchPayments,
    config: PAYMENT_FILTER_CONFIG,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">All Payments</h1>
        <p className="text-muted-foreground">View and search all platform payment orders.</p>
      </div>

      <DataExplorer
        search={search}
        columns={columns}
        renderRow={(payment) => (
          <TableRow
            key={payment.paymentOrderId}
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => router.push(`/admin/payments/${payment.paymentOrderId}`)}
          >
            <TableCell className="font-mono text-xs">{payment.paymentOrderId}</TableCell>
            <TableCell className="font-mono text-xs">
              {payment.razorpayOrderId ?? "—"}
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="text-xs">
                {payment.paymentContext.replace(/_/g, " ")}
              </Badge>
            </TableCell>
            <TableCell className="font-medium">
              <div>
                <p>{formatAmount(payment.amountMinor, payment.currency)}</p>
                {payment.discountAmountMinor && payment.discountAmountMinor > 0 && (
                  <p className="text-xs text-green-600">
                    -{formatAmount(payment.discountAmountMinor, payment.currency)} off
                  </p>
                )}
              </div>
            </TableCell>
            <TableCell>{getPaymentBadge(payment.status)}</TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {formatDate(payment.createdAt)}
            </TableCell>
            <TableCell>
              {payment.razorpayRefundId ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center gap-1 text-xs text-amber-600 cursor-default">
                      <RefreshCw className="h-3 w-3" />
                      {payment.refundAmountMinor != null && payment.refundAmountMinor > 0
                        ? formatAmount(payment.refundAmountMinor, payment.currency)
                        : payment.status === "REFUNDED" ? "Refunded" : "Initiated"}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {payment.refundAmountMinor != null && payment.refundAmountMinor > 0 && (
                      <p className="text-xs">Refund: {formatAmount(payment.refundAmountMinor, payment.currency)}</p>
                    )}
                    <p className="text-xs">Refund ID: {payment.razorpayRefundId}</p>
                    {payment.refundedAt && (
                      <p className="text-xs">Date: {formatDate(payment.refundedAt)}</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              ) : "—"}
            </TableCell>
          </TableRow>
        )}
      />
    </div>
  )
}



