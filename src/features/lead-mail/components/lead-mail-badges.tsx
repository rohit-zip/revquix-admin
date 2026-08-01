"use client"

/**
 * Shared status badges for the lead-mail surfaces.
 *
 * Extracted so the campaign list and the campaign detail view cannot disagree about what a status
 * looks like or is called. Two independent copies of a nine-arm status switch is how one of them ends
 * up missing INTERRUPTED and silently renders it as "Sending".
 */

import {
  Ban,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  MinusCircle,
  PauseCircle,
  PlugZap,
  XCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { LEAD_MAIL_CAMPAIGN_STATUS, LEAD_MAIL_DELIVERY_STATUS } from "../api/lead-mail.types"

const EMERALD = "gap-1 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
const AMBER = "gap-1 border-amber-500/30 text-amber-600 dark:text-amber-400"
const MUTED = "gap-1 border-muted-foreground/30 text-muted-foreground"

export function CampaignStatusBadge({ status }: { status: string }) {
  switch (status) {
    case LEAD_MAIL_CAMPAIGN_STATUS.DRAFT:
      return (
        <Badge variant="outline" className={MUTED}>
          <FileText className="size-3" /> Draft
        </Badge>
      )
    case LEAD_MAIL_CAMPAIGN_STATUS.QUEUED:
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="size-3" /> Queued
        </Badge>
      )
    case LEAD_MAIL_CAMPAIGN_STATUS.COMPLETED:
      return (
        <Badge variant="outline" className={EMERALD}>
          <CheckCircle2 className="size-3" /> Completed
        </Badge>
      )
    case LEAD_MAIL_CAMPAIGN_STATUS.PARTIAL_FAILURE:
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="size-3" /> Partial Failure
        </Badge>
      )
    case LEAD_MAIL_CAMPAIGN_STATUS.CANCELLED:
      return (
        <Badge variant="outline" className={MUTED}>
          <Ban className="size-3" /> Cancelled
        </Badge>
      )
    case LEAD_MAIL_CAMPAIGN_STATUS.INTERRUPTED:
      return (
        <Badge variant="outline" className={AMBER}>
          <PlugZap className="size-3" /> Interrupted
        </Badge>
      )
    case LEAD_MAIL_CAMPAIGN_STATUS.PAUSED:
      return (
        <Badge variant="outline" className={AMBER}>
          <PauseCircle className="size-3" /> Paused
        </Badge>
      )
    default:
      // SENDING, and the legacy IN_PROGRESS still carried by pre-V2 rows.
      return (
        <Badge variant="secondary" className="gap-1">
          <Loader2 className="size-3 animate-spin" /> Sending
        </Badge>
      )
  }
}

export function DeliveryStatusBadge({ status }: { status: string }) {
  switch (status) {
    case LEAD_MAIL_DELIVERY_STATUS.SENT:
      return (
        <Badge variant="outline" className={EMERALD}>
          <CheckCircle2 className="size-3" /> Sent
        </Badge>
      )
    case LEAD_MAIL_DELIVERY_STATUS.FAILED:
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="size-3" /> Failed
        </Badge>
      )
    // Neutral, never an error colour: a skip is a deliberate exclusion (unsubscribed, or no name for
    // a {{name}} send), not a delivery problem.
    case LEAD_MAIL_DELIVERY_STATUS.SKIPPED:
      return (
        <Badge variant="outline" className={MUTED}>
          <MinusCircle className="size-3" /> Skipped
        </Badge>
      )
    case LEAD_MAIL_DELIVERY_STATUS.SENDING:
      return (
        <Badge variant="secondary" className="gap-1">
          <Loader2 className="size-3 animate-spin" /> Sending
        </Badge>
      )
    default:
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="size-3" /> Pending
        </Badge>
      )
  }
}

/** Operator-facing wording for each skip reason. */
export const SKIP_REASON_LABELS: Record<string, string> = {
  UNSUBSCRIBED: "Unsubscribed",
  MISSING_NAME: "No name on file",
  SUPPRESSED_BOUNCE: "Previously bounced",
  SUPPRESSED_COMPLAINT: "Previously reported as spam",
  MANUAL: "Removed before sending",
  INVALID_EMAIL: "Invalid email address",
}

/** Shared date formatter, so both tables render timestamps identically. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
