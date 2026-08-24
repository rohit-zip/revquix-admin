"use client"

/**
 * ─── FIRST-RESPONSE SLA ──────────────────────────────────────────────────────
 *
 * Phase 4 §7 of `docs/HELP_AND_SUPPORT_MASTER_PLAN.md`.
 *
 * `first_responded_at` has been stamped correctly for as long as the contact form has existed, and
 * nothing has ever read it — while `/contact` publishes *"we aim to respond to all messages within
 * 24 business hours"*. This card is the difference between making that claim and being able to
 * check it.
 *
 * ── Median and p90, never the mean ───────────────────────────────────────────
 *
 * One ticket answered a week late drags an average far enough to make a good week look bad and a
 * bad week look survivable. The median is what a typical person waited; p90 is what the unlucky
 * tail waited. A promise is kept or broken by those two.
 *
 * ── "—" is not zero ──────────────────────────────────────────────────────────
 *
 * A null median means nothing in the window was answered, which is a very different statement from
 * "answered instantly". It renders as an em dash and never as a good number.
 *
 * ── The target is stricter than the promise, on purpose ──────────────────────
 *
 * The page says "business hours"; this measures clock hours. Green here is therefore unambiguously
 * a promise kept. The footnote says so, because a number whose definition lives only in a docblock
 * is a number somebody will eventually quote wrong.
 */

import { AlertTriangle, Clock, Inbox, Timer } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

import { useSupportSlaSummary } from "./api/contact.hooks"
import {
  SLA_BUCKET_LABELS,
  formatDuration,
  type SupportSlaMetrics,
} from "./api/contact.types"

export function SlaSummaryCard() {
  const { data, isLoading, isError } = useSupportSlaSummary()

  // No red panel: this is a report sitting above the queue, and the queue is the job. A failed
  // report should not look like a failed inbox.
  if (isError) return null

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  const all = data?.buckets.find((b) => b.bucket === "ALL")
  if (!data || !all) return null

  const sources = data.buckets.filter((b) => b.bucket !== "ALL")
  const breaching = all.breachedOpen > 0

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          icon={<Timer className="h-4 w-4" />}
          label="Median first reply"
          value={formatDuration(all.medianMinutes)}
          hint={`${all.respondedCount} of ${all.ticketCount} answered`}
        />
        <Metric
          icon={<Clock className="h-4 w-4" />}
          label="p90 first reply"
          value={formatDuration(all.p90Minutes)}
          hint="What the slowest tenth waited"
        />
        <Metric
          icon={<Inbox className="h-4 w-4" />}
          label="Waiting on us"
          value={String(all.awaitingStaff)}
          hint="Open right now"
          tone={all.awaitingStaff > 0 ? "warn" : undefined}
        />
        <Metric
          icon={<AlertTriangle className="h-4 w-4" />}
          label={`Past ${data.targetHours}h, unanswered`}
          value={String(all.breachedOpen)}
          hint={
            all.withinTargetPercent === null
              ? "No tickets in the window"
              : `${all.withinTargetPercent}% answered in target`
          }
          tone={breaching ? "bad" : "good"}
        />
      </div>

      {sources.length > 1 && (
        <Card>
          <CardContent className="p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">Source</th>
                  <th className="pb-2 text-right font-medium">Tickets</th>
                  <th className="pb-2 text-right font-medium">Median</th>
                  <th className="pb-2 text-right font-medium">p90</th>
                  <th className="pb-2 text-right font-medium">In target</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((bucket) => (
                  <SourceRow key={bucket.bucket} bucket={bucket} />
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        Last {data.windowDays} days, spam excluded. Measured against {data.targetHours} <strong>clock</strong>{" "}
        hours — stricter than the &ldquo;24 business hours&rdquo; the public contact page promises, so
        anything green here is a promise kept either way.
      </p>
    </div>
  )
}

function SourceRow({ bucket }: { bucket: SupportSlaMetrics }) {
  return (
    <tr className="border-t">
      <td className="py-2">{SLA_BUCKET_LABELS[bucket.bucket] ?? bucket.bucket}</td>
      <td className="py-2 text-right tabular-nums">{bucket.ticketCount}</td>
      <td className="py-2 text-right tabular-nums">{formatDuration(bucket.medianMinutes)}</td>
      <td className="py-2 text-right tabular-nums">{formatDuration(bucket.p90Minutes)}</td>
      <td className="py-2 text-right tabular-nums">
        {bucket.withinTargetPercent === null ? "—" : `${bucket.withinTargetPercent}%`}
      </td>
    </tr>
  )
}

function Metric({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: string
  hint: string
  tone?: "good" | "warn" | "bad"
}) {
  const valueTone =
    tone === "bad"
      ? "text-destructive"
      : tone === "warn"
        ? "text-amber-600 dark:text-amber-400"
        : tone === "good"
          ? "text-emerald-600 dark:text-emerald-400"
          : ""

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {icon}
          {label}
        </div>
        <p className={`mt-1 text-2xl font-semibold tabular-nums ${valueTone}`}>{value}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  )
}
