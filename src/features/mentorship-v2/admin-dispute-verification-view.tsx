"use client"

/**
 * ─── DISPUTES ENGINE (PLATFORM HEALTH TAB) ────────────────────────────────────
 *
 * The machinery behind the dispute queue: the live invariant assertions, the automatic-resolution
 * rate, the SLA sweep, and the mentor reliability feed.
 *
 * <h3>What moved out of this file, and why</h3>
 * This used to be the whole dispute console — invariants, auto-resolution stats, the SLA sweep, the
 * reliability distribution, then the queue, then an inspector you opened by pasting a dispute id.
 * The queue and the inspector are now `/professional-mentor/disputes` and its detail route, because
 * they are the operator's daily work and were buried as panels four and five of five.
 *
 * What is left here is genuinely engineering: assertions that must read empty, a rate measured
 * against a target, a job you can run by hand, and a scoring feed. An operator resolving a dispute
 * never needs any of it; an on-call engineer debugging why disputes are not escalating needs all of
 * it. That is the split, and it is why this file is now a Platform Health tab rather than a page.
 */

import { useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Gauge,
  Loader2,
  Play,
  RefreshCw,
  ServerCog,
  Sparkles,
  XCircle,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  useDisputeSnapshot,
  useRecomputeReliability,
  useRunDisputeSlaSweep,
} from "./api/disputes.hooks"

export default function AdminDisputeVerificationView() {
  const snapshotQuery = useDisputeSnapshot()
  const snapshot = snapshotQuery.data
  const sweep = useRunDisputeSlaSweep()

  const invariantsBroken = (snapshot?.invariantViolations.length ?? 0) > 0

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Disputes engine</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            The machinery behind the queue. The queue itself, and every individual case, live on{" "}
            <strong>Disputes</strong> in the sidebar.
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
            The dispute tables may not be migrated. Run the app once against a database with
            V188–V191 applied, then refresh.
          </AlertDescription>
        </Alert>
      ) : snapshot ? (
        <>
          {/* ── 1. Invariants ── */}
          <Card className={invariantsBroken ? "border-destructive" : undefined}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ServerCog className="size-4" /> Invariants &amp; queue health
              </CardTitle>
              <CardDescription>
                Live assertions, recomputed every time this panel opens — not a stored log. A check
                that only ran when a row was written cannot catch a bug introduced by a later code
                change or a manual data fix. <strong>Violations must always be empty.</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {snapshot.invariantViolations.length === 0 ? (
                <p className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                  <CheckCircle2 className="size-4" /> No invariant violations. Every live dispute
                  holds its payout, every resolved dispute records a decision, and no dispute has
                  been reopened twice.
                </p>
              ) : (
                <Alert variant="destructive">
                  <XCircle className="size-4" />
                  <AlertTitle>
                    {snapshot.invariantViolations.length} violation(s) — real bugs
                  </AlertTitle>
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

          {/* ── 2. Automatic resolution ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="size-4" /> Automatic resolution
              </CardTitle>
              <CardDescription>
                The target is <strong>&gt;50% auto-resolved</strong>. Only cases with a server-side
                ground truth are automated — the join ledger settles &quot;the mentor never
                joined&quot; and its mirror image, and a complaint the records contradict outright is
                declined. Everything else is a judgement and is deliberately left to a human, because
                a wrong automatic refund costs far more than a slow correct one.
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
                {snapshot.firstResponseHours}-hour window and stands down entirely if they contest
                the claim. The join ledger only knows about our own Join button, so an instant rule
                would refund against a mentor who genuinely attended through some other link.
              </p>
            </CardContent>
          </Card>

          {/* ── 3. SLA sweep ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="size-4" /> SLA breaches &amp; the sweep
              </CardTitle>
              <CardDescription>
                Runs the same five-stage <code>DisputeSlaJob.sweep()</code> the scheduler runs — not
                a parallel copy — so a green manual run is real evidence about the scheduled one.
                Stage four is the one that actually pays mentors after a dispute closes, which is why
                &quot;holding payout past appeal window&quot; above is the number to watch: if it
                does not clear, the sweep has stopped running.
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
                <Stat label="Appeal window" value={`${snapshot.appealWindowHours}h`} />
                <Stat label="Dispute window" value={`${snapshot.disputeWindowDays} days`} />
              </div>

              <Button type="button" size="sm" onClick={() => sweep.mutate()} disabled={sweep.isPending}>
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

          {/* ── 4. Reliability ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Gauge className="size-4" /> Mentor reliability distribution
              </CardTitle>
              <CardDescription>
                The ranking feed marketplace search reads. <strong>Unrated is not zero</strong> — a
                mentor with fewer than five completed sessions has a NULL score, and ranking must
                apply no penalty for it rather than coalescing it to 0, which would bury every new
                mentor.
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
        </>
      ) : null}
    </div>
  )
}

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
