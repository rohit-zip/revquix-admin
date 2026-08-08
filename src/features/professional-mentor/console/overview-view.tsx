"use client"

/**
 * ─── OVERVIEW ─────────────────────────────────────────────────────────────────
 *
 * Replaces the console-home directory — a page whose only content was a card per console explaining
 * where things were. That page was a symptom: it existed because nothing else told you what needed
 * doing, and a directory is not an answer to "what needs doing".
 *
 * <h3>This page computes nothing</h3>
 * Every number here is read from the snapshot endpoint that owns it, and the "Needs attention" rows
 * link into the table that owns the records. There is deliberately no aggregation layer: a second
 * copy of a metric is the copy that goes stale and gets believed. The old console home was right
 * about that, and it is the one thing it was right about.
 *
 * <h3>Needs attention is the point of the page</h3>
 * It is the only band that can be empty, and empty is the goal. Everything else is context.
 */

import Link from "next/link"
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Coins,
  LinkIcon,
  Loader2,
  Lock,
  RefreshCw,
  ShieldAlert,
  UserX,
  Video,
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"
import { getFeedbackBreaches } from "@/features/mentorship-v2/api/admin-lists.api"
import { getJobHealth } from "@/features/mentorship-v2/api/ops.api"
import { useCallSnapshot } from "@/features/mentorship-v2/api/calls.hooks"
import { useCommerceSnapshot } from "@/features/mentorship-v2/api/commerce.hooks"
import { useDisputeSnapshot } from "@/features/mentorship-v2/api/disputes.hooks"
import { useMentorshipV2Health } from "@/features/mentorship-v2/api/mentorship-v2.hooks"
import { formatMinor } from "./console-format"

/** Singular/plural pair, because "1 disputes with nobody assigned" reads like a bug in the page. */
interface AttentionRow {
  count: number
  /** Written for count > 1. `one` supplies the singular when the count is exactly 1. */
  label: string
  one?: string
  href: string
  icon: React.ReactNode
  /** Destructive means "money or a customer is affected right now", not merely "non-zero". */
  severe?: boolean
}

