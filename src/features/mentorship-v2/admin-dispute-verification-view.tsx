"use client"

/**
 * ─── MENTORSHIP V2 · PHASE 7 DISPUTE CONSOLE ─────────────────────────────────
 *
 * Master-plan §9's <i>"Admin dispute console: queue, filters, SLA breach view, one-click
 * resolutions"</i>, plus the runtime verification panel every prior phase established.
 *
 * Five panels, each mapping to a stated Phase 7 exit criterion:
 *
 *  1. **Invariants & queue health** — the live assertions. `invariantViolations` must always render
 *     empty; a non-empty entry is a real bug, not noise. Three things are asserted server-side on
 *     every open: a live dispute must hold the payout (otherwise a remedy may be unfundable), a
 *     resolved dispute must record what was decided, and no dispute may have been reopened twice.
 *     The last two are also database CHECKs — restated here so a dropped constraint is caught by
 *     this panel rather than by a support agent.
 *  2. **Auto-resolution rate** — against master-plan §9's own ">50% auto-resolved" target, because a
 *     target nobody measures is a wish. The kill switch's state is shown next to it.
 *  3. **SLA breach view + sweep** — runs the exact `DisputeSlaJob.sweep()` the scheduler runs, so a
 *     green manual run is real evidence about the scheduled one. Every dispute escalation is
 *     time-driven, so this is the only practical way to verify it without waiting hours.
 *  4. **The queue** — urgent first, then oldest first. Oldest-first within a band on purpose: a
 *     newest-first queue starves the cases about to breach.
 *  5. **Dispute inspector** — the full thread including internal notes, the auto-attached join
 *     ledger, the audit trail, and the one-click resolution form.
 *
 * The resolve form reads `requiresAmount` / `requiresEntitlement` from the server's own resolution
 * catalogue rather than keeping a private copy of those rules. A private copy is how an admin ends up
 * submitting a PARTIAL_REFUND with no amount.
 */

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Gauge,
  Gavel,
  Loader2,
  Lock,
  MessageSquare,
  Play,
  RefreshCw,
  Search,
  ServerCog,
  ShieldAlert,
  Sparkles,
  UserCheck,
  XCircle,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  useAdminReplyOnDispute,
  useAssignDispute,
  useDisputeQueue,
  useDisputeSnapshot,
  useInspectDispute,
  useRecomputeReliability,
  useRefundableHeadroom,
  useRequestDisputeInfo,
  useResolutionCatalogue,
  useResolveDispute,
  useRunDisputeSlaSweep,
  useTryAutoResolveDispute,
} from "./api/disputes.hooks"
import type { DisputePriority, DisputeRow } from "./api/disputes.types"

function formatMinor(minor?: number | null, currency?: string | null): string {
  if (minor === null || minor === undefined) return "—"
  const symbol = currency === "USD" ? "$" : "₹"
  return symbol + (minor / 100).toLocaleString()
}

function formatWhen(value?: string | null): string {
  if (!value) return "—"
  return new Date(value).toLocaleString()
}

/** Signed hours → "6h left" or "overdue by 6h". Never clamped — the sign is the point. */
function formatDeadline(hours?: number | null): { text: string; overdue: boolean } | null {
  if (hours === null || hours === undefined) return null
  if (hours < 0) return { text: `overdue by ${Math.round(Math.abs(hours))}h`, overdue: true }
  return { text: `${Math.round(hours)}h left`, overdue: false }
}

const PRIORITY_VARIANT: Record<DisputePriority, "default" | "secondary" | "destructive" | "outline"> = {
  LOW: "outline",
  NORMAL: "secondary",
  HIGH: "default",
  URGENT: "destructive",
}

