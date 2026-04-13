/**
 * ─── WEBHOOK LOG DETAIL VIEW ─────────────────────────────────────────────────
 *
 * Detail page for a single webhook log entry.
 * Shows all metadata fields + the raw JSON payload in a formatted view.
 *
 * Route: /admin/webhooks/[id]
 */

"use client"

import React from "react"
import { useRouter } from "nextjs-toploader/app"
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  Hash,
  RefreshCw,
  Tag,
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

import { useWebhookLogById } from "./api/payment.hooks"

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

function getEventTypeBadgeClass(eventType: string): string {
  const map: Record<string, string> = {
    "payment.captured":
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    "payment.failed":
      "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    "payment.authorized":
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    "refund.created":
      "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
    "refund.processed":
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  }
  return (
    map[eventType] ??
    "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false)
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => {
            navigator.clipboard.writeText(text)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          }}
        >
          {copied ? (
            <CheckCircle2 className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">{copied ? "Copied!" : "Copy to clipboard"}</p>
      </TooltipContent>
    </Tooltip>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-9 rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
      <Skeleton className="h-96 rounded-lg" />
    </div>
  )
}

// ─── Detail field row ─────────────────────────────────────────────────────────

function DetailField({
  label,
  value,
  mono = false,
  copyable = false,
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
  copyable?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <div className="flex items-center gap-1 text-right min-w-0">
        <span
          className={`text-sm break-all ${mono ? "font-mono text-xs" : ""}`}
        >
          {value ?? "—"}
        </span>
        {copyable && typeof value === "string" && value !== "—" && (
          <CopyButton text={value} />
        )}
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface WebhookLogDetailViewProps {
  id: number
}

export default function WebhookLogDetailView({ id }: WebhookLogDetailViewProps) {
  const router = useRouter()
  const { data: log, isLoading, isError, error } = useWebhookLogById(id)

  // Try to pretty-print the raw JSON payload
  const formattedPayload = (() => {
    if (!log?.rawPayload) return null
    try {
      return JSON.stringify(JSON.parse(log.rawPayload), null, 2)
    } catch {
      // If it's not valid JSON, return as-is
      return log.rawPayload
    }
  })()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <DetailSkeleton />
      </div>
    )
  }

  if (isError || !log) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => router.push("/admin/webhooks")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Webhook Logs
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive/50 mb-4" />
            <h2 className="text-lg font-semibold">Webhook Log Not Found</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {error instanceof Error
                ? error.message
                : `Could not load webhook log #${id}`}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statusInfo = log.isProcessed
    ? {
        label: "Processed",
        icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
        variant: "default" as const,
        badgeCls:
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      }
    : log.processingError
      ? {
          label: "Error",
          icon: <AlertCircle className="h-4 w-4 text-destructive" />,
          variant: "destructive" as const,
          badgeCls:
            "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
        }
      : {
          label: "Pending",
          icon: <Clock className="h-4 w-4 text-muted-foreground" />,
          variant: "outline" as const,
          badgeCls:
            "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
        }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => router.push("/admin/webhooks")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Webhook Log #{log.id}</h1>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.badgeCls}`}
              >
                {statusInfo.icon}
                {statusInfo.label}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Received {formatDateTime(log.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Info Cards ── */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Event Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Tag className="h-4 w-4" />
              Event Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <DetailField label="ID" value={String(log.id)} mono />
            <Separator />
            <DetailField
              label="Event ID"
              value={log.eventId}
              mono
              copyable
            />
            <Separator />
            <DetailField
              label="Event Type"
              value={
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getEventTypeBadgeClass(log.eventType)}`}
                >
                  {log.eventType}
                </span>
              }
            />
            <Separator />
            <DetailField
              label="Razorpay Order ID"
              value={log.razorpayOrderId ?? "—"}
              mono
              copyable={!!log.razorpayOrderId}
            />
            <Separator />
            <DetailField
              label="Razorpay Payment ID"
              value={log.razorpayPaymentId ?? "—"}
              mono
              copyable={!!log.razorpayPaymentId}
            />
          </CardContent>
        </Card>

        {/* Processing Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <RefreshCw className="h-4 w-4" />
              Processing Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <DetailField
              label="Status"
              value={
                <span className="flex items-center gap-1.5">
                  {statusInfo.icon}
                  <span className="text-sm font-medium">
                    {statusInfo.label}
                  </span>
                </span>
              }
            />
            <Separator />
            <DetailField
              label="Attempt Count"
              value={
                <Badge
                  variant={
                    log.attemptCount > 0 ? "destructive" : "outline"
                  }
                  className="text-xs"
                >
                  {log.attemptCount}
                </Badge>
              }
            />
            <Separator />
            <div className="flex items-start justify-between gap-4 py-2">
              <span className="text-sm text-muted-foreground shrink-0 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Received At
              </span>
              <span className="text-sm text-right">
                {formatDateTime(log.createdAt)}
              </span>
            </div>
            <Separator />
            <div className="flex items-start justify-between gap-4 py-2">
              <span className="text-sm text-muted-foreground shrink-0 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Last Updated
              </span>
              <span className="text-sm text-right">
                {formatDateTime(log.updatedAt)}
              </span>
            </div>
            {log.processingError && (
              <>
                <Separator />
                <div className="py-2">
                  <p className="text-sm text-muted-foreground mb-2">
                    Processing Error
                  </p>
                  <pre className="text-xs bg-destructive/10 text-destructive p-3 rounded-md overflow-auto max-h-40 whitespace-pre-wrap break-all">
                    {log.processingError}
                  </pre>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Raw JSON Payload ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Hash className="h-4 w-4" />
              Raw Webhook Payload
            </CardTitle>
            {formattedPayload && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-xs"
                onClick={() =>
                  navigator.clipboard.writeText(formattedPayload)
                }
              >
                <Copy className="h-3 w-3" />
                Copy JSON
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {formattedPayload ? (
            <pre className="text-xs bg-muted/50 border rounded-lg p-4 overflow-auto max-h-150 whitespace-pre font-mono leading-relaxed">
              {formattedPayload}
            </pre>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No raw payload available for this webhook event.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}




