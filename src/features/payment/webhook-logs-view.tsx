/**
 * ─── WEBHOOK LOGS VIEW ───────────────────────────────────────────────────────
 *
 * Admin panel showing all Razorpay webhook event logs with processing status.
 * Uses GenericFilterResponse for filtering, searching, and pagination.
 * Clicking a row navigates to the detail page: /admin/webhooks/[id]
 */

"use client"

import React from "react"
import { useRouter } from "nextjs-toploader/app"
import { AlertCircle, CheckCircle2, Clock, ExternalLink } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  TableCell, TableRow,
} from "@/components/ui/table"
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip"

import { DataExplorer, type DataColumn } from "@/components/data-explorer"
import { useWebhookLogsSearch } from "./api/payment.hooks"
import type { PaymentWebhookLogResponse } from "./api/payment.types"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  })
}

function getEventTypeBadge(eventType: string) {
  const map: Record<string, string> = {
    "payment.captured": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    "payment.failed": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    "payment.authorized": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    "refund.created": "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
    "refund.processed": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  }
  const cls = map[eventType] ?? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {eventType}
    </span>
  )
}

// ─── Columns ──────────────────────────────────────────────────────────────────

const columns: DataColumn<PaymentWebhookLogResponse>[] = [
  { key: "id", header: "#", sortable: false },
  { key: "eventType", header: "Event Type", sortable: true },
  { key: "razorpayOrderId", header: "Order ID", sortable: false },
  { key: "razorpayPaymentId", header: "Payment ID", sortable: false },
  { key: "isProcessed", header: "Status", sortable: false },
  { key: "attemptCount", header: "Attempts", sortable: true },
  { key: "createdAt", header: "Received At", sortable: true },
  { key: "actions", header: "", sortable: false },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function WebhookLogsView() {
  const search = useWebhookLogsSearch()
  const router = useRouter()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Webhook Logs</h1>
        <p className="text-muted-foreground">
          All Razorpay webhook events received by the platform.
        </p>
      </div>

      <DataExplorer
        search={search}
        columns={columns}
        renderRow={(log) => (
          <TableRow
            key={log.id}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => router.push(`/admin/webhooks/${log.id}`)}
          >
            <TableCell className="text-xs text-muted-foreground">{log.id}</TableCell>
            <TableCell>{getEventTypeBadge(log.eventType)}</TableCell>
            <TableCell className="font-mono text-xs">
              {log.razorpayOrderId ?? "—"}
            </TableCell>
            <TableCell className="font-mono text-xs">
              {log.razorpayPaymentId ?? "—"}
            </TableCell>
            <TableCell>
              {log.isProcessed ? (
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle2 className="h-3 w-3" /> Processed
                </span>
              ) : log.processingError ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center gap-1 text-xs text-destructive cursor-default">
                      <AlertCircle className="h-3 w-3" /> Error
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs wrap-break-word">{log.processingError}</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" /> Pending
                </span>
              )}
            </TableCell>
            <TableCell>
              <Badge variant={log.attemptCount > 0 ? "destructive" : "outline"} className="text-xs">
                {log.attemptCount}
              </Badge>
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {formatDate(log.createdAt)}
            </TableCell>
            <TableCell>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(`/admin/webhooks/${log.id}`)
                }}
              >
                <ExternalLink className="mr-1 h-3 w-3" />
                Details
              </Button>
            </TableCell>
          </TableRow>
        )}
      />
    </div>
  )
}