export default function AdminDisputeVerificationView() {
  const snapshotQuery = useDisputeSnapshot()
  const snapshot = snapshotQuery.data
  const sweep = useRunDisputeSlaSweep()

  const [statusFilter, setStatusFilter] = useState("")
  const [mentorFilter, setMentorFilter] = useState("")
  const [liveOnly, setLiveOnly] = useState(true)
  const [queuePage, setQueuePage] = useState(0)

  const queue = useDisputeQueue({
    status: statusFilter || undefined,
    mentorUserId: mentorFilter || undefined,
    liveOnly,
    page: queuePage,
    size: 25,
  })

  /*
    `?disputeId=` opens the inspector straight onto one dispute. The admin alert emails link here,
    and without this they would land on a queue with a lookup box and a reference to paste into it -
    which is a link people stop clicking. Read once as the initial state rather than synced: an
    admin who then looks at a different dispute should not have it yanked back by the URL.
  */
  const searchParams = useSearchParams()
  const linkedDisputeId = searchParams.get("disputeId")?.trim() ?? ""
  const [disputeIdInput, setDisputeIdInput] = useState(linkedDisputeId)
  const [activeDisputeId, setActiveDisputeId] = useState(linkedDisputeId)

  const invariantsBroken = (snapshot?.invariantViolations.length ?? 0) > 0

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <ShieldAlert className="size-5" /> Mentorship V2 — Disputes &amp; Reliability (Phase 7)
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            The dispute queue, the SLA breach view, one-click resolutions that each execute a real
            financial action, and the live invariant checks. Every write on this page needs
            <code className="mx-1 rounded bg-muted px-1 py-0.5 text-xs">
              PERM_MANAGE_MENTORSHIP_DISPUTES
            </code>
            — reads only need the usual internals permission.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void snapshotQuery.refetch()}
          disabled={snapshotQuery.isFetching}
        >
          {snapshotQuery.isFetching ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          Refresh
        </Button>
      </header>

      {snapshotQuery.isLoading ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            <Loader2 className="mx-auto mb-2 size-5 animate-spin" />
            Loading dispute snapshot…
          </CardContent>
        </Card>
      ) : snapshotQuery.isError ? (
        <Alert variant="destructive">
          <XCircle className="size-4" />
          <AlertTitle>Could not load the snapshot</AlertTitle>
          <AlertDescription>
            The Phase 7 tables may not be migrated yet. Run the app once against a database with
            V188–V191 applied, then refresh.
          </AlertDescription>
        </Alert>
      ) : snapshot ? (
        <>
          {/* ── 1. Invariants & queue health ── */}
          <Card className={invariantsBroken ? "border-destructive" : undefined}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ServerCog className="size-4" /> Invariants &amp; queue health
              </CardTitle>
              <CardDescription>
                These are live assertions, recomputed every time this panel opens — not a stored log.
                A check that only ran when a row was written cannot catch a bug introduced by a later
                code change or a manual data fix. <strong>Violations must always be empty.</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {snapshot.invariantViolations.length === 0 ? (
                <p className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                  <CheckCircle2 className="size-4" /> No invariant violations. Every live dispute
                  holds its payout, every resolved dispute records a decision, and no dispute has been
                  reopened twice.
                </p>
              ) : (
                <Alert variant="destructive">
                  <XCircle className="size-4" />
                  <AlertTitle>{snapshot.invariantViolations.length} violation(s) — real bugs</AlertTitle>
                  <AlertDescription>
                    <ul className="mt-1 list-disc space-y-1 pl-4 text-xs">
                      {snapshot.invariantViolations.map((violation) => (
                        <li key={violation}>{violation}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {snapshot.warnings.length > 0 ? (
                <Alert>
                  <AlertTriangle className="size-4" />
                  <AlertTitle>{snapshot.warnings.length} warning(s)</AlertTitle>
                  <AlertDescription>
                    <ul className="mt-1 list-disc space-y-1 pl-4 text-xs">
                      {snapshot.warnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Stat label="Total disputes" value={snapshot.totalDisputes} />
                <Stat label="Live" value={snapshot.liveDisputes} />
                <Stat
                  label="Unassigned (recent)"
                  value={snapshot.unassignedLive}
                  tone={snapshot.unassignedLive > 0 ? "warn" : undefined}
                />
                <Stat
                  label="Holding payout past appeal"
                  value={snapshot.holdingPayoutPastAppealWindow}
                  tone={snapshot.holdingPayoutPastAppealWindow > 0 ? "warn" : undefined}
                />
              </div>

              <Separator />

              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">By status</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(snapshot.countsByStatus).map(([status, count]) => (
                    <Badge key={status} variant={count > 0 ? "secondary" : "outline"}>
                      {status.replaceAll("_", " ").toLowerCase()}: {count}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── 2. Auto-resolution rate ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="size-4" /> Automatic resolution
              </CardTitle>
              <CardDescription>
                Master-plan §9 set a target of <strong>&gt;50% auto-resolved</strong>. Only cases with
                a server-side ground truth are automated — the join ledger settles &quot;the mentor
                never joined&quot; and its mirror image, and a complaint the records contradict
                outright is declined. Everything else is a judgement and is deliberately left to a
                human, because a wrong automatic refund costs far more than a slow correct one.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <Stat label="Auto-resolved" value={snapshot.autoResolvedCount} />
                <Stat
                  label="Rate"
                  value={`${snapshot.autoResolutionRatePercentage}%`}
                  tone={snapshot.autoResolutionRatePercentage >= 50 ? "good" : undefined}
                />
                <Stat
                  label="Rules enabled"
                  value={snapshot.autoResolutionEnabled ? "Yes" : "NO — off"}
                  tone={snapshot.autoResolutionEnabled ? "good" : "warn"}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                A rule never fires instantly: it waits for the respondent&apos;s full{" "}
                {snapshot.firstResponseHours}-hour window and stands down entirely if they contest the
                claim. The join ledger only knows about our own Join button, so an instant rule would
                refund against a mentor who genuinely attended through some other link.
              </p>
            </CardContent>
          </Card>

          {/* ── 3. SLA breach view + sweep ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="size-4" /> SLA breaches &amp; the sweep
              </CardTitle>
              <CardDescription>
                Runs the same five-stage <code>DisputeSlaJob.sweep()</code> the scheduler runs — not a
                parallel copy — so a green manual run is real evidence about the scheduled one. Stage
                four is the one that actually pays mentors after a dispute closes, which is why
                &quot;holding payout past appeal window&quot; above is the number to watch: if it does
                not clear, the sweep has stopped running.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Stat
                  label={`First response (${snapshot.firstResponseHours}h) breaches`}
                  value={snapshot.firstResponseBreaches}
                  tone={snapshot.firstResponseBreaches > 0 ? "warn" : "good"}
                />
                <Stat
                  label={`Resolution (${snapshot.resolutionHours}h) breaches`}
                  value={snapshot.resolutionBreaches}
                  tone={snapshot.resolutionBreaches > 0 ? "warn" : "good"}
                />
                <Stat label={`Appeal window`} value={`${snapshot.appealWindowHours}h`} />
                <Stat label="Dispute window" value={`${snapshot.disputeWindowDays} days`} />
              </div>

              <Button
                type="button"
                size="sm"
                onClick={() => sweep.mutate()}
                disabled={sweep.isPending}
              >
                {sweep.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Running…
                  </>
                ) : (
                  <>
                    <Play className="size-4" /> Run SLA sweep now
                  </>
                )}
              </Button>

              {sweep.data ? (
                <div className="grid gap-2 rounded-md border p-3 text-xs sm:grid-cols-5">
                  <SweepStat label="Auto-resolved" value={sweep.data.autoResolved} />
                  <SweepStat label="1st-response breaches" value={sweep.data.firstResponseBreaches} />
                  <SweepStat label="Resolution breaches" value={sweep.data.resolutionBreaches} />
                  <SweepStat label="Payout holds released" value={sweep.data.payoutHoldsReleased} />
                  <SweepStat label="Scores recomputed" value={sweep.data.reliabilityRecomputed} />
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* ── Reliability distribution ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Gauge className="size-4" /> Mentor reliability distribution
              </CardTitle>
              <CardDescription>
                The ranking feed Phase 9 will read. <strong>Unrated is not zero</strong> — a mentor
                with fewer than five completed sessions has a NULL score, and Phase 9 must apply no
                penalty for it rather than coalescing it to 0, which would bury every new mentor.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Stat label="Rated mentors" value={snapshot.ratedMentors} />
                <Stat label="Unrated (no penalty)" value={snapshot.unratedMentors} />
              </div>
              {Object.keys(snapshot.mentorsByReliabilityBand).length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(snapshot.mentorsByReliabilityBand).map(([band, count]) => (
                    <Badge key={band} variant={band === "AT_RISK" ? "destructive" : "secondary"}>
                      {band.replaceAll("_", " ").toLowerCase()}: {count}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No mentor has enough completed history to be rated yet.
                </p>
              )}
              <RecomputePanel />
            </CardContent>
          </Card>

          {/* ── 4. The queue ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="size-4" /> Queue
              </CardTitle>
              <CardDescription>
                Urgent first, then oldest first. Oldest-first within a priority band on purpose: a
                newest-first queue starves the cases that have waited longest, which are exactly the
                ones about to breach.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-3">
                <Input
                  placeholder="Status filter (e.g. ESCALATED)"
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value.toUpperCase())
                    setQueuePage(0)
                  }}
                />
                <Input
                  placeholder="Mentor user id"
                  value={mentorFilter}
                  onChange={(event) => {
                    setMentorFilter(event.target.value)
                    setQueuePage(0)
                  }}
                />
                <Button
                  type="button"
                  variant={liveOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setLiveOnly((prev) => !prev)
                    setQueuePage(0)
                  }}
                >
                  {liveOnly ? "Showing live only" : "Showing everything"}
                </Button>
              </div>

              {queue.isLoading ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  <Loader2 className="mx-auto mb-2 size-4 animate-spin" /> Loading queue…
                </p>
              ) : queue.isError ? (
                <Alert variant="destructive">
                  <XCircle className="size-4" />
                  <AlertDescription>Could not load the queue.</AlertDescription>
                </Alert>
              ) : !queue.data || queue.data.content.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Nothing in the queue{liveOnly ? " that is still live" : ""}.
                </p>
              ) : (
                <>
                  <ul className="space-y-2">
                    {queue.data.content.map((dispute) => (
                      <li key={dispute.disputeId}>
                        <QueueRow
                          dispute={dispute}
                          onInspect={() => {
                            setDisputeIdInput(dispute.disputeId)
                            setActiveDisputeId(dispute.disputeId)
                          }}
                        />
                      </li>
                    ))}
                  </ul>
                  {queue.data.totalPages > 1 ? (
                    <div className="flex items-center justify-between pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={queue.data.first}
                        onClick={() => setQueuePage((prev) => Math.max(prev - 1, 0))}
                      >
                        Previous
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        Page {queue.data.number + 1} of {queue.data.totalPages} ·{" "}
                        {queue.data.totalElements} total
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={queue.data.last}
                        onClick={() => setQueuePage((prev) => prev + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>

          {/* ── 5. Inspector ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Search className="size-4" /> Dispute inspector
              </CardTitle>
              <CardDescription>
                The full case file: the thread including internal staff notes, the auto-attached join
                ledger, the append-only audit trail, and the resolution form. This is the payload a
                chargeback response is written from.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Dispute id (DSP…)"
                  value={disputeIdInput}
                  onChange={(event) => setDisputeIdInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") setActiveDisputeId(disputeIdInput.trim())
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveDisputeId(disputeIdInput.trim())}
                >
                  <Search className="size-4" /> Inspect
                </Button>
              </div>

              {activeDisputeId ? <DisputeInspector disputeId={activeDisputeId} /> : null}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}

// ─── Small pieces ───────────────────────────────────────────────────────────

function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: number | string
  tone?: "good" | "warn"
}) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={
          tone === "good"
            ? "mt-0.5 text-lg font-semibold text-emerald-600"
            : tone === "warn"
              ? "mt-0.5 text-lg font-semibold text-amber-600"
              : "mt-0.5 text-lg font-semibold"
        }
      >
        {value}
      </p>
    </div>
  )
}

function SweepStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  )
}

function QueueRow({ dispute, onInspect }: { dispute: DisputeRow; onInspect: () => void }) {
  const firstResponse = formatDeadline(dispute.hoursUntilFirstResponseDue)

  return (
    <div className="flex flex-wrap items-start justify-between gap-2 rounded-md border p-3">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
          {dispute.disputeTypeLabel}
          <Badge variant={PRIORITY_VARIANT[dispute.priority]} className="h-4 px-1 text-[10px]">
            {dispute.priority}
          </Badge>
          <Badge variant="secondary" className="h-4 px-1 text-[10px]">
            {dispute.statusLabel}
          </Badge>
          {dispute.payoutHold ? (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600">
              <Lock className="size-2.5" aria-hidden="true" /> payout held
            </span>
          ) : null}
        </p>
        <p className="mt-0.5 font-mono text-xs text-muted-foreground">{dispute.disputeId}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {dispute.buyerName ?? dispute.buyerUserId} vs {dispute.mentorName ?? dispute.mentorUserId}
          {dispute.amountInQuestionMinor > 0
            ? ` · ${formatMinor(dispute.amountInQuestionMinor, dispute.currency)} in question`
            : ""}
          {dispute.assignedAdminName ? ` · assigned to ${dispute.assignedAdminName}` : " · unassigned"}
        </p>
        {firstResponse && !dispute.firstResponseAt ? (
          <p
            className={
              firstResponse.overdue
                ? "mt-0.5 text-xs font-medium text-destructive"
                : "mt-0.5 text-xs text-muted-foreground"
            }
          >
            First response {firstResponse.text}
          </p>
        ) : null}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onInspect}>
        Open
      </Button>
    </div>
  )
}

function RecomputePanel() {
  const [mentorUserId, setMentorUserId] = useState("")
  const recompute = useRecomputeReliability()

  return (
    <div className="space-y-2 rounded-md border p-3">
      <p className="text-xs font-medium">Force a reliability recompute</p>
      <div className="flex gap-2">
        <Input
          placeholder="Mentor user id"
          value={mentorUserId}
          onChange={(event) => setMentorUserId(event.target.value)}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => recompute.mutate(mentorUserId.trim())}
          disabled={!mentorUserId.trim() || recompute.isPending}
        >
          {recompute.isPending ? <Loader2 className="size-4 animate-spin" /> : "Recompute"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Idempotent. Useful after a manual data correction, or to confirm a resolution actually moved
        the score it was supposed to move.
      </p>
    </div>
  )
}

// ─── Inspector ──────────────────────────────────────────────────────────────

function DisputeInspector({ disputeId }: { disputeId: string }) {
  const query = useInspectDispute(disputeId)
  const dispute = query.data

  if (query.isLoading) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        <Loader2 className="mx-auto mb-2 size-4 animate-spin" /> Loading dispute…
      </p>
    )
  }
  if (query.isError || !dispute) {
    return (
      <Alert variant="destructive">
        <XCircle className="size-4" />
        <AlertDescription>No dispute found for that id.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-md border p-3 text-xs sm:grid-cols-3">
        <Field label="Type">{dispute.disputeTypeLabel}</Field>
        <Field label="Status">
          {dispute.statusLabel} ({dispute.priority})
        </Field>
        <Field label="Raised by">
          {dispute.raisedByRole} {dispute.raisedByUserId ? `· ${dispute.raisedByUserId}` : ""}
        </Field>
        <Field label="Order">{dispute.orderNumber ?? dispute.orderId}</Field>
        <Field label="Booking">{dispute.bookingId ?? "— (not session-specific)"}</Field>
        <Field label="Entitlement">{dispute.entitlementId ?? "—"}</Field>
        <Field label="Amount in question">
          {formatMinor(dispute.amountInQuestionMinor, dispute.currency)}
        </Field>
        <Field label="Payout hold">
          {dispute.payoutHold ? "HELD" : `released ${formatWhen(dispute.payoutHoldReleasedAt)}`}
        </Field>
        <Field label="Assigned">{dispute.assignedAdminName ?? "unassigned"}</Field>
        <Field label="Opened">{formatWhen(dispute.createdAt)}</Field>
        <Field label="First response">{formatWhen(dispute.firstResponseAt)}</Field>
        <Field label="Resolved">{formatWhen(dispute.resolvedAt)}</Field>
        {dispute.resolution ? (
          <>
            <Field label="Resolution">{dispute.resolutionLabel ?? dispute.resolution}</Field>
            <Field label="Amount moved">
              {formatMinor(dispute.resolutionAmountMinor, dispute.currency)}
            </Field>
            <Field label="Auto-resolved">
              {dispute.autoResolved ? (dispute.autoResolutionRule ?? "yes") : "no"}
            </Field>
          </>
        ) : null}
        <Field label="Appeal window ends">{formatWhen(dispute.appealWindowEndsAt)}</Field>
        <Field label="Reopened">{dispute.reopenedCount} / 1 allowed</Field>
      </div>

      {dispute.description ? (
        <div className="rounded-md border p-3">
          <p className="text-xs font-medium text-muted-foreground">Original complaint</p>
          <p className="mt-1 whitespace-pre-wrap text-sm">{dispute.description}</p>
        </div>
      ) : null}

      {/* Evidence */}
      {dispute.evidence && dispute.evidence.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Evidence</p>
          {dispute.evidence.map((item) => (
            <div
              key={item.evidenceId}
              className={
                item.kind === "SYSTEM_LOG"
                  ? "rounded-md border border-primary/40 bg-primary/5 p-3"
                  : "rounded-md border p-3"
              }
            >
              <p className="flex items-center gap-1.5 text-xs font-medium">
                {item.kind === "SYSTEM_LOG" ? <ServerCog className="size-3.5" /> : null}
                {item.kindLabel} · {item.uploadedByName ?? "Revquix"} · {formatWhen(item.createdAt)}
              </p>
              {item.systemSummary ? <p className="mt-1 text-sm">{item.systemSummary}</p> : null}
              {item.caption ? (
                <p className="mt-1 text-xs text-muted-foreground">{item.caption}</p>
              ) : null}
              {item.fileUrl ? (
                <a
                  href={item.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-xs underline underline-offset-2"
                >
                  Open attachment
                </a>
              ) : null}
              {item.systemPayload ? (
                <pre className="mt-2 max-h-64 overflow-auto rounded bg-background/80 p-2 text-[10px]">
                  {JSON.stringify(item.systemPayload, null, 2)}
                </pre>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {/* Thread, internal notes included */}
      {dispute.messages && dispute.messages.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Thread ({dispute.messages.length}) — internal notes are visible here only
          </p>
          {dispute.messages.map((message) => (
            <div
              key={message.messageId}
              className={
                message.internal
                  ? "rounded-md border border-dashed border-amber-500/60 bg-amber-500/5 p-2.5"
                  : "rounded-md border p-2.5"
              }
            >
              <p className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
                {message.authorName ?? "Revquix"}
                <Badge variant="outline" className="h-4 px-1 text-[10px]">
                  {message.authorRole}
                </Badge>
                {message.internal ? (
                  <Badge variant="destructive" className="h-4 px-1 text-[10px]">
                    internal
                  </Badge>
                ) : null}
                <span className="font-normal text-muted-foreground">
                  {formatWhen(message.createdAt)}
                </span>
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{message.body}</p>
            </div>
          ))}
        </div>
      ) : null}

      <DisputeActionsPanel dispute={dispute} />

      {/* Audit trail */}
      {dispute.audit && dispute.audit.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            Audit trail ({dispute.audit.length})
          </p>
          <ol className="space-y-1 border-l pl-3">
            {dispute.audit.map((row) => (
              <li key={row.auditId} className="text-xs">
                <p className="font-medium">
                  {row.action} · {row.actorType}
                  {row.actorName ? ` (${row.actorName})` : ""}
                </p>
                <p className="text-muted-foreground">
                  {formatWhen(row.createdAt)}
                  {row.note ? ` · ${row.note}` : ""}
                </p>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-0.5 break-words font-medium">{children}</p>
    </div>
  )
}

/**
 * Assign, reply, ask a side, try the rules, and resolve.
 *
 * The resolve form's field visibility is driven entirely by the server's resolution catalogue, so
 * "does this outcome need an amount?" has one answer in the whole system.
 */
function DisputeActionsPanel({ dispute }: { dispute: DisputeRow }) {
  const catalogue = useResolutionCatalogue()
  const headroom = useRefundableHeadroom(dispute.disputeId)
  const assign = useAssignDispute(dispute.disputeId)
  const reply = useAdminReplyOnDispute(dispute.disputeId)
  const requestInfo = useRequestDisputeInfo(dispute.disputeId)
  const tryAuto = useTryAutoResolveDispute(dispute.disputeId)
  const resolve = useResolveDispute(dispute.disputeId)

  const [messageBody, setMessageBody] = useState("")
  const [internal, setInternal] = useState(false)
  const [resolution, setResolution] = useState("")
  const [amount, setAmount] = useState("")
  const [extendDays, setExtendDays] = useState("")
  const [note, setNote] = useState("")
  const [reject, setReject] = useState(false)

  const terminal =
    dispute.status === "RESOLVED" || dispute.status === "REJECTED" || dispute.status === "WITHDRAWN"

  const selected = (catalogue.data ?? []).find((option) => option.value === resolution)
  const needsAmount = selected?.requiresAmount ?? false
  const needsEntitlement = selected?.requiresEntitlement ?? false
  const amountMinor = amount.trim() ? Number(amount.trim()) : undefined
  const refundable = headroom.data?.refundableMinor ?? 0
  const amountTooLarge = needsAmount && amountMinor !== undefined && amountMinor > refundable

  const canResolve =
    !terminal &&
    !!resolution &&
    note.trim().length >= 10 &&
    (!needsAmount || (amountMinor !== undefined && amountMinor > 0)) &&
    !amountTooLarge &&
    (!needsEntitlement || !!dispute.entitlementId) &&
    !resolve.isPending

  return (
    <div className="space-y-4 rounded-md border p-3">
      <p className="text-sm font-semibold">Actions</p>

      {terminal ? (
        <Alert>
          <CheckCircle2 className="size-4" />
          <AlertDescription className="text-xs">
            This dispute is closed ({dispute.statusLabel}). Only the parties can reopen it, once,
            inside the appeal window.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => assign.mutate(undefined)}
              disabled={assign.isPending}
            >
              {assign.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <UserCheck className="size-4" />
              )}
              Take this case
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => tryAuto.mutate()}
              disabled={tryAuto.isPending}
            >
              {tryAuto.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              Try the automatic rules
            </Button>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-xs font-medium">Message</p>
            <Textarea
              rows={3}
              value={messageBody}
              onChange={(event) => setMessageBody(event.target.value)}
              placeholder="What do you want to say, or note internally?"
            />
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={internal}
                onChange={(event) => setInternal(event.target.checked)}
              />
              Internal note — staff only, never shown to either party
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  reply.mutate(
                    { body: messageBody.trim(), internal },
                    { onSuccess: () => setMessageBody("") },
                  )
                }
                disabled={!messageBody.trim() || reply.isPending}
              >
                {reply.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                {internal ? "Save internal note" : "Reply to both"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  requestInfo.mutate(
                    { fromBuyer: true, body: messageBody.trim() },
                    { onSuccess: () => setMessageBody("") },
                  )
                }
                disabled={!messageBody.trim() || internal || requestInfo.isPending}
              >
                Ask the customer
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  requestInfo.mutate(
                    { fromBuyer: false, body: messageBody.trim() },
                    { onSuccess: () => setMessageBody("") },
                  )
                }
                disabled={!messageBody.trim() || internal || requestInfo.isPending}
              >
                Ask the mentor
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              &quot;Ask&quot; moves the ball to that side and puts the dispute on their pending-action
              list, rather than leaving it reading &quot;under review&quot; while everyone waits for
              everyone else.
            </p>
          </div>

          <Separator />

          {/* One-click resolution */}
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-xs font-medium">
              <Gavel className="size-3.5" /> Resolve
            </p>
            <p className="text-xs text-muted-foreground">
              Every option below performs a real action — a refund through the single refund path, a
              payout release, a package-validity extension, a service suspension. Refundable headroom
              on this order:{" "}
              <strong>{formatMinor(refundable, dispute.currency)}</strong>. An amount larger than that
              is refused, not clamped.
            </p>

            <select
              value={resolution}
              onChange={(event) => setResolution(event.target.value)}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="">Choose a resolution…</option>
              {(catalogue.data ?? []).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                  {option.requiresAmount ? " (needs an amount)" : ""}
                  {option.penalisesMentor ? " · penalises mentor" : ""}
                </option>
              ))}
            </select>

            {needsAmount ? (
              <div className="space-y-1">
                <Input
                  type="number"
                  min={1}
                  placeholder="Amount in minor units (paise/cents)"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                />
                {amountTooLarge ? (
                  <p className="text-xs font-medium text-destructive">
                    That is more than this order can still refund (
                    {formatMinor(refundable, dispute.currency)}).
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {amountMinor ? formatMinor(amountMinor, dispute.currency) : "In minor units."}
                  </p>
                )}
              </div>
            ) : null}

            {needsEntitlement ? (
              <div className="space-y-1">
                <Input
                  type="number"
                  min={1}
                  placeholder="Extend validity by how many days (default 30)"
                  value={extendDays}
                  onChange={(event) => setExtendDays(event.target.value)}
                />
                {!dispute.entitlementId ? (
                  <p className="text-xs font-medium text-destructive">
                    This dispute has no package entitlement attached, so validity cannot be extended.
                  </p>
                ) : null}
              </div>
            ) : null}

            <Textarea
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Explain the decision — both parties will read this (min 10 characters)"
            />

            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={reject}
                onChange={(event) => setReject(event.target.checked)}
              />
              Decline instead of resolve — no remedy executed, payout hold lifted, nothing recorded
              against the mentor
            </label>

            <Button
              type="button"
              size="sm"
              onClick={() =>
                resolve.mutate({
                  resolution,
                  note: note.trim(),
                  amountMinor,
                  reject,
                  extendValidityDays: extendDays.trim() ? Number(extendDays.trim()) : undefined,
                })
              }
              disabled={!canResolve}
            >
              {resolve.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Applying…
                </>
              ) : (
                <>
                  <Gavel className="size-4" /> {reject ? "Decline dispute" : "Resolve and execute"}
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
