"use client"

/**
 * LeadMailCampaignDetailView — send report for a single Admin Lead Mailer campaign.
 *
 * Polls GET /campaigns/{id} every 3s while the campaign is still IN_PROGRESS
 * (sentCount + failedCount < recipientCount), and stops polling once it reaches
 * a terminal status (COMPLETED / PARTIAL_FAILURE).
 */

import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useLeadMailCampaign } from "./api/lead-mail.hooks"
import { LEAD_MAIL_CAMPAIGN_STATUS, LEAD_MAIL_DELIVERY_STATUS } from "./api/lead-mail.types"

const POLL_INTERVAL_MS = 3000

function formatDateTime(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function CampaignStatusBadge({ status }: { status: string }) {
  if (status === LEAD_MAIL_CAMPAIGN_STATUS.COMPLETED) {
    return (
      <Badge variant="outline" className="gap-1 border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="size-3" /> Completed
      </Badge>
    )
  }
  if (status === LEAD_MAIL_CAMPAIGN_STATUS.PARTIAL_FAILURE) {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="size-3" /> Partial Failure
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="gap-1">
      <Clock className="size-3" /> In Progress
    </Badge>
  )
}

function DeliveryStatusBadge({ status }: { status: string }) {
  if (status === LEAD_MAIL_DELIVERY_STATUS.SENT) {
    return (
      <Badge variant="outline" className="gap-1 border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="size-3" /> Sent
      </Badge>
    )
  }
  if (status === LEAD_MAIL_DELIVERY_STATUS.FAILED) {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="size-3" /> Failed
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="gap-1">
      <Loader2 className="size-3 animate-spin" /> Pending
    </Badge>
  )
}

export function LeadMailCampaignDetailView({ campaignId }: { campaignId: string }) {
  // Poll only while the send is still in progress — a fixed interval is simpler
  // than TanStack Query's dynamic-refetchInterval callback and sufficient for the
  // MVP's small-batch send volumes.
  const { data, isLoading } = useLeadMailCampaign(campaignId, { refetchInterval: POLL_INTERVAL_MS })

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const completedCount = data.sentCount + data.failedCount
  const progressPct = data.recipientCount > 0 ? Math.round((completedCount / data.recipientCount) * 100) : 0
  const isInProgress = data.status === LEAD_MAIL_CAMPAIGN_STATUS.IN_PROGRESS

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle>{data.subject}</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Sent {formatDateTime(data.createdAt)} · from {data.fromPrefix}@revquix.com
              </p>
            </div>
            <CampaignStatusBadge status={data.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="rounded-md border p-3">
              <p className="text-2xl font-semibold">{data.recipientCount}</p>
              <p className="text-xs text-muted-foreground">Recipients</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{data.sentCount}</p>
              <p className="text-xs text-muted-foreground">Sent</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-2xl font-semibold text-rose-600 dark:text-rose-400">{data.failedCount}</p>
              <p className="text-xs text-muted-foreground">Failed</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{isInProgress ? "Sending…" : "Done"}</span>
              <span>
                {completedCount} / {data.recipientCount}
              </span>
            </div>
            <Progress value={progressPct} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Send Report</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent At</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recipients.map((recipient) => (
                <TableRow key={recipient.leadMailRecipientId}>
                  <TableCell>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{recipient.name ?? "—"}</p>
                      <p className="truncate text-xs text-muted-foreground">{recipient.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DeliveryStatusBadge status={recipient.deliveryStatus} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDateTime(recipient.sentAt)}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-xs text-rose-500" title={recipient.errorMessage ?? undefined}>
                    {recipient.errorMessage ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