export default function ProfessionalMentorOverviewView() {
  const disputes = useDisputeSnapshot()
  const calls = useCallSnapshot()
  const commerce = useCommerceSnapshot()
  const health = useMentorshipV2Health()
  const breaches = useQuery({
    queryKey: ["pm-feedback-breaches"],
    queryFn: () => getFeedbackBreaches(100),
    staleTime: 30_000,
  })
  const jobs = useQuery({
    queryKey: ["pm-job-health"],
    queryFn: getJobHealth,
    staleTime: 30_000,
  })

  const loading =
    disputes.isLoading || calls.isLoading || commerce.isLoading || breaches.isLoading || jobs.isLoading

  const stuckBreaches = (breaches.data ?? []).filter((row) => row.sweepOverdue).length
  const stuckJobs = (jobs.data ?? []).filter((job) => job.stuck)
  const staleJobs = (jobs.data ?? []).filter((job) => job.stale && !job.stuck)

  const attention: AttentionRow[] = []
  if (disputes.data) {
    if (disputes.data.unassignedLive > 0) {
      attention.push({
        count: disputes.data.unassignedLive,
        label: "disputes with nobody assigned",
        one: "dispute with nobody assigned",
        href: PATH_CONSTANTS.ADMIN_PM_DISPUTES,
        icon: <UserX className="size-4" />,
      })
    }
    const breaching = disputes.data.firstResponseBreaches + disputes.data.resolutionBreaches
    if (breaching > 0) {
      attention.push({
        count: breaching,
        label: "disputes past an SLA deadline",
        one: "dispute past an SLA deadline",
        href: PATH_CONSTANTS.ADMIN_PM_DISPUTES,
        icon: <Clock className="size-4" />,
        severe: true,
      })
    }
    if (disputes.data.holdingPayoutPastAppealWindow > 0) {
      attention.push({
        count: disputes.data.holdingPayoutPastAppealWindow,
        label: "payouts still held past the appeal window",
        one: "payout still held past the appeal window",
        href: PATH_CONSTANTS.ADMIN_PM_PAYOUTS,
        icon: <Lock className="size-4" />,
        severe: true,
      })
    }
  }
  if (calls.data) {
    if (calls.data.missingMeetingLink > 0) {
      attention.push({
        count: calls.data.missingMeetingLink,
        label: "confirmed sessions with no meeting link",
        one: "confirmed session with no meeting link",
        href: PATH_CONSTANTS.ADMIN_PM_SESSIONS,
        icon: <LinkIcon className="size-4" />,
        severe: true,
      })
    }
    if (calls.data.overdueForAutoComplete > 0) {
      attention.push({
        count: calls.data.overdueForAutoComplete,
        label: "sessions past their auto-complete deadline — payouts are stalled",
        one: "session past its auto-complete deadline — a payout is stalled",
        href: PATH_CONSTANTS.ADMIN_PM_SESSIONS,
        icon: <Video className="size-4" />,
        severe: true,
      })
    }
  }
  /*
    Job health leads the band. Every other row here describes a record that needs a human; these two
    describe the machinery that produces those records. A dead sweep is upstream of everything else
    on this page — the feedback breaches below are literally a symptom of it — so it belongs first.
  */
  if (stuckJobs.length > 0) {
    attention.push({
      count: stuckJobs.length,
      label: "scheduled jobs have a run that never finished — they may be holding database locks",
      one: "scheduled job has a run that never finished — it may be holding database locks",
      href: `${PATH_CONSTANTS.ADMIN_PM_PLATFORM}?tab=jobs`,
      icon: <Activity className="size-4" />,
      severe: true,
    })
  }
  if (staleJobs.length > 0) {
    attention.push({
      count: staleJobs.length,
      label: "scheduled jobs have had no successful run recently",
      one: "scheduled job has had no successful run recently",
      href: `${PATH_CONSTANTS.ADMIN_PM_PLATFORM}?tab=jobs`,
      icon: <Activity className="size-4" />,
      severe: true,
    })
  }
  if (stuckBreaches > 0) {
    attention.push({
      count: stuckBreaches,
      label: "feedback breaches the sweep has not converted — the job is not completing",
      one: "feedback breach the sweep has not converted — the job is not completing",
      href: PATH_CONSTANTS.ADMIN_PM_DISPUTES,
      icon: <AlertTriangle className="size-4" />,
      severe: true,
    })
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Professional Mentor</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            What needs doing, and where the money is. Every number here is read from the surface that
            owns it — nothing on this page is computed a second time.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            void disputes.refetch()
            void calls.refetch()
            void commerce.refetch()
            void breaches.refetch()
            void jobs.refetch()
          }}
          disabled={loading}
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          Refresh
        </Button>
      </header>

      {/* ── Band 1: needs attention ── */}
      <Card className={attention.some((row) => row.severe) ? "border-destructive" : undefined}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="size-4" /> Needs attention
          </CardTitle>
          <CardDescription>
            The only band on this page that is supposed to be empty. Each row links to the records
            behind it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              <Loader2 className="mx-auto mb-2 size-4 animate-spin" /> Checking…
            </p>
          ) : attention.length === 0 ? (
            <p className="flex items-center gap-2 py-2 text-sm font-medium text-emerald-600">
              <CheckCircle2 className="size-4" /> Nothing needs attention. Every scheduled job has
              run successfully, no disputes are unassigned or breaching, and every confirmed session
              has its meeting link.
            </p>
          ) : (
            <ul className="divide-y">
              {attention.map((row) => (
                <li key={row.label}>
                  <Link
                    href={row.href}
                    className="flex items-center gap-3 py-2.5 transition-colors hover:text-foreground"
                  >
                    <span className={row.severe ? "text-destructive" : "text-amber-600"}>
                      {row.icon}
                    </span>
                    <span className="text-sm">
                      <strong className={row.severe ? "text-destructive" : undefined}>
                        {row.count}
                      </strong>{" "}
                      {row.count === 1 ? (row.one ?? row.label) : row.label}
                    </span>
                    <ArrowRight className="ml-auto size-3.5 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* ── Band 2: today ── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile
          label="Open disputes"
          value={disputes.data?.liveDisputes}
          href={PATH_CONSTANTS.ADMIN_PM_DISPUTES}
          icon={<ShieldAlert className="size-3.5" />}
        />
        <Tile
          label="Sessions next 24h"
          value={calls.data?.upcomingNext24h}
          href={PATH_CONSTANTS.ADMIN_PM_SESSIONS}
          icon={<Video className="size-3.5" />}
        />
        <Tile
          label="Awaiting feedback"
          value={calls.data?.awaitingFeedback}
          href={PATH_CONSTANTS.ADMIN_PM_SESSIONS}
          icon={<Clock className="size-3.5" />}
        />
        <Tile
          label="Total orders"
          value={commerce.data?.totalOrders}
          href={PATH_CONSTANTS.ADMIN_PM_ORDERS}
          icon={<Coins className="size-3.5" />}
        />
      </div>

      {/* ── Band 3: live money ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Live money</CardTitle>
          <CardDescription>
            All figures in INR — the platform&apos;s reporting currency. An individual order may have
            charged the buyer in another one.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Money label="Gross paid" minor={commerce.data?.grossPaidMinor} />
          <Money label="Mentor commission earned" minor={commerce.data?.mentorCommissionMinor} />
          <Money label="Buyer platform fee (net of refunds)" minor={commerce.data?.netBuyerPlatformFeeMinor} />
        </CardContent>
      </Card>

      {/* ── Band 4: rollout ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rollout state</CardTitle>
          <CardDescription>
            The flag and the pilot allowlist gate mentor-facing surfaces. Admins bypass both, which is
            why this console works regardless of what they say.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {health.isLoading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading…
            </p>
          ) : health.isError ? (
            <Alert>
              <AlertTriangle className="size-4" />
              <AlertTitle>Could not load rollout state</AlertTitle>
              <AlertDescription className="text-xs">
                Open Platform Health → Foundations for the full diagnostic.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={health.data?.schemaExists ? "secondary" : "destructive"}>
                {health.data?.schemaExists ? "schema present" : "schema missing"}
              </Badge>
              <Button asChild size="sm" variant="ghost" className="ml-auto">
                <Link href={PATH_CONSTANTS.ADMIN_PM_PLATFORM}>
                  Platform Health <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Tile({
  label,
  value,
  href,
  icon,
}: {
  label: string
  value?: number
  href: string
  icon?: React.ReactNode
}) {
  return (
    <Link href={href} className="rounded-lg border p-3 transition-colors hover:bg-accent">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold">{value ?? "—"}</p>
    </Link>
  )
}

function Money({ label, minor }: { label: string; minor?: number }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-xl font-semibold">
        {minor === undefined ? "—" : formatMinor(minor, "INR")}
      </p>
    </div>
  )
}
